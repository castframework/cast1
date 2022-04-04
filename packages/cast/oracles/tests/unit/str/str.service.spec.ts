import { getStubInstance, getStubRepository } from '../../utils';
import { SettlementTransactionCensor } from '../../../src/modules/str/str.censor';
import { SettlementTransactionService } from '../../../src/modules/str/str.service';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import {
  Ledger,
  Movement,
  OracleSettlementTransactionHelpers,
  STRSettlementTransaction,
} from '@castframework/models';
import { expect } from 'chai';
import { Between, Repository } from 'typeorm';
import { ChainUser } from '../../../src/guards/ChainRoles.guard';
import { v4 } from 'uuid';
import { BlockchainService } from '../../../src/shared/services/blockchain.service';
import Sinon = require('sinon');

describe('[Unit] STR Service =>', () => {
  let settlementTransactionRepository: Repository<STRSettlementTransaction>;
  let settlementTransactionCensor: SettlementTransactionCensor;
  let blockchainService: BlockchainService;
  let movementRepository: Repository<Movement>;

  const settlementTransactionId: string = v4();
  //use address generator
  const chainUser: ChainUser = {
    address: 'string',
    chain: Ledger.ETHEREUM,
  };
  const transactionHelpers =
    OracleSettlementTransactionHelpers.givenSTRSettlementTransaction();
  const settlementTransaction: STRSettlementTransaction = transactionHelpers;
  const settlementTransactions: STRSettlementTransaction[] = [
    transactionHelpers,
    transactionHelpers,
  ];
  const begin = settlementTransactions[1].settlementDate;
  const end = settlementTransactions[1].settlementDate;

  function givenStubbedRepositories(): void {
    blockchainService = getStubInstance(BlockchainService);
    settlementTransactionRepository =
      getStubRepository<STRSettlementTransaction>();
    settlementTransactionCensor = getStubInstance(SettlementTransactionCensor);
    settlementTransactionCensor.censor = Sinon.stub().callsFake(
      async (strs) => strs,
    );
    settlementTransactionRepository.findOne = Sinon.stub().resolves(
      settlementTransaction,
    );
    settlementTransactionRepository.find = Sinon.stub().resolves(
      settlementTransactions,
    );
  }

  beforeEach(givenStubbedRepositories);

  const givenTestInstance = (): SettlementTransactionService =>
    new SettlementTransactionService(
      settlementTransactionRepository,
      movementRepository,
      settlementTransactionCensor,
      blockchainService,
    );

  it('[getSettlementTransaction] should return censor result', async () => {
    const strService = givenTestInstance();

    const result = await strService.getSettlementTransaction(
      chainUser,
      settlementTransactionId,
    );

    expect(result).to.deep.equal(settlementTransaction);
  });

  it('[getSettlementTransaction] should return null if censor filter everything', async () => {
    const strService = givenTestInstance();
    settlementTransactionCensor.censor = Sinon.stub().resolves([]);

    const result = await strService.getSettlementTransaction(
      chainUser,
      settlementTransactionId,
    );

    expect(result).to.equal(null);
  });

  it('[getSettlementTransaction] should call censor', async () => {
    const strService = givenTestInstance();

    await strService.getSettlementTransaction(
      chainUser,
      settlementTransactionId,
    );

    sinon.assert.calledOnceWithExactly(
      settlementTransactionCensor.censor as SinonStub,
      [settlementTransaction],
      chainUser,
    );
  });

  it('[getSettlementTransaction] should call findOne', async () => {
    const strService = givenTestInstance();

    await strService.getSettlementTransaction(
      chainUser,
      settlementTransactionId,
    );

    sinon.assert.calledOnceWithExactly(
      settlementTransactionRepository.findOne as SinonStub,
      {
        where: {
          instrumentLedger: chainUser.chain,
          id: settlementTransactionId,
        },
        relations: ['movements'],
      },
    );
  });

  it('[getSettlementTransaction] should return null if not find in the db', async () => {
    const strService = givenTestInstance();
    settlementTransactionRepository.findOne = Sinon.stub().resolves(undefined);

    const result = await strService.getSettlementTransaction(
      chainUser,
      settlementTransactionId,
    );
    expect(result).to.equal(null);
  });

  it('[getSettlementTransactions] should call find', async () => {
    const strService = givenTestInstance();

    await strService.getSettlementTransactions(chainUser);

    sinon.assert.calledOnceWithExactly(
      settlementTransactionRepository.find as SinonStub,
      {
        where: {
          instrumentLedger: chainUser.chain,
        },
        relations: ['movements'],
      },
    );
  });

  it('[getSettlementTransactions] should return find result', async () => {
    const strService = givenTestInstance();
    const result = await strService.getSettlementTransactions(chainUser);
    expect(result).to.deep.equal(settlementTransactions);
  });

  it('[getSettlementTransactions] should return censor result', async () => {
    const strService = givenTestInstance();
    settlementTransactionCensor.censor = Sinon.stub().resolves([
      settlementTransaction,
    ]);
    const result = await strService.getSettlementTransactions(chainUser);

    expect(result).to.deep.equal([settlementTransaction]);
  });

  it('[getSettlementTransactionByTimeFrame] should call find', async () => {
    const strService = givenTestInstance();

    await strService.getSettlementTransactionByTimeFrame(chainUser, begin, end);

    sinon.assert.calledOnceWithExactly(
      settlementTransactionRepository.find as SinonStub,
      {
        where: {
          settlementDate: Between(begin, end),
        },
        relations: ['movements'],
      },
    );
  });

  it('[getSettlementTransactionByTimeFrame] should return find result', async () => {
    const strService = givenTestInstance();
    const result = await strService.getSettlementTransactionByTimeFrame(
      chainUser,
      begin,
      end,
    );
    expect(result).to.deep.equal(settlementTransactions);
  });
});
