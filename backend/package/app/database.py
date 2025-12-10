import boto3
import os
import logging
from botocore.config import Config as BotoConfig

logger = logging.getLogger(__name__)

# DynamoDB Configuration
TABLE_NAME = os.getenv("DYNAMODB_TABLE", "fleet-management-telemetry-dev")
REGION_NAME = os.getenv("AWS_REGION", "eu-west-1")

# Initialize DynamoDB Resource
dynamodb = boto3.resource(
    'dynamodb',
    region_name=REGION_NAME
)

table = dynamodb.Table(TABLE_NAME)

def get_table():
    return table
