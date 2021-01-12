import { createRequest, createResponse } from 'node-mocks-http';
import { parse as parseUrl, URLSearchParams } from 'url';
import { EventEmitter } from 'events';
import {
  ImageConfig,
  imageConfigDefault,
} from 'next/dist/next-server/server/image-config';

import { imageOptimizer } from '../lib/image-optimizer';
import { createDeferred } from './utils';

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

describe('[unit] imageOptimizer', () => {
  test('External image', async () => {
    const imageConfig: ImageConfig = {
      ...imageConfigDefault,
      domains: ['upload.wikimedia.org'],
    };

    const params = generateParams(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Macaca_nigra_self-portrait_large.jpg/1024px-Macaca_nigra_self-portrait_large.jpg',
      {
        w: '2048',
        q: '75',
      }
    );

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

    // Write the snapshots as image
    // addSnapshotSerializer
    // https://github.com/synyx/jest-canvas-snapshot-serializer
    expect(body).toMatchSnapshot();
  });
});
