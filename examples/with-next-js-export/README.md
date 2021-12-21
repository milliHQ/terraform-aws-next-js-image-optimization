# Next.js export and S3 example

This example shows how to use the image optimizer together with a statically exported Next.js HTML site that is hosted on AWS S3.

> **Note:** The full example code is available on [GitHub](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js-export)

## Features

- ✅ &nbsp;[Statically exported Next.js](https://nextjs.org/docs/advanced-features/static-html-export) HTML site using `next export`
- ✅ &nbsp;Site hosted on [AWS S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- ✅ &nbsp;Optimized caching with Amazon CloudFront
- ✅ &nbsp;[Serverless image optimization](https://github.com/milliHQ/terraform-aws-next-js-image-optimization) using CloudFront and AWS Lambda

## Setup guide

This guide walks you through the necessary steps to deploy the example to your own AWS account.

### 0. Prerequisites

The following software is required to follow this guide:

- [Node.js 14+](https://nodejs.org/)
- [Terraform 1.0+](https://www.terraform.io/downloads)
- [AWS CLI](https://aws.amazon.com/cli/)

### 1. Initialize project

Download the files from the example app and initialize it in a new folder:

```sh
npx create-next-app -e https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js-export my-app
cd my-app
```

### 2. Create the required resources in your AWS account

We use Terraform to create all the resources (S3 bucket, CloudFront distribution, image optimizer, etc.) in your AWS account.  
For simplicity we use [AWS Access Keys](https://docs.aws.amazon.com/powershell/latest/userguide/pstools-appendix-sign-up.html) for authentication, other authentication methods are [also available](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication).

```sh
# Expose your AWS Access Keys to the current terminal session
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

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
> website_bucket_id = "next-image-optimizer-example-export"
```

### 3. Adjust Next.js config

In the Next.js project, open the `next.config.js` file and add the following lines (Remember to replace `<distribution-id>` with the output from the previous step):

```diff
// next.config.js
+ const domainName = 'xxxxxxxxxxxxxxxxx.cloudfront.net';
- const domainName = '<distribution-id>.cloudfront.net';
```

### 4. Build and export the Next.js site

To create a static build of Next.js we need to run two commands.  
`next build` builds the production site in the `.next/` folder.  
[`next export`](https://nextjs.org/docs/advanced-features/static-html-export) then creates a static HTML export from your site that can be deployed to a static file hosting service like AWS S3.

```sh
npm run build  # Builds the Next.js site
npm run export # Prepares the
```

After running the two commands you should see a new folder named `out/` in your project, where the statically exported site is exported to.

### 5. Upload the Next.js site to S3

To upload the content of the `out/` folder we use the [AWS CLI](https://aws.amazon.com/cli/).  
Make sure to replace `<bucket-name>` with the output from step 2 before running the command:

```sh
aws s3 sync ./out s3://<bucket-name>
```

---

Your website should now be accessible on the CloudFront domain `<distribution-id>.cloudfront.net` you got from step 2.  
To update your site, simply repeat step 4. & 5 of this guide.

## Caveats

Please note that [not all features](https://nextjs.org/docs/advanced-features/static-html-export#unsupported-features) of Next.js are supported when using `next export`.  
In addition here are some things that should be taken into account when using this solution:

- **When using JPEG images in the `/public` folder, always use the `.jpeg` (long) not the `.jpg` (short) extension for it.**  
  Next.js image component always requests the long extension `.jpeg`, since S3 cannot soft redirect `.jpg` to `.jpeg` the request for the image would fail otherwise.
