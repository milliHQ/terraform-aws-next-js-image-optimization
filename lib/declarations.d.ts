declare module NodeJS {
  interface Global {
    fetch: any;
  }

  export interface ProcessEnv {
    DOMAINS: string;
  }
}
