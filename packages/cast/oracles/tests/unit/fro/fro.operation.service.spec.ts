import { getStubInstance } from '../../utils';
import * as sinon from 'sinon';
import { SinonStub, SinonStubbedInstance } from 'sinon';
import {
  Currency,
  InitiateTradeInputHelpers,
  OracleSettlementTransactionHelpers,
  SettlementTransactionType,
  ForgeOperationType,
  InitiateTradeInput,
  ParticipantAdresses,
  CancelSettlementTransactionInput,
  CancelSettlementTransactionInputHelpers,
} from '@castframework/models';
import { StrClientService } from '@castframework/oracle-clients';
import { FroOperationService } from '../../../src/modules/fro/fro.operation.service';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { BlockchainService } from '../../../src/shared/services/blockchain.service';
import { ForgeBond } from '@castframework/cast-interface-v1';
import Sinon = require('sinon');

chai.use(chaiAsPromised);

describe('[Unit] FRO operation Service =>', () => {
  let blockchainService: BlockchainService;
  let strClientService: StrClientService;

  let forgeBondStub: SinonStubbedInstance<ForgeBond<any>>;
  let getForgeBondStub: SinonStub;

  let input: InitiateTradeInput;
  let sellerAddresses: ParticipantAdresses;
  let buyerAddresses: ParticipantAdresses;
  const cancelSettlementTransactionInput: CancelSettlementTransactionInput =
    CancelSettlementTransactionInputHelpers.getCancelSettlementTransactionInput();
  function givenStubbedRepositories(): void {
    input = InitiateTradeInputHelpers.getInitiateTradeInput();
    sellerAddresses = input.sellerAddresses;
    buyerAddresses = input.buyerAddresses;

    blockchainService = getStubInstance(BlockchainService);
    strClientService = getStubInstance(StrClientService);

    strClientService.createSettlementTransaction = Sinon.stub().returns(
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    );

    strClientService.getSettlementTransaction = Sinon.stub().returns(
      OracleSettlementTransactionHelpers.givenSTRSettlementTransaction(),
    );

    forgeBondStub = getStubInstance(
      ForgeBond,
    ) as unknown as SinonStubbedInstance<ForgeBond<any>>;
    getForgeBondStub = blockchainService.getForgeBond as SinonStub;
    getForgeBondStub.resolves(forgeBondStub);

    forgeBondStub.initiateTrade.resolves({ transactionId: 'txId' });
    forgeBondStub.initiateSubscription.resolves({ transactionId: 'txId' });
    forgeBondStub.cancelSettlementTransaction.resolves({
      transactionId: 'txId',
    });
  }

  beforeEach(givenStubbedRepositories);

  const givenTestInstance = (): FroOperationService =>
    new FroOperationService(blockchainService, strClientService);

  it('[initiateOperation - Trade] should throw an error if the operation type is wrong', async () => {
    const froOperationService = givenTestInstance();

    const initiateOperationPromise = froOperationService.initiateOperation(
      input,
      ForgeOperationType.REDEMPTION,
    );

    await expect(initiateOperationPromise).to.be.rejectedWith(
      'forgeOperationType is not a valid operation type : Redemption',
    );
  });

  it('[initiateOperation - Trade] should create settlement transaction with correct global informations', async () => {
    const froOperationService = givenTestInstance();
    await froOperationService.initiateOperation(
      input,
      ForgeOperationType.TRADE,
    );

    sinon.assert.calledWithMatch(
      strClientService.createSettlementTransaction as SinonStub,
      sinon.match({
        operationId: input.operationId,
        movements: sinon.match((mvts) => mvts.length === 3),
        instrumentLedger: input.instrumentLedger,
        instrumentPublicAddress: input.instrumentAddress,
        paymentCurrency: Currency.EUR,
        settlementType: SettlementTransactionType.DVP,
        settlementDate: input.settlementDate,
        hash: sinon.match.string,
      }),
    );
  });

  it('[initiateOperation - Trade] should create settlement transaction with correct payment informations', async () => {
    const froOperationService = givenTestInstance();
    await froOperationService.initiateOperation(
      input,
      ForgeOperationType.TRADE,
    );
    sinon.assert.calledWithMatch(
      strClientService.createSettlementTransaction as SinonStub,
      sinon.match({
        deliveryReceiverAccountNumber: buyerAddresses.deliveryAccountNumber,
        deliverySenderAccountNumber: sellerAddresses.deliveryAccountNumber,
        paymentReceiverAccountNumber: sellerAddresses.paymentAccountNumber,
        paymentSenderAccountNumber: buyerAddresses.paymentAccountNumber,
      }),
    );
  });

  it('[initiateOperation - Trade] should throw an error if str client service throw', async () => {
    const froOperationService = givenTestInstance();
    (strClientService.createSettlementTransaction as SinonStub).throws();

    const initiateOperationPromise = froOperationService.initiateOperation(
      input,
      ForgeOperationType.TRADE,
    );

    await expect(initiateOperationPromise).to.be.rejected;
  });

  it('[cancelSettlementTransaction] should call getSettlementTransaction for cancel a Settlement Transaction calling', async () => {
    const froOperationService = givenTestInstance();
    await froOperationService.cancelSettlementTransaction(
      cancelSettlementTransactionInput,
    );
    sinon.assert.calledWithMatch(
      strClientService.getSettlementTransaction as SinonStub,
      cancelSettlementTransactionInput.settlementTransactionId,
    );
  });
});
