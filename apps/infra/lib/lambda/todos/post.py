import boto3
import os
import json
from uuid import uuid7
from typing import TYPE_CHECKING
from pydantic import BaseModel

if TYPE_CHECKING:
    from mypy_boto3_dynamodb import DynamoDBServiceResource
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb");

class CreateTodoBody(BaseModel):
    title: str
    description: str
    tags: list[str]

def post_todo(event: APIGatewayProxyEventV2, context: Context):
    # validate body to ensure it matches what we're looking for
    try:
        print(event['body'])
        body = CreateTodoBody.model_validate_json(event['body'])
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

    