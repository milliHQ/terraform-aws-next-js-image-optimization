output "cloudfront_domain_name" {
  description = "Domain of the internal CloudFront distribution."
  value       = module.cloudfront.cloudfront_domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Zone id of the internal CloudFront distribution."
  value       = module.cloudfront.cloudfront_hosted_zone_id
}

output "cloudfront_origin_id" {
  description = "Id of the custom origin used for image optimization."
  value       = var.cloudfront_origin_id
}

output "cloudfront_origin" {
  description = "Predefined CloudFront origin. Can be used to embed the image optimizer into an existing CloudFront resource."
  value       = local.cloudfront_origin
}

output "cloudfront_origin_image_optimizer" {
  description = "Deprecated, please use cloudfront_origin instead."
  value       = local.cloudfront_origin
}

output "cloudfront_cache_behavior" {
  description = "Predefined CloudFront cache behavior. Can be used to embed the image optimizer into an existing CloudFront resource."
  value       = local.cloudfront_cache_behavior
}

output "cloudfront_origin_request_policy_id" {
  description = "Request policy id used for image optimization."
  value       = aws_cloudfront_origin_request_policy.this.id
}

output "cloudfront_cache_policy_id" {
  description = "Cache policy id used for image optimization."
  value       = aws_cloudfront_cache_policy.this.id
}
