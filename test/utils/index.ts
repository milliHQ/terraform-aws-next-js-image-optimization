export interface Deferred<T = never> {
  promise: Promise<T>;
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export function createDeferred<T>(): Deferred<T> {
  let r;
  let j;

  const promise = new Promise<T>(
    (resolve: (value: any) => void, reject: (reason?: any) => void): void => {
      r = resolve;
      j = reject;
    }
  );

  return ({ promise, resolve: r, reject: j } as unknown) as Deferred<T>;
}

type Delay = (ms: number) => Promise<void>;

export const delay: Delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
