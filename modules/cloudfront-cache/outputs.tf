output "cloudfront_domain_name" {
  value = element(concat(aws_cloudfront_distribution.distribution.*.domain_name, [""]), 0)
}

output "cloudfront_hosted_zone_id" {
  value = element(concat(aws_cloudfront_distribution.distribution.*.hosted_zone_id, [""]), 0)
}
