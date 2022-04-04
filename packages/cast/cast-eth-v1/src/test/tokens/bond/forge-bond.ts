import { ForgeBondInstance } from '../../../../dist/types';
import * as constants from '../../constants';
import { assertEvent, assertEventArgs } from '../../utils/events';
import { buildForgeBond } from '../../utils/builders';
import * as faker from 'faker';

const initialSupply = constants.initialSupply;
const currentSupply = constants.currentSupply;
const isinCode = constants.isinCode;
const name = constants.name;
const symbol = constants.symbol;
const divisor = constants.divisor;
const denomination = constants.denomination;
const startDate = constants.startDate;
const initialMaturityDate = constants.initialMaturityDate;
const firstCouponDate = constants.firstCouponDate;
const isSoftBullet = constants.isSoftBullet;
const softBulletPeriodInMonths = constants.softBulletPeriodInMonths;
const couponFrequencyInMonths = constants.couponFrequencyInMonths;
const interestRateInBips = constants.interestRateInBips;
const callable = constants.callable;

contract('ForgeBond', (accounts) => {
  let forgeBond: ForgeBondInstance;
  context('once deployed', async function () {
    beforeEach(async function () {
      forgeBond = await buildForgeBond(constants.owner);
    });

    it('initialSupply member should match the one given to constructor', async function () {
      await forgeBond.initialSupply().then((supply) => {
        assert.equal(
          supply.toNumber(),
          initialSupply,
          'Initial supply does not match',
        );
      });
    });

    it('currentSupply should be initialized with initialSupply', async function () {
      await forgeBond.currentSupply().then((supply) => {
        assert.equal(
          supply.toNumber(),
          currentSupply,
          'Current supply does not match',
        );
      });
    });

    it('isinCode member should match the one given to constructor', async function () {
      await forgeBond.isinCode().then((value) => {
        assert.equal(value, isinCode, 'Isin Code does not match');
      });
    });

    it('getType member should match Bond', async function () {
      await forgeBond.getType().then((value) => {
        assert.equal(value, 'Bond', 'getType does not match');
      });
    });

    it('name member should match the one given to constructor', async function () {
      await forgeBond.name().then((value) => {
        assert.equal(value, name, 'Name does not match');
      });
    });

    it('symbol member should match the one given to constructor', async function () {
      await forgeBond.symbol().then((value) => {
        assert.equal(value, symbol, 'Name does not match');
      });
    });

    it('denomination member should match the one given to constructor', async function () {
      await forgeBond.denomination().then((value) => {
        assert.equal(
          value.toNumber(),
          denomination,
          'Denomination does not match',
        );
      });
    });

    it('startDate member should match the one given to constructor', async function () {
      await forgeBond.startDate().then((date) => {
        assert.equal(date.toNumber(), startDate, 'Start date does not match');
      });
    });

    it('maturityDate member should match the one given to constructor', async function () {
      await forgeBond.maturityDate().then((date) => {
        assert.equal(
          date.toNumber(),
          initialMaturityDate,
          'Maturity date does not match',
        );
      });
    });

    it('currentMaturityDate member should be equal to maturityDate', async function () {
      await forgeBond.currentMaturityDate().then((currentMaturityDate) => {
        assert.equal(
          currentMaturityDate.toNumber(),
          initialMaturityDate,
          'Current maturity date does not match',
        );
      });
    });

    it('firstCouponDate member should match the one given to constructor', async function () {
      await forgeBond.firstCouponDate().then((date) => {
        assert.equal(
          date.toNumber(),
          firstCouponDate,
          'First coupon date does not match',
        );
      });
    });

    it('couponFrequencyInMonths member should match the one given to constructor', async function () {
      await forgeBond.couponFrequencyInMonths().then((frequency) => {
        assert.equal(
          frequency.toNumber(),
          couponFrequencyInMonths,
          'First coupon date does not match',
        );
      });
    });

    it('interestRateInBips member should match the one given to constructor', async function () {
      await forgeBond.interestRateInBips().then((rate) => {
        assert.equal(
          rate.toNumber(),
          interestRateInBips,
          'Interest rate does not match',
        );
      });
    });

    it('callable member should match the one given to constructor', async function () {
      await forgeBond.callable().then((isCallable) => {
        assert.equal(isCallable, callable, 'Callable does not match');
      });
    });

    it('divisor member should match the one given to constructor', async function () {
      await forgeBond.divisor().then((div) => {
        assert.equal(div.toNumber(), divisor, 'divisor does not match');
      });
    });

    it('isSoftBullet member should match the one given to constructor', async function () {
      await forgeBond.isSoftBullet().then((softBullet) => {
        assert.equal(softBullet, isSoftBullet, 'isSoftBullet does not match');
      });
    });

    it('softBulletPeriodInMonths member should match the one given to constructor', async function () {
      await forgeBond.softBulletPeriodInMonths().then((period) => {
        assert.equal(
          period.toNumber(),
          softBulletPeriodInMonths,
          'softBulletPeriodInMonths does not match',
        );
      });
    });

    it('Owner should match owner', async function () {
      await forgeBond.owner().then((owner) => {
        assert.equal(owner, constants.owner, 'Owner does not match');
      });
    });

    it('should have 10000 ForgeBond in the first account', async function () {
      await forgeBond.getBalance(constants.owner).then((balance) => {
        assert.equal(
          balance.valueOf(),
          10000,
          "10000 wasn't in the first account",
        );
      });
    });

    it('should have 0 ForgeBond in the second account', async function () {
      await forgeBond.getBalance(accounts[1]).then((balance) => {
        assert.equal(balance.valueOf(), 0, 'Second account has a balance');
      });
    });
  });
});
