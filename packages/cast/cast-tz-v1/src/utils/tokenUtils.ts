import * as faker from 'faker';

export const TOKEN_LOCKED = 2;
export const ERROR = 255;
export const REGISTRAR_ROLE = 1;
export const SETTLER_ROLE = 2;
export const CASH_RECEIVED = 3;
export const CASH_SENT = 4;

export const buildTokenBond = (
  registrarAddress: string,
  ownerAddress: string,
): any => {
  return {
    registrar: registrarAddress,
    settler: 'tz1XrCvviH8CqoHMSKpKuznLArEa1yR9U7ep',
    owner: ownerAddress,
    denomination: 1753660800,
    divisor: 1438041600,
    startDate: 12,
    initialMaturityDate: 36,
    firstCouponDate: 1,
    couponFrequencyInMonths: 1,
    interestRateInBips: 24,
    callable: true,
    isSoftBullet: true,
    softBulletPeriodInMonths: 1234,
    initialSupply: 2000,
    isinCode: faker.name.findName(), // generated randomly
    name: faker.name.findName(), // generated randomly
    symbol: 'mo',
    currency: 'EUR',
  };
};

export const buildTokenEMTN = (
  registrarAddress: string,
  ownerAddress: string,
): any => {
  return {
    registrar: registrarAddress,
    settler: 'tz1XrCvviH8CqoHMSKpKuznLArEa1yR9U7ep',
    owner: ownerAddress,
    initialSupply: 2000,
    isinCode: faker.name.findName(), // generated randomly
    name: faker.name.findName(), // generated randomly
    symbol: 'mo',
    currency: 'EUR',
  };
};

// for playTransition Tests
export const buildCustomTokenEMTN = (
  ownerAddress: string,
  adminAddress: string,
  settlerAddress: string,
): any => {
  return {
    registrar: ownerAddress,
    settler: settlerAddress,
    owner: adminAddress,
    initialSupply: 1000000000,
    isinCode: faker.name.findName(),
    name: faker.name.findName(),
    symbol: 'Bob',
    currency: 'EUR',
  };
};

// for playTransition Tests
export const buildCustomTokenBond = (
  ownerAddress: string,
  adminAddress: string,
  settlerAddress: string,
): any => {
  return {
    registrar: ownerAddress,
    settler: settlerAddress,
    owner: adminAddress,
    denomination: 1753660800,
    divisor: 1438041600,
    startDate: 12,
    initialMaturityDate: 36,
    firstCouponDate: 1,
    couponFrequencyInMonths: 1,
    interestRateInBips: 24,
    callable: true,
    isSoftBullet: true,
    softBulletPeriodInMonths: 1234,
    initialSupply: 2000,
    isinCode: faker.name.findName(), // generated randomly
    name: faker.name.findName(), // generated randomly
    symbol: 'Bob',
    currency: 'EUR',
  };
};

export const buildSubscriptionArgs = (
  receiver: string,
  quantity: number,
  txId: number,
  ownerAdress: string,
) => [
  txId, // txId
  txId, // operationId
  ownerAdress, // deliverySenderAccountNumber
  receiver, // deliveryReceiverAccountNumber
  quantity, // deliveryQuantity
  faker.datatype.hexaDecimal(12), // txHash
];
