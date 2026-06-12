import boto3
import os
import json
import base64
from uuid import uuid7
from typing import TYPE_CHECKING
from pydantic import BaseModel
from urllib.parse import parse_qsl
if TYPE_CHECKING:
    from mypy_boto3_dynamodb import DynamoDBServiceResource
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb");

class CreateTodoBody(BaseModel):
    title: str
    description: str

def post_todo(event: APIGatewayProxyEventV2, context: Context):
    # validate body to ensure it matches what we're looking for
    try:
        raw = event.get("body") or ""
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw).decode("utf-8")
        body = CreateTodoBody.model_validate(dict(parse_qsl(raw)))
    except ValueError as e:
        return { 
            "statusCode": 400,
            "body":  json.dumps({ "error": str(e) })
        }
    # validate table to ensure it exists
    tableName = os.environ.get("TABLE_NAME");
    if tableName is None:
         return {
            "statusCode": 500,
            "body": json.dumps({ "error": "No table environment variable found" })
        }
    table = dynamodb.Table(tableName);
    try:
        item_id = str(uuid7())
        created = table.put_item(Item={
            "id": item_id,
            **body
        });
        
        return {
            "statusCode": 201,
            "body": json.dumps({ "id": item_id })
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "body":  json.dumps({ "error": str(e) })
        }

    