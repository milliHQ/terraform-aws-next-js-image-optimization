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
  version = "2.4.0"

  function_name = random_id.function_name.hex
  description   = var.deployment_name
  handler       = "handler.handler"
  runtime       = "nodejs14.x"
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
      arn     = module.api_gateway.apigatewayv2_api_execution_arn
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
  version = "1.1.0"

  name          = var.deployment_name
  description   = "Managed by Terraform-next.js image optimizer"
  protocol_type = "HTTP"

  create_api_domain_name = false

  integrations = {
    "GET /_next/{proxy+}" = {
      lambda_arn             = module.image_optimizer.lambda_function_arn
      payload_format_version = "2.0"
      timeout_milliseconds   = var.lambda_timeout * 1000
    }
  }

  tags = var.tags
}

########################
# CloudFront Integration
########################

# Get the AWS region from the provider
data "aws_region" "current" {}

locals {
  # Origin Shield
  ###############

  # Origin Shield mapping configuration
  # See: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html
  origin_shield_region_mapping = {
    # Regions where Origin Shield is available
    us-east-2      = "us-east-2"      # US East (Ohio)
    us-east-1      = "us-east-1"      # US East (N. Virginia)
    us-west-2      = "us-west-2"      # US West (Oregon)
    ap-south-1     = "ap-south-1"     # Asia Pacific (Mumbai)
    ap-northeast-2 = "ap-northeast-2" # Asia Pacific (Seoul)
    ap-southeast-1 = "ap-southeast-1" # Asia Pacific (Singapore)
    ap-southeast-2 = "ap-southeast-2" # Asia Pacific (Sydney)
    ap-northeast-1 = "ap-northeast-1" # Asia Pacific (Tokyo)
    eu-central-1   = "eu-central-1"   # Europe (Frankfurt)
    eu-west-1      = "eu-west-1"      # Europe (Ireland)
    eu-west-2      = "eu-west-2"      # Europe (London)
    sa-east-1      = "sa-east-1"      # South America (São Paulo)

    # Regions where Origin Shield is NOT available (choose closest region)
    us-west-1    = "us-west-2"      # US West (N. California)
    af-south-1   = "eu-west-1"      # Africa (Cape Town)
    ap-east-1    = "ap-southeast-1" # Asia Pacific (Hong Kong)
    ca-central-1 = "us-east-1"      # Canada (Central)
    eu-south-1   = "eu-central-1"   # Europe (Milan)
    eu-west-3    = "eu-west-2"      # Europe (Paris)
    eu-north-1   = "eu-west-2"      # Europe (Stockholm)
    me-south-1   = "ap-south-1"     # Middle East (Bahrain)
  }

  origin_shield_region = var.cloudfront_origin_shield_region == "auto" ? lookup(
    local.origin_shield_region_mapping,
    data.aws_region.current.name,
    null
  ) : var.cloudfront_origin_shield_region

  origin_shield_enabled = var.cloudfront_enable_origin_shield && local.origin_shield_region != null

  cloudfront_origin_shield_config = local.origin_shield_enabled ? {
    origin_shield = {
      enabled              = true
      origin_shield_region = local.origin_shield_region
    }
  } : {}

  # Query string parameters used by image optimizer
  # Must be sorted to prevent unnecessary updates of the cloudFront distribution
  cloudfront_allowed_query_string_keys = sort(["url", "w", "q"])

  # Headers that are used by the image optimizer
  cloudfront_allowed_headers = sort(["accept", "referer"])


  # CloudFront origin
  ###################
  cloudfront_origin = merge(
    {
      domain_name = trimprefix(module.api_gateway.apigatewayv2_api_api_endpoint, "https://")
      origin_id   = var.cloudfront_origin_id

      custom_origin_config = {
        http_port              = "80"
        https_port             = "443"
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    },
    local.cloudfront_origin_shield_config
  )

  # CloudFront cache behavior
  ###########################
  cloudfront_cache_behavior = {
    path_pattern             = "/_next/image*"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = local.cloudfront_origin.origin_id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    origin_request_policy_id = aws_cloudfront_origin_request_policy.this.id
    cache_policy_id          = aws_cloudfront_cache_policy.this.id
  }
}

resource "random_id" "policy_name" {
  prefix      = "${var.deployment_name}-"
  byte_length = 4
}

resource "aws_cloudfront_origin_request_policy" "this" {
  name    = "${random_id.policy_name.hex}-request"
  comment = "Managed by Terraform-next.js image optimizer"

  cookies_config {
    cookie_behavior = "none"
  }

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = local.cloudfront_allowed_headers
    }
  }

  query_strings_config {
    query_string_behavior = "whitelist"
    query_strings {
      items = local.cloudfront_allowed_query_string_keys
    }
  }
}

resource "aws_cloudfront_cache_policy" "this" {
  name    = "${random_id.policy_name.hex}-cache"
  comment = "Managed by Terraform-next.js image optimizer"

  # Default values (Should be provided by origin)
  min_ttl     = 0
  default_ttl = 86400
  max_ttl     = 31536000

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "whitelist"
      headers {
        items = local.cloudfront_allowed_headers
      }
    }

    query_strings_config {
      query_string_behavior = "whitelist"
      query_strings {
        items = local.cloudfront_allowed_query_string_keys
      }
    }

    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

module "cloudfront" {
  source = "./modules/cloudfront-cache"

  cloudfront_create_distribution = var.cloudfront_create_distribution
  cloudfront_price_class         = var.cloudfront_price_class
  cloudfront_origin              = local.cloudfront_origin
  cloudfront_default_behavior    = local.cloudfront_cache_behavior

  deployment_name = var.deployment_name
  tags            = var.tags
}
