# Next.js export and S3 example

This example shows how to use the image optimizer together with a static hosted Next.js site on AWS S3.

> **Note:** The full example code is available on [GitHub](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js-export)

## Tutorial

### 0. Setup and Prerequisites

The following Software is required to follow this tutorial:

- [Node.js 14+](https://nodejs.org/)
- [Terraform 1.0+](https://www.terraform.io/downloads)
- [AWS CLI](https://aws.amazon.com/cli/)

### 1. Initialize project

Download the files from the example app:

```sh
npx create-next-app -e https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-next-js-export my-app
cd my-app
```

### 1. Create static Next.js build

```sh
npm run build
npm run export
```

### 2. Create the required resources in your AWS account

We use Terraform to create all the resources (S3 bucket, image optimizer) in our AWS account:

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

### 2. Adjust Next.js config

In the Next.js project, open the `next.config.js` file and add the following lines (Remember to replace `<distribution-id>` with the output from the previous step):

```diff
// next.config.js
+ const domainName = 'd1cr4t1q607tbl.cloudfront.net';
- const domainName = '<distribution-id>.cloudfront.net';
```

### 3. Build and export the Next.js app

Now build and prepare your app for export by running the following commands:

```sh
npm run build
npm run export
```

There should now be a new folder called `out/` in your project.  
It contains the files that should be uploaded into the S3 bucket in the next step.

### 4. Upload the Next.js app to S3

To upload the content of the `out/` folder we use the [AWS CLI](https://aws.amazon.com/cli/).  
Make sure to replace `<bucket-name>` with the output from step 2 before running the command:

```sh
aws s3 sync ./out s3://<bucket-name>
```

---

You should repeat step 3. & 4. every time you want to make changes to your website.

## Caveats

- When using JPEG images in the `/public` folder, always use the `.jpeg` (long) not the `.jpg` (short) extension for it.  
  Next.js image component always requests the long extension `.jpeg`, since S3 cannot soft redirect `.jpg` to `.jpeg` the request for the image would fail otherwise.
