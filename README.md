# Terraform Next.js Image Optimization module for AWS

![CI](https://github.com/dealmore/terraform-aws-next-js-image-optimization/workflows/CI/badge.svg)

A drop-in [image optimization loader](https://nextjs.org/docs/basic-features/image-optimization#loader) for Next.js image component `next/image`.  
If you need a complete hosting solution for Next.js with Terraform, please check out our [Terraform Next.js module for AWS](https://registry.terraform.io/modules/dealmore/next-js/aws).

## Features

This module is currently under active development.

- ✅  Terraform `v0.13+`
- ✅  Serverless image processing powered by [AWS Lambda](https://aws.amazon.com/lambda/)
- ✅  [Amazon CloudFront](https://aws.amazon.com/cloudfront/) powered image caching
- 🚧  S3 powered image cache with automatic expiration
- 🚧  CORS based security rules (Only allow image embed from defined domains)
- 🚧  Support for [Device Sizes](https://nextjs.org/docs/basic-features/image-optimization#device-sizes)
- 🚧  Support for [Image Sizes](https://nextjs.org/docs/basic-features/image-optimization#image-sizes)

## Usage

## Versioning

We internally rely on the Next.js image optimizer, so every version we publish follows the versioning schema of the [Next.js package](https://www.npmjs.com/package/next).

## License

Apache-2.0 - see [LICENSE](https://github.com/dealmore/terraform-aws-next-js-image-optimization/blob/main/LICENSE) for details.
