import * as path from 'path';
import { LambdaSAM, generateSAM } from '@dealmore/sammy';
import S3 from 'aws-sdk/clients/s3';
import { URLSearchParams } from 'url';

import { s3PublicDir } from './utils/s3-public-dir';
import { getLocalIpAddressFromHost } from './utils/host-ip-address';
import { acceptAllFixtures } from './constants';

describe('[e2e]', () => {
  const route = '/_next/image';
  const hostIpAddress = getLocalIpAddressFromHost();
  const s3Endpoint = `${hostIpAddress}:9000`;
  const pathToWorker = path.resolve(__dirname, '../lib');
  const fixturesDir = path.resolve(__dirname, './fixtures');
  const cacheControlHeader = 'public, max-age=123456';
  let fixtureBucketName: string;
  let lambdaSAM: LambdaSAM;
  let s3: S3;

  beforeAll(async () => {
    // Generate SAM for the worker lambda
    lambdaSAM = await generateSAM({
      lambdas: {
        imageOptimizer: {
          filename: 'dist.zip',
          handler: 'handler.handler',
          runtime: 'nodejs12.x',
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
        `${optimizerPrefix}${filePath.replace('/', '_')}.${fixtureResponse.ext}`
      );

      const response = await lambdaSAM.sendApiGwRequest(
        `${route}?${optimizerParams.toString()}`
      );
      const body = await response
        .text()
        .then((text) => Buffer.from(text, 'base64'));

      expect(response.status).toBe(200);
      expect(body).toMatchFile(snapshotFileName);
      expect(response.headers.get('Content-Type')).toBe(
        fixtureResponse['content-type']
      );
      expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

      // Header settings needed for CloudFront compression
      expect(response.headers.has('Content-Length')).toBeTruthy();
      expect(response.headers.has('Content-Encoding')).toBeFalsy();
    }
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
        `${optimizerPrefix}${filePath.replace('/', '_')}.${fixtureResponse.ext}`
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

      const body = await response
        .text()
        .then((text) => Buffer.from(text, 'base64'));

      expect(response.status).toBe(200);
      expect(body).toMatchFile(snapshotFileName);
      expect(response.headers.get('Content-Type')).toBe(
        fixtureResponse['content-type']
      );
      expect(response.headers.get('Cache-Control')).toBe(cacheControlHeader);

      // Header settings needed for CloudFront compression
      expect(response.headers.has('Content-Length')).toBeTruthy();
      expect(response.headers.has('Content-Encoding')).toBeFalsy();
    }
  );

  test.todo('Run test against domain that is not on the list');
});
