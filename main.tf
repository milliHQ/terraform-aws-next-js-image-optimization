###############
# Worker Lambda
###############

module "lambda_content" {
  source  = "milliHQ/download/npm"
  version = "2.1.0"

  module_name    = "@millihq/tf-next-image-optimization"
  module_version = var.next_image_version
  path_to_file   = "dist.zip"
  use_local      = var.debug_use_local_packages
  local_cwd      = path.module
}

module "image_optimizer" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "3.1.0"

  function_name = var.deployment_name
  description   = "Managed by Terraform Next.js image optimizer"
  handler       = "handler.handler"
  runtime       = "nodejs16.x"
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout
  publish       = true

  environment_variables = {
    NODE_ENV                             = "production"
    TF_NEXTIMAGE_BASE_ORIGIN             = var.next_image_base_origin
    TF_NEXTIMAGE_DOMAINS                 = jsonencode(var.next_image_domains)
    TF_NEXTIMAGE_DEVICE_SIZES            = var.next_image_device_sizes != null ? jsonencode(var.next_image_device_sizes) : null
    TF_NEXTIMAGE_FORMATS                 = jsonencode(var.next_image_formats)
    TF_NEXTIMAGE_IMAGE_SIZES             = var.next_image_image_sizes != null ? jsonencode(var.next_image_image_sizes) : null
    TF_NEXTIMAGE_DANGEROUSLY_ALLOW_SVG   = var.next_image_dangerously_allow_SVG ? jsonencode(var.next_image_dangerously_allow_SVG) : null
    TF_NEXTIMAGE_CONTENT_SECURITY_POLICY = var.next_image_content_security_policy != null ? jsonencode(var.next_image_content_security_policy) : null
    TF_NEXTIMAGE_SOURCE_BUCKET           = var.source_bucket_id
  }

  create_package         = false
  local_existing_package = module.lambda_content.rel_path

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
  description   = "Managed by Terraform Next.js image optimizer"
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
  # - Accept:  Header is used to determine the supported image formats from the
  #            client.
  # - Referer: Header is used to determine the host for absolute image paths,
  #            e.g. example.com/_next/image?url=/image.png, would fetch the
  #            image from example.com/image.png.name
  #            Not used if the images are fetched from S3 bucket.
  cloudfront_allowed_headers = var.source_bucket_id == null && var.next_image_base_origin == null ? sort(["accept", "referer"]) : ["accept"]


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

resource "aws_cloudfront_origin_request_policy" "this" {
  name    = "${var.deployment_name}_request"
  comment = "Managed by Terraform Next.js image optimizer"

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
  name    = "${var.deployment_name}_image-cache"
  comment = "Managed by Terraform Next.js image optimizer"

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

  cloudfront_create_distribution      = var.cloudfront_create_distribution
  cloudfront_price_class              = var.cloudfront_price_class
  cloudfront_origin                   = local.cloudfront_origin
  cloudfront_default_behavior         = local.cloudfront_cache_behavior
  cloudfront_minimum_protocol_version = var.cloudfront_minimum_protocol_version
  cloudfront_acm_certificate_arn      = var.cloudfront_acm_certificate_arn
  cloudfront_aliases                  = var.cloudfront_aliases

  deployment_name = var.deployment_name
  tags            = var.tags
}
