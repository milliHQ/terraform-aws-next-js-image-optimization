# Standalone Example

This example shows how to use the image optimizer together with an existing Next.js deployment.

> **Note:** The full example code is available on [GitHub](https://github.com/dealmore/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js)

## 1. Deploy the image optimizer to AWS

Create a new `main.tf` file (can be in the same directory where your Next.js project is located) and add the following code:

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

  next_image_domains = ["assets.vercel.com"]
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

You should save the `<distribution-id>.cloudfront.net` output somewhere since you need it in the next step.

## 2. Adjust Next.js config

In your Next.js project, open or create the `next.config.js` file and add the following lines (Remember to replace `<distribution-id>` with the output from the previous step):

```diff
// next.config.js

module.exports = {
+  images: {
+    path: 'https://<distribution-id>.cloudfront.net/_next/image'
+  },
}
```

## 3. Deploy your Next.js app

Now build and redeploy your app (for this example we host our Next.js app on [Vercel](https://vercel.com/)):

> Note that Vercel already has built-in image optimization, so this is only for demonstration purposes.

```sh
npm i -g vercel
vercel init
vercel
```

---

Now you are all set!  
You can now visit your Next.js app in browser and the images should be delivered by the CloudFront distribution.
