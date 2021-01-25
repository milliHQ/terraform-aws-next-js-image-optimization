##############################
# Processed image storage (S3)
##############################
resource "aws_s3_bucket" "static_upload" {
  bucket_prefix = "tf-next-image"
  acl           = "private"
  force_destroy = true
  tags          = var.tags
}

###############
# Worker Lambda
###############
module "lambda_content" {
  source  = "dealmore/download/npm"
  version = "1.0.0"

  module_name    = "@dealmore/tf-next-image-optimization"
  module_version = var.next_js_version
  path_to_file   = "dist.zip"
  use_local      = var.debug_use_local_packages
}

resource "random_id" "function_name" {
  prefix      = "${var.deployment_name}-"
  byte_length = 4
}

module "image_optimizer" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "1.34.0"

  function_name = random_id.function_name.hex
  description   = var.deployment_name
  handler       = "handler.handler"
  runtime       = "nodejs12.x"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  publish       = true

  environment_variables = {
    NODE_ENV = "production",
    DOMAINS  = jsonencode(var.domains)
  }

  create_package         = false
  local_existing_package = module.lambda_content.abs_path

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service = "apigateway"
      arn     = module.api_gateway.this_apigatewayv2_api_execution_arn
    }
  }

  cloudwatch_logs_retention_in_days = 30
  role_permissions_boundary         = var.lambda_role_permissions_boundary

  tags = var.tags
}

#########################
# API Gateway integration
#########################
module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "0.8.0"

  name          = var.deployment_name
  description   = "Managed by Terraform-next.js image optimizer"
  protocol_type = "HTTP"

  create_api_domain_name = false

  integrations = {
    "GET /_next/image" = {
      lambda_arn             = module.image_optimizer.this_lambda_function_arn
      payload_format_version = "2.0"
      timeout_milliseconds   = var.lambda_timeout * 1000
    }
  }

  tags = var.tags
}

########################
# CloudFront Integration
########################

