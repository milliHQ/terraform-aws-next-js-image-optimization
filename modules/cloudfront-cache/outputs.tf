output "cloudfront_domain_name" {
  value = var.cloudfront_create_distribution ? element(concat(aws_cloudfront_distribution.distribution.*.domain_name, [""]), 0) : null
}

output "cloudfront_hosted_zone_id" {
  value = var.cloudfront_create_distribution ? element(concat(aws_cloudfront_distribution.distribution.*.hosted_zone_id, [""]), 0) : null
}
