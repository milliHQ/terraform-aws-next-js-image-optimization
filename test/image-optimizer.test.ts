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

describe('[unit] External image', () => {
  const s3Endpoint = process.env.CI ? 's3:9000' : 'localhost:9000';
  const fixturesDir = path.resolve(__dirname, './fixtures');
  let s3: S3;
  let fixtures = ['jpeg/Macaca_nigra_self-portrait_large.jpg'];
  let bucketName: string;

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

    const upload = await s3PublicDir(s3, fixturesDir);
    bucketName = upload.bucketName;
  });

  test.each(fixtures)('%p', async (filePath) => {
    const publicPath = `http://${s3Endpoint}/${bucketName}/${filePath}`;
    const optimizerParams = {
      w: '2048',
      q: '75',
    };
    const optimizerPrefix = `external_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
    const snapshotFileName = path.join(
      __dirname,
      '__snapshots__',
      `${optimizerPrefix}${filePath.replace('/', '_')}`
    );

    const imageConfig: ImageConfig = {
      ...imageConfigDefault,
      domains: ['localhost', 's3'],
    };
    const params = generateParams(publicPath, optimizerParams);

    // Mock request & response
    const request = createRequest({
      method: 'GET',
      url: '/image',
      params: params.params,
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

    await defer.promise;

    const header = response._getHeaders();
    const body = response._getBuffer();

    expect(result.finished).toBe(true);
    expect(body).toMatchFile(snapshotFileName);
  });
});
