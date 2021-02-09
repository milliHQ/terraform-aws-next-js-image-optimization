variable "cloudfront_create_distribution" {
  type = bool
}

variable "cloudfront_price_class" {
  type = string
}

variable "cloudfront_allowed_query_string_keys" {
  type = list(string)
}

variable "cloudfront_allowed_headers" {
  type = list(string)
}

variable "cloudfront_origin" {
  type = any
}


variable "deployment_name" {
  type = string
}

variable "tags" {
  type = map(string)
}
