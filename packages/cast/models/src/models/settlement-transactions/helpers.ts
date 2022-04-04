import {
  OracleSettlementTransaction,
  STRSettlementTransaction,
} from './settlement-transaction';
import { Currency, SettlementModel } from '../operations';
import { Ledger } from '../constants';
import { v4 } from 'uuid';
import * as faker from 'faker';
import {
  CancelSettlementTransactionInput,
  InitiateRedemptionInput,
  InitiateTradeInput,
  ParticipantAdresses,
} from './operation-input';
import {
  SettlementTransactionStatus,
  SettlementTransactionType,
} from '../settlement-transactions';
import { ParticipantAdressesWithoutDelivery } from '..';
export class OracleSettlementTransactionHelpers {
  public static givenSTRSettlementTransaction(
    partialSTR: Partial<STRSettlementTransaction> = {},
  ): STRSettlementTransaction {
    const data: STRSettlementTransaction = {
      id: v4(),
      settlementType: SettlementTransactionType.DVP,
      settlementDate: new Date(),
      instrumentLedger: Ledger.ETHEREUM,
      instrumentPublicAddress: faker.finance.ethereumAddress(),
      deliveryQuantity: 4321,
      deliverySenderAccountNumber: faker.finance.ethereumAddress(),
      deliveryReceiverAccountNumber: faker.finance.ethereumAddress(),
      paymentCurrency: Currency.EUR,
      paymentAmount: 1234,
      paymentSenderAccountNumber: faker.finance.iban(),
      paymentReceiverAccountNumber: faker.finance.iban(),
      operationId: '1d1103ca-f1fb-4efe-9344-7d43c81d7650',
      hash: '2fd8f0ec4f3dc08a16b1bee604585f809ca265e9',
      tradeId: 'f26be269-8729-46a1-879c-e647580c9024',
      paymentSenderLegalEntityId: faker.datatype.uuid(),
      paymentReceiverLegalEntityId: faker.datatype.uuid(),
      tradeDate: faker.date.soon(),
      settlementModel: SettlementModel.INDIRECT,
      intermediateAccountIBAN: 'intermediateAccountIBAN',
    };

    return { ...data, ...partialSTR };
  }

  public static givenOracleSettlementTransaction(): OracleSettlementTransaction {
    const data: OracleSettlementTransaction = {
      id: '1006',
      settlementType: SettlementTransactionType.DVP,
      settlementStatus: SettlementTransactionStatus.INITIATED,
      settlementDate: new Date('10/16/2020, 8:00:46 AM'),
      instrumentLedger: Ledger.ETHEREUM,
      instrumentPublicAddress: 'instrumentPublicAddress',
      deliveryQuantity: 4321,
      deliverySenderAccountNumber: 'deliverySenderAccountNumber',
      deliveryReceiverAccountNumber: 'deliveryReceiverAccountNumber',
      paymentCurrency: Currency.EUR,
      paymentAmount: 1234,
      paymentSenderAccountNumber: 'paymentSenderAccountNumber',
      paymentReceiverAccountNumber: 'paymentReceiverAccountNumber',
      operationId: '1d1103ca-f1fb-4efe-9344-7d43c81d7650',
      hash: '2fd8f0ec4f3dc08a16b1bee604585f809ca265e9',
      tradeId: 'f26be269-8729-46a1-879c-e647580c9024',
      paymentSenderLegalEntityId: faker.datatype.uuid(),
      paymentReceiverLegalEntityId: faker.datatype.uuid(),
      tradeDate: new Date('2020-01-01T00:00:00'),
      settlementModel: SettlementModel.INDIRECT,
      intermediateAccountIBAN: 'intermediateAccountIBAN',
    };

    return data;
  }
}

export class ParticipantAdressesHelpers {
  public static givenParticipantAdresses(): ParticipantAdresses {
    return {
      deliveryAccountNumber: faker.finance.ethereumAddress(),
      paymentAccountNumber: faker.finance.account(12),
      legalEntityId: faker.datatype.uuid(),
    };
  }
  public static givenParticipantAdressesWithoutDelivery(): ParticipantAdressesWithoutDelivery {
    return {
      paymentAccountNumber: faker.finance.account(12),
      legalEntityId: faker.datatype.uuid(),
    };
  }
}

export class InitiateRedemptionInputHelpers {
  public static givenInitiateRedemptionInput(
    nParticipants: number,
  ): InitiateRedemptionInput {
    return {
      settlementDate: faker.date.soon(),
      instrumentAddress: faker.finance.ethereumAddress(),
      issuerAddresses: ParticipantAdressesHelpers.givenParticipantAdressesWithoutDelivery(),
      participantsAddresses: new Array(nParticipants)
        .fill(undefined)
        .map(() => ParticipantAdressesHelpers.givenParticipantAdresses()),
      instrumentLedger: Ledger.ETHEREUM, // Only work with eth for now
      operationId: faker.datatype.uuid(),
      tradeId: 'f26be269-8729-46a1-879c-e647580c9024',
      tradeDate: new Date('2020-01-01T00:00:00'),
      settlementModel: SettlementModel.INDIRECT,
      intermediateAccountIBAN: 'intermediateAccountIBAN',
    };
  }
}

export class InitiateTradeInputHelpers {
  public static getInitiateTradeInput(): InitiateTradeInput {
    return {
      settlementDate: faker.date.soon(),
      operationId: '2a51014c-e29d-4c1a-903a-e7211e1cfe75',
      instrumentAddress: faker.finance.ethereumAddress(),
      instrumentLedger: Ledger.ETHEREUM, // Only work with eth for now
      sellerAddresses: ParticipantAdressesHelpers.givenParticipantAdresses(),
      buyerAddresses: ParticipantAdressesHelpers.givenParticipantAdresses(),
      deliveryQuantity: 100,
      paymentAmount: 1000,
      paymentCurrency: Currency.EUR,
      tradeId: 'f26be269-8729-46a1-879c-e647580c9024',
      tradeDate: new Date('2020-01-01T00:00:00'),
      settlementModel: SettlementModel.INDIRECT,
      intermediateAccountIBAN: 'intermediateAccountIBAN',
    };
  }
}

export class CancelSettlementTransactionInputHelpers {
  public static getCancelSettlementTransactionInput(): CancelSettlementTransactionInput {
    return {
      instrumentAddress: faker.finance.ethereumAddress(),
      instrumentLedger: Ledger.ETHEREUM,
      settlementTransactionId: '255d38a7-53b6-4116-b2a4-15ac7fa63c84',
    };
  }
}
