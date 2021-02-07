terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "next_image_optimizer" {
  source = "../.."

  next_image_domains = ["assets.vercel.com"]

  debug_use_local_packages = true
}

output "domain" {
  value = module.next_image_optimizer.cloudfront_domain_name
}
