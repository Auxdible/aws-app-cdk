import boto3
import os
import json
from typing import TYPE_CHECKING
from uuid import uuid7
from pydantic import BaseModel


if TYPE_CHECKING:
    from mypy_boto3_dynamodb import DynamoDBServiceResource
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb");

class PatchTodoBody(BaseModel):
    id: str 
    title: str | None = None
    description: str | None = None
    tags: list[str] | None = None

def patch_todo(event: APIGatewayProxyEventV2, context: Context):
    # validate body to ensure it matches what we're looking for
    try:
        body = PatchTodoBody.model_validate_json(event['body'])
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
        updated = table.put_item(Item={ k: v for k, v in body.model_dump().items() if v is not None });
        
        return {
            "statusCode": 200,
            "body": json.dumps({ "updated": updated['Attributes'] })
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "body":  json.dumps({ "error": str(e) })
        }

    