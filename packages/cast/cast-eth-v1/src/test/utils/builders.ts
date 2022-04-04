const ForgeBond = artifacts.require('ForgeBond');

import { ForgeBondInstance } from '../../../dist/types';
import * as constants from '../constants';

export async function buildForgeBond(
  owner: string,
  couponFrequency = constants.couponFrequencyInMonths,
): Promise<ForgeBondInstance> {
  const bondParameters = {
    initialSupply: constants.initialSupply,
    currentSupply: constants.currentSupply,
    isinCode: constants.isinCode,
    name: constants.name,
    symbol: constants.symbol,
    denomination: constants.denomination,
    divisor: constants.divisor,
    startDate: constants.startDate,
    initialMaturityDate: constants.initialMaturityDate,
    firstCouponDate: constants.firstCouponDate,
    couponFrequencyInMonths: couponFrequency,
    interestRateInBips: constants.interestRateInBips,
    callable: constants.callable,
    isSoftBullet: constants.isSoftBullet,
    softBulletPeriodInMonths: constants.softBulletPeriodInMonths,
    currency: constants.currency,
    registrar: constants.registrar,
    settler: constants.settler,
    owner,
  };

  return ForgeBond.new(bondParameters);
}
