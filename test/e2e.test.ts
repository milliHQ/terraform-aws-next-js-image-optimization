import * as path from 'path';
import { LambdaSAM, generateSAM } from '@dealmore/sammy';
import { S3 } from 'aws-sdk';
import { URLSearchParams } from 'url';

import { s3PublicDir } from './utils/s3-public-dir';
import { getLocalIpAddressFromHost } from './utils/host-ip-address';

describe('e2e test', () => {
  const route = '/_next/image';
  const hostIpAddress = getLocalIpAddressFromHost();
  const s3Endpoint = process.env.CI ? 's3:9000' : `${hostIpAddress}:9000`;
  const pathToWorker = path.resolve(__dirname, '../lib');
  const fixturesDir = path.resolve(__dirname, './fixtures');
  const fixtures = ['jpeg/Macaca_nigra_self-portrait_large.jpg'];
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
          route,
          method: 'get',
          environment: {
            DOMAINS: JSON.stringify([hostIpAddress, 's3']),
          },
        },
      },
      cwd: pathToWorker,
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

    const upload = await s3PublicDir(s3, fixturesDir);
    fixtureBucketName = upload.bucketName;
  });

  afterAll(async () => {
    await lambdaSAM.stop();
  });

  test.each(fixtures)('%p', async (filePath) => {
    const publicPath = `http://${s3Endpoint}/${fixtureBucketName}/${filePath}`;
    const params = new URLSearchParams({
      url: publicPath,
      w: '2048',
      q: '75',
    });
    const optimizerPrefix = `external_w-${params.get('w')}_q-${params.get(
      'q'
    )}_`;
    const snapshotFileName = path.join(
      __dirname,
      '__snapshots__/e2e/',
      `${optimizerPrefix}${filePath.replace('/', '_')}`
    );

    const response = await lambdaSAM.sendApiGwRequest(
      `${route}?${params.toString()}`
    );
    const body = await response
      .text()
      .then((text) => Buffer.from(text, 'base64'));

    expect(response.status).toBe(200);
    expect(body).toMatchFile(snapshotFileName);
  });

  test.todo('Run test against domain that is not on the list');
});
