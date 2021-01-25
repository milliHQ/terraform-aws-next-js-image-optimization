##############################
# Processed image storage (S3)
##############################
resource "aws_s3_bucket" "cache" {
  bucket_prefix = "tf-next-image"
  acl           = "private"
  force_destroy = true

  lifecycle_rule {
    id      = "expire_cached_images"
    enabled = var.expire_cache >= 0 # -1 disables the expiration

    expiration {
      days = var.expire_cache > 0 ? var.expire_cache : 0
    }
  }

  tags = var.tags
}

resource "aws_cloudfront_origin_access_identity" "origin_access_identity" {
  comment = var.deployment_name
}

data "aws_iam_policy_document" "cloudfront_s3_access" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.cache.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.origin_access_identity.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudfront_access" {
  bucket = aws_s3_bucket.cache.id
  policy = data.aws_iam_policy_document.cloudfront_s3_access.json
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

locals {
  # Query string parameters used by image optimizer
  # Must be sorted to prevent unnessesary updates of the cloudFront distribution
  cloudfront_allowed_query_string_keys = sort(["url", "w", "q"])

  cloudfront_origin_image_cache = {
    domain_name = aws_s3_bucket.cache.bucket_regional_domain_name
    origin_id   = "tf-next-image-cache"

    s3_origin_config = {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_access_identity.cloudfront_access_identity_path
    }
  }

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

  cloudfront_origin_group = {
    origin_id = "tf-next-image-origin-group"

    # When the image does not exist on S3, S3 sends a 403, which then triggers
    # the image optimizer Lambda reoute
    failover_criteria = {
      status_codes = [403]
    }

    member = [
      local.cloudfront_origin_image_cache["origin_id"],
      local.cloudfront_origin_image_optimizer["origin_id"]
    ]
  }
}

module "cloudfront" {
  source = "./modules/cloudfront-cache"

  cloudfront_create_distribution       = var.cloudfront_create_distribution
  cloudfront_minimum_protocol_version  = var.cloudfront_minimum_protocol_version
  cloudfront_price_class               = var.cloudfront_price_class
  cloudfront_allowed_query_string_keys = local.cloudfront_allowed_query_string_keys
  cloudfront_origins = [
    local.cloudfront_origin_image_cache,
    local.cloudfront_origin_image_optimizer
  ]
  cloudfront_origin_group = local.cloudfront_origin_group

  deployment_name = var.deployment_name
  tags            = var.tags
}
