import boto3
import os
import json
from typing import TYPE_CHECKING
from pydantic import BaseModel
from urllib.parse import parse_qsl
import base64

if TYPE_CHECKING:
    from aws_lambda_typing.events import APIGatewayProxyEventV2
    from aws_lambda_typing.context import Context
    from mypy_boto3_dynamodb import DynamoDBServiceResource

class DeleteTodoBody(BaseModel):
    id: str

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb");

def delete_todo(event: APIGatewayProxyEventV2, context: Context):
    # validate body to ensure we actually have an id
    try:
        raw = event['queryStringParameters']
        print(raw)
        body = DeleteTodoBody.model_validate(raw)
    except ValueError as e:
        return {
            "statusCode": 400,
            "body": json.dumps({ "error": str(e) })
        }
    tableName = os.environ.get("TABLE_NAME");
    if tableName is None:
        return { 
            "statusCode": 500,
            "body":  json.dumps({ "error": "No table environment variable found" })
        }
    table = dynamodb.Table(tableName);

    try:
        table.delete_item(Key={ 'pk': body.id}, ConditionExpression="attribute_exists (pk)")
        return {
            "statusCode": 204,
            "body": json.dumps({ "success": True })
        }
    except Exception as e:
        return { 
            "statusCode": 400,
            "body":  json.dumps({ "error": "That todo does not exist!" })
        }
