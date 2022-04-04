/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SettlementTransactionCensor } from '../../../src/modules/str/str.censor';
import { expect } from 'chai';
import {
  Ledger,
  OracleSettlementTransactionHelpers,
} from '@castframework/models';
import { ChainUser } from '../../../src/guards/ChainRoles.guard';
import * as faker from 'faker';
import { BlockchainService } from '../../../src/shared/services/blockchain.service';
import { getStubInstance } from '../../utils';
import { SinonStub, SinonStubbedInstance } from 'sinon';
import { ForgeBond } from '@castframework/cast-interface-v1';

describe('[Unit] Settlement Transaction Censor Service =>', () => {
  let censor: SettlementTransactionCensor;
  let blockchainService: BlockchainService;

  let forgeBondStub: SinonStubbedInstance<ForgeBond<any>>;
  let getForgeBondStub: SinonStub;

  function givenTestInstance(): void {
    blockchainService = getStubInstance(BlockchainService);
    forgeBondStub = getStubInstance(
      ForgeBond,
    ) as unknown as SinonStubbedInstance<ForgeBond<any>>;
    getForgeBondStub = blockchainService.getForgeBond as SinonStub;
    getForgeBondStub.resolves(forgeBondStub);

    forgeBondStub.owner.resolves('0xISSUER');

    censor = new SettlementTransactionCensor(blockchainService);
  }

  beforeEach(givenTestInstance);

  it('Should censor if not in transaction and not operator', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(false);

    const user: ChainUser = {
      address: '0xANON',
      chain: Ledger.ETHEREUM,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql([]);
  });

  it('Should censor if user is not for chain ', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(true);
    forgeBondStub.owner.resolves('0xNOTISSUER');

    const user: ChainUser = {
      address: '0xANON',
      chain: Ledger.TEZOS,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql([]);
  });

  it('Should pass if user is operator', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(true);
    const user: ChainUser = {
      address: '0xANON',
      chain: Ledger.ETHEREUM,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql(settlements);
  });

  it('Should pass if user is issuer', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(false);

    const user: ChainUser = {
      address: '0xISSUER',
      chain: Ledger.ETHEREUM,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql(settlements);
  });

  it('Should pass if user is additional reader', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(false);

    const user: ChainUser = {
      address: '0xADDITIONAL_READER',
      chain: Ledger.ETHEREUM,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        additionalReaderAddresses: [
          '0xADDITIONAL_READER',
          '0xANOTHER_ADDITIONAL_READER',
        ],
      }),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql(settlements);
  });

  it('Should pass if user is part of transaction', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(false);

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    ];

    const user: ChainUser = {
      address: settlements[0].deliverySenderAccountNumber,
      chain: Ledger.ETHEREUM,
    };

    const result = await censor.censor(settlements, user);

    expect(result).to.eql(settlements);
  });

  it('Complex case is part of transaction filter', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(false);
    forgeBondStub.owner.resolves('0xNOTISSUER');

    const user: ChainUser = {
      address: faker.finance.ethereumAddress(),
      chain: Ledger.ETHEREUM,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        deliverySenderAccountNumber: user.address,
      }),
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        deliverySenderAccountNumber: 'nop',
        deliveryReceiverAccountNumber: 'nop',
      }),
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        deliverySenderAccountNumber: user.address,
        instrumentLedger: Ledger.TEZOS,
      }),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql([settlements[0]]);
  });

  it('Complex case operator filter', async () => {
    forgeBondStub.isOperatorWithRoleAuthorized.resolves(true);

    const user: ChainUser = {
      address: faker.finance.ethereumAddress(),
      chain: Ledger.ETHEREUM,
    };

    const settlements = [
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        deliverySenderAccountNumber: user.address,
      }),
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        deliverySenderAccountNumber: 'nop',
        deliveryReceiverAccountNumber: 'nop',
      }),
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction({
        deliverySenderAccountNumber: user.address,
        instrumentLedger: Ledger.TEZOS,
      }),
    ];

    const result = await censor.censor(settlements, user);

    expect(result).to.eql([settlements[0], settlements[1]]);
  });
});
