const RLP = require('rlp');
const faker = require('faker');


exports.buildBondArgs = (symbol, supply, registrar, settler, issuers) => {
  const now = Math.floor(Date.now() / 1000);
  const yearInSecond = 31536000;

  return RLP.encode([
    supply,
    faker.finance.bic(),
    symbol,
    symbol,
    10, //denomination 100000EUR -> 10000000 with divisor=100
    100, //divisor
    now, //startDate
    now + yearInSecond, //maturityDate
    now + (yearInSecond/4),
    4, //couponFrequencyInMonths
    36, //interestRateInBips 36 bips = 0.36%
    0, //callable //false
    1, // isSoftBullet //true
    12, // softBulletPeriodInMonths
    registrar,
    settler,
    issuers,
  ])
};

exports.settlementArgs = (seller, buyer, quantity) => ({
  txId: faker.random.hexaDecimal(32),
  operationId: faker.random.hexaDecimal(32),
  deliverySenderAccountNumber: seller,
  deliveryReceiverAccountNumber: buyer,
  deliveryQuantity: quantity,
  txHash: faker.random.hexaDecimal(64),
});