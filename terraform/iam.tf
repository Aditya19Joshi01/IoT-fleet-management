resource "aws_iam_role" "iot_timestream_role" {
  name = "${var.project_name}-iot-timestream-role-${var.environment}"

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

resource "aws_iam_role_policy" "iot_timestream_policy" {
  name = "${var.project_name}-iot-timestream-policy-${var.environment}"
  role = aws_iam_role.iot_timestream_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "timestream:WriteRecords"
        ]
        Resource = aws_timestreamwrite_table.telemetry_table.arn
      },
      {
        Effect = "Allow"
        Action = [
          "timestream:DescribeEndpoints"
        ]
        Resource = "*"
      }
    ]
  })
}
