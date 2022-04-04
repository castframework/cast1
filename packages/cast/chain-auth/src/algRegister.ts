import { AlgRegister } from './types';
import { ethAlg } from './eth/eth';
import { tzAlg } from './tz/tz';

export const algRegister: AlgRegister = {
  ETH: ethAlg,
  TZ: tzAlg,
};
