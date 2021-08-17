import {
  ImageConfig,
  imageConfigDefault,
} from 'next/dist/next-server/server/image-config';
import { parse as parseUrl } from 'url';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { Writable } from 'stream';
import S3 from 'aws-sdk/clients/s3';

import { imageOptimizer, S3Config } from './image-optimizer';
import { normalizeHeaders } from './normalized-headers';
import { createDeferred } from './utils';

function generateS3Config(bucketName?: string): S3Config | undefined {
  let s3: S3;

  if (!bucketName) {
    return undefined;
  }

  // Only for testing purposes when connecting against a local S3 backend
  if (process.env.__DEBUG__USE_LOCAL_BUCKET) {
    s3 = new S3(JSON.parse(process.env.__DEBUG__USE_LOCAL_BUCKET));
  } else {
    s3 = new S3();
  }

  return {
    s3,
    bucket: bucketName,
  };
}

function parseFromEnv<T>(key: string, defaultValue: T) {
  try {
    if (key in process.env) {
      return JSON.parse(process.env[key]!) as T;
    }

    return defaultValue;
  } catch (err) {
    console.error(`Could not parse ${key} from environment variable`);
    console.error(err);
    return defaultValue;
  }
}

const domains = parseFromEnv(
  'TF_NEXTIMAGE_DOMAINS',
  imageConfigDefault.domains!
);
const deviceSizes = parseFromEnv(
  'TF_NEXTIMAGE_DEVICE_SIZES',
  imageConfigDefault.deviceSizes
);
const imageSizes = parseFromEnv(
  'TF_NEXTIMAGE_IMAGE_SIZES',
  imageConfigDefault.imageSizes
);
const sourceBucket = process.env.TF_NEXTIMAGE_SOURCE_BUCKET ?? undefined;

const imageConfig: ImageConfig = {
  ...imageConfigDefault,
  domains,
  deviceSizes,
  imageSizes,
};

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  const s3Config = generateS3Config(sourceBucket);

  const reqMock: any = {
    headers: normalizeHeaders(event.headers),
    method: event.requestContext.http.method,
    url: `/?${event.rawQueryString}`,
  };

  const resBuffers: Buffer[] = [];
  const resMock: any = new Writable();
  const defer = createDeferred();
  let didCallEnd = false;

  resMock.write = (chunk: Buffer | string) => {
    resBuffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  };
  resMock._write = (chunk: Buffer | string) => {
    resMock.write(chunk);
  };
  const mockHeaders: Record<string, string | string[]> = {};
  resMock.writeHead = (_status: any, _headers: any) =>
    Object.assign(mockHeaders, _headers);
  resMock.getHeader = (name: string) => mockHeaders[name.toLowerCase()];
  resMock.getHeaders = () => mockHeaders;
  resMock.getHeaderNames = () => Object.keys(mockHeaders);
  resMock.setHeader = (name: string, value: string | string[]) =>
    (mockHeaders[name.toLowerCase()] = value);
  resMock._implicitHeader = () => {};

  resMock.originalEnd = resMock.end;
  resMock.on('close', () => defer.resolve());
  resMock.end = (message: any) => {
    didCallEnd = true;
    resMock.originalEnd(message);
  };

  const parsedUrl = parseUrl(reqMock.url, true);
  const result = await imageOptimizer(
    imageConfig,
    reqMock,
    resMock,
    parsedUrl,
    s3Config
  );

  const normalizedHeaders: Record<string, string> = {};
  for (const [headerKey, headerValue] of Object.entries(mockHeaders)) {
    if (Array.isArray(headerValue)) {
      normalizedHeaders[headerKey] = headerValue.join(', ');
      continue;
    }

    normalizedHeaders[headerKey] = headerValue;
  }

  if (result.originCacheControl) {
    normalizedHeaders['cache-control'] = result.originCacheControl;
  } else {
    normalizedHeaders['cache-control'] = 'public, max-age=60';
  }

  if (didCallEnd) defer.resolve();
  await defer.promise;

  return {
    statusCode: resMock.statusCode || 200,
    body: Buffer.concat(resBuffers).toString('base64'),
    isBase64Encoded: true,
    headers: normalizedHeaders,
  };
}
