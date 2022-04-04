import * as constants from '../test/constants.js';
export const monkeyUint = (max = 0xff): number =>
  Math.ceil(Math.random() * max);

export const monkeyAddress = (): string => constants.registrar;

export const monkeyString = (): string =>
  Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, monkeyUint(5) + 1);

export const monkeyBool = (): number => (Math.random() >= 0.5 ? 0 : 1);

export const monkeyFromType = (
  type: string,
): number | string | Buffer | undefined => {
  switch (type) {
    case 'uint':
      return monkeyUint();
    case 'address':
      return monkeyAddress();
    case 'string':
      return monkeyString();
    case 'bool':
      return monkeyBool();
  }
};
