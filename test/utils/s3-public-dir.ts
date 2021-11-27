import { randomBytes } from 'crypto';
import { promises as fs, createReadStream } from 'fs';
import * as path from 'path';

import S3 from 'aws-sdk/clients/s3';
import { lookup as lookupMimeType } from 'mime-types';

// Upload the content of the dirPath to the bucket
// https://stackoverflow.com/a/46213474/831465
async function uploadDir(
  s3: S3,
  s3Path: string,
  bucketName: string,
  cacheControl?: string
) {
  async function getFiles(dir: string): Promise<string | string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  }

  const files = (await getFiles(s3Path)) as string[];
  await Promise.all(
    files
      .filter((filePath) => !filePath.includes('.DS_Store'))
      .map((filePath) => {
        // Restore the relative structure
        const objectKey = path.relative(s3Path, filePath);
        const contentType = lookupMimeType(filePath);
        return s3
          .putObject({
            Key: objectKey,
            Bucket: bucketName,
            Body: createReadStream(filePath),
            CacheControl: cacheControl,
            ContentType:
              typeof contentType === 'string' ? contentType : undefined,
          })
          .promise();
      })
  );

  return files;
}

/**
 * Creates a public bucket and uploads the content of dir to it
 * Returns the bucket name
 */
export async function s3PublicDir(
  s3: S3,
  dirPath: string,
  cacheControl?: string
): Promise<{ bucketName: string; files: string[] }> {
  const bucketName = randomBytes(8).toString('hex');

  // Configure the bucket so that the objects can be accessed publicly
  const bucketPolicy = {
    Bucket: bucketName,
    Policy: `{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": [
            "s3:GetBucketLocation",
            "s3:ListBucket"
          ],
          "Effect": "Allow",
          "Principal": {
            "AWS": [
              "*"
            ]
          },
          "Resource": [
            "arn:aws:s3:::${bucketName}"
          ],
          "Sid": ""
        },
        {
          "Sid": "",
          "Effect": "Allow",
          "Principal": {
            "AWS": "*"
          },
          "Action": [
            "s3:GetObject"
          ],
          "Resource": [
            "arn:aws:s3:::${bucketName}/*"
          ]
        }
      ]
    }`,
  };

  await s3
    .createBucket({
      Bucket: bucketName,
      ACL: 'public-read',
    })
    .promise();
  await s3.putBucketPolicy(bucketPolicy).promise();

  const files = await uploadDir(s3, dirPath, bucketName, cacheControl);

  return { bucketName, files };
}
