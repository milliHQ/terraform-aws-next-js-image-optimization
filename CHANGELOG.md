# Changelog

## [Unreleased]

## [12.1.3] - 2022-08-12

- Uses Image Optimizer module of [Next.js 12.1.3](https://github.com/vercel/next.js/releases/tag/v12.1.3) ([#121](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/121))
- Updates sharp from `v0.30.3` to [`v0.30.7`](https://github.com/lovell/sharp/releases/tag/v0.30.7) ([#136](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/136))
- Support usage of custom domain and SSL certificate with the default CloudFront distribution ([#134](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/134))
- Minimum protocol version for the default CloudFront distribution can now set using `cloudfront_minimum_protocol_version` variable. New default value is `TLSv1` (was `TLSv1.2_2018` before) ([#134](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/134))

## [12.1.2] - 2022-04-16

- Uses Image Optimizer module of [Next.js 12.1.2](https://github.com/vercel/next.js/releases/tag/v12.1.2) ([#118](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/118))

## [12.1.1] - 2022-04-13

- Uses Image Optimizer module of [Next.js 12.1.1](https://github.com/vercel/next.js/releases/tag/v12.1.1) ([#116](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/116))

## [12.1.0] - 2022-04-04

- Ensure compatibility with AWS Provider Version 4 ([#119](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/119), [#120](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/120))
- Uses Image Optimizer module of [Next.js 12.1.0](https://github.com/vercel/next.js/releases/tag/v12.1.0) ([#123](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/123))
- Adds option to enable SVG support ([#124](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/124))

## [12.0.10] - 2022-03-29

- Updates sharp from `v0.30.1` to [`v0.30.3`](https://github.com/lovell/sharp/releases/tag/v0.30.3) ([#115](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/115))
- Uses Image Optimizer module of [Next.js 12.0.10](https://github.com/vercel/next.js/releases/tag/v12.0.10) ([#108](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/108))

## [12.0.9] - 2022-02-17

- Uses Image Optimizer module of [Next.js 12.0.9](https://github.com/vercel/next.js/releases/tag/v12.0.9) ([#104](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/104))
- Smaller and better optimized image optimizer package ([#113](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/113))

## [12.0.8] - 2022-02-17

- Uses Image Optimizer module of [Next.js 12.0.8](https://github.com/vercel/next.js/releases/tag/v12.0.8) ([#97](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/97))

## [12.0.7] - 2022-02-15

- Updates sharp to [`v0.30.1`](https://github.com/lovell/sharp/releases/tag/v0.30.1) ([#109](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/109))
- Uses Image Optimizer module of [Next.js 12.0.7](https://github.com/vercel/next.js/releases/tag/v12.0.7) ([#93](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/93))

## [12.0.6] - 2022-01-29

- Bump node-fetch from 2.6.6 to 2.6.7 ([#106](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/106))
- Uses Image Optimizer module of [Next.js 12.0.6](https://github.com/vercel/next.js/releases/tag/v12.0.6) ([#103](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/103))

## [12.0.5] - 2022-01-22

- Uses Image Optimizer module of [Next.js 12.0.5](https://github.com/vercel/next.js/releases/tag/v12.0.5) ([#96](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/96))

## [12.0.4] - 2022-01-22

- Uses Image Optimizer module of [Next.js 12.0.4](https://github.com/vercel/next.js/releases/tag/v12.0.4) ([#86](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/86))

## [12.0.3] - 2022-01-22

- Uses Image Optimizer module of [Next.js 12.0.3](https://github.com/vercel/next.js/releases/tag/v12.0.3) ([#84](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/84))

## [12.0.2] - 2022-01-22

- Uses Image Optimizer module of [Next.js 12.0.2](https://github.com/vercel/next.js/releases/tag/v12.0.2) ([#101](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/101))
- Use relative path as lambda function local package path ([#98](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/98))

## [12.0.1] (December 21, 2021)

In this release we fixed a bug that could occur when using absolute image paths (When you use S3 as backend, you are not affected).  
In addition you can now define a new input variable `next_image_base_origin` that can be used to resolve absolute image paths.

When you set `next_image_base_origin = "https://example.com"` requests for an absolute image path (`/path/to/image.png`) are then resolved to the URL `https://example.com/path/to/image.png`.

We also added a fully featured example how to use `next export` together with S3 and the image optimizer, check it out: [Statically exported Next.js app hosted on S3](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js)

- Add base origin setting ([#94](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/94), [#95](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/95))
- Uses Image Optimizer module of [Next.js 12.0.1](https://github.com/vercel/next.js/releases/tag/v12.0.1) ([#81](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/81))

## 12.0.0 (November 28, 2021)

This release introduces a new package called [Pixel](https://github.com/milliHQ/pixel) that abstracts the image optimization stuff and makes it usable with platforms other than AWS Lambda.
We plan to offer multiple flavors of it, like express middleware or docker images.

⚠️ **Breaking Changes** ⚠️

We have [removed](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/78) the output variable `cloudfront_origin_image_optimizer` that was deprecated since the v11.0.0 release.
To upgrade, please use the output variable `cloudfront_origin` from now on.

E.g. when using the ["With existing CloudFront distribution example"](https://registry.terraform.io/modules/milliHQ/next-js-image-optimization/aws/latest/examples/with-existing-cloudfront) you should make the following changes:

```diff
module "next_image_optimizer" {
  source = "milliHQ/next-js-image-optimization/aws"
  ...
}

resource "aws_cloudfront_distribution" "distribution" {
  ...

  dynamic "origin" {
-   for_each = [module.next_image_optimizer.cloudfront_origin_image_optimizer]
+   for_each = [module.next_image_optimizer.cloudfront_origin]
   ...
  }
}
```

---

- Uses Image Optimizer module of [Next.js 12.0.0](https://github.com/vercel/next.js/releases/tag/v12.0.0) ([#80](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/80))
- Add support for AVIF ([#73](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/73), [#92](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/92))
- Fixes "Error while trying to add new domain" bug ([#68](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/68), [#69](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/69))
- Remove random strings from resource names ([#72](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/72), [#77](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/77))
- Bump sharp from 0.29.1 to 0.29.3 ([#79](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/79), [#85](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/85))
- Remove deprecated output `cloudfront_origin_image_optimizer` ([#78](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/78), [#82](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/82))
- Remove referer header from cache key when S3 is used ([#87](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/87), [#91](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/91))

## 11.1.2 (September 14, 2021)

- Uses Image Optimizer module of [Next.js 11.1.2](https://github.com/vercel/next.js/releases/tag/v11.1.2) ([#63](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/63))
- Updates sharp to [`v0.29.1`](https://github.com/lovell/sharp/releases/tag/v0.29.1) ([#66](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/66))
- Bump terraform-aws-lambda module to [2.17.0](https://github.com/terraform-aws-modules/terraform-aws-lambda/releases/tag/v2.17.0) ([#67](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/67))

## 11.1.1 (September 02, 2021)

The upgrade to Next.js 11.1.1 fixes a potential vulnerability which allowed a XSS-attack.
For more information see the [Security Advisory](https://github.com/vercel/next.js/security/advisories/GHSA-9gr3-7897-pp7m).

- Uses Image Optimizer module of [Next.js 11.1.1](https://github.com/vercel/next.js/releases/tag/v11.1.1) ([#64](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/64))

## 11.1.0 (August 30, 2021)

⚠️ **Namespace changed** ⚠️

We [recently changed](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/61) the namespace of this module from `dealmore` to `milliHQ`.
Make sure to upgrade the source of the module accordingly:

```diff
module "next_image_optimizer" {
-  source = "dealmore/next-js-image-optimization/aws"
+  source = "milliHQ/next-js-image-optimization/aws"
}
```

---

Beginning with this release we change the engine that is used to optimize the images from squoosh to Sharp.
Sharp has a much better performance and is therefore better suited for the job.
Please read the [Next.js RFC](https://github.com/vercel/next.js/discussions/27073) for more information.

- Use sharp as image optimization engine ([#51](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/51), [#57](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/57))
- Fix typo for default image sizes ([#53](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/53), [#56](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/56))
- Uses Image Optimizer module of [Next.js 11.1.0](https://github.com/vercel/next.js/releases/tag/v11.1.0) ([#54](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/54))

## 11.0.1 (July 06, 2021)

- Uses Image Optimizer module of [Next.js 11.0.1](https://github.com/vercel/next.js/releases/tag/v11.0.1) ([#49](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/49))

## 11.0.0 (June 15, 2021)

The output `cloudfront_origin_image_optimizer` is now deprecated.
Use `cloudfront_origin` instead.

- Fixes image optimization for webp format ([#44](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/44))  
  Thanks to [@vcnc-hex](https://github.com/vcnc-hex) for contributing!
- Uses Image Optimizer module of [Next.js 11.0.0](https://github.com/vercel/next.js/releases/tag/v11.0.0) ([#45](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/45))
- Add output for cache behavior ([#43](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/43), [#48](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/48))
- Bump AWS API Gateway Terraform module from 0.11.0 to 1.1.0 ([#47](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/47))
- Bump AWS Lambda Terraform module from 1.47.0 to 2.4.0 ([#46](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/46))

## 10.2.3 (June 05, 2021)

- Improves caching of processed images by using [CloudFront Origin Shield](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html) ([#2](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/2), [#41](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/41))
- Uses Image Optimizer module of [Next.js 10.2.3](https://github.com/vercel/next.js/releases/tag/v10.2.3) ([#39](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/39))

## 10.2.2 (May 22, 2021)

- Uses Image Optimizer module of [Next.js 10.2.2](https://github.com/vercel/next.js/releases/tag/v10.2.2) ([#35](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/35))

## 10.2.1 (May 22, 2021)

- Uses Image Optimizer module of [Next.js 10.2.1](https://github.com/vercel/next.js/releases/tag/v10.2.1) ([#38](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/38))

## 10.2.0 (May 11, 2021)

- Uses Image Optimizer module of [Next.js 10.2.0](https://github.com/vercel/next.js/releases/tag/v10.2.0) ([#31](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/31))

## 10.1.3 (May 11, 2021)

- Uses Image Optimizer module of [Next.js 10.1.3](https://github.com/vercel/next.js/releases/tag/v10.1.3) ([#28](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/28))

## 10.1.2 (May 04, 2021)

- Uses Image Optimizer module of [Next.js 10.1.2](https://github.com/vercel/next.js/releases/tag/v10.1.2) ([#25](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/25))

## 10.1.1 (May 04, 2021)

- Uses Image Optimizer module of [Next.js 10.1.1](https://github.com/vercel/next.js/releases/tag/v10.1.1) ([#33](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/33))

## 10.1.0 (May 04, 2021)

- Uses Image Optimizer module of [Next.js 10.1.0](https://github.com/vercel/next.js/releases/tag/v10.1.0) ([#32](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/32))

## 10.0.9 (April 27, 2021)

- Uses Image Optimizer module of [Next.js 10.0.9](https://github.com/vercel/next.js/releases/tag/v10.0.9) ([#22](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/22))

## 10.0.8 (April 26, 2021)

- Makes the module compatible with Terraform `0.15` ([#26](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/26), [#29](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/29))
- Uses Image Optimizer module of [Next.js 10.0.8](https://github.com/vercel/next.js/releases/tag/v10.0.8) ([#19](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/19))

## 10.0.7 (April 01, 2021)

- Uses Image Optimizer module of [Next.js 10.0.7](https://github.com/vercel/next.js/releases/tag/v10.0.7) ([#10](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/10))

## 10.0.6 (April 01, 2021)

- Uses Image Optimizer module of [Next.js 10.0.6](https://github.com/vercel/next.js/releases/tag/v10.0.6) ([#3](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/3))
- Bundling of the image optimizer has changed from ncc to nft ([#23](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/23), [#24](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/24))

## 10.0.5 (March 15, 2021)

**Note 1:** From now on we aligning the versioning schema with the releases of Next.js.

**Note 2:** When upgrading from a previous release, you may experience an error from Terraform:

```
Error: error updating CloudFront Distribution:
InvalidArgument: The parameter ForwardedValues cannot be used when a cache policy is associated to the cache behavior.
	status code: 400
```

This is a known bug in the Terraform AWS provider and may requires a manual upgrade in the AWS Console ([terraform-provider-aws#17626](https://github.com/hashicorp/terraform-provider-aws/issues/17626)).

- Fixes wrong response for repeated requests from external source ([#12](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/12), [#13](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/13))
- Use Request and Cache Policies in CloudFront distribution ([#5](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/5), [#9](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/9))
- Upgrades Lambda runtime from `nodejs12.x` to `nodejs14.x`. ([#4](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/issues/4), [#8](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/8))

## 2.0.1 (March 08, 2021)

- Bump internal module `terraform-aws-modules/apigateway-v2/aws` from `0.8.0` to `0.11.0` ([#16](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/16), [#18](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/18))  
  Resolves compatibility issue with newer versions of Terraform.

## 2.0.0 (February 13, 2021)

- Adds support to resize images from a S3 origin ([#7](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/pull/7))

## 1.0.0 (February 07, 2021)

Initial release
