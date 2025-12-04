resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_timestream_policy" {
  name = "${var.project_name}-lambda-timestream-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "timestream:Select",
          "timestream:DescribeTable",
          "timestream:ListMeasures"
        ]
        Resource = aws_timestreamwrite_table.telemetry_table.arn
      },
      {
        Effect = "Allow"
        Action = [
          "timestream:DescribeEndpoints",
          "timestream:SelectValues"
        ]
        Resource = "*"
      }
    ]
  })
}

# We will use a dummy zip for now to initialize the function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function_payload.zip"
  
  source {
    content  = "def handler(event, context): return {'statusCode': 200, 'body': 'Hello from Lambda!'}"
    filename = "main.py"
  }
}

resource "aws_lambda_function" "api_backend" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "${var.project_name}-api-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "main.handler" 
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      TIMESTREAM_DB    = aws_timestreamwrite_database.fleet_db.database_name
      TIMESTREAM_TABLE = aws_timestreamwrite_table.telemetry_table.table_name
    }
  }
}
