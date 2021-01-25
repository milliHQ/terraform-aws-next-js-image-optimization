output "cloudfront_domain_name" {
  description = "The domain of the CloudFront distribution."
  value       = module.cloudfront.cloudfront_domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "The zone id of the CloudFront distribution."
  value       = module.cloudfront.cloudfront_hosted_zone_id
}
