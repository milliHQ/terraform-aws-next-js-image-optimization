#########################
# Cloudfront distribution
#########################
resource "aws_cloudfront_distribution" "distribution" {
  count = var.cloudfront_create_distribution ? 1 : 0

  enabled         = true
  is_ipv6_enabled = true
  comment         = var.deployment_name
  price_class     = var.cloudfront_price_class

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = lookup(var.cloudfront_origin_group, "origin_id", null)

    forwarded_values {
      query_string            = true
      query_string_cache_keys = var.cloudfront_allowed_query_string_keys

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Default values (Should be provided by origin)
    min_ttl     = 0
    default_ttl = 86400
    max_ttl     = 31536000
  }

  origin_group {
    origin_id = lookup(var.cloudfront_origin_group, "origin_id", null)

    failover_criteria {
      status_codes = lookup(var.cloudfront_origin_group["failover_criteria"], "status_codes", null)
    }

    dynamic "member" {
      for_each = lookup(var.cloudfront_origin_group, "member", [])

      content {
        origin_id = member.value
      }
    }
  }

  dynamic "origin" {
    for_each = var.cloudfront_origins

    content {
      domain_name = origin.value["domain_name"]
      origin_id   = origin.value["origin_id"]

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
    minimum_protocol_version       = var.cloudfront_minimum_protocol_version
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = var.tags
}
