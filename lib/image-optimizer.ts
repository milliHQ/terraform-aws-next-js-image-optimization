import { IncomingMessage, ServerResponse } from 'http';
import { UrlWithParsedQuery } from 'url';

import {
  imageOptimizer as pixel,
  ImageOptimizerOptions,
} from '@millihq/pixel-core';
import { ImageConfig } from 'next/dist/server/image-config';
import nodeFetch from 'node-fetch';
import S3 from 'aws-sdk/clients/s3';

/* -----------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------------*/

type NodeFetch = typeof nodeFetch;

type OriginCacheControl = string | null;

interface S3Config {
  s3: S3;
  bucket: string;
}

/* -----------------------------------------------------------------------------
 * globals
 * ---------------------------------------------------------------------------*/

// let originCacheControl: OriginCacheControl;

// /**
//  * fetch polyfill to intercept the request to the external resource
//  * to get the Cache-Control header from the origin
//  */
// const fetchPolyfill: NodeFetch = (url, init) => {
//   return nodeFetch(url, init).then((result) => {
//     originCacheControl = result.headers.get('Cache-Control');
//     return result;
//   });
// };

// fetchPolyfill.isRedirect = nodeFetch.isRedirect;

// // Polyfill fetch is used by nextImageOptimizer
// // @ts-ignore
// global.fetch = fetchPolyfill;

/* -----------------------------------------------------------------------------
 * imageOptimizer
 * ---------------------------------------------------------------------------*/

async function imageOptimizer(
  imageConfig: ImageConfig,
  req: IncomingMessage,
  res: ServerResponse,
  parsedUrl: UrlWithParsedQuery,
  s3Config?: S3Config
): ReturnType<typeof pixel> {
  const options: ImageOptimizerOptions = {
    /**
     * Use default temporary folder from AWS Lambda
     */
    distDir: '/tmp',

    imageConfig: {
      ...imageConfig,
      loader: 'default',
    },

    /**
     * Is called when the path is an absolute URI, e.g. `/my/image.png`.
     *
     * @param req - Incoming client request
     * @param res - Outgoing mocked response
     * @param url - Parsed url object from the client request,
     *              e.g. `/my/image.png`
     */
    async requestHandler(
      { headers }: IncomingMessage,
      res: ServerResponse,
      url: UrlWithParsedQuery
    ) {
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
          res.setHeader('Cache-Control', object.CacheControl);
          // originCacheControl = object.CacheControl;
        }

        res.write(object.Body);
        res.end();
      } else if (headers.referer) {
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
        const upstreamType = upstreamRes.headers.get('Content-Type');
        const originCacheControl = upstreamRes.headers.get('Cache-Control');

        if (upstreamType) {
          res.setHeader('Content-Type', upstreamType);
        }

        if (originCacheControl) {
          res.setHeader('Cache-Control', originCacheControl);
        }

        const upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer());
        res.write(upstreamBuffer);
        res.end();
      }
    },
  };

  return pixel(req, res, parsedUrl, options);
}

export type { S3Config };
export { imageOptimizer };
