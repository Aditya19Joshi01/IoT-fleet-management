resource "aws_iot_thing" "vehicle_simulator" {
  name = "${var.project_name}-simulator-${var.environment}"
}

resource "aws_iot_policy" "vehicle_policy" {
  name = "${var.project_name}-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# Note: Certificates are typically generated via CLI or Console for security 
# and then attached. Creating them in Terraform and storing keys in state 
# is possible but requires careful state management.
