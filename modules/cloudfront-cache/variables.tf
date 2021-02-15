variable "cloudfront_create_distribution" {
  type = bool
}

variable "cloudfront_price_class" {
  type = string
}

variable "cloudfront_origin" {
  type = any
}

variable "cloudfront_origin_request_policy_id" {
  type = string
}

variable "cloudfront_cache_policy_id" {
  type = string
}

variable "deployment_name" {
  type = string
}

variable "tags" {
  type = map(string)
}
