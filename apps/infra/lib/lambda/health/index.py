import boto3
import os
import botocore
import uuid

dynamodb = boto3.resource('dynamodb')
def health_handler(event, context):
    tableName = os.environ.get("TABLE_NAME");
    if tableName is None:
        return {
            "statusCode": 500,
            "body": "You are missing a table name environment variable!"
        }

    table = dynamodb.Table(tableName);

    table.put_item(Item={
        "pk": str(uuid.uuid7()),
        "ip": event['requestContext']['http']['sourceIp'],
        "message": "Test of me!!! DO I WORK!!!"
    });  
   
    return {
        "statusCode": 200,
        "body": "health check received and posted a thing to the table"
    }