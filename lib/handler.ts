// Ensure NODE_ENV is set to production
process.env.NODE_ENV = 'production';
// Set NEXT_SHARP_PATH environment variable
// ! Make sure this comes before the fist import
process.env.NEXT_SHARP_PATH = require.resolve('sharp');

import { parse as parseUrl } from 'url';

import {
  defaultConfig,
  NextConfigComplete,
} from 'next/dist/server/config-shared';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  // Disable is tolerable since we only import the types here, not the module
  // itself
  // eslint-disable-next-line import/no-unresolved
} from 'aws-lambda';
import S3 from 'aws-sdk/clients/s3';

import { imageOptimizer, S3Config } from './image-optimizer';
import { normalizeHeaders } from './normalized-headers';

/* -----------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------------*/
type ImageConfig = Partial<NextConfigComplete['images']>;

/* -----------------------------------------------------------------------------
 * Utils
 * ---------------------------------------------------------------------------*/

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

/* -----------------------------------------------------------------------------
 * Globals
 * ---------------------------------------------------------------------------*/
// `images` property is defined on default config
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const imageConfigDefault = defaultConfig.images!;

const domains = parseFromEnv(
  'TF_NEXTIMAGE_DOMAINS',
  imageConfigDefault.domains ?? []
);
const deviceSizes = parseFromEnv(
  'TF_NEXTIMAGE_DEVICE_SIZES',
  imageConfigDefault.deviceSizes
);
const formats = parseFromEnv(
  'TF_NEXTIMAGE_FORMATS',
  imageConfigDefault.formats
);
const imageSizes = parseFromEnv(
  'TF_NEXTIMAGE_IMAGE_SIZES',
  imageConfigDefault.imageSizes
);
const dangerouslyAllowSVG = parseFromEnv(
  'TF_NEXTIMAGE_DANGEROUSLY_ALLOW_SVG',
  imageConfigDefault.dangerouslyAllowSVG
);
const contentSecurityPolicy = parseFromEnv(
  'TF_NEXTIMAGE_CONTENT_SECURITY_POLICY',
  imageConfigDefault.contentSecurityPolicy
);
const sourceBucket = process.env.TF_NEXTIMAGE_SOURCE_BUCKET ?? undefined;
const baseOriginUrl = process.env.TF_NEXTIMAGE_BASE_ORIGIN ?? undefined;

const imageConfig: ImageConfig = {
  ...imageConfigDefault,
  domains,
  deviceSizes,
  formats,
  imageSizes,
  dangerouslyAllowSVG,
  contentSecurityPolicy,
};

/* -----------------------------------------------------------------------------
 * Handler
 * ---------------------------------------------------------------------------*/

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  const s3Config = generateS3Config(sourceBucket);

  const parsedUrl = parseUrl(`/?${event.rawQueryString}`, true);
  const imageOptimizerResult = await imageOptimizer(
    { headers: normalizeHeaders(event.headers) },
    imageConfig,
    {
      baseOriginUrl,
      parsedUrl,
      s3Config,
    }
  );

  if ('error' in imageOptimizerResult) {
    return {
      statusCode: imageOptimizerResult.statusCode,
      body: imageOptimizerResult.error,
    };
  }

  const { contentType, paramsResult, maxAge } = imageOptimizerResult;
  const { isStatic, minimumCacheTTL } = paramsResult;
  const cacheTTL = Math.max(minimumCacheTTL, maxAge);

  const normalizedHeaders: Record<string, string> = {
    Vary: 'Accept',
    'Content-Type': contentType,
    'Cache-Control': isStatic
      ? 'public, max-age=315360000, immutable'
      : `public, max-age=${cacheTTL}`,
  };

  if (imageConfig.contentSecurityPolicy) {
    normalizedHeaders['Content-Security-Policy'] =
      imageConfig.contentSecurityPolicy;
  }

  return {
    statusCode: 200,
    body: imageOptimizerResult.buffer.toString('base64'),
    isBase64Encoded: true,
    headers: normalizedHeaders,
  };
}
