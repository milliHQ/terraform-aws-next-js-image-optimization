# Changelog

## 10.0.1 (July 06, 2021)

- Uses Image Optimizer module of [Next.js 11.0.1](https://github.com/vercel/next.js/releases/tag/v11.0.1) ([#49](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/49))

## 11.0.0 (June 15, 2021)

The output `cloudfront_origin_image_optimizer` is now deprecated.
Use `cloudfront_origin` instead.

- Fixes image optimization for webp format ([#44](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/44))  
  Thanks to [@vcnc-hex](https://github.com/vcnc-hex) for contributing!
- Uses Image Optimizer module of [Next.js 11.0.0](https://github.com/vercel/next.js/releases/tag/v11.0.0) ([#45](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/45))
- Add output for cache behavior ([#43](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/43), [#48](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/48))
- Bump AWS API Gateway Terraform module from 0.11.0 to 1.1.0 ([#47](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/47))
- Bump AWS Lambda Terraform module from 1.47.0 to 2.4.0 ([#46](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/46))

## 10.2.3 (June 05, 2021)

- Improves caching of processed images by using [CloudFront Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html) ([#2](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/2), [#41](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/41))
- Uses Image Optimizer module of [Next.js 10.2.3](https://github.com/vercel/next.js/releases/tag/v10.2.3) ([#39](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/39))

## 10.2.2 (May 22, 2021)

- Uses Image Optimizer module of [Next.js 10.2.2](https://github.com/vercel/next.js/releases/tag/v10.2.2) ([#35](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/35))

## 10.2.1 (May 22, 2021)

- Uses Image Optimizer module of [Next.js 10.2.1](https://github.com/vercel/next.js/releases/tag/v10.2.1) ([#38](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/38))

## 10.2.0 (May 11, 2021)

- Uses Image Optimizer module of [Next.js 10.2.0](https://github.com/vercel/next.js/releases/tag/v10.2.0) ([#31](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/31))

## 10.1.3 (May 11, 2021)

- Uses Image Optimizer module of [Next.js 10.1.3](https://github.com/vercel/next.js/releases/tag/v10.1.3) ([#28](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/28))

## 10.1.2 (May 04, 2021)

- Uses Image Optimizer module of [Next.js 10.1.2](https://github.com/vercel/next.js/releases/tag/v10.1.2) ([#25](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/25))

## 10.1.1 (May 04, 2021)

- Uses Image Optimizer module of [Next.js 10.1.1](https://github.com/vercel/next.js/releases/tag/v10.1.1) ([#33](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/33))

## 10.1.0 (May 04, 2021)

- Uses Image Optimizer module of [Next.js 10.1.0](https://github.com/vercel/next.js/releases/tag/v10.1.0) ([#32](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/32))

## 10.0.9 (April 27, 2021)

- Uses Image Optimizer module of [Next.js 10.0.9](https://github.com/vercel/next.js/releases/tag/v10.0.9) ([#22](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/22))

## 10.0.8 (April 26, 2021)

- Makes the module compatible with Terraform `0.15` ([#26](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/26), [#29](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/29))
- Uses Image Optimizer module of [Next.js 10.0.8](https://github.com/vercel/next.js/releases/tag/v10.0.8) ([#19](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/19))

## 10.0.7 (April 01, 2021)

- Uses Image Optimizer module of [Next.js 10.0.7](https://github.com/vercel/next.js/releases/tag/v10.0.7) ([#10](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/10))

## 10.0.6 (April 01, 2021)

- Uses Image Optimizer module of [Next.js 10.0.6](https://github.com/vercel/next.js/releases/tag/v10.0.6) ([#3](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/3))
- Bundling of the image optimizer has changed from ncc to nft ([#23](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/23), [#24](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/24))

## 10.0.5 (March 15, 2021)

**Note 1:** From now on we aligning the versioning schema with the releases of Next.js.

**Note 2:** When upgrading from a previous release, you may experience an error from Terraform:

```
Error: error updating CloudFront Distribution:
InvalidArgument: The parameter ForwardedValues cannot be used when a cache policy is associated to the cache behavior.
	status code: 400
```

This is a known bug in the Terraform AWS provider and may requires a manual upgrade in the AWS Console ([terraform-provider-aws#17626](https://github.com/hashicorp/terraform-provider-aws/issues/17626)).

- Fixes wrong response for repeated requests from external source ([#12](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/12), [#13](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/13))
- Use Request and Cache Policies in CloudFront distribution ([#5](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/5), [#9](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/9))
- Upgrades Lambda runtime from `nodejs12.x` to `nodejs14.x`. ([#4](https://github.com/dealmore/terraform-aws-next-js-image-optimization/issues/4), [#8](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/8))

## 2.0.1 (March 08, 2021)

- Bump internal module `terraform-aws-modules/apigateway-v2/aws` from `0.8.0` to `0.11.0` ([#16](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/16), [#18](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/18))  
  Resolves compatibility issue with newer versions of Terraform.

## 2.0.0 (February 13, 2021)

- Adds support to resize images from a S3 origin ([#7](https://github.com/dealmore/terraform-aws-next-js-image-optimization/pull/7))

## 1.0.0 (February 07, 2021)

Initial release
