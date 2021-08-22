import { IncomingMessage, ServerResponse } from 'http';
import { ImageConfig } from 'next/dist/server/image-config';
import { NextConfig } from 'next/dist/server/config';
import { imageOptimizer as nextImageOptimizer } from 'next/dist/server/image-optimizer';
import Server from 'next/dist/server/next-server';
import nodeFetch, { RequestInfo, RequestInit } from 'node-fetch';
import { UrlWithParsedQuery } from 'url';
import S3 from 'aws-sdk/clients/s3';

// Sets working dir of Next.js to /tmp (Lambda tmp dir)
const distDir = '/tmp';

let originCacheControl: string | null;

/**
 * fetch polyfill to intercept the request to the external resource
 * to get the Cache-Control header from the origin
 */
function fetchPolyfill(url: RequestInfo, init?: RequestInit) {
  return nodeFetch(url, init).then((result) => {
    originCacheControl = result.headers.get('Cache-Control');
    return result;
  });
}

// Polyfill fetch used by nextImageOptimizer
global.fetch = fetchPolyfill;

interface S3Config {
  s3: S3;
  bucket: string;
}

async function imageOptimizer(
  imageConfig: ImageConfig,
  req: IncomingMessage,
  res: ServerResponse,
  parsedUrl: UrlWithParsedQuery,
  s3Config?: S3Config
) {
  // Create next config mock
  const nextConfig = ({
    images: imageConfig,
  } as unknown) as NextConfig;

  // Create Next Server mock
  const server = {
    getRequestHandler: () => async (
      { headers }: IncomingMessage,
      res: ServerResponse,
      url: UrlWithParsedQuery
    ) => {
      if (s3Config) {
        // S3 expects keys without leading `/`
        const trimmedKey = url.href.startsWith('/')
          ? url.href.substring(1)
          : url.href;

        const object = await s3Config.s3
          .getObject({
            Key: trimmedKey,
            Bucket: s3Config.bucket,
          })
          .promise();

        if (!object.Body) {
          throw new Error(`Could not fetch image ${trimmedKey} from bucket.`);
        }

        res.statusCode = 200;

        if (object.ContentType) {
          res.setHeader('Content-Type', object.ContentType);
        }

        if (object.CacheControl) {
          originCacheControl = object.CacheControl;
        }

        res.end(object.Body);
      } else if (headers.referer) {
        let upstreamBuffer: Buffer;
        let upstreamType: string | null;

        const { referer } = headers;
        const trimmedReferer = referer.endsWith('/')
          ? referer.substring(0, referer.length - 1)
          : referer;
        const origin = `${trimmedReferer}${url.href}`;
        const upstreamRes = await nodeFetch(origin);

        if (!upstreamRes.ok) {
          throw new Error(`Could not fetch image from ${origin}.`);
        }

        res.statusCode = upstreamRes.status;
        upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer());
        upstreamType = upstreamRes.headers.get('Content-Type');
        originCacheControl = upstreamRes.headers.get('Cache-Control');

        if (upstreamType) {
          res.setHeader('Content-Type', upstreamType);
        }

        res.end(upstreamBuffer);
      }
    },
  } as Server;

  const result = await nextImageOptimizer(
    server,
    req,
    res,
    parsedUrl,
    nextConfig,
    distDir
  );
  return {
    ...result,
    originCacheControl,
  };
}

export { S3Config, imageOptimizer };
