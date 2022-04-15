import { getStubInstance } from '../../utils';
import * as sinon from 'sinon';
import { SinonStub, SinonStubbedInstance } from 'sinon';
import {
  CreateMovementInput,
  CreateOracleSettlementTransactionInput,
  Currency,
  InitiateRedemptionInputHelpers,
  InstrumentPosition,
  InstrumentPositionHelpers,
  SettlementTransactionType,
  InitiateRedemptionInput,
  ParticipantAdresses,
  ParticipantAdressesWithoutDelivery,
} from '@castframework/models';
import { PositionService } from '../../../src/modules/fxo/position/position.service';
import { StrClientService } from '@castframework/oracle-clients';
import { FroRedemptionService } from '../../../src/modules/fro/fro.redemption.service';
import * as _ from 'lodash';
import { ForgePubSub } from '../../../src/utils/PubSub.wrapper';
import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { BlockchainService } from '../../../src/shared/services/blockchain.service';
import { ForgeBond } from '@castframework/cast-interface-v1';
import Sinon = require('sinon');
import * as faker from 'faker';

chai.use(chaiAsPromised);

describe('[Unit] FRO redemption Service =>', () => {
  let blockchainService: BlockchainService;
  let positionService: PositionService;
  let strClientService: StrClientService;
  let forgePubSub: ForgePubSub;

  let forgeBondStub: SinonStubbedInstance<ForgeBond<any>>;
  let getForgeBondStub: SinonStub;

  let input: InitiateRedemptionInput;
  let issuerAddresses: ParticipantAdressesWithoutDelivery;
  let settlerAddresses: ParticipantAdresses;
  let investorsAddresses: ParticipantAdresses[];
  let investorPositions: InstrumentPosition[];
  let nInvestors: number;

  const issuerDeliveryAccountNumber = faker.finance.ethereumAddress();

  function givenStubbedRepositories(): void {
    nInvestors = 2;
    input = InitiateRedemptionInputHelpers.givenInitiateRedemptionInput(
      nInvestors + 1, // 1 being the settler
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [settlerAddresses, ...investorsAddresses] = input.participantsAddresses;

    issuerAddresses = input.issuerAddresses;

    investorPositions = investorsAddresses.map((inv) =>
      InstrumentPositionHelpers.givenInstrumentPositionFor(
        input.instrumentAddress,
        inv.deliveryAccountNumber,
        input.instrumentLedger,
      ),
    );

    blockchainService = getStubInstance(BlockchainService);
    positionService = getStubInstance(PositionService);
    strClientService = getStubInstance(StrClientService);
    forgePubSub = getStubInstance(ForgePubSub);

    forgeBondStub = getStubInstance(
      ForgeBond,
    ) as unknown as SinonStubbedInstance<ForgeBond<any>>;
    getForgeBondStub = blockchainService.getForgeBond as SinonStub;
    getForgeBondStub.resolves(forgeBondStub);

    forgeBondStub.initiateRedemption.resolves({ transactionId: 'txId' });
    forgeBondStub.owner.resolves(issuerDeliveryAccountNumber);
    forgeBondStub.settler.resolves(input.intermediateAccountIBAN);
    forgeBondStub.currency.resolves(Currency.EUR);

    positionService.getInstrumentPositions =
      Sinon.stub().returns(investorPositions);
    strClientService.createSettlementTransactions = Sinon.stub().returns([]);
  }

  beforeEach(givenStubbedRepositories);

  const givenTestInstance = (): FroRedemptionService =>
    new FroRedemptionService(
      blockchainService,
      positionService,
      strClientService,
    );

  it('[initiateRedemption] should read owner from contract', async () => {
    const froRedemptionService = givenTestInstance();

    await froRedemptionService.initiateRedemption(input);

    sinon.assert.calledOnceWithExactly(forgeBondStub.owner);
  });

  it('[initiateRedemption] should throw an error if participant addresses are not given', async () => {
    const froRedemptionService = givenTestInstance();

    const invalidInput = {
      ...input,
      participantsAddresses: [],
    };

    const initiateRedemptionPromise =
      froRedemptionService.initiateRedemption(invalidInput);

    await expect(initiateRedemptionPromise).to.be.rejectedWith(
      /.*Cannot find payment account number for address.*/,
    );
  });

  it('[initiateRedemption] should get positions from PositionService', async () => {
    const froRedemptionService = givenTestInstance();

    await froRedemptionService.initiateRedemption(input);

    sinon.assert.calledOnceWithExactly(
      positionService.getInstrumentPositions as SinonStub,
      input.instrumentAddress,
      input.instrumentLedger,
    );
  });

  it('[initiateRedemption] should create correct number of settlement transactions', async () => {
    const froRedemptionService = givenTestInstance();
    await froRedemptionService.initiateRedemption(input);

    sinon.assert.calledWithMatch(
      strClientService.createSettlementTransactions as SinonStub,
      sinon.match((val) => val.length === nInvestors),
    );
  });

  it('[initiateRedemption] should create correct number of movements', async () => {
    const froRedemptionService = givenTestInstance();
    await froRedemptionService.initiateRedemption(input);

    sinon.assert.calledWithMatch(
      strClientService.createSettlementTransactions as SinonStub,
      sinon.match(
        (settlementTransactions: CreateOracleSettlementTransactionInput[]) => {
          const allMovements: CreateMovementInput[] = _.flatten(
            settlementTransactions.map((st) => st.movements),
          );
          const nUniqueMovements = _.uniqBy(
            allMovements,
            (mvt: CreateMovementInput) => mvt.id,
          ).length;

          // Two movement per investor:
          // - cash from settler to investor
          // - token from investor to issuer
          // One additional movement of cash from settler to issuer
          return nUniqueMovements === nInvestors * 2 + 1;
        },
      ),
    );
  });

  it('[initiateRedemption] should create settlement transaction with correct global informations', async () => {
    const froRedemptionService = givenTestInstance();
    await froRedemptionService.initiateRedemption(input);

    sinon.assert.calledWithMatch(
      strClientService.createSettlementTransactions as SinonStub,
      sinon.match.every(
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
      ),
    );
  });

  it('[initiateRedemption] should create settlement transaction with correct payment informations', async () => {
    const froRedemptionService = givenTestInstance();
    await froRedemptionService.initiateRedemption(input);

    investorsAddresses.forEach((investorsAddresses) => {
      sinon.assert.calledWithMatch(
        strClientService.createSettlementTransactions as SinonStub,
        sinon.match.some(
          sinon.match({
            deliveryReceiverAccountNumber: issuerDeliveryAccountNumber,
            deliverySenderAccountNumber:
              investorsAddresses.deliveryAccountNumber,
            paymentReceiverAccountNumber:
              investorsAddresses.paymentAccountNumber,
            paymentSenderAccountNumber: issuerAddresses.paymentAccountNumber,
            paymentSenderLegalEntityId: issuerAddresses.legalEntityId,
            paymentReceiverLegalEntityId: investorsAddresses.legalEntityId,
          }),
        ),
      );
    });
  });

  it('[initiateRedemption] should throw an error if str client service throw', async () => {
    const froRedemptionService = givenTestInstance();
    (strClientService.createSettlementTransactions as SinonStub).throws();

    const initiateRedemptionPromise =
      froRedemptionService.initiateRedemption(input);

    await expect(initiateRedemptionPromise).to.be.rejected;
  });
});
