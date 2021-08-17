import { fork } from 'child_process';
import getPort from 'get-port';
import { ImageConfig } from 'next/dist/server/image-config';
import fetch from 'node-fetch';
import { createRequest, createResponse } from 'node-mocks-http';
import { EventEmitter } from 'events';
import S3 from 'aws-sdk/clients/s3';

import { imageOptimizer } from '../../lib/image-optimizer';
import { createDeferred } from '../../lib/utils';
import { GenerateParams } from './generate-params';

interface ImageOptimizerResult {
  originCacheControl: string | null;
  finished: boolean;
}

interface S3Options {
  options: S3.Types.ClientConfiguration;
  bucket: string;
}

type ForkMessage =
  | {
      type: 'STARTED';
    }
  | { type: 'RESULT'; payload: ImageOptimizerResult };

/**
 * Runs the image optimizer inside a forked process
 */
export async function runOptimizerFork(
  params: GenerateParams,
  imageConfig: ImageConfig,
  requestHeaders: Record<string, string>,
  s3Config?: S3Options
) {
  let result: ImageOptimizerResult;
  const port = await getPort();
  const imageOptimizerFork = fork('./run-optimizer.fork.js', {
    cwd: __dirname,
  });

  const deferServerStart = createDeferred();
  const deferResult = createDeferred();
  imageOptimizerFork.on('message', (body: ForkMessage) => {
    if (body) {
      if (body.type === 'STARTED') {
        deferServerStart.resolve();
      } else if (body.type === 'RESULT') {
        result = body.payload;
        deferResult.resolve();
      }
    }
  });

  imageOptimizerFork.send({
    port,
    imageConfig,
    parsedUrl: params.parsedUrl,
    s3Config,
  });

  await deferServerStart.promise;

  const response = await fetch(
    `http://localhost:${port}/_next/image?` +
      new URLSearchParams(params.params),
    {
      headers: requestHeaders,
    }
  );

  await deferResult.promise;

  // Shutdown fork
  // Needed to kill the WASM process for the image resizer (squoosh)
  imageOptimizerFork.kill();

  return {
    result: result!,
    headers: Object.fromEntries(response.headers),
    body: await response.buffer(),
  };
}

/**
 * Runs the image optimizer inside the main process
 */
export async function runOptimizer(
  params: GenerateParams,
  imageConfig: ImageConfig,
  requestHeaders: Record<string, string>,
  s3Config?: S3Options
) {
  // Mock request & response
  const request = createRequest({
    method: 'GET',
    url: '/_next/image',
    params: params.params,
    headers: requestHeaders,
  });

  const response = createResponse({
    eventEmitter: EventEmitter,
  });

  const defer = createDeferred();

  response.on('data', () => {
    response._getData();
  });

  response.on('end', () => {
    response._getData();
    defer.resolve();
  });

  const result = await imageOptimizer(
    imageConfig,
    request,
    response,
    params.parsedUrl,
    s3Config
      ? {
          s3: new S3(s3Config.options),
          bucket: s3Config.bucket,
        }
      : undefined
  );

  await defer.promise;

  return {
    result,
    headers: response._getHeaders(),
    body: response._getBuffer(),
  };
}
