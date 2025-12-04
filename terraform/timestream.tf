resource "aws_timestreamwrite_database" "fleet_db" {
  database_name = "${var.project_name}-db-${var.environment}"
}

resource "aws_timestreamwrite_table" "telemetry_table" {
  database_name = aws_timestreamwrite_database.fleet_db.database_name
  table_name    = "telemetry"

  retention_properties {
    magnetic_store_retention_period_in_days = 30
    memory_store_retention_period_in_hours  = 24
  }
}
