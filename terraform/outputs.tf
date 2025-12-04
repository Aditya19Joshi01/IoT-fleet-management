output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}

output "frontend_url" {
  value = aws_cloudfront_distribution.frontend_distribution.domain_name
}

output "iot_thing_name" {
  value = aws_iot_thing.vehicle_simulator.name
}
