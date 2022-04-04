const ForgeBondFactory = artifacts.require('ForgeBondFactory');
const ForgeInstrumentRegistry = artifacts.require('ForgeInstrumentRegistry');
const ForgeBond = artifacts.require('ForgeBond');

import {
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

let forgeBondFactory: ForgeBondFactoryInstance;
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

async function unAuthorizeFactory(): Promise<void> {
  await forgeInstrumentRegistry.unAuthorizeFactory(forgeBondFactory.address, {
    from: registrar,
  });
}

contract('ForgeInstrumentRegistry', () => {
  context('isFactoryAuthorized', async () => {
    beforeEach(async function () {
      await createForgeBondFactory();
    });

    it('should return false for 0x0', async () => {
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

    it('should return true for authorized factory', async () => {
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

    it('should return false for unauthorized factory', async () => {
      await authorizeFactory();
      await unAuthorizeFactory();
      const res = await forgeInstrumentRegistry.isFactoryAuthorized(
        forgeBondFactory.address,
      );

      expect(res).to.be.eql(false);
    });
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
