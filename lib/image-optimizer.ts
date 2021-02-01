import { IncomingMessage, ServerResponse } from 'http';
import { imageOptimizer as nextImageOptimizer } from 'next/dist/next-server/server/image-optimizer';
import { ImageConfig } from 'next/dist/next-server/server/image-config';
import nodeFetch, { RequestInfo, RequestInit } from 'node-fetch';

import { UrlWithParsedQuery } from 'url';
import Server from 'next/dist/next-server/server/next-server';

let originCacheControl: string | null;

/**
 * fetch polyfill to intercept the request to the external resource
 * to get the Cache-Control header from the origin
 */
async function fetchPolyfill(url: RequestInfo, init?: RequestInit) {
  return nodeFetch(url, init).then((result) => {
    originCacheControl = result.headers.get('Cache-Control');
    return result;
  });
}

// Polyfill fetch used by nextImageOptimizer
global.fetch = fetchPolyfill;

async function imageOptimizer(
  imageConfig: ImageConfig,
  req: IncomingMessage,
  res: ServerResponse,
  parsedUrl: UrlWithParsedQuery
) {
  // Create Next Server mock
  const server = ({
    nextConfig: {
      images: imageConfig,
    },
    distDir: '/tmp',
    getRequestHandler: () => () => {
      // TODO
    },
  } as unknown) as Server;

  const result = await nextImageOptimizer(server, req, res, parsedUrl);
  return {
    ...result,
    originCacheControl,
  };
}

export { imageOptimizer };
