// Set NEXT_SHARP_PATH environment variable
// ! Make sure this comes before the fist import
process.env.NEXT_SHARP_PATH = require.resolve('sharp');

import { ImageConfig, imageConfigDefault } from 'next/dist/server/image-config';
import { parse as parseUrl } from 'url';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  // Disable is tolerable since we only import the types here, not the module
  // itself
  // eslint-disable-next-line import/no-unresolved
} from 'aws-lambda';
import { Writable } from 'stream';
import S3 from 'aws-sdk/clients/s3';
import { IncomingMessage } from 'http';

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
    const envValue = process.env[key];
    if (typeof envValue === 'string') {
      return JSON.parse(envValue) as T;
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
  imageConfigDefault.domains ?? []
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

  const reqMock = {
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
  const mockHeaders: Map<string, string | string[]> = new Map();
  resMock.writeHead = (_status: any, _headers: any) =>
    Object.assign(mockHeaders, _headers);
  resMock.getHeader = (name: string) => mockHeaders.get(name.toLowerCase());
  resMock.getHeaders = () => mockHeaders;
  resMock.getHeaderNames = () => Object.keys(mockHeaders);
  resMock.setHeader = (name: string, value: string | string[]) =>
    mockHeaders.set(name.toLowerCase(), value);
  // Empty function is tolerable here since it is part of a mock
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resMock._implicitHeader = () => {};

  resMock.originalEnd = resMock.end;
  resMock.on('close', () => defer.resolve());
  resMock.end = (message: string) => {
    didCallEnd = true;
    resMock.originalEnd(message);
  };

  const parsedUrl = parseUrl(reqMock.url, true);
  await imageOptimizer(
    imageConfig,
    reqMock as IncomingMessage,
    resMock,
    parsedUrl,
    s3Config
  );

  const normalizedHeaders: Record<string, string> = {};
  for (const [headerKey, headerValue] of mockHeaders.entries()) {
    if (Array.isArray(headerValue)) {
      normalizedHeaders[headerKey] = headerValue.join(', ');
      continue;
    }

    normalizedHeaders[headerKey] = headerValue;
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
