# Custom Domain Example

This example shows how to configure a custom domain for the [Terraform Next.js Image Optimization module for AWS](https://github.com/milliHQ/terraform-aws-next-js-image-optimization).

> **Note:** The full example code is available on [GitHub](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/tree/main/examples/with-custom-domain)

## Setup the Terraform module

1. Create a new file called `main.tf` and paste the code from the following source: [main.tf on GitHub](https://github.com/milliHQ/terraform-aws-next-js-image-optimization/blob/main/examples/with-custom-domain/main.tf):

2. Then configure the domain you want to use:

   ```tf
   # main.tf

   ...
   ###########
   # Variables
   ###########

   variable "custom_domain" {
     description = "Your custom domain"
     type        = string
     default     = "example.com"
   }

   variable "custom_domain_zone_name" {
     description = "The Route53 zone name of the custom domain"
     type        = string
     default     = "example.com."
   }

   ...
   ```

3. Run Terraform to deploy the image optimizer to your AWS account:

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
   > custom_domain     = "example.com"
   > cloudfront_domain = "<distribution-id>.cloudfront.net"
   ```

4. Integrate with Next.js by editing `next.config.js`:

   ```diff
   // next.config.js

   module.exports = {
   +  images: {
   +    path: 'https://example.com/_next/image'
   +  },
   }
   ```
