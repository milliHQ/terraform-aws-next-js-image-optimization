import { ETagCache } from '@millihq/etag-cache';
import {
  defaultConfig,
  NextConfigComplete,
} from 'next/dist/server/config-shared';
import { fetchTimeout } from './fetch-timeout';

type NextImageConfig = Partial<NextConfigComplete['images']>;
type NodeFetch = typeof import('node-fetch').default;

/* -----------------------------------------------------------------------------
 * Default Configuration
 * ---------------------------------------------------------------------------*/

// Timeout the connection before 30000ms to be able to print an error message
// See Lambda@Edge Limits for origin-request event here:
// https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html#limits-lambda-at-edge
const FETCH_TIMEOUT = 29500;

// `images` property is defined on default config
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const defaultImageConfig = defaultConfig.images!;

const domains = parseFromEnv<typeof defaultImageConfig.domains>(
  'TF_NEXTIMAGE_DOMAINS'
);
const deviceSizes = parseFromEnv<typeof defaultImageConfig.deviceSizes>(
  'TF_NEXTIMAGE_DEVICE_SIZES'
);
const formats = parseFromEnv<typeof defaultImageConfig.formats>(
  'TF_NEXTIMAGE_FORMATS'
);
const imageSizes = parseFromEnv<typeof defaultImageConfig.imageSizes>(
  'TF_NEXTIMAGE_IMAGE_SIZES'
);
const dangerouslyAllowSVG = parseFromEnv<
  typeof defaultImageConfig.dangerouslyAllowSVG
>('TF_NEXTIMAGE_DANGEROUSLY_ALLOW_SVG');
const contentSecurityPolicy = parseFromEnv<
  typeof defaultImageConfig.contentSecurityPolicy
>('TF_NEXTIMAGE_CONTENT_SECURITY_POLICY');

const imageConfigEndpoint = process.env.IMAGE_CONFIG_ENDPOINT;

function parseFromEnv<T>(key: string): T | undefined {
  try {
    const envValue = process.env[key];
    if (typeof envValue === 'string') {
      return JSON.parse(envValue) as T;
    }

    return undefined;
  } catch (err) {
    console.error(`Could not parse ${key} from environment variable`);
    console.error(err);
    return undefined;
  }
}

/* -----------------------------------------------------------------------------
 * fetchImageConfig
 * ---------------------------------------------------------------------------*/
function fetchImageConfigGenerator(fetch: NodeFetch) {
  return async function fetchImageConfig(
    hostname: string,
    eTag?: string
  ): Promise<{ item?: NextImageConfig; eTag: string } | null> {
    const url = imageConfigEndpoint + '/' + hostname;
    const response = await fetchTimeout(fetch, FETCH_TIMEOUT, url, eTag);

    // Existing cache is still valid
    if (response.status === 304 && eTag) {
      return {
        eTag,
      };
    }

    if (response.status === 200) {
      const nextConfig = (await response.json()) as NextConfigComplete;
      // Etag is always present on CloudFront responses
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const responseEtag = response.headers.get('etag')!;

      return {
        eTag: responseEtag,
        item: nextConfig.images,
      };
    }

    return null;
  };
}

/* -----------------------------------------------------------------------------
 * getImageConfig
 * ---------------------------------------------------------------------------*/

/**
 * Filters undefined values from an object
 * @param obj
 * @returns
 */
function filterObject(obj: { [key: string]: any }) {
  const ret: { [key: string]: any } = {};
  Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .forEach((key) => (ret[key] = obj[key]));
  return ret;
}

type GetImageConfigOptions = {
  configCache: ETagCache<any>;
  hostname: string;
};

async function getImageConfig({
  configCache,
  hostname,
}: GetImageConfigOptions): Promise<NextImageConfig> {
  let externalConfig: NextImageConfig | undefined;

  // Use external Config
  if (imageConfigEndpoint) {
    externalConfig = await configCache.get(hostname);
  }

  // Generate config object by merging the items in the following order:
  // 1. defaultConfig
  // 2. externalConfig (if exists)
  // 3. vales set from environment variables
  const imageConfig: NextImageConfig = {
    ...defaultConfig,
    ...externalConfig,
    ...filterObject({
      domains,
      deviceSizes,
      formats,
      imageSizes,
      dangerouslyAllowSVG,
      contentSecurityPolicy,
    }),
  };

  return imageConfig;
}

export { fetchImageConfigGenerator, getImageConfig };
export type { NextImageConfig };
