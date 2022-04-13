import { fork } from 'child_process';
import { URLSearchParams } from 'url';

import { Pixel } from '@millihq/pixel-core';
import getPort from 'get-port';
import { ImageConfig } from 'next/dist/shared/lib/image-config';
import fetch from 'node-fetch';
import S3 from 'aws-sdk/clients/s3';

import { imageOptimizer } from '../../lib/image-optimizer';
import { createDeferred } from '../../lib/utils';
import { GenerateParams } from './generate-params';

type ImageOptimizerResult = ReturnType<Pixel['imageOptimizer']>;

interface S3Options {
  options: S3.Types.ClientConfiguration;
  bucket: string;
}

type ForkMessage =
  | {
      type: 'STARTED';
    }
  | { type: 'RESULT'; payload: ImageOptimizerResult };

type RunOptimizerReturnType = Promise<ImageOptimizerResult>;

type RunOptimizerOptions = {
  baseOriginUrl?: string;
  s3Config?: S3Options;
};

/**
 * Runs the image optimizer inside a forked process
 */
export async function runOptimizerFork(
  params: GenerateParams,
  imageConfig: ImageConfig,
  requestHeaders: Record<string, string>,
  { baseOriginUrl, s3Config }: RunOptimizerOptions = {}
): RunOptimizerReturnType {
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
    baseOriginUrl,
    parsedUrl: params.parsedUrl,
    s3Config,
  });

  await deferServerStart.promise;

  await fetch(
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

  // Tolerable eslint disable because the function is only used in test
  // environnement
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return result!;
}

/**
 * Runs the image optimizer inside the main process
 */
export async function runOptimizer(
  params: GenerateParams,
  imageConfig: ImageConfig,
  requestHeaders: Record<string, string>,
  { baseOriginUrl, s3Config }: RunOptimizerOptions = {}
): RunOptimizerReturnType {
  return imageOptimizer({ headers: requestHeaders }, imageConfig, {
    baseOriginUrl,
    parsedUrl: params.parsedUrl,
    s3Config: s3Config
      ? {
          s3: new S3(s3Config.options),
          bucket: s3Config.bucket,
        }
      : undefined,
  });
}
