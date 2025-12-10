# IoT Role to write to DynamoDB
resource "aws_iam_role" "iot_dynamodb_role" {
  name = "${var.project_name}-iot-dynamodb-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "iot.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "iot_dynamodb_policy" {
  name = "${var.project_name}-iot-dynamodb-policy-${var.environment}"
  role = aws_iam_role.iot_dynamodb_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem"
        ]
        Resource = aws_dynamodb_table.telemetry_table.arn
      }
    ]
  })
}

# Lambda Role to read from DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${var.project_name}-lambda-dynamodb-policy-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan" # Used sparingly for stats
        ]
        Resource = [
          aws_dynamodb_table.telemetry_table.arn,
          "${aws_dynamodb_table.telemetry_table.arn}/index/*"
        ]
      }
    ]
  })
}
