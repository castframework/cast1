const ForgeBondFactory = artifacts.require('ForgeBondFactory');
const ForgeInstrumentRegistry = artifacts.require('ForgeInstrumentRegistry');
const ForgeBond = artifacts.require('ForgeBond');

import {
  ForgeBondInstance,
  ForgeBondFactoryInstance,
  ForgeInstrumentRegistryInstance,
} from '../../dist/types';

import * as constants from './constants.js';

const initialSupply = constants.initialSupply;
const currentSupply = constants.currentSupply;
const isinCode = constants.isinCode;
const name = constants.name;
const symbol = constants.symbol;
const divisor = constants.divisor;
const denomination = constants.denomination;
const startDate = constants.startDate;
const initialMaturityDate = constants.initialMaturityDate;
// const extendedMaturityDate = 1816732800; // 28/07/2027
const interestRateInBips = constants.interestRateInBips;
const callable = constants.callable;
const isSoftBullet = constants.isSoftBullet; //1: true, 0: false
const softBulletPeriodInMonths = 24;
const firstCouponDate = constants.firstCouponDate;
const couponFrequencyInMonths = constants.couponFrequencyInMonths;
const registrar = constants.registrar;
const settler = constants.settler;
const owner = constants.owner;

const bondParameters = {
  initialSupply,
  currentSupply,
  isinCode,
  name,
  symbol,
  denomination,
  divisor,
  startDate,
  initialMaturityDate,
  firstCouponDate,
  couponFrequencyInMonths,
  interestRateInBips,
  callable,
  isSoftBullet,
  softBulletPeriodInMonths,
  currency: constants.currency,
  registrar,
  settler,
  owner,
};

const bondParametersWithDifferentName = {
  initialSupply,
  currentSupply,
  isinCode,
  name: 'different name',
  symbol,
  denomination,
  divisor,
  startDate,
  initialMaturityDate,
  firstCouponDate,
  couponFrequencyInMonths,
  interestRateInBips,
  callable,
  isSoftBullet,
  softBulletPeriodInMonths,
  currency: constants.currency,
  registrar,
  settler,
  owner,
};

const bondParametersWithDifferentNameAndIsin = {
  initialSupply,
  currentSupply,
  isinCode: 'different isin',
  name: 'different name',
  symbol,
  denomination,
  divisor,
  startDate,
  initialMaturityDate,
  firstCouponDate,
  couponFrequencyInMonths,
  interestRateInBips,
  callable,
  isSoftBullet,
  softBulletPeriodInMonths,
  currency: constants.currency,
  registrar,
  settler,
  owner,
};

function assertEvent(
  response: Truffle.TransactionResponse<Truffle.AnyEvent>,
  eventName: string,
  index: number,
): void {
  assert.equal(
    response.logs[index].event,
    eventName,
    `${eventName} event should fire`,
  );
}

function assertEventArgs(
  response: Truffle.TransactionResponse<Truffle.AnyEvent>,
  eventIndex: number,
  argName: string,
  expectedValue: unknown,
): void {
  assert.equal(
    response.logs[eventIndex].args[argName],
    expectedValue,
    `${argName} expected to be equal to ${expectedValue}`,
  );
}

let forgeBondFactory: ForgeBondFactoryInstance;
let forgeBond: ForgeBondInstance;
let forgeInstrumentRegistry: ForgeInstrumentRegistryInstance;

async function createForgeBondFactory(): Promise<void> {
  forgeInstrumentRegistry = await ForgeInstrumentRegistry.new(registrar);
  forgeBondFactory = await ForgeBondFactory.new(registrar);
}

async function authorizeFactory(): Promise<void> {
  await forgeInstrumentRegistry.authorizeFactory(
    'Bond',
    forgeBondFactory.address,
    {
      from: registrar,
    },
  );
}

