/// <reference types="jest-file-snapshot" />

import { createRequest, createResponse } from 'node-mocks-http';
import { parse as parseUrl, URLSearchParams } from 'url';
import { EventEmitter } from 'events';
import {
  ImageConfig,
  imageConfigDefault,
} from 'next/dist/next-server/server/image-config';
import { S3 } from 'aws-sdk';
import * as path from 'path';

import { imageOptimizer } from '../lib/image-optimizer';
import { createDeferred } from './utils';
import { s3PublicDir } from './utils/s3-public-dir';
import { acceptAllFixtures, acceptWebpFixtures } from './constants';

interface Options {
  w?: string;
  q?: string;
}

function generateParams(url: string, options: Options = {}) {
  const encodedUrl = encodeURIComponent(url);
  const params = new URLSearchParams();
  params.append('url', url);
  options.q && params.append('q', options.q);
  options.w && params.append('w', options.w);

  const parsedUrl = parseUrl(`/?${params.toString()}`, true);

  return {
    url: encodedUrl,
    parsedUrl,
    params: Object.fromEntries(params),
  };
}

async function runOptimizer(
  params: ReturnType<typeof generateParams>,
  imageConfig: ImageConfig,
  requestHeaders: Record<string, string>
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
    params.parsedUrl
  );

  return {
    result,
    headers: response._getHeaders(),
    body: response._getBuffer(),
  };
}

describe('[unit]', () => {
  const s3Endpoint = process.env.CI ? 's3:9000' : 'localhost:9000';
  const fixturesDir = path.resolve(__dirname, './fixtures');
  const optimizerParams = {
    w: '2048',
    q: '75',
  };
  const imageConfig: ImageConfig = {
    ...imageConfigDefault,
    domains: ['localhost', 's3'],
  };
  let s3: S3;
  let bucketName: string;
  const cacheControlHeader = 'public, max-age=123456';

  beforeAll(async () => {
    // Upload files to local s3 Server
    const S3options: S3.Types.ClientConfiguration = {
      accessKeyId: 'test',
      secretAccessKey: 'testtest',
      endpoint: s3Endpoint,
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
      sslEnabled: false,
    };
    s3 = new S3(S3options);

    const upload = await s3PublicDir(s3, fixturesDir, cacheControlHeader);
    bucketName = upload.bucketName;
  });

  test.each(acceptAllFixtures)(
    'External image: Accept */*: %s',
    async (filePath, fixtureResponse) => {
      const publicPath = `http://${s3Endpoint}/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const { result, headers, body } = await runOptimizer(
        params,
        imageConfig,
        {
          accept: '*/*',
        }
      );

      expect(result.finished).toBe(true);
      expect(headers['content-type']).toBe(fixtureResponse['content-type']);

      const optimizerPrefix = `external_accept_all_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${fixtureResponse.ext}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );

  test.each(acceptWebpFixtures)(
    'External image: Accept image/webp: %s',
    async (filePath, fixtureResponse) => {
      const publicPath = `http://${s3Endpoint}/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const { result, headers, body } = await runOptimizer(
        params,
        imageConfig,
        {
          accept: 'image/webp,*/*',
        }
      );

      expect(result.finished).toBe(true);
      expect(result.originCacheControl).toBe(cacheControlHeader);
      expect(headers['content-type']).toBe(fixtureResponse['content-type']);
      expect(headers['etag']).toBeDefined();
      expect(headers['cache-control']).toBe(
        'public, max-age=0, must-revalidate'
      );

      const optimizerPrefix = `external_accept_webp_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${fixtureResponse.ext}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );

  test.each(acceptAllFixtures)(
    'Internal image: Accept */*: %s',
    async (filePath, fixtureResponse) => {
      const publicPath = `/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const { result, headers, body } = await runOptimizer(
        params,
        imageConfig,
        {
          accept: '*/*',
          referer: `http://${s3Endpoint}/`,
        }
      );

      expect(result.finished).toBe(true);
      expect(headers['content-type']).toBe(fixtureResponse['content-type']);

      const optimizerPrefix = `internal_accept_all_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${fixtureResponse.ext}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );

  test.each(acceptWebpFixtures)(
    'Internal image: Accept image/webp: %s',
    async (filePath, fixtureResponse) => {
      const publicPath = `/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const { result, headers, body } = await runOptimizer(
        params,
        imageConfig,
        {
          accept: 'image/webp,*/*',
          referer: `http://${s3Endpoint}/`,
        }
      );

      expect(result.finished).toBe(true);
      expect(headers['content-type']).toBe(fixtureResponse['content-type']);

      const optimizerPrefix = `internal_accept_webp_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${fixtureResponse.ext}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );
});
