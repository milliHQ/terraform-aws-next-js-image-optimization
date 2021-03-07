###############
# Worker Lambda
###############
module "lambda_content" {
  source  = "dealmore/download/npm"
  version = "1.0.0"

  module_name    = "@dealmore/tf-next-image-optimization"
  module_version = var.next_image_version
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
    NODE_ENV                   = "production",
    TF_NEXTIMAGE_DOMAINS       = jsonencode(var.next_image_domains)
    TF_NEXTIMAGE_DEVICE_SIZES  = var.next_image_device_sizes != null ? jsonencode(var.next_image_device_sizes) : null
    TF_NEXTIMAGE_IMAGE_SIZES   = var.next_image_image_sizes != null ? jsonencode(var.next_image_image_sizes) : null
    TF_NEXTIMAGE_SOURCE_BUCKET = var.source_bucket_id
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

  attach_policy_json        = var.lambda_attach_policy_json
  policy_json               = var.lambda_policy_json
  role_permissions_boundary = var.lambda_role_permissions_boundary

  tags = var.tags
}

#########################
# API Gateway integration
#########################
module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "0.11.0"

  name          = var.deployment_name
  description   = "Managed by Terraform-next.js image optimizer"
  protocol_type = "HTTP"

  create_api_domain_name = false

  integrations = {
    "GET /_next/{proxy+}" = {
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

locals {
  # Query string parameters used by image optimizer
  # Must be sorted to prevent unnessesary updates of the cloudFront distribution
  cloudfront_allowed_query_string_keys = sort(["url", "w", "q"])

  # Headers that are used by the image optimizer
  cloudfront_allowed_headers = sort(["accept", "referer"])

  cloudfront_origin_image_optimizer = {
    domain_name = trimprefix(module.api_gateway.this_apigatewayv2_api_api_endpoint, "https://")
    origin_id   = "tf-next-image-optimizer"

    custom_origin_config = {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
}

# TODO: Use request policy once support for cache policies is released
# (We cannot use request policies without cache policies)
# https://github.com/hashicorp/terraform-provider-aws/pull/17336

# resource "aws_cloudfront_origin_request_policy" "api_gateway" {
#   name        = var.deployment_name
#   description = "Managed by Terraform-next.js image optimizer"

#   cookies_config {
#     cookie_behavior = "none"
#   }

#   headers_config {
#     header_behavior = "whitelist"
#     headers {
#       items = local.cloudfront_allowed_headers
#     }
#   }

#   query_strings_config {
#     query_string_behavior = "whitelist"
#     query_strings {
#       items = local.cloudfront_allowed_query_string_keys
#     }
#   }
# }

module "cloudfront" {
  source = "./modules/cloudfront-cache"

  cloudfront_create_distribution       = var.cloudfront_create_distribution
  cloudfront_price_class               = var.cloudfront_price_class
  cloudfront_allowed_query_string_keys = local.cloudfront_allowed_query_string_keys
  cloudfront_allowed_headers           = local.cloudfront_allowed_headers
  cloudfront_origin                    = local.cloudfront_origin_image_optimizer

  deployment_name = var.deployment_name
  tags            = var.tags
}
