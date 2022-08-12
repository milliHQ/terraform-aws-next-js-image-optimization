terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# AWS region where the image optimizer should be deployed to.
# While the optimized images are cached globally (via CloudFront CDN) this
# determines the location where the optimization (Lambda) should happen, when
# the cache is missed.
provider "aws" {
  region = "us-east-1"
}

###########
# Variables
###########

variable "custom_domain" {
  description = "Your custom domain"
  type        = string
  default     = "example.com"
}

# Assuming that the hosted ZONE of your domain is already registered in your
# AWS account (Route 53)
# https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/AboutHZWorkingWith.html
variable "custom_domain_zone_name" {
  description = "The Route53 zone name of the custom domain"
  type        = string
  default     = "example.com."
}

# Get the hosted zone for the custom domain
data "aws_route53_zone" "custom_domain_zone" {
  name = var.custom_domain_zone_name
}

# Create a new record in Route 53 for the domain
resource "aws_route53_record" "cloudfront_alias_domain" {
  zone_id = data.aws_route53_zone.custom_domain_zone.zone_id
  name    = each.key
  type    = "A"

  alias {
    name                   = module.next_image_optimizer.cloudfront_domain_name
    zone_id                = module.next_image_optimizer.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

##########
# SSL Cert
##########

# Creates a free SSL certificate for CloudFront distribution
# For more options (e.g. multiple domains) see:
# https://registry.terraform.io/modules/terraform-aws-modules/acm/aws/
module "cloudfront_cert" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 3.0"

  domain_name               = var.custom_domain
  zone_id                   = data.aws_route53_zone.custom_domain_zone.zone_id
  subject_alternative_names = slice(local.aliases, 1, length(local.aliases))

  tags = {
    Name = "CloudFront ${var.custom_domain}"
  }

  # CloudFront works only with certs stored in us-east-1
  providers = {
    aws = aws.global_region
  }
}

#######################
# Route53 Domain record
#######################

module "next_image_optimizer" {
  source = "milliHQ/next-js-image-optimization/aws"

  cloudfront_aliases             = [var.custom_domain]
  cloudfront_acm_certificate_arn = module.cloudfront_cert.acm_certificate_arn
  next_image_domains             = ["assets.vercel.com"]
}

output "custom_domain" {
  value = var.custom_domain
}

output "cloudfront_domain" {
  value = module.next_image_optimizer.cloudfront_domain_name
}
