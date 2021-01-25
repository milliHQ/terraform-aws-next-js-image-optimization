##########
# Settings
##########
variable "next_js_version" {
  description = "The Next.js version from where you want to use the image optimizer from. Supports semver ranges."
  type        = string
  default     = "^10.0.0"
}

variable "domains" {
  description = "The allowed origin domains that can be used for fetching images."
  type        = list(string)
  default     = []
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
  description = "The max amount of time the worker Lambda Function has to return a response in seconds. Should not be more than 30 (Limited by API Gateway)."
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 30
    error_message = "The var.lambda_timeout must between 1 and 30 seconds."
  }
}

variable "lambda_role_permissions_boundary" {
  type        = string
  description = "ARN of IAM policy that scopes aws_iam_role access for the lambda."
  default     = null
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
