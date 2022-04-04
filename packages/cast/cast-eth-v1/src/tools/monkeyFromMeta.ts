import { monkeyFromType } from './monkey';

export const genMonkeyArray = (
  inputs: { name: string; type: string }[],
): (number | string | Buffer | undefined)[] =>
  inputs.map((val) => monkeyFromType(val.type));
