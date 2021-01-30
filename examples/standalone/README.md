# Standalone Example

This example describes how to use the image optimizer together with an existing Next.js deployment.

## 1. Deploy the image optimizer to AWS

Create a new `main.tf` file and add the following code:

```tf
# main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Main AWS region where the resources should be created in
# Should be close to where your Next.js deployment is located
provider "aws" {
  region = "us-east-1"
}

module "next_image_optimizer" {
  source = "dealmore/next-js-image-optimization/aws"

  domains = ["example.com", "my.example.com"]
}

output "domain" {
  value = module.next_image_optimizer.cloudfront_domain_name
}
```

Then run Terraform to create the image optimizer in your AWS account:

```sh
terraform init  # Only needed on the first time running Terraform

terraform plan  # (Optional) See what resources Terraform will create
terraform apply # Deploy the image optimizer module to your AWS account
```

After Terraform has successfully created all resources in your AWS account, you should see the following output on the terminal:

```sh
> Apply complete!
>
> Outputs:
>
> domain = "<distribution-id>.cloudfront.net"
```

You should save the `<distribution-id>.cloudfront.net` output somewhere since you will need it in the next step.

## 2. Adjust Next.js config

In your Next.js project, open or create the `next.config.js` file and add the following lines (Remember to replace `<distribution-id>` with the output from the previous step):

```diff
module.exports = {
+  images: {
+    loader: 'default',
+    path: 'https://<distribution-id>.cloudfront.net/_next/image/',
+  },
}
```

Now you are all set!  
Rebuild your Next.js app and after a new deployment it should use the image optimizer.
