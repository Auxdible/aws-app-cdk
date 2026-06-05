import boto3
import os

from mypy_boto3_dynamodb import DynamoDBServiceResource

dynamodb: DynamoDBServiceResource = boto3.resource("dynamodb");

def get_all_todos(event, context):
    # Get table name and validate that it actually exists
    tableName = os.environ.get("TABLE_NAME");
    if tableName is None:
        return {
            "statusCode": 500,
            "body": { "error": "No table environment variable found" } 
        }
    table = dynamodb.Table(tableName);
    res = table.scan();
    items = res['Items'];
    while 'LastEvaluatedKey' in res:
        res = table.scan(ExclusiveStartKey=res['LastEvaluatedKey'])
        items.extend(res['Items'])
    return {
        "statusCode": 200,
        "body": { "data": items }
    }    
    