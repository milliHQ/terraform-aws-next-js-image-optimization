##########
# Settings
##########
variable "next_image_version" {
  description = "Next.js version from where you want to use the image optimizer from. Supports semver ranges."
  type        = string
  default     = "12.1.3"
}

variable "next_image_base_origin" {
  description = "Base URL where requests for absolute image paths should be resolved to. Should not have a trailing slash."
  type        = string
  default     = null
}

variable "next_image_domains" {
  description = "Allowed origin domains that can be used for fetching images."
  type        = list(string)
  default     = []
}

variable "next_image_device_sizes" {
  description = "Allowed device sizes that should be used for image optimization."
  type        = list(number)
  default     = null
}

variable "next_image_formats" {
  description = "If the Accept head matches more than one of the configured formats, the first match in the array is used. Therefore, the array order matters. If there is no match, the Image Optimization API will fallback to the original image's format."
  type        = list(string)
  default     = ["image/webp"]
}

variable "next_image_image_sizes" {
  description = "Allowed image sizes that should be used for image optimization."
  type        = list(number)
  default     = null
}

variable "next_image_dangerously_allow_SVG" {
  description = "Enable the optimization of SVG images."
  type        = bool
  default     = false
}

variable "next_image_content_security_policy" {
  description = "Set the value of the Content-Security-Policy header in the response of the image optimizer."
  type        = string
  default     = null
}

variable "lambda_memory_size" {
  description = "Amount of memory in MB the worker Lambda Function can use. Valid value between 128 MB to 10,240 MB, in 1 MB increments."
  type        = number
  default     = 1024

  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "The var.lambda_memory_size must between 128 and 10240 MB."
  }
}

variable "lambda_timeout" {
  description = "Max amount of time the worker Lambda Function has to return a response in seconds. Should not be more than 30 (Limited by API Gateway)."
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 30
    error_message = "The var.lambda_timeout must between 1 and 30 seconds."
  }
}

variable "lambda_attach_policy_json" {
  description = "Controls whether lambda_policy_json should be added to IAM role for Lambda function."
  type        = bool
  default     = false
}

variable "lambda_policy_json" {
  description = "Additional policy document as JSON to attach to the Lambda Function role."
  type        = string
  default     = ""
}

variable "lambda_role_permissions_boundary" {
  description = "ARN of IAM policy that scopes aws_iam_role access for the lambda."
  type        = string
  default     = null
}

variable "source_bucket_id" {
  description = "When your static files are deployed to a Bucket (e.g. with Terraform Next.js) the optimizer can pull the source from the bucket rather than over the internet."
  type        = string
  default     = null
}

#####################
# CloudFront settings
#####################

variable "cloudfront_create_distribution" {
  description = "Controls whether a CloudFront distribution should be created."
  type        = bool
  default     = true
}

variable "cloudfront_price_class" {
  description = "Price class for the CloudFront distribution. One of PriceClass_All, PriceClass_200, PriceClass_100."
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_enable_origin_shield" {
  description = "Controls whether CloudFront Origin Shield should be enabled on the image optimizer lambdas."
  type        = bool
  default     = true
}

variable "cloudfront_origin_shield_region" {
  description = "Override the region chosen for the CloudFront origin shield. Use `auto` to automatically determine the optimal region."
  type        = string
  default     = "auto"
}

variable "cloudfront_origin_id" {
  description = "Override the id for the custom CloudFront id."
  type        = string
  default     = "tf-next-image-optimizer"
}

variable "cloudfront_minimum_protocol_version" {
  description = "The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections. One of SSLv3, TLSv1, TLSv1_2016, TLSv1.1_2016, TLSv1.2_2018 TLSv1.2_2019 or TLSv1.2_2021."
  type        = string
  default     = "TLSv1"
}

variable "cloudfront_acm_certificate_arn" {
  description = "CloudFront ACM certificate to use."
  type        = string
  default     = null
}

variable "cloudfront_aliases" {
  description = "Custom domain(s) for CloudFront."
  type        = list(string)
  default     = []
}

##########
# Labeling
##########

variable "deployment_name" {
  description = "Identifier for the deployment group (only lowercase alphanumeric characters and hyphens are allowed)."
  type        = string
  default     = "tf-next-image"

  validation {
    condition     = can(regex("[a-z0-9-]+", var.deployment_name))
    error_message = "Only lowercase alphanumeric characters and hyphens allowed."
  }
}

variable "tags" {
  description = "Tag metadata to label AWS resources that support tags."
  type        = map(string)
  default     = {}
}

#######
# Debug
#######
variable "debug_use_local_packages" {
  description = "(Debug) Use local packages instead of downloading them from npm."
  type        = bool
  default     = false
}
