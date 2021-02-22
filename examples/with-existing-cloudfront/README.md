# Example with existing CloudFront distribution

This example shows how to integrate the image optimizer into an existing CloudFront distribution (Without creating a new one).

> **Note:** The full example code is available on [GitHub](https://github.com/dealmore/terraform-aws-next-js-image-optimization/tree/main/examples/with-existing-cloudfront)

## Integration

For a zero config setup the module is preconfigured to create a CloudFront distribution by itself.
However when using the module together with an external CloudFront resource, you can disable this behavior by setting `cloudfront_create_distribution` to `false`:

```diff
module "next_image_optimizer" {
   source = "dealmore/next-js-image-optimization/aws"

+  cloudfront_create_distribution = false
}
```

The module has some preconfigured output values (`cloudfront_allowed_query_string_keys`, `cloudfront_origin_request_policy_id` and `cloudfront_cache_policy_id`) that make it easy to integrate the module with an existing CloudFront resource.

```tf
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

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = module.next_image_optimizer.cloudfront_origin_id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    origin_request_policy_id = module.next_image_optimizer.cloudfront_origin_request_policy_id
    cache_policy_id = module.next_image_optimizer.cloudfront_cache_policy_id
  }

  # This is a generic dynamic to create an origin
  dynamic "origin" {
    for_each = [module.next_image_optimizer.cloudfront_origin_image_optimizer]

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
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
}
```
