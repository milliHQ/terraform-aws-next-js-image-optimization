import { Server } from 'http';
import {
  ImageConfig,
  imageConfigDefault,
} from 'next/dist/next-server/server/image-config';
import { Bridge } from '@dealmore/terraform-next-node-bridge';
import { parse as parseUrl } from 'url';
import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { S3 } from 'aws-sdk';

import { imageOptimizer } from './image-optimizer';
import { cacheResponse } from './cache-response';

let domains = [];
try {
  domains = JSON.parse(process.env.DOMAINS);
} catch (err) {
  console.error('Could not parse the provided domain list!');
  console.error(err);
}

const imageConfig: ImageConfig = {
  ...imageConfigDefault,
  domains,
};

const server = new Server((req, res) => {
  const parsedUrl = parseUrl(req.url!, true);

  imageOptimizer(imageConfig, req, res, parsedUrl);
});
const bridge = new Bridge(server);
bridge.listen();

const s3 = new S3();

export async function handler(event: APIGatewayProxyEventV2, context: Context) {
  const response = await bridge.launcher(event, context);

  //  We intercept the response from Next.js here and cache the result to S3
  await cacheResponse(s3, event, response);

  return response;
}
