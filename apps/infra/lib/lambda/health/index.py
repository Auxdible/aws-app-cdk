import boto3
import botocore

def health_handler(event, context):
    return {
        "statusCode": 200,
        "body": "health check received!"
    }