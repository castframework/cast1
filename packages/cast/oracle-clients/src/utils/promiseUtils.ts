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