contract('ForgeBondFactory', () => {
  context('isFactoryAuthorized', async () => {
    beforeEach(async function () {
      await createForgeBondFactory();
    });

    it('should isFactoryAuthorized registry method return true', async () => {
      const res1 = await forgeInstrumentRegistry.isFactoryAuthorized(
        '0x0000000000000000000000000000000000000000',
      );

      expect(res1).to.be.eql(false);
      await authorizeFactory();
      const res = await forgeInstrumentRegistry.isFactoryAuthorized(
        forgeBondFactory.address,
      );

      expect(res).to.be.eql(true);
    });

    //    it('should return the registry address', async () => {
    //      const res = await forgeBondFactory.getInstrumentRegistry();
    //
    //      expect(res).to.be.eql(forgeInstrumentRegistry.address);
    //    });
  });

  context('getInstrumentRegistry', async () => {
    beforeEach(async function () {
      await createForgeBondFactory();
      await authorizeFactory();
    });

    //    it('should return the registry address', async () => {
    //      const res = await forgeBondFactory.getInstrumentRegistry();
    //
    //      expect(res).to.be.eql(forgeInstrumentRegistry.address);
    //    });
  });

  context('createForgeBond', async function () {
    beforeEach(async function () {
      await createForgeBondFactory();
      await authorizeFactory();
    });

    it('should return address of created contract', async function () {
      await forgeBondFactory.createForgeBond
        .call(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .then((contractAddress: string) => {
          assert.notEqual(
            contractAddress,
            '0',
            'Returned address should not be 0',
          );
        });
    });

    it('should return address of valid ForgeBond instance', async function () {
      let returnedAddress: string | undefined;
      await forgeBondFactory.createForgeBond
        .call(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .then((contractAddress: string) => {
          returnedAddress = contractAddress;
        });
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParameters,
        {
          from: constants.registrar,
        },
      );
      forgeBond = await ForgeBond.at(returnedAddress as string);
      forgeBond
        .initialSupply()
        .then(
          (supply) =>
            supply &&
            assert.equal(
              supply.toNumber(),
              initialSupply,
              'Initial supply does not match',
            ),
        )
        .catch(
          (err) =>
            err && assert.fail('Call to initialSupply() should not fail'),
        );
      forgeBond
        .owner()
        .then((address) =>
          assert.equal(
            address,
            constants.owner,
            'Owner address does not match',
          ),
        )
        .catch((err) => err && assert.fail('Call to owner() should not fail'));
      forgeBond
        .maturityDate()
        .then(
          (date) =>
            date &&
            assert.equal(
              date.toNumber(),
              initialMaturityDate,
              'Maturity date does not match',
            ),
        )
        .catch(
          (err) => err && assert.fail('Call to maturityDate() should not fail'),
        );
      forgeBond
        .callable()
        .then((isCallable) =>
          assert.equal(isCallable, callable, 'Maturity date does not match'),
        )
        .catch(
          (err) => err && assert.fail('Call to callable() should not fail'),
        );
    });

    it('should emit InstrumentListed event with the right parameters', async function () {
      let returnedAddress: string;
      await forgeBondFactory.createForgeBond
        .call(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .then((contractAddress: string) => {
          returnedAddress = contractAddress;
        });
      await forgeBondFactory
        .createForgeBond(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .then((response: Truffle.TransactionResponse<Truffle.AnyEvent>) => {
          assertEvent(response, 'InstrumentListed', 2);
          assertEventArgs(response, 2, '_instrumentAddress', returnedAddress);
        });
    });

    it('should fail if a contract with the same name already exists', async function () {
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParameters,
        {
          from: constants.registrar,
        },
      );
      let err;
      await forgeBondFactory
        .createForgeBond(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .catch((error) => {
          err = error;
        });
      assert.equal(
        err.reason,
        'Bond with this name already exists',
        'Wrong error message',
      );
    });

    it('should fail if a contract with the same isin code already exists', async function () {
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParameters,
        {
          from: constants.registrar,
        },
      );
      let err;
      await forgeBondFactory
        .createForgeBond(
          forgeInstrumentRegistry.address,
          bondParametersWithDifferentName,
          {
            from: constants.registrar,
          },
        )
        .catch((error) => {
          err = error;
        });
      assert.equal(
        err.reason,
        'Bond with this isin already exists',
        'Wrong error message',
      );
    });

    it('should not fail if no contract exists with same name or isin', async function () {
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParameters,
        {
          from: constants.registrar,
        },
      );
      let err;
      await forgeBondFactory
        .createForgeBond(
          forgeInstrumentRegistry.address,
          bondParametersWithDifferentNameAndIsin,
          {
            from: constants.registrar,
          },
        )
        .catch((error) => {
          err = error;
        });
      assert.equal(err, undefined, 'Should not fail');
    });
  });

  context('just to test instrument registry getBondByName', async function () {
    beforeEach(async function () {
      await createForgeBondFactory();
      await authorizeFactory();
    });

    it('should return 0 if no contract with this name', async function () {
      await forgeInstrumentRegistry
        .getInstrumentByName(name)
        .then((contractAddress: string) => {
          assert.equal(
            contractAddress,
            constants.ZERO_ADDRESS,
            'Returned address should be 0',
          );
        });
    });

    it('should return address of the corresponding contract', async function () {
      let returnedAddress: string;
      await forgeBondFactory.createForgeBond
        .call(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .then((contractAddress: string) => {
          returnedAddress = contractAddress;
        });
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParameters,
        {
          from: constants.registrar,
        },
      );
      await forgeInstrumentRegistry
        .getInstrumentByName(name)
        .then((contractAddress: string) => {
          assert.equal(
            contractAddress,
            returnedAddress,
            'Wrong returned address',
          );
        });
    });
  });

  context(
    'just to test instrument registry getBondByIsinCode',
    async function () {
      beforeEach(async function () {
        await createForgeBondFactory();
        await authorizeFactory();
      });

      it('should return 0 if no contract with this isin code', async function () {
        await forgeInstrumentRegistry
          .getInstrumentByIsinCode(isinCode)
          .then((contractAddress: string) => {
            assert.equal(
              contractAddress,
              constants.ZERO_ADDRESS,
              'Returned address should be 0',
            );
          });
      });

      it('should return address of the corresponding contract', async function () {
        let returnedAddress: string;
        await forgeBondFactory.createForgeBond
          .call(forgeInstrumentRegistry.address, bondParameters, {
            from: constants.registrar,
          })
          .then((contractAddress: string) => {
            returnedAddress = contractAddress;
          });
        await forgeBondFactory.createForgeBond(
          forgeInstrumentRegistry.address,
          bondParameters,
          {
            from: constants.registrar,
          },
        );

        await forgeInstrumentRegistry
          .getInstrumentByIsinCode(isinCode)
          .then((contractAddress: string) => {
            assert.equal(
              contractAddress,
              returnedAddress,
              'Wrong returned address',
            );
          });
      });
    },
  );

  context('just to test instrument registry getAllBonds', async function () {
    beforeEach(async function () {
      await createForgeBondFactory();
      await authorizeFactory();
    });

    it('should return all tokens addresses', async function () {
      const returnedAddresses: string[] = [];
      await forgeBondFactory.createForgeBond
        .call(forgeInstrumentRegistry.address, bondParameters, {
          from: constants.registrar,
        })
        .then((contractAddress: string) => {
          returnedAddresses.push(contractAddress);
        });
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParameters,
        {
          from: constants.registrar,
        },
      );
      await forgeBondFactory.createForgeBond
        .call(
          forgeInstrumentRegistry.address,
          bondParametersWithDifferentNameAndIsin,
          {
            from: constants.registrar,
          },
        )
        .then((contractAddress: string) => {
          returnedAddresses.push(contractAddress);
        });
      await forgeBondFactory.createForgeBond(
        forgeInstrumentRegistry.address,
        bondParametersWithDifferentNameAndIsin,
        {
          from: constants.registrar,
        },
      );
      assert.equal(returnedAddresses.length, 2, 'Wrong number of addresses');
      await forgeInstrumentRegistry
        .getAllInstruments()
        .then((addresses: string[]) => {
          assert.deepEqual(
            addresses,
            returnedAddresses,
            'Wrong returned addresses',
          );
        });
    });
  });
});
