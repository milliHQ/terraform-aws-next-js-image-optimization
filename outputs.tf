output "cloudfront_domain_name" {
  description = "Domain of the internal CloudFront distribution."
  value       = module.cloudfront.cloudfront_domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Zone id of the internal CloudFront distribution."
  value       = module.cloudfront.cloudfront_hosted_zone_id
}

output "cloudfront_allowed_query_string_keys" {
  description = "Allowed query string keys used by the image optimizer."
  value       = local.cloudfront_allowed_query_string_keys
}

output "cloudfront_allowed_headers" {
  description = "Allowed header keys used by the image optimizer."
  value       = local.cloudfront_allowed_headers
}

output "cloudfront_origin_image_optimizer" {
  description = "Predefined CloudFront origin of the image optimizer. Can be used to embedd the image optimizer into an existing CloudFront resource."
  value       = local.cloudfront_origin_image_optimizer
}
