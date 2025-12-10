resource "aws_dynamodb_table" "telemetry_table" {
  name         = "${var.project_name}-telemetry-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "vehicle_id"
  range_key    = "timestamp"

  attribute {
    name = "vehicle_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S" # Storing ISO string
  }

  # Global Secondary Index to query by status (for dashboard stats)
  # This allows "Give me all active vehicles"
  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
}
