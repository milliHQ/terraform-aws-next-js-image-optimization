import * as path from 'path';
import { URLSearchParams } from 'url';

import { generateAPISAM, APISAMGenerator } from '@millihq/sammy';
import S3 from 'aws-sdk/clients/s3';
import { extension as extensionMimeType } from 'mime-types';

import { s3PublicDir } from './utils/s3-public-dir';
import { getLocalIpAddressFromHost } from './utils/host-ip-address';

const NODE_RUNTIME = 'nodejs16.x';
// Environment variables that should be set in the Lambda environment
const ENVIRONMENT_VARIABLES = {
  NODE_ENV: 'production',
  TF_NEXTIMAGE_DANGEROUSLY_ALLOW_SVG: JSON.stringify(true),
  TF_NEXTIMAGE_CONTENT_SECURITY_POLICY: JSON.stringify(
    "default-src 'self'; script-src 'none'; sandbox;"
  ),
};

jest.setTimeout(60_000);

describe('[e2e]', () => {
  const route = '/_next/image';
  const hostIpAddress = getLocalIpAddressFromHost();
  const s3Endpoint = `${hostIpAddress}:9000`;
  const pathToWorker = path.resolve(__dirname, '../lib');
  const fixturesDir = path.resolve(__dirname, './fixtures');
  const cacheControlHeader = 'public, max-age=123456';
  let fixtureBucketName: string;
  let s3: S3;

  beforeAll(async () => {
    // Upload the fixtures to public S3 server
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
    fixtureBucketName = upload.bucketName;
  });

  describe('Without S3', () => {
    let lambdaSAM: APISAMGenerator;

    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateAPISAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
              ...ENVIRONMENT_VARIABLES,
              TF_NEXTIMAGE_DOMAINS: JSON.stringify([hostIpAddress]),
            },
          },
        },
        cwd: pathToWorker,
        onData(data) {
          console.log(data.toString());
        },
        onError(data) {
          console.log(data.toString());
        },
      });

      await lambdaSAM.start();
    });

    afterAll(async () => {
      await lambdaSAM.stop();
    });

    test.each([
      // inputFilename | outputContentType | outputCacheControlHeader
      ['avif/test.avif', 'image/jpeg', cacheControlHeader],
      // Files that are not converted by sharp use minimumCacheTTL config
      ['bmp/test.bmp', 'image/bmp', 'public, max-age=60'],
      ['gif/test.gif', 'image/gif', cacheControlHeader],
      ['gif/animated.gif', 'image/gif', cacheControlHeader],
      ['jpeg/test.jpg', 'image/jpeg', cacheControlHeader],
      ['png/test.png', 'image/png', cacheControlHeader],
      ['svg/test.svg', 'image/svg+xml', cacheControlHeader],
      ['tiff/test.tiff', 'image/tiff', cacheControlHeader],
      ['webp/test.webp', 'image/jpeg', cacheControlHeader],
      ['webp/animated.webp', 'image/webp', cacheControlHeader],
    ])(
      'External: Accept */*: %s',
      async (filePath, outputContentType, outputCacheControlHeader) => {
        const publicPath = `http://${s3Endpoint}/${fixtureBucketName}/${filePath}`;
        const optimizerParams = new URLSearchParams({
          url: publicPath,
          w: '2048',
          q: '75',
        });
        const optimizerPrefix = `external_accept_all_w-${optimizerParams.get(
          'w'
        )}_q-${optimizerParams.get('q')}_`;
        const snapshotFileName = path.join(
          __dirname,
          '__snapshots__/e2e/',
          `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
            outputContentType
          )}`
        );

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: '*/*',
            },
          }
        );
        const body = await response.buffer();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(outputContentType);
        expect(response.headers.get('Cache-Control')).toBe(
          outputCacheControlHeader
        );

        // Check that Content-Security-Policy header is present to prevent potential
        // XSS attack
        // Fixed in Next.js 11.1.1
        // https://github.com/vercel/next.js/security/advisories/GHSA-9gr3-7897-pp7m
        // https://nvd.nist.gov/vuln/detail/CVE-2021-39178
        expect(response.headers.get('Content-Security-Policy')).toBe(
          "default-src 'self'; script-src 'none'; sandbox;"
        );

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      }
    );

    test.each([
      // inputFilename | outputContentType | outputCacheControlHeader
      ['avif/test.avif', 'image/jpeg', cacheControlHeader],
      // Files that are not converted by sharp use minimumCacheTTL config
      ['bmp/test.bmp', 'image/bmp', 'public, max-age=60'],
      ['gif/test.gif', 'image/gif', cacheControlHeader],
      ['gif/animated.gif', 'image/gif', cacheControlHeader],
      ['jpeg/test.jpg', 'image/jpeg', cacheControlHeader],
      ['png/test.png', 'image/png', cacheControlHeader],
      ['svg/test.svg', 'image/svg+xml', cacheControlHeader],
      ['tiff/test.tiff', 'image/tiff', cacheControlHeader],
      ['webp/test.webp', 'image/jpeg', cacheControlHeader],
      ['webp/animated.webp', 'image/webp', cacheControlHeader],
    ])(
      'Internal: Accept */*: %s',
      async (filePath, outputContentType, outputCacheControlHeader) => {
        const publicPath = `/${fixtureBucketName}/${filePath}`;
        const optimizerParams = new URLSearchParams({
          url: publicPath,
          w: '2048',
          q: '75',
        });
        const optimizerPrefix = `internal_accept_all_w-${optimizerParams.get(
          'w'
        )}_q-${optimizerParams.get('q')}_`;
        const snapshotFileName = path.join(
          __dirname,
          '__snapshots__/e2e/',
          `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
            outputContentType
          )}`
        );

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: '*/*',
              Referer: `http://${s3Endpoint}/`,
            },
          }
        );

        const body = await response.buffer();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(outputContentType);
        expect(response.headers.get('Cache-Control')).toBe(
          outputCacheControlHeader
        );

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      }
    );

    test.each([
      // inputFilename | outputContentType | outputCacheControlHeader
      ['avif/test.avif', 'image/webp', cacheControlHeader],
      // Files that are not converted by sharp use minimumCacheTTL config
      ['bmp/test.bmp', 'image/bmp', 'public, max-age=60'],
      ['gif/test.gif', 'image/webp', cacheControlHeader],
      ['gif/animated.gif', 'image/gif', cacheControlHeader],
      ['jpeg/test.jpg', 'image/webp', cacheControlHeader],
      ['png/test.png', 'image/webp', cacheControlHeader],
      ['svg/test.svg', 'image/svg+xml', cacheControlHeader],
      ['tiff/test.tiff', 'image/webp', cacheControlHeader],
      ['webp/test.webp', 'image/webp', cacheControlHeader],
      ['webp/animated.webp', 'image/webp', cacheControlHeader],
    ])(
      'External: Accept image/webp,*/*: %s',
      async (filePath, outputContentType, outputCacheControlHeader) => {
        const publicPath = `http://${s3Endpoint}/${fixtureBucketName}/${filePath}`;
        const optimizerParams = new URLSearchParams({
          url: publicPath,
          w: '2048',
          q: '75',
        });
        const optimizerPrefix = `external_accept_webp_w-${optimizerParams.get(
          'w'
        )}_q-${optimizerParams.get('q')}_`;
        const snapshotFileName = path.join(
          __dirname,
          '__snapshots__/e2e/',
          `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
            outputContentType
          )}`
        );

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: 'image/webp,*/*',
            },
          }
        );
        const body = await response.buffer();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(outputContentType);
        expect(response.headers.get('Cache-Control')).toBe(
          outputCacheControlHeader
        );

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      }
    );

    test.each([
      // inputFilename | outputContentType | outputCacheControlHeader
      ['avif/test.avif', 'image/webp', cacheControlHeader],
      // Files that are not converted by sharp use minimumCacheTTL config
      ['bmp/test.bmp', 'image/bmp', 'public, max-age=60'],
      ['gif/test.gif', 'image/webp', cacheControlHeader],
      ['gif/animated.gif', 'image/gif', cacheControlHeader],
      ['jpeg/test.jpg', 'image/webp', cacheControlHeader],
      ['png/test.png', 'image/webp', cacheControlHeader],
      ['svg/test.svg', 'image/svg+xml', cacheControlHeader],
      ['tiff/test.tiff', 'image/webp', cacheControlHeader],
      ['webp/test.webp', 'image/webp', cacheControlHeader],
      ['webp/animated.webp', 'image/webp', cacheControlHeader],
    ])(
      'Internal: Accept image/webp,*/*: %s',
      async (filePath, outputContentType, outputCacheControlHeader) => {
        const publicPath = `/${fixtureBucketName}/${filePath}`;
        const optimizerParams = new URLSearchParams({
          url: publicPath,
          w: '2048',
          q: '75',
        });
        const optimizerPrefix = `internal_accept_webp_w-${optimizerParams.get(
          'w'
        )}_q-${optimizerParams.get('q')}_`;
        const snapshotFileName = path.join(
          __dirname,
          '__snapshots__/e2e/',
          `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
            outputContentType
          )}`
        );

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: 'image/webp,*/*',
              Referer: `http://${s3Endpoint}/`,
            },
          }
        );

        const body = await response.buffer();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(outputContentType);
        expect(response.headers.get('Cache-Control')).toBe(
          outputCacheControlHeader
        );

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      }
    );
  });

  describe('With S3', () => {
    let lambdaSAM: APISAMGenerator;

    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateAPISAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
              ...ENVIRONMENT_VARIABLES,
              TF_NEXTIMAGE_SOURCE_BUCKET: fixtureBucketName,
              __DEBUG__USE_LOCAL_BUCKET: JSON.stringify({
                accessKeyId: 'test',
                secretAccessKey: 'testtest',
                endpoint: s3Endpoint,
                s3ForcePathStyle: true,
                signatureVersion: 'v4',
                sslEnabled: false,
              }),
            },
          },
        },
        cwd: pathToWorker,
        onData(data) {
          console.log(data.toString());
        },
        onError(data) {
          console.log(data.toString());
        },
      });

      await lambdaSAM.start();
    });

    afterAll(async () => {
      await lambdaSAM.stop();
    });

    test('Internal: Fetch image from S3', async () => {
      const publicPath = '/jpeg/test.jpg';
      const optimizerParams = new URLSearchParams({
        url: publicPath,
        w: '2048',
        q: '75',
      });

      const response = await lambdaSAM.sendApiGwRequest(
        `${route}?${optimizerParams.toString()}`,
        {
          headers: {
            Accept: 'image/webp,*/*',
            Referer: `http://${s3Endpoint}/`,
          },
        }
      );

      expect(response.ok).toBeTruthy();
      expect(response.headers.get('content-type')).toBe('image/webp');
    });
  });

  describe('Accept Avif format', () => {
    let lambdaSAM: APISAMGenerator;

    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateAPISAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
              ...ENVIRONMENT_VARIABLES,
              TF_NEXTIMAGE_SOURCE_BUCKET: fixtureBucketName,
              TF_NEXTIMAGE_FORMATS: JSON.stringify([
                'image/avif',
                'image/webp',
              ]),
              __DEBUG__USE_LOCAL_BUCKET: JSON.stringify({
                accessKeyId: 'test',
                secretAccessKey: 'testtest',
                endpoint: s3Endpoint,
                s3ForcePathStyle: true,
                signatureVersion: 'v4',
                sslEnabled: false,
              }),
            },
          },
        },
        cwd: pathToWorker,
        onData(data) {
          console.log(data.toString());
        },
        onError(data) {
          console.log(data.toString());
        },
      });

      await lambdaSAM.start();
    });

    afterAll(async () => {
      await lambdaSAM.stop();
    });

    test.each([
      // inputFilename | outputContentType
      ['avif/test.avif', 'image/avif'],
      ['bmp/test.bmp', 'image/bmp'],
      ['gif/test.gif', 'image/avif'],
      ['gif/animated.gif', 'image/gif'],
      ['jpeg/test.jpg', 'image/avif'],
      ['png/test.png', 'image/avif'],
      ['svg/test.svg', 'image/svg+xml'],
      ['tiff/test.tiff', 'image/avif'],
      ['webp/test.webp', 'image/avif'],
      ['webp/animated.webp', 'image/webp'],
    ])('Accept image/avif,*/*: %s', async (filePath, outputContentType) => {
      const publicPath = `/${filePath}`;
      const optimizerParams = new URLSearchParams({
        url: publicPath,
        w: '128',
        q: '75',
      });

      const response = await lambdaSAM.sendApiGwRequest(
        `${route}?${optimizerParams.toString()}`,
        {
          headers: {
            Accept: 'image/avif,*/*',
            Referer: `http://${s3Endpoint}/`,
          },
        }
      );

      expect(response.ok).toBeTruthy();
      expect(response.headers.get('content-type')).toBe(outputContentType);
    });
  });

  describe('From filesystem cache for external image', () => {
    let lambdaSAM: APISAMGenerator;
    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateAPISAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
              ...ENVIRONMENT_VARIABLES,
              TF_NEXTIMAGE_DOMAINS: JSON.stringify([hostIpAddress]),
            },
          },
        },
        cwd: pathToWorker,
        onData: (data) => console.log(data.toString()),
        onError: (data) => console.log(data.toString()),
      });

      await lambdaSAM.start({ warmContainers: 'EAGER' });
    });

    afterAll(async () => {
      await lambdaSAM.stop();
    });
    test.each([
      'internet. (first call)',
      'hitting filesystem cache. (2nd call)',
    ])('Fetch external image by %s', async () => {
      const filePath = 'png/test.png';
      const outputContentType = 'image/png';
      const publicPath = `http://${s3Endpoint}/${fixtureBucketName}/${filePath}`;
      const [w, q] = ['2048', '75'];
      const optimizerParams = new URLSearchParams({ url: publicPath, w, q });
      const optimizerPrefix = `external_accept_all_w-${w}_q-${q}_`;
      const snapshotFileName = path.join(
        __dirname,
        '__snapshots__/e2e/',
        `${optimizerPrefix}${filePath.replace('/', '_')}.${extensionMimeType(
          outputContentType
        )}`
      );

      const response = await lambdaSAM.sendApiGwRequest(
        `${route}?${optimizerParams.toString()}`,
        {
          headers: {
            Accept: '*/*',
            Referer: `http://${s3Endpoint}/`,
          },
        }
      );
      const body = await response.buffer();

      expect(response.status).toBe(200);
      expect(body).toMatchFile(snapshotFileName);
      expect(response.headers.get('Content-Type')).toBe(outputContentType);
      expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

      // Header settings needed for CloudFront compression
      expect(response.headers.has('Content-Length')).toBeTruthy();
      expect(response.headers.has('Content-Encoding')).toBeFalsy();
    });
  });

  test.todo('Run test against domain that is not on the list');
});
