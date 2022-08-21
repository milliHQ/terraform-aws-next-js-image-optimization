// Ensure NODE_ENV is set to production
process.env.NODE_ENV = 'production';
// Set NEXT_SHARP_PATH environment variable
// ! Make sure this comes before the fist import
process.env.NEXT_SHARP_PATH = require.resolve('sharp');

import { parse as parseUrl } from 'url';

import { ETagCache } from '@millihq/etag-cache';
import createFetch from '@vercel/fetch-cached-dns';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  // Disable is tolerable since we only import the types here, not the module
  // itself
  // eslint-disable-next-line import/no-unresolved
} from 'aws-lambda';
import S3 from 'aws-sdk/clients/s3';
import nodeFetch from 'node-fetch';

import { imageOptimizer, S3Config } from './image-optimizer';
import { normalizeHeaders } from './normalized-headers';
import {
  fetchImageConfigGenerator,
  getImageConfig,
  NextImageConfig,
} from './image-config';

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

/* -----------------------------------------------------------------------------
 * Globals
 * ---------------------------------------------------------------------------*/

const sourceBucket = process.env.TF_NEXTIMAGE_SOURCE_BUCKET ?? undefined;
const baseOriginUrl = process.env.TF_NEXTIMAGE_BASE_ORIGIN ?? undefined;

/**
 * We use a custom fetch implementation here that caches DNS resolutions
 * to improve performance for repeated requests.
 */
// eslint-disable-next-line
const fetch = createFetch();
const fetchImageConfig = fetchImageConfigGenerator(fetch as typeof nodeFetch);
const configCache = new ETagCache<NextImageConfig>(60, fetchImageConfig);

/* -----------------------------------------------------------------------------
 * Handler
 * ---------------------------------------------------------------------------*/

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> {
  const headers = normalizeHeaders(event.headers);
  const hostname = headers['host'];
  const imageConfig = await getImageConfig({ configCache, hostname });
  const s3Config = generateS3Config(sourceBucket);
  const parsedUrl = parseUrl(`/?${event.rawQueryString}`, true);
  const imageOptimizerResult = await imageOptimizer({ headers }, imageConfig, {
    baseOriginUrl,
    parsedUrl,
    s3Config,
  });

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
