import delay from 'delay';

export function buildPullingPromise<T>(
  fn: (resolve: (result: T) => void, reject: (reason?: any) => void) => void,
  msInterval: number,
): Promise<T> {
  let promiseResolve, promiseReject;

  const promise = new Promise<T>((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const timeout = setInterval(fn, msInterval, resolve, reject);

  function resolve(args: T): void {
    clearInterval(timeout);
    promiseResolve(args);
  }

  function reject(args: any): void {
    clearInterval(timeout);
    promiseReject(args);
  }

  return promise;
}

export async function asyncForEach<T, R>(
  array: T[],
  callback: (value: T, index: number, array: T[]) => Promise<R>,
): Promise<R[]> {
  const returnValues: R[] = [];

  for (let index = 0; index < array.length; index++) {
    returnValues.push(await callback(array[index], index, array));
  }

  return returnValues;
}

export async function asyncMap<T1, T2>(
  array: T1[],
  callback: (value: T1, index: number, array: T1[]) => Promise<T2>,
): Promise<T2[]> {
  return Promise.all(array.map(callback));
}

export async function asyncFilter<T>(
  array: T[],
  callback: (value: T, index: number, array: T[]) => Promise<boolean>,
): Promise<T[]> {
  const filterMap = await asyncMap(array, callback);
  return array.filter((_, index) => filterMap[index]);
}

export async function waitFor(
  testFn: () => boolean | Promise<boolean>,
  msInterval: number,
  msTimeout: number,
): Promise<void> {
  const end = Date.now() + msTimeout;
  while (!(await testFn()) && Date.now() < end) {
    await delay(msInterval);
  }
  if (!(await testFn())) {
    throw new Error('Timeout reached');
  }
}
