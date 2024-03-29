variable "cloudfront_create_distribution" {
  type = bool
}

variable "cloudfront_price_class" {
  type = string
}

variable "cloudfront_origin" {
  type = any
}

variable "cloudfront_default_behavior" {
  type = any
}

variable "deployment_name" {
  type = string
}

variable "tags" {
  type = map(string)
}

variable "cloudfront_minimum_protocol_version" {
  type = string
}

variable "cloudfront_acm_certificate_arn" {
  type    = string
  default = null
}

variable "cloudfront_aliases" {
  type    = list(string)
  default = []
}
