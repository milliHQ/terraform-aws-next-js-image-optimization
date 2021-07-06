import * as path from 'path';
import { LambdaSAM, generateSAM } from '@dealmore/sammy';
import S3 from 'aws-sdk/clients/s3';
import { URLSearchParams } from 'url';

import { s3PublicDir } from './utils/s3-public-dir';
import { getLocalIpAddressFromHost } from './utils/host-ip-address';
import { acceptAllFixtures, acceptWebpFixtures } from './constants';

const ONE_MINUTE_IN_MS = 60000;
const NODE_RUNTIME = 'nodejs14.x';

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
    let lambdaSAM: LambdaSAM;

    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateSAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
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

    test.each(acceptAllFixtures)(
      'External: Accept */*: %s',
      async (filePath, fixtureResponse) => {
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
          `${optimizerPrefix}${filePath.replace('/', '_')}.${
            fixtureResponse.ext
          }`
        );

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: '*/*',
            },
          }
        );
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(
          fixtureResponse['content-type']
        );
        expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      },
      ONE_MINUTE_IN_MS
    );

    test.each(acceptAllFixtures)(
      'Internal: Accept */*: %s',
      async (filePath, fixtureResponse) => {
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
          `${optimizerPrefix}${filePath.replace('/', '_')}.${
            fixtureResponse.ext
          }`
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

        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(
          fixtureResponse['content-type']
        );
        expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      },
      ONE_MINUTE_IN_MS
    );

    test.each(acceptWebpFixtures)(
      'External: Accept image/webp,*/*: %s',
      async (filePath, fixtureResponse) => {
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
          `${optimizerPrefix}${filePath.replace('/', '_')}.${
            fixtureResponse.ext
          }`
        );

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: 'image/webp,*/*',
            },
          }
        );
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(
          fixtureResponse['content-type']
        );
        expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      },
      ONE_MINUTE_IN_MS
    );

    test.each(acceptWebpFixtures)(
      'Internal: Accept image/webp,*/*: %s',
      async (filePath, fixtureResponse) => {
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
          `${optimizerPrefix}${filePath.replace('/', '_')}.${
            fixtureResponse.ext
          }`
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

        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(
          fixtureResponse['content-type']
        );
        expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      },
      ONE_MINUTE_IN_MS
    );
  });

  describe('With S3', () => {
    let lambdaSAM: LambdaSAM;

    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateSAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
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

    test(
      'Internal: Fetch image from S3',
      async () => {
        const fixture = acceptAllFixtures[0];
        const publicPath = `/${fixture[0]}`;
        const optimizerParams = new URLSearchParams({
          url: publicPath,
          w: '2048',
          q: '75',
        });

        const response = await lambdaSAM.sendApiGwRequest(
          `${route}?${optimizerParams.toString()}`,
          {
            headers: {
              Accept: '*/*',
              Referer: `http://${s3Endpoint}/`,
            },
          }
        );

        const body = await response.text();

        expect(response.ok).toBeTruthy();
        expect(response.headers.get('content-type')).toBe(
          fixture[1]['content-type']
        );
      },
      ONE_MINUTE_IN_MS
    );
  });

  describe('From filesystem cache for external image', () => {
    let lambdaSAM: LambdaSAM;
    beforeAll(async () => {
      // Generate SAM for the worker lambda
      lambdaSAM = await generateSAM({
        lambdas: {
          imageOptimizer: {
            filename: 'dist.zip',
            handler: 'handler.handler',
            runtime: NODE_RUNTIME,
            memorySize: 1024,
            route,
            method: 'get',
            environment: {
              TF_NEXTIMAGE_DOMAINS: JSON.stringify([hostIpAddress]),
            },
          },
        },
        cwd: pathToWorker,
        onData: (data) => console.log(data.toString()),
        onError: (data) => console.log(data.toString()),
        cliOptions: { warmContainers: 'EAGER' },
      });

      await lambdaSAM.start();
    });

    afterAll(async () => {
      await lambdaSAM.stop();
    });
    test.each([
      'internet. (first call)',
      'hitting filesystem cache. (2nd call)',
    ])(
      'Fetch external image by %s',
      async () => {
        const [filePath, fixtureResponse] =
          acceptAllFixtures.find((f) => f[1].ext === 'png') || [];
        if (!filePath || !fixtureResponse)
          throw new Error('Can not found png file path');

        const publicPath = `http://${s3Endpoint}/${fixtureBucketName}/${filePath}`;
        const [w, q] = ['2048', '75'];
        const optimizerParams = new URLSearchParams({ url: publicPath, w, q });
        const optimizerPrefix = `external_accept_all_w-${w}_q-${q}_`;
        const snapshotFileName = path.join(
          __dirname,
          '__snapshots__/e2e/',
          `${optimizerPrefix}${filePath.replace('/', '_')}.${
            fixtureResponse.ext
          }`
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
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(body).toMatchFile(snapshotFileName);
        expect(response.headers.get('Content-Type')).toBe(
          fixtureResponse['content-type']
        );
        expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

        // Header settings needed for CloudFront compression
        expect(response.headers.has('Content-Length')).toBeTruthy();
        expect(response.headers.has('Content-Encoding')).toBeFalsy();
      },
      ONE_MINUTE_IN_MS
    );
  });

  test.todo('Run test against domain that is not on the list');
});
