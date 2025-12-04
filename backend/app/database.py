import boto3
import os
import logging
from botocore.config import Config as BotoConfig

logger = logging.getLogger(__name__)

# Timestream Configuration
DATABASE_NAME = os.getenv("TIMESTREAM_DB", "fleet-management-db-dev")
TABLE_NAME = os.getenv("TIMESTREAM_TABLE", "telemetry")
REGION_NAME = os.getenv("AWS_REGION", "eu-west-1")

# Initialize Timestream Query Client
# We use a standard client. In Lambda, credentials are auto-injected.
ts_query = boto3.client(
    'timestream-query', 
    region_name=REGION_NAME,
    config=BotoConfig(read_timeout=20, retries={'max_attempts': 10})
)

def run_query(query_string):
    """
    Executes a query against Amazon Timestream and returns the results as a list of dictionaries.
    """
    try:
        paginator = ts_query.get_paginator('query')
        page_iterator = paginator.paginate(QueryString=query_string)
        
        results = []
        for page in page_iterator:
            results.extend(_parse_query_result(page))
            
        return results
    except Exception as e:
        logger.error(f"Error running query: {e}")
        return []

def _parse_query_result(query_result):
    """
    Helper to parse Timestream query response into a list of dicts.
    """
    column_info = query_result['ColumnInfo']
    rows = query_result['Rows']
    
    parsed_rows = []
    for row in rows:
        data = row['Data']
        row_dict = {}
        for i, col in enumerate(column_info):
            col_name = col['Name']
            val = data[i].get('ScalarValue')
            
            # Basic type conversion (expand as needed)
            if val is None:
                row_dict[col_name] = None
            elif 'Type' in col and col['Type']['ScalarType'] == 'DOUBLE':
                row_dict[col_name] = float(val)
            elif 'Type' in col and col['Type']['ScalarType'] == 'BIGINT':
                row_dict[col_name] = int(val)
            else:
                row_dict[col_name] = val
                
        parsed_rows.append(row_dict)
    return parsed_rows

# No init_db needed for Timestream as it's serverless and schema-less (mostly)
async def init_db():
    pass

async def close_db_pool():
    pass
