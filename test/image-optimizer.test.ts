/// <reference types="jest-file-snapshot" />

import * as path from 'path';

import S3 from 'aws-sdk/clients/s3';
import { extension as extensionMimeType } from 'mime-types';
import { ImageConfig, imageConfigDefault } from 'next/dist/server/image-config';

import { s3PublicDir } from './utils/s3-public-dir';
import { acceptAllFixtures, acceptWebpFixtures } from './constants';
import { generateParams } from './utils/generate-params';
import { runOptimizerFork as runOptimizer } from './utils/run-optimizer';

// 1 min timeout, since first request for S3 image can be pretty slow on local
// machines
jest.setTimeout(60_000);

describe('unit', () => {
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
  const S3options: S3.Types.ClientConfiguration = {
    accessKeyId: 'test',
    secretAccessKey: 'testtest',
    endpoint: s3Endpoint,
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
    sslEnabled: false,
  };

  beforeAll(async () => {
    // Upload files to local s3 Server
    s3 = new S3(S3options);

    const upload = await s3PublicDir(s3, fixturesDir, cacheControlHeader);
    bucketName = upload.bucketName;
  });

  test('Fetch internal image from S3', async () => {
    const fixture = acceptAllFixtures[0];
    const fixturePath = `/${fixture[0]}`;
    const params = generateParams(fixturePath, optimizerParams);

    const { result, headers } = await runOptimizer(
      params,
      imageConfig,
      {
        accept: '*/*',
      },
      { options: S3options, bucket: bucketName }
    );

    expect(result.finished).toBe(true);
    expect(headers['content-type']).toBe(fixture[1]);
  });

  test('Custom image size', async () => {
    const fixture = acceptAllFixtures[0];
    const fixturePath = `http://${s3Endpoint}/${bucketName}/${fixture[0]}`;
    const defaultImageSize = 32;
    const nonDefaultImageSize = 33;

    expect(imageConfigDefault.imageSizes).toContain(defaultImageSize);
    expect(imageConfigDefault.imageSizes).not.toContain(nonDefaultImageSize);

    const params = generateParams(fixturePath, {
      w: nonDefaultImageSize.toString(),
      q: '75',
    });

    {
      const customImageConfig = {
        ...imageConfig,
        imageSizes: [nonDefaultImageSize],
      };

      const { result, headers } = await runOptimizer(
        params,
        customImageConfig,
        {
          accept: '*/*',
        }
      );

      expect(result.finished).toBe(true);
      expect(headers['content-type']).toBe(fixture[1]);
    }

    {
      // Using default image size should not be possible when custom
      // image size is defined
      const customImageConfig = {
        ...imageConfig,
        imageSizes: [defaultImageSize],
      };

      const { result, headers, body } = await runOptimizer(
        params,
        customImageConfig,
        {
          accept: '*/*',
        }
      );

      expect(result.finished).toBe(true);
      expect(body.toString()).toBe(
        `"w" parameter (width) of ${nonDefaultImageSize} is not allowed`
      );
      expect(headers['content-type']).toBeUndefined();
    }
  });

  test('Custom device size', async () => {
    const fixture = acceptAllFixtures[0];
    const fixturePath = `http://${s3Endpoint}/${bucketName}/${fixture[0]}`;
    const defaultDeviceSize = 1080;
    const nonDefaultDeviceSize = 1081;

    expect(imageConfigDefault.deviceSizes).toContain(defaultDeviceSize);
    expect(imageConfigDefault.deviceSizes).not.toContain(nonDefaultDeviceSize);

    const params = generateParams(fixturePath, {
      w: nonDefaultDeviceSize.toString(),
      q: '75',
    });

    {
      const customImageConfig = {
        ...imageConfig,
        deviceSizes: [nonDefaultDeviceSize],
      };

      const { result, headers } = await runOptimizer(
        params,
        customImageConfig,
        {
          accept: '*/*',
        }
      );

      expect(result.finished).toBe(true);
      expect(headers['content-type']).toBe(fixture[1]);
    }

    {
      // Using default device size should not be possible when custom
      // device size is defined
      const customImageConfig = {
        ...imageConfig,
        deviceSizes: [defaultDeviceSize],
      };

      const { result, headers, body } = await runOptimizer(
        params,
        customImageConfig,
        {
          accept: '*/*',
        }
      );

      expect(result.finished).toBe(true);
      expect(body.toString('utf-8')).toBe(
        `"w" parameter (width) of ${nonDefaultDeviceSize} is not allowed`
      );
      expect(headers['content-type']).toBeUndefined();
    }
  });

  test.each(acceptAllFixtures)(
    'External image: Accept */*: %s',
    async (filePath, outputContentType) => {
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
      expect(headers['content-type']).toBe(outputContentType);

      // Check that Content-Security-Policy header is present to prevent potential
      // XSS attack
      // Fixed in Next.js 11.1.1
      // https://github.com/vercel/next.js/security/advisories/GHSA-9gr3-7897-pp7m
      // https://nvd.nist.gov/vuln/detail/CVE-2021-39178
      expect(headers['content-security-policy']).toBe(
        `script-src 'none'; sandbox;`
      );

      const optimizerPrefix = `external_accept_all_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );

  test.each(acceptWebpFixtures)(
    'External image: Accept image/webp: %s',
    async (filePath, outputContentType) => {
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
      expect(headers['content-type']).toBe(outputContentType);
      expect(headers['etag']).toBeDefined();
      expect(headers['cache-control']).toBe(
        'public, max-age=123456, must-revalidate'
      );

      const optimizerPrefix = `external_accept_webp_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );

  test.each(acceptAllFixtures)(
    'Internal image: Accept */*: %s',
    async (filePath, outputContentType) => {
      const publicPath = `/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const { result, headers, body } = await runOptimizer(
        params,
        imageConfig,
        {
          accept: '*/*',
          referer: `http://${s3Endpoint}/hello/world?foo=bar`,
        }
      );

      expect(result.finished).toBe(true);
      expect(headers['content-type']).toBe(outputContentType);

      const optimizerPrefix = `internal_accept_all_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );

  test.each(acceptWebpFixtures)(
    'Internal image: Accept image/webp: %s',
    async (filePath, outputContentType) => {
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
      expect(headers['content-type']).toBe(outputContentType);

      const optimizerPrefix = `internal_accept_webp_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );
      expect(body).toMatchFile(snapshotFileName);
    }
  );
});
