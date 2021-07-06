##########
# Settings
##########
variable "next_image_version" {
  description = "Next.js version from where you want to use the image optimizer from. Supports semver ranges."
  type        = string
  default     = "11.0.1"
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

variable "next_image_image_sizes" {
  description = "Allowed image sizes that should be used for image optimization."
  type        = list(number)
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
  description = "Price class for the CloudFront distributions (main & proxy config). One of PriceClass_All, PriceClass_200, PriceClass_100."
  type        = string
  default     = "PriceClass_100"
}

variable "cloudfront_enable_origin_shield" {
  description = "Controls whether CloudFront Origin Shield should be enabled on the image optimizer lambdas."
  type        = bool
  default     = true
}

variable "cloudfront_origin_shield_region" {
  description = "Override the region choosen for the CloudFront origin shield. Use `auto` to automatically determine the optimal region."
  type        = string
  default     = "auto"
}

variable "cloudfront_origin_id" {
  description = "Override the id for the custom CloudFront id."
  type        = string
  default     = "tf-next-image-optimizer"
}

##########
# Labeling
##########

variable "deployment_name" {
  description = "Identifier for the deployment group (alphanumeric characters, underscores, hyphens, slashes, hash signs and dots are allowed)."
  type        = string
  default     = "tf-next-image"
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
