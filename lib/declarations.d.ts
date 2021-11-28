import nodeFetch from 'node-fetch';

type NodeFetch = typeof nodeFetch;
declare global {
  namespace NodeJS {
    interface Global {
      fetch: NodeFetch;
    }
    export interface ProcessEnv {
      TF_NEXTIMAGE_DOMAINS?: string;
      TF_NEXTIMAGE_DEVICE_SIZES?: string;
      TF_NEXTIMAGE_FORMATS?: string;
      TF_NEXTIMAGE_IMAGE_SIZES?: string;
      TF_NEXTIMAGE_SOURCE_BUCKET?: string;
      __DEBUG__USE_LOCAL_BUCKET?: string;
      NEXT_SHARP_PATH?: string;
    }
  }
}

export {};
