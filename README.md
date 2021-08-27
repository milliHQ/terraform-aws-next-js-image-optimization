# Terraform Next.js Image Optimization module for AWS

![CI](https://github.com/dealmore/terraform-aws-next-js-image-optimization/workflows/CI/badge.svg)

A drop-in [image optimization loader](https://nextjs.org/docs/basic-features/image-optimization#loader) for the Next.js image component `next/image`.

> **Notice:** If you need a complete hosting solution for Next.js with Terraform, please check out our [Terraform Next.js module for AWS](https://registry.terraform.io/modules/dealmore/next-js/aws).

## Features

- ✅ &nbsp;Terraform `v0.13+`
- ✅ &nbsp;Serverless image processing powered by [AWS Lambda](https://aws.amazon.com/lambda/)
- ✅ &nbsp;[Amazon CloudFront](https://aws.amazon.com/cloudfront/) powered image caching
- ✅ &nbsp;Two-layer caching with [CloudFront Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html)
- ✅ &nbsp;Support for custom [Device Sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes) & [Image Sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes)

## Architecture

The image optimization module is designed as a full stack AWS app.
It relies on multiple AWS services and connects them to work as a single application:

![Architecture overview diagram](https://github.com/dealmore/terraform-aws-next-js-image-optimization/blob/main/docs/assets/architecture.png?raw=true)

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

Then rebuild and redeploy your Next.js application to make use of the changed configuration.

## Examples

- [Next.js + Vercel](https://github.com/dealmore/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js) - Use the image optimizer together with a Next.js app deployed on Vercel.
- [Existing CloudFront](https://github.com/dealmore/terraform-aws-next-js-image-optimization/tree/main/examples/with-existing-cloudfront) - Embedd the image optimizer in an existing CloudFront distribution.

<!-- prettier-ignore-start -->
<!--- STOP: Auto generated values - Make no manual edits here --->
<!--- BEGIN_TF_DOCS --->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 0.13 |
| <a name="requirement_aws"></a> [aws](#requirement\_aws) | >= 3.43.0 |
| <a name="requirement_random"></a> [random](#requirement\_random) | >= 2.3.0 |

## Providers

| Name | Version |
|------|---------|
| <a name="provider_aws"></a> [aws](#provider\_aws) | >= 3.43.0 |
| <a name="provider_random"></a> [random](#provider\_random) | >= 2.3.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_cloudfront_create_distribution"></a> [cloudfront\_create\_distribution](#input\_cloudfront\_create\_distribution) | Controls whether a CloudFront distribution should be created. | `bool` | `true` | no |
| <a name="input_cloudfront_enable_origin_shield"></a> [cloudfront\_enable\_origin\_shield](#input\_cloudfront\_enable\_origin\_shield) | Controls whether CloudFront Origin Shield should be enabled on the image optimizer lambdas. | `bool` | `true` | no |
| <a name="input_cloudfront_origin_id"></a> [cloudfront\_origin\_id](#input\_cloudfront\_origin\_id) | Override the id for the custom CloudFront id. | `string` | `"tf-next-image-optimizer"` | no |
| <a name="input_cloudfront_origin_shield_region"></a> [cloudfront\_origin\_shield\_region](#input\_cloudfront\_origin\_shield\_region) | Override the region choosen for the CloudFront origin shield. Use `auto` to automatically determine the optimal region. | `string` | `"auto"` | no |
| <a name="input_cloudfront_price_class"></a> [cloudfront\_price\_class](#input\_cloudfront\_price\_class) | Price class for the CloudFront distribution. One of PriceClass\_All, PriceClass\_200, PriceClass\_100. | `string` | `"PriceClass_100"` | no |
| <a name="input_debug_use_local_packages"></a> [debug\_use\_local\_packages](#input\_debug\_use\_local\_packages) | (Debug) Use local packages instead of downloading them from npm. | `bool` | `false` | no |
| <a name="input_deployment_name"></a> [deployment\_name](#input\_deployment\_name) | Identifier for the deployment group (alphanumeric characters, underscores, hyphens, slashes, hash signs and dots are allowed). | `string` | `"tf-next-image"` | no |
| <a name="input_lambda_attach_policy_json"></a> [lambda\_attach\_policy\_json](#input\_lambda\_attach\_policy\_json) | Controls whether lambda\_policy\_json should be added to IAM role for Lambda function. | `bool` | `false` | no |
| <a name="input_lambda_memory_size"></a> [lambda\_memory\_size](#input\_lambda\_memory\_size) | Amount of memory in MB the worker Lambda Function can use. Valid value between 128 MB to 10,240 MB, in 1 MB increments. | `number` | `1024` | no |
| <a name="input_lambda_policy_json"></a> [lambda\_policy\_json](#input\_lambda\_policy\_json) | Additional policy document as JSON to attach to the Lambda Function role. | `string` | `""` | no |
| <a name="input_lambda_role_permissions_boundary"></a> [lambda\_role\_permissions\_boundary](#input\_lambda\_role\_permissions\_boundary) | ARN of IAM policy that scopes aws\_iam\_role access for the lambda. | `string` | `null` | no |
| <a name="input_lambda_timeout"></a> [lambda\_timeout](#input\_lambda\_timeout) | Max amount of time the worker Lambda Function has to return a response in seconds. Should not be more than 30 (Limited by API Gateway). | `number` | `30` | no |
| <a name="input_next_image_device_sizes"></a> [next\_image\_device\_sizes](#input\_next\_image\_device\_sizes) | Allowed device sizes that should be used for image optimization. | `list(number)` | `null` | no |
| <a name="input_next_image_domains"></a> [next\_image\_domains](#input\_next\_image\_domains) | Allowed origin domains that can be used for fetching images. | `list(string)` | `[]` | no |
| <a name="input_next_image_image_sizes"></a> [next\_image\_image\_sizes](#input\_next\_image\_image\_sizes) | Allowed image sizes that should be used for image optimization. | `list(number)` | `null` | no |
| <a name="input_next_image_version"></a> [next\_image\_version](#input\_next\_image\_version) | Next.js version from where you want to use the image optimizer from. Supports semver ranges. | `string` | `"11.0.1"` | no |
| <a name="input_source_bucket_id"></a> [source\_bucket\_id](#input\_source\_bucket\_id) | When your static files are deployed to a Bucket (e.g. with Terraform Next.js) the optimizer can pull the source from the bucket rather than over the internet. | `string` | `null` | no |
| <a name="input_tags"></a> [tags](#input\_tags) | Tag metadata to label AWS resources that support tags. | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_cloudfront_cache_behavior"></a> [cloudfront\_cache\_behavior](#output\_cloudfront\_cache\_behavior) | Predefined CloudFront cache behavior. Can be used to embed the image optimizer into an existing CloudFront resource. |
| <a name="output_cloudfront_cache_policy_id"></a> [cloudfront\_cache\_policy\_id](#output\_cloudfront\_cache\_policy\_id) | Cache policy id used for image optimization. |
| <a name="output_cloudfront_domain_name"></a> [cloudfront\_domain\_name](#output\_cloudfront\_domain\_name) | Domain of the internal CloudFront distribution. |
| <a name="output_cloudfront_hosted_zone_id"></a> [cloudfront\_hosted\_zone\_id](#output\_cloudfront\_hosted\_zone\_id) | Zone id of the internal CloudFront distribution. |
| <a name="output_cloudfront_origin"></a> [cloudfront\_origin](#output\_cloudfront\_origin) | Predefined CloudFront origin. Can be used to embed the image optimizer into an existing CloudFront resource. |
| <a name="output_cloudfront_origin_id"></a> [cloudfront\_origin\_id](#output\_cloudfront\_origin\_id) | Id of the custom origin used for image optimization. |
| <a name="output_cloudfront_origin_image_optimizer"></a> [cloudfront\_origin\_image\_optimizer](#output\_cloudfront\_origin\_image\_optimizer) | Deprecated, please use cloudfront\_origin instead. |
| <a name="output_cloudfront_origin_request_policy_id"></a> [cloudfront\_origin\_request\_policy\_id](#output\_cloudfront\_origin\_request\_policy\_id) | Request policy id used for image optimization. |

<!--- END_TF_DOCS --->
<!-- prettier-ignore-end -->

## Versioning

We rely internally on the original Next.js image optimizer.
So the versioning of the module is aligned with the version of the corresponding Next.js release.

For example the [`v10.0.5`](https://github.com/dealmore/terraform-aws-next-js-image-optimization/releases/tag/v10.0.5) version of this Terraform module uses the image optimizer from the [Next.js 10.0.5 release](https://github.com/vercel/next.js/releases/tag/v10.0.5).

Please note that we only publish versions `>=10.0.5`, for a full list of available versions see the published versions in the [Terraform Registry](https://registry.terraform.io/modules/dealmore/next-js-image-optimization/aws).

## Contributing

Contributions are welcome!  
If you want to improve this module, please take a look at our [contributing guide](https://github.com/dealmore/terraform-aws-next-js-image-optimization/blob/main/CONTRIBUTING.md).

## License

Apache-2.0 - see [LICENSE](https://github.com/dealmore/terraform-aws-next-js-image-optimization/blob/main/LICENSE) for details.

> **Note:** All sample projects in [`examples/*`](./examples) are licensed as MIT to comply with the official [Next.js examples](https://github.com/vercel/next.js/tree/canary/examples).
