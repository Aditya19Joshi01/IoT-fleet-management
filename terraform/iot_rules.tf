resource "aws_iot_topic_rule" "telemetry_to_timestream" {
  name        = "TelemetryToTimestream_${var.environment}"
  description = "Routes vehicle telemetry to Timestream"
  enabled     = true
  sql         = "SELECT * FROM 'vehicles/+/telemetry'"
  sql_version = "2016-03-23"

  timestream {
    database_name = aws_timestreamwrite_database.fleet_db.database_name
    table_name    = aws_timestreamwrite_table.telemetry_table.table_name
    role_arn      = aws_iam_role.iot_timestream_role.arn

    dimension {
      name  = "vehicle_id"
      value = "$${topic(2)}"
    }
  }
}
