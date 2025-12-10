resource "aws_iot_topic_rule" "telemetry_to_dynamodb" {
  name        = "TelemetryToDynamoDB_${var.environment}"
  description = "Routes vehicle telemetry to DynamoDB"
  enabled     = true
  sql         = "SELECT * FROM 'vehicles/+/telemetry'"
  sql_version = "2016-03-23"

  dynamodbv2 {
    role_arn = aws_iam_role.iot_dynamodb_role.arn
    put_item {
      table_name = aws_dynamodb_table.telemetry_table.name
    }
  }
}
