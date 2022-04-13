/// <reference types="jest-file-snapshot" />

import * as path from 'path';

import S3 from 'aws-sdk/clients/s3';
import { extension as extensionMimeType } from 'mime-types';
import {
  ImageConfig,
  imageConfigDefault,
} from 'next/dist/shared/lib/image-config';

import { generateParams } from './utils/generate-params';
import { runOptimizer } from './utils/run-optimizer';
import { s3PublicDir } from './utils/s3-public-dir';

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
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
    const params = generateParams('/avif/test.avif', optimizerParams);

    const result = await runOptimizer(
      params,
      imageConfig,
      {
        accept: '*/*',
      },
      { s3Config: { options: S3options, bucket: bucketName } }
    );

    if ('error' in result) {
      throw result.error;
    }

    expect(result.contentType).toBe('image/jpeg');
  });

  test('Custom image size', async () => {
    const fixturePath = `http://${s3Endpoint}/${bucketName}/avif/test.avif`;
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

      const result = await runOptimizer(params, customImageConfig, {
        accept: '*/*',
      });

      if ('error' in result) {
        throw result.error;
      }

      expect(result.contentType).toBe('image/jpeg');
    }

    {
      // Using default image size should not be possible when custom
      // image size is defined
      const customImageConfig = {
        ...imageConfig,
        imageSizes: [defaultImageSize],
      };

      const result = await runOptimizer(params, customImageConfig, {
        accept: '*/*',
      });

      if (!('error' in result)) {
        throw new Error('Optimization successful, but should be failed.');
      }

      expect(result.error).toBeDefined();
      expect(result.error).toBe(
        `"w" parameter (width) of ${nonDefaultImageSize} is not allowed`
      );
      expect(result.statusCode).toBe(400);
    }
  });

  test('Custom device size', async () => {
    const fixturePath = `http://${s3Endpoint}/${bucketName}/avif/test.avif`;
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

      const result = await runOptimizer(params, customImageConfig, {
        accept: '*/*',
      });

      if ('error' in result) {
        throw result.error;
      }

      expect(result.contentType).toBe('image/jpeg');
    }

    {
      // Using default device size should not be possible when custom
      // device size is defined
      const customImageConfig = {
        ...imageConfig,
        deviceSizes: [defaultDeviceSize],
      };

      const result = await runOptimizer(params, customImageConfig, {
        accept: '*/*',
      });

      if (!('error' in result)) {
        throw new Error('Optimization successful, but should be failed.');
      }

      expect(result.error).toBe(
        `"w" parameter (width) of ${nonDefaultDeviceSize} is not allowed`
      );
      expect(result.statusCode).toBe(400);
    }
  });

  test.each([
    // inputFilename | outputContentType
    ['avif/test.avif', 'image/jpeg'],
    ['bmp/test.bmp', 'image/bmp'],
    ['gif/test.gif', 'image/gif'],
    ['gif/animated.gif', 'image/gif'],
    ['jpeg/test.jpg', 'image/jpeg'],
    ['png/test.png', 'image/png'],
    ['svg/test.svg', 'image/svg+xml'],
    ['tiff/test.tiff', 'image/tiff'],
    ['webp/test.webp', 'image/jpeg'],
    ['webp/animated.webp', 'image/webp'],
  ])('External image: Accept */*: %s', async (filePath, outputContentType) => {
    const publicPath = `http://${s3Endpoint}/${bucketName}/${filePath}`;
    const params = generateParams(publicPath, optimizerParams);

    const result = await runOptimizer(params, imageConfig, {
      accept: '*/*',
    });

    if ('error' in result) {
      throw result.error;
    }

    expect(result.contentType).toBe(outputContentType);

    const optimizerPrefix = `external_accept_all_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
    const snapshotFileName = path.join(
      __dirname,
      '__snapshots__',
      `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
        outputContentType
      )}`
    );
    expect(result.buffer).toMatchFile(snapshotFileName);
  });

  test.each([
    // inputFilename | outputContentType | outputMaxAge
    ['avif/test.avif', 'image/webp', 123456],
    // Files that are not converted by sharp use minimumCacheTTL config
    ['bmp/test.bmp', 'image/bmp', 60],
    ['gif/test.gif', 'image/webp', 123456],
    ['gif/animated.gif', 'image/gif', 123456],
    ['jpeg/test.jpg', 'image/webp', 123456],
    ['png/test.png', 'image/webp', 123456],
    ['svg/test.svg', 'image/svg+xml', 123456],
    ['tiff/test.tiff', 'image/webp', 123456],
    ['webp/test.webp', 'image/webp', 123456],
    ['webp/animated.webp', 'image/webp', 123456],
  ])(
    'External image: Accept image/webp: %s',
    async (filePath, outputContentType, outputMaxAge) => {
      const publicPath = `http://${s3Endpoint}/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const result = await runOptimizer(params, imageConfig, {
        accept: 'image/webp,*/*',
      });

      if ('error' in result) {
        throw result.error;
      }

      expect(result.contentType).toBe(outputContentType);
      expect(result.maxAge).toBe(outputMaxAge);

      const optimizerPrefix = `external_accept_webp_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );
      expect(result.buffer).toMatchFile(snapshotFileName);
    }
  );

  test.each([
    // inputFilename | outputContentType
    ['avif/test.avif', 'image/jpeg'],
    ['bmp/test.bmp', 'image/bmp'],
    ['gif/test.gif', 'image/gif'],
    ['gif/animated.gif', 'image/gif'],
    ['jpeg/test.jpg', 'image/jpeg'],
    ['png/test.png', 'image/png'],
    ['svg/test.svg', 'image/svg+xml'],
    ['tiff/test.tiff', 'image/tiff'],
    ['webp/test.webp', 'image/jpeg'],
    ['webp/animated.webp', 'image/webp'],
  ])('Internal image: Accept */*: %s', async (filePath, outputContentType) => {
    const publicPath = `/${bucketName}/${filePath}`;
    const params = generateParams(publicPath, optimizerParams);

    const result = await runOptimizer(params, imageConfig, {
      accept: '*/*',
      referer: `http://${s3Endpoint}/hello/world?foo=bar`,
    });

    if ('error' in result) {
      throw result.error;
    }

    expect(result.contentType).toBe(outputContentType);

    const optimizerPrefix = `internal_accept_all_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
    const snapshotFileName = path.join(
      __dirname,
      '__snapshots__',
      `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
        outputContentType
      )}`
    );
    expect(result.buffer).toMatchFile(snapshotFileName);
  });

  test.each([
    // inputFilename | outputContentType
    ['avif/test.avif', 'image/webp'],
    ['bmp/test.bmp', 'image/bmp'],
    ['gif/test.gif', 'image/webp'],
    ['gif/animated.gif', 'image/gif'],
    ['jpeg/test.jpg', 'image/webp'],
    ['png/test.png', 'image/webp'],
    ['svg/test.svg', 'image/svg+xml'],
    ['tiff/test.tiff', 'image/webp'],
    ['webp/test.webp', 'image/webp'],
    ['webp/animated.webp', 'image/webp'],
  ])(
    'Internal image: Accept image/webp: %s',
    async (filePath, outputContentType) => {
      const publicPath = `/${bucketName}/${filePath}`;
      const params = generateParams(publicPath, optimizerParams);

      const result = await runOptimizer(params, imageConfig, {
        accept: 'image/webp,*/*',
        referer: `http://${s3Endpoint}/`,
      });

      if ('error' in result) {
        throw result.error;
      }

      expect(result.contentType).toBe(outputContentType);

      const optimizerPrefix = `internal_accept_webp_w-${optimizerParams.w}_q-${optimizerParams.q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );
      expect(result.buffer).toMatchFile(snapshotFileName);
    }
  );

  test('Use base origin option', async () => {
    const params = generateParams('/avif/test.avif', {
      w: '1080',
      q: '75',
    });

    const result = await runOptimizer(
      params,
      imageConfig,
      {
        accept: '*/*',
      },
      {
        baseOriginUrl: `http://${s3Endpoint}/${bucketName}`,
      }
    );

    if ('error' in result) {
      throw result.error;
    }

    expect(result.contentType).toBe('image/jpeg');
  });
});
