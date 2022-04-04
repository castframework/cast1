import {
  CreateForgeBondParams,
  CreateForgeEMTNParams,
} from '@castframework/cast-interface-v1';
import {
  CreateBondInput,
  CreateEMTNInput,
  Currency,
} from '@castframework/models';
import { isoDateToSecond } from './typeUtils';

export function buildCreateForgeBondArgs(
  bond: CreateBondInput,
): CreateForgeBondParams {
  // L'ordre des données est important
  const {
    nominalAmount,
    isinCode,
    symbol,
    denomination,
    decimals,
    startDate,
    maturityDate,
    firstCouponDate,
    couponFrequencyInMonths,
    couponRateInBips,
    isCallable,
    isSoftBullet,
    softBulletPeriodInMonths,
    currency,
    registrarAgentAddress,
    settlerAgentAddress,
    issuerAddress,
  } = bond;

  const initialSupply: number = Math.floor(
    (nominalAmount as number) / (denomination as number),
  );
  const divisor = 10 ** (decimals as number);

  return {
    initialSupply,
    isinCode,
    name: symbol,
    symbol,
    denomination: denomination as number,
    divisor,
    startDate: isoDateToSecond(startDate as Date),
    initialMaturityDate: isoDateToSecond(maturityDate as Date),
    firstCouponDate: isoDateToSecond(firstCouponDate as Date),
    couponFrequencyInMonths: couponFrequencyInMonths as number,
    interestRateInBips: couponRateInBips as number,
    callable: isCallable as boolean,
    isSoftBullet: isSoftBullet as boolean,
    softBulletPeriodInMonths: softBulletPeriodInMonths as number,
    currency: currency as Currency,
    registrar: registrarAgentAddress as string,
    settler: settlerAgentAddress as string,
    owner: issuerAddress as string,
  };
}

export function buildCreateForgeEMTNArgs(
  emtn: CreateEMTNInput,
  registryAddress: string,
): CreateForgeEMTNParams {
  // L'ordre des données est important
  const {
    nominalAmount,
    isinCode,
    symbol,
    denomination,
    decimals,
    currency,
    registrarAgentAddress,
    settlerAgentAddress,
    issuerAddress,
  } = emtn;

  const initialSupply: number = Math.floor(
    (nominalAmount as number) / (denomination as number),
  );
  const divisor = 10 ** (decimals as number);

  return {
    currency: currency as string,
    initialSupply,
    isinCode,
    name: symbol,
    owner: issuerAddress as string,
    registrar: registrarAgentAddress as string,
    registryAddress,
    settler: settlerAgentAddress as string,
    symbol,
  };
}
