declare module NodeJS {
  interface Global {
    fetch: any;
  }

  export interface ProcessEnv {
    TF_NEXTIMAGE_DOMAINS?: string;
    TF_NEXTIMAGE_DEVICE_SIZES?: string;
    TF_NEXTIMAGE_IMAGE_SIZES?: string;
  }
}
