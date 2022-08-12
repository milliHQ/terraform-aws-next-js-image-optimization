terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "next_image_optimizer" {
  source = "milliHQ/next-js-image-optimization/aws"

  next_image_domains = ["assets.vercel.com"]
}

output "domain" {
  value = module.next_image_optimizer.cloudfront_domain_name
}
