import { IncomingMessage, ServerResponse } from 'http';
import { imageOptimizer as nextImageOptimizer } from 'next/dist/next-server/server/image-optimizer';
import { ImageConfig } from 'next/dist/next-server/server/image-config';
import nodeFetch from 'node-fetch';

import { UrlWithParsedQuery } from 'url';
import Server from 'next/dist/next-server/server/next-server';

// Polyfill fetch used by nextImageOptimizer
global.fetch = nodeFetch;

function imageOptimizer(
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
      console.log('Here!');
    },
  } as unknown) as Server;

  return nextImageOptimizer(server, req, res, parsedUrl);
}

export { imageOptimizer };
