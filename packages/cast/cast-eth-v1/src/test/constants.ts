// eslint-disable-next-line @typescript-eslint/no-var-requires
const Web3 = require('web3');

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
export enum Currency {
  EUR = 'EUR',
}
const now = Math.floor(Date.now() / 1000);
export const oneYearInSeconds = 365 * 24 * 3600;
export const nowPlusNineYears = now + oneYearInSeconds * 9 - 42;
export const minusOneYear = now - oneYearInSeconds - 42;
export const initialSupply = 10000;
export const currentSupply = 10000;
export const isinCode = 'FR0003500008';
export const name = 'Test Token';
export const symbol = 'TST';
export const divisor = 1000;
export const denomination = 100000 * divisor; // 100000 eur * divisor(1000)
export const startDate = 1430870400; //06/05/2015
export const initialMaturityDate = 1753660800; //28/07/2025
export const extendedMaturityDate = 1816732800; // 28/07/2027
export const firstCouponDate = 1438041600; //28/07/2015
export const couponFrequencyInMonths = 12; //1 coupon per year
export const interestRateInBips = 36; //0.36% = 36 bips
export const callable = true;
export const isSoftBullet = true;
export const softBulletPeriodInMonths = 24;
export const currency = Currency.EUR;
export const firstCallDate = 1496361600; //02/06/2017
export const firstCallAmount = 750000000 * divisor; //750 million euros * divisor(100)
export const secondCallDate = 1543536000; //30/11/2018
export const secondCallAmount = 250000000 * divisor; //250 million euros * divisor(100)
export const owner = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
export const registrar = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';
export const settler = '0xC5fdf4076b8F3A5357c5E395ab970B5B54098Fef';
export const investor1Address = '0x821aEa9a577a9b44299B9c15c88cf3087F3b5544';
export const investor2Address = '0x0d1d4e623D10F9FBA5Db95830F7d3839406C6AF2';
export const investor3Address = '0x2932b7A2355D6fecc4b5c0B6BD44cC31df247a2e';
export const investor4Address = '0x2191eF87E392377ec08E7c08Eb105Ef5448eCED5';
export const unknownAddress = '0x5AEDA56215b167893e80B4fE645BA6d5Bab767DE';
export const created = 0x01;
export const tokenLocked = 0x02;
export const cashReceived = 0x03;
export const cashSent = 0x04;
export const noSuchTransition = 0xff;
export const shouldNotWork = 0xee;
