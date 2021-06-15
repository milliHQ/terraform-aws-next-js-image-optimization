terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Main AWS region where the resources should be created in
provider "aws" {
  region = "us-east-1"
}

#################
# Image Optimizer
#################
module "next_image_optimizer" {
  source = "dealmore/next-js-image-optimization/aws"

  # Prevent creation of the internal CloudFront distribution
  cloudfront_create_distribution = false

  deployment_name         = "next-image-optimizer-example-external-cf"
  next_image_domains      = ["assets.vercel.com"]
  next_image_image_sizes  = [12, 24, 48]
  next_image_device_sizes = [760, 960, 1024]
}

##################################
# Existing CloudFront distribution
##################################
resource "aws_cloudfront_distribution" "distribution" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "next-image-optimizer-example-external-cf"

  # This is a generic dynamic to create the default cache behavior
  dynamic "default_cache_behavior" {
    for_each = [module.next_image_optimizer.cloudfront_cache_behavior]

    content {
      allowed_methods  = default_cache_behavior.value["allowed_methods"]
      cached_methods   = default_cache_behavior.value["cached_methods"]
      target_origin_id = default_cache_behavior.value["target_origin_id"]

      viewer_protocol_policy = default_cache_behavior.value["viewer_protocol_policy"]
      compress               = default_cache_behavior.value["compress"]

      origin_request_policy_id = default_cache_behavior.value["origin_request_policy_id"]
      cache_policy_id          = default_cache_behavior.value["cache_policy_id"]
    }
  }

  # This is a generic dynamic to create an origin
  dynamic "origin" {
    for_each = [module.next_image_optimizer.cloudfront_origin_image_optimizer]

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

output "domain" {
  value = aws_cloudfront_distribution.distribution.domain_name
}
