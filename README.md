# Terraform Next.js Image Optimization module for AWS

[![CI](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/actions/workflows/CI.yml/badge.svg)](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/actions/workflows/CI.yml)

A drop-in [image optimization loader](https://nextjs.org/docs/basic-features/image-optimization#loader) for the Next.js image component `next/image`.

> **Notice:** If you look for a complete solution to host a Next.js application with Terraform on AWS, please check out our [Terraform Next.js module for AWS](https://registry.terraform.io/modules/milliHQ/next-js/aws).

## Features

- ✅ &nbsp;Terraform `v0.13+`
- ✅ &nbsp;Serverless image processing powered by [AWS Lambda](https://aws.amazon.com/lambda/)
- ✅ &nbsp;Powerful optimization using the [sharp](https://github.com/lovell/sharp) processing library
- ✅ &nbsp;Performant image caching powered by [Amazon CloudFront](https://aws.amazon.com/cloudfront/)
- ✅ &nbsp;Two-layer caching with [CloudFront Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)
- ✅ &nbsp;Support for custom [Device Sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) & [Image Sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes)

## Architecture

The image optimization module is designed as a full stack AWS app.
It relies on multiple AWS services and connects them to work as a single application:

![Architecture overview diagram](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/blob/main/docs/assets/architecture.png?raw=true)

## Usage

### 1. Deploy the module to AWS

Initialize the module by creating a `main.tf` file with the following content (you can place the file in the same directory where your Next.js project is located):

```tf
# main.tf

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Main AWS region where the resources should be created in
# Should be close to where your Next.js deployment is located
provider "aws" {
  region = "us-east-1"
}

module "next_image_optimizer" {
  source = "milliHQ/next-js-image-optimization/aws"

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

Then rebuild and redeploy your Next.js application to make use of the changed configuration.

## Examples

- [Statically exported Next.js app hosted on S3](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js-export)  
  Use the image optimizer together with a statically exported Next.js app that is deployed to S3 and CloudFront.
- [Next.js + Vercel](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js)  
  Use the image optimizer together with a Next.js app deployed on Vercel.
- [Existing CloudFront](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-existing-cloudfront)  
  Use the image optimizer with an existing CloudFront distribution.

<!-- prettier-ignore-start -->
<!-- STOP: Auto generated values - Make no manual edits here -->
<!-- BEGIN_TF_DOCS -->
## Requirements

| Name | Version |
|------|---------|
| terraform | >= 0.13 |
| aws | >= 4.8 |

## Providers

| Name | Version |
|------|---------|
| aws | >= 4.8 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| cloudfront\_acm\_certificate\_arn | CloudFront ACM certificate to use. | `string` | `null` | no |
| cloudfront\_aliases | Custom domain(s) for CloudFront. | `list(string)` | `[]` | no |
| cloudfront\_create\_distribution | Controls whether a CloudFront distribution should be created. | `bool` | `true` | no |
| cloudfront\_enable\_origin\_shield | Controls whether CloudFront Origin Shield should be enabled on the image optimizer lambdas. | `bool` | `true` | no |
| cloudfront\_minimum\_protocol\_version | The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections. One of SSLv3, TLSv1, TLSv1\_2016, TLSv1.1\_2016, TLSv1.2\_2018 TLSv1.2\_2019 or TLSv1.2\_2021. | `string` | `"TLSv1"` | no |
| cloudfront\_origin\_id | Override the id for the custom CloudFront id. | `string` | `"tf-next-image-optimizer"` | no |
| cloudfront\_origin\_shield\_region | Override the region chosen for the CloudFront origin shield. Use `auto` to automatically determine the optimal region. | `string` | `"auto"` | no |
| cloudfront\_price\_class | Price class for the CloudFront distribution. One of PriceClass\_All, PriceClass\_200, PriceClass\_100. | `string` | `"PriceClass_100"` | no |
| debug\_use\_local\_packages | (Debug) Use local packages instead of downloading them from npm. | `bool` | `false` | no |
| deployment\_name | Identifier for the deployment group (only lowercase alphanumeric characters and hyphens are allowed). | `string` | `"tf-next-image"` | no |
| lambda\_attach\_policy\_json | Controls whether lambda\_policy\_json should be added to IAM role for Lambda function. | `bool` | `false` | no |
| lambda\_memory\_size | Amount of memory in MB the worker Lambda Function can use. Valid value between 128 MB to 10,240 MB, in 1 MB increments. | `number` | `1024` | no |
| lambda\_policy\_json | Additional policy document as JSON to attach to the Lambda Function role. | `string` | `""` | no |
| lambda\_role\_permissions\_boundary | ARN of IAM policy that scopes aws\_iam\_role access for the lambda. | `string` | `null` | no |
| lambda\_timeout | Max amount of time the worker Lambda Function has to return a response in seconds. Should not be more than 30 (Limited by API Gateway). | `number` | `30` | no |
| next\_image\_base\_origin | Base URL where requests for absolute image paths should be resolved to. Should not have a trailing slash. | `string` | `null` | no |
| next\_image\_content\_security\_policy | Set the value of the Content-Security-Policy header in the response of the image optimizer. | `string` | `null` | no |
| next\_image\_dangerously\_allow\_SVG | Enable the optimization of SVG images. | `bool` | `false` | no |
| next\_image\_device\_sizes | Allowed device sizes that should be used for image optimization. | `list(number)` | `null` | no |
| next\_image\_domains | Allowed origin domains that can be used for fetching images. | `list(string)` | `[]` | no |
| next\_image\_formats | If the Accept head matches more than one of the configured formats, the first match in the array is used. Therefore, the array order matters. If there is no match, the Image Optimization API will fallback to the original image's format. | `list(string)` | <pre>[<br>  "image/webp"<br>]</pre> | no |
| next\_image\_image\_sizes | Allowed image sizes that should be used for image optimization. | `list(number)` | `null` | no |
| next\_image\_version | Next.js version from where you want to use the image optimizer from. Supports semver ranges. | `string` | `"12.1.3"` | no |
| source\_bucket\_id | When your static files are deployed to a Bucket (e.g. with Terraform Next.js) the optimizer can pull the source from the bucket rather than over the internet. | `string` | `null` | no |
| tags | Tag metadata to label AWS resources that support tags. | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| cloudfront\_cache\_behavior | Predefined CloudFront cache behavior. Can be used to embed the image optimizer into an existing CloudFront resource. |
| cloudfront\_cache\_policy\_id | Cache policy id used for image optimization. |
| cloudfront\_domain\_name | Domain of the internal CloudFront distribution. |
| cloudfront\_hosted\_zone\_id | Zone id of the internal CloudFront distribution. |
| cloudfront\_origin | Predefined CloudFront origin. Can be used to embed the image optimizer into an existing CloudFront resource. |
| cloudfront\_origin\_id | Id of the custom origin used for image optimization. |
| cloudfront\_origin\_request\_policy\_id | Request policy id used for image optimization. |
<!-- END_TF_DOCS -->
<!-- prettier-ignore-end -->

## Limits

- Max file size of a resized image is 6mb ([#110](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/110))  
  Resized images returned by the image optimization API cannot exceed 6mb in size, because this is the maximum allowed [payload size for AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html#function-configuration-deployment-and-execution).

## Versioning

The module internally relies on the original Next.js image optimizer.
So the versioning of the module is aligned with the version of the corresponding Next.js release.

For example the [`v10.0.5`](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/releases/tag/v10.0.5) version of this Terraform module uses the image optimizer from the [Next.js 10.0.5 release](https://github.com/vercel/next.js/releases/tag/v10.0.5).

Please note that we only publish versions `>=10.0.5`, for a full list of available versions see the published versions in the [Terraform Registry](https://registry.terraform.io/modules/milliHQ/next-js-image-optimization/aws).

## Contributing

Contributions are welcome!  
If you want to improve this module, please take a look at our [contributing guide](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/blob/main/CONTRIBUTING.md).

## About

This project is maintained by [milliVolt infrastructure](https://milli.is).  
We build custom infrastructure solutions for any cloud provider.

## License

Apache-2.0 - see [LICENSE](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/blob/main/LICENSE) for details.

> **Note:** All sample projects in [`examples/*`](./examples) are licensed as MIT to comply with the official [Next.js examples](https://github.com/vercel/next.js/tree/canary/examples).
