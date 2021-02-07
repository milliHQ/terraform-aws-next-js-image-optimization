# Terraform Next.js Image Optimization module for AWS

![CI](https://github.com/dealmore/terraform-aws-next-js-image-optimization/workflows/CI/badge.svg)

A drop-in [image optimization loader](https://nextjs.org/docs/basic-features/image-optimization#loader) for the Next.js image component `next/image`.

If you need a complete hosting solution for Next.js with Terraform, please check out our [Terraform Next.js module for AWS](https://registry.terraform.io/modules/dealmore/next-js/aws).

## Features

- ✅ &nbsp;Terraform `v0.13+`
- ✅ &nbsp;Serverless image processing powered by [AWS Lambda](https://aws.amazon.com/lambda/)
- ✅ &nbsp;[Amazon CloudFront](https://aws.amazon.com/cloudfront/) powered image caching
- ✅ &nbsp;Support for custom [Device Sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) & [Image Sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes)

## Usage

### 1. Deploy the module to AWS

Initialize the module by creating a `main.tf` file with the following content (you can place the file in the same directory where your Next.js project is located):

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

  next_image_domains = ["example.com", "sub.example.com"]
}

output "domain" {
  value = module.next_image_optimizer.cloudfront_domain_name
}
```

Then run Terraform to deploy the image optimiziation module to your AWS account:

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

### 2. Adjust Next.js config

In your Next.js project, open or create the `next.config.js` file and add the following lines (Remember to replace `<distribution-id>` with the output from the previous step):

```diff
// next.config.js

module.exports = {
+  images: {
+    path: 'https://<distribution-id>.cloudfront.net/_next/image'
+  },
}
```

## Examples

- [Next.js + Vercel](https://github.com/dealmore/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js) - Use the image optimizer together with a Next.js app deployed on Vercel.

<!-- prettier-ignore-start -->
<!--- BEGIN_TF_DOCS --->

<!--- END_TF_DOCS --->
<!-- prettier-ignore-end -->

## Versioning

We rely on the original Next.js image optimizer, so every version of the internal Lambda component [`@dealmore/tf-next-image-optimization`](https://www.npmjs.com/package/@dealmore/tf-next-image-optimization) follows the versioning schema of the official [Next.js package](https://www.npmjs.com/package/next).

By default we use the current major version `^10.0.0` of Next.js as base, so each deployment of the Terraform module pulls the latest package from this range.

However if you have problems with a specific version Next.js you can override this setting with a fixed version number or semver range:

```diff
# main.tf
module "next_image_optimizer" {
   source = "dealmore/next-js-image-optimization/aws"

   next_image_domains = ["example.com", "sub.example.com"]
+  next_image_version = "10.0.5"
}
```

Please note that we only publish versions `>=10.0.5`, for a full list of available versions see this [npm page](https://www.npmjs.com/package/@dealmore/tf-next-image-optimization?activeTab=versions).

## License

Apache-2.0 - see [LICENSE](https://github.com/dealmore/terraform-aws-next-js-image-optimization/blob/main/LICENSE) for details.

> **Note:** All sample projects in [`examples/*`](./examples) are licensed as MIT to comply with the official [Next.js examples](https://github.com/vercel/next.js/tree/canary/examples).
