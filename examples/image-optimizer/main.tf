terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

module "next_image_optimizer" {
  source = "../.."

  domains = ["raw.githubusercontent.com"]

  debug_use_local_packages = true
}
