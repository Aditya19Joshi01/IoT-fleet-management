variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Name of the project used for resource naming"
  type        = string
  default     = "fleet-management"
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}
