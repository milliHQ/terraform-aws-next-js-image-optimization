terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Main AWS region where the resources should be created in
provider "aws" {
  region = "us-east-1"
}

##########
# Settings
##########
variable "deployment_name" {
  description = "Identifier that should be added to the resources created in AWS."
  type        = string
  default     = "next-image-optimizer-example-export"
}

########################
# Image Optimizer module
########################
module "next_image_optimizer" {
  source = "milliHQ/next-js-image-optimization/aws"

  # Prevent creation of the internal CloudFront distribution
  cloudfront_create_distribution = false

  deployment_name    = var.deployment_name
  next_image_domains = ["assets.vercel.com"]
  next_image_formats = ["image/avif", "image/webp"]
}

###########
# S3 bucket
###########
resource "aws_s3_bucket" "website_bucket" {
  bucket_prefix = var.deployment_name
  acl           = "public-read"
  force_destroy = true

  cors_rule {
    allowed_headers = ["Authorization", "Content-Length"]
    allowed_methods = ["GET", "POST"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }

  website {
    index_document = "index.html"
    error_document = "404/index.html"
  }

  tags = {
    Name = var.deployment_name
  }
}

data "aws_iam_policy_document" "public_bucket_access" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.website_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = aws_s3_bucket.website_bucket.id
  policy = data.aws_iam_policy_document.public_bucket_access.json
}

#########################
# CloudFront distribution
#########################
data "aws_cloudfront_origin_request_policy" "managed_cors_s3_origin" {
  name = "Managed-CORS-CustomOrigin"
}

data "aws_cloudfront_cache_policy" "managed_caching_optimized_uncompressed" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "distribution" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = var.deployment_name

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "website-bucket"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.managed_cors_s3_origin.id
    cache_policy_id          = data.aws_cloudfront_cache_policy.managed_caching_optimized_uncompressed.id
  }

  origin {
    domain_name = aws_s3_bucket.website_bucket.website_endpoint
    origin_id   = "website-bucket"

    custom_origin_config {
      http_port              = "80"
      https_port             = "443"
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
    }
  }

  # This is a generic dynamic to create the cache behavior for the image optimizer
  dynamic "ordered_cache_behavior" {
    for_each = [module.next_image_optimizer.cloudfront_cache_behavior]

    content {
      path_pattern     = ordered_cache_behavior.value["path_pattern"]
      allowed_methods  = ordered_cache_behavior.value["allowed_methods"]
      cached_methods   = ordered_cache_behavior.value["cached_methods"]
      target_origin_id = ordered_cache_behavior.value["target_origin_id"]

      viewer_protocol_policy = ordered_cache_behavior.value["viewer_protocol_policy"]
      compress               = ordered_cache_behavior.value["compress"]

      origin_request_policy_id = ordered_cache_behavior.value["origin_request_policy_id"]
      cache_policy_id          = ordered_cache_behavior.value["cache_policy_id"]
    }
  }

  # This is a generic dynamic to create the origin for the image optimizer
  dynamic "origin" {
    for_each = [module.next_image_optimizer.cloudfront_origin]

    content {
      domain_name = origin.value["domain_name"]
      origin_id   = origin.value["origin_id"]

      # Origin Shield
      dynamic "origin_shield" {
        for_each = lookup(origin.value, "origin_shield", null) != null ? [true] : []

        content {
          enabled              = lookup(origin.value["origin_shield"], "enabled", false)
          origin_shield_region = lookup(origin.value["origin_shield"], "origin_shield_region", null)
        }
      }

      # S3 origin
      dynamic "s3_origin_config" {
        for_each = lookup(origin.value, "s3_origin_config", null) != null ? [true] : []

        content {
          origin_access_identity = lookup(origin.value["s3_origin_config"], "origin_access_identity", null)
        }
      }

      # Custom origin
      dynamic "custom_origin_config" {
        for_each = lookup(origin.value, "custom_origin_config", null) != null ? [true] : []

        content {
          http_port                = lookup(origin.value["custom_origin_config"], "http_port", null)
          https_port               = lookup(origin.value["custom_origin_config"], "https_port", null)
          origin_protocol_policy   = lookup(origin.value["custom_origin_config"], "origin_protocol_policy", null)
          origin_ssl_protocols     = lookup(origin.value["custom_origin_config"], "origin_ssl_protocols", null)
          origin_keepalive_timeout = lookup(origin.value["custom_origin_config"], "origin_keepalive_timeout", null)
          origin_read_timeout      = lookup(origin.value["custom_origin_config"], "origin_read_timeout", null)
        }
      }
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}

#########
# Outputs
#########

output "website_bucket_id" {
  value = aws_s3_bucket.website_bucket.id
}

output "domain" {
  value = aws_cloudfront_distribution.distribution.domain_name
}
