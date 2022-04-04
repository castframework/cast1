import { v4 as uuid } from 'uuid';
import {
  CreateBondInput,
  CreateEMTNInput,
  CreateOracleSettlementTransactionInput,
  Currency,
  EmtnType,
  InitiateRedemptionInput,
  InitiateSubscriptionInput,
  InitiateTradeInput,
  InstrumentStatus,
  Ledger,
  SettlementModel,
  SettlementTransactionType,
  Underlying,
} from '@castframework/models';
import dateformat = require('dateformat');
import * as fs from 'fs';
import {
  addHexPrefix,
  bufferToHex,
  privateToAddress,
  toBuffer,
} from 'ethereumjs-util';
import { extractAddressFromSecret } from '@castframework/blockchain-driver-tz';

interface Addresses {
  ISSUER_1: string;
  DEALER_1: string;
  DEALER_2: string;
  REGISTRAR: string;
  SETTLEMENT_AGENT: string;
}

type PrivateKeys = {
  ISSUER_1: string;
  DEALER_1: string;
  DEALER_2: string;
  REGISTRAR: string;
  SETTLEMENT_AGENT: string;
};

const ethNetworkFolder = process.env['NETWORK_ETH_FOLDER'];

const ethKeys = JSON.parse(
  fs.readFileSync(`${ethNetworkFolder}/keys.json`, 'utf8'),
);

const tzNetworkFolder = process.env['NETWORK_TZ_FOLDER'];

const tzKeys = JSON.parse(
  fs.readFileSync(`${tzNetworkFolder}/keys.json`, 'utf8'),
);

export const tezosPrivateKeys: PrivateKeys = tzKeys;
export const ethPrivateKeys: PrivateKeys = ethKeys;

export const ethAddresses = Object.keys(ethPrivateKeys).reduce(
  (result, key) => {
    result[key] = addHexPrefix(
      bufferToHex(privateToAddress(toBuffer(ethPrivateKeys[key]))),
    );
    return result;
  },
  {},
) as unknown as Addresses;

export const tzAddresses: Addresses = Object.keys(ethPrivateKeys).reduce(
  (result, key) => {
    result[key] = extractAddressFromSecret(tezosPrivateKeys[key]);
    return result;
  },
  {},
) as unknown as Addresses;

export const addressesByLedger: Map<Ledger, Addresses> = new Map([
  [Ledger.ETHEREUM, ethAddresses],
  [Ledger.TEZOS, tzAddresses],
]);

export function getCreateBondInput(ledger: Ledger): CreateBondInput {
  const isinCode = dateformat(new Date(), 'yyyymmddHHMM');
  const symbol = isinCode;
  return {
    denomination: 100,
    nominalAmount: 100000,
    decimals: 3,
    startDate: new Date('2020-01-01T00:00:00'),
    maturityDate: new Date('2021-01-01T00:00:00'),
    firstCouponDate: new Date('2020-01-06T00:00:00'),
    couponFrequencyInMonths: 10,
    couponRateInBips: 10,
    isCallable: true,
    isSoftBullet: true,
    softBulletPeriodInMonths: 10,
    registrarAgentAddress: addressesByLedger.get(ledger)?.REGISTRAR,
    settlerAgentAddress: addressesByLedger.get(ledger)?.SETTLEMENT_AGENT,
    extendedMaturityDate: new Date('2020-01-01T00:00:00'),
    currency: Currency.EUR,
    spread: 10,
    callFrequency: '10',
    symbol,
    isinCode,
    cfiCode: 'codeCFI',
    commonCode: 'codeCommon',
    status: InstrumentStatus.CREATED,
    issuerId: 'issuerId',
    ledger,
    issuerAddress: addressesByLedger.get(ledger)?.ISSUER_1,
  };
}

export function getCreateEmtnInput(ledger: Ledger): CreateEMTNInput {
  const isinCode = dateformat(new Date(), 'yyyymmddHHMM');
  const symbol = isinCode;
  return {
    denomination: 100,
    nominalAmount: 100000,
    decimals: 3,
    startDate: new Date('2020-01-01T00:00:00'),
    maturityDate: new Date('2021-01-01T00:00:00'),
    firstCouponDate: new Date('2020-01-06T00:00:00'),
    couponFrequencyInMonths: 10,
    couponRateInBips: 10,
    isCallable: true,
    registrarAgentAddress: addressesByLedger.get(ledger)?.REGISTRAR,
    settlerAgentAddress: addressesByLedger.get(ledger)?.SETTLEMENT_AGENT,
    currency: Currency.EUR,
    callFrequency: '10',
    symbol,
    isinCode,
    cfiCode: 'codeCFI',
    commonCode: 'codeCommon',
    status: InstrumentStatus.CREATED,
    issuerId: 'issuerId',
    ledger,
    issuerAddress: addressesByLedger.get(ledger)?.ISSUER_1,
    autocallFrequencyInMonths: 12,
    EmtnType: EmtnType.type1,
    isAutocall: true,
    underlying: Underlying.UDL1,
    firstAutocallDate: new Date('2020-01-06T00:00:00'),
    barrier1: 80,
    barrier2: 60,
  };
}

export function getInitiateSubscriptionInput(
  instrumentAddress: string,
  ledger: Ledger,
): InitiateSubscriptionInput {
  return {
    tradeId: uuid(),
    tradeDate: new Date('2020-01-06T00:00:00'),
    settlementDate: new Date('2020-01-07T00:00:00'),
    operationId: '1a51014c-e29d-4c1a-903a-e7211e1cfe75',
    instrumentAddress,
    instrumentLedger: ledger,
    issuerAddresses: {
      paymentAccountNumber: 'securityIssuerIBAN',
      legalEntityId: 'issuerLegalEntityId',
    },
    investorAddresses: {
      deliveryAccountNumber: addressesByLedger?.get(ledger)?.DEALER_1 as string,
      paymentAccountNumber: 'investor1IBAN',
      legalEntityId: 'investorLegalEntityId',
    },
    intermediateAccountIBAN: 'settlerIBAN',
    deliveryQuantity: 100,
    paymentAmount: 1000,
    paymentCurrency: Currency.EUR,
    additionalReaderAddresses: [],
    settlementModel: SettlementModel.INDIRECT,
  };
}

export function getInitiateTradeInput(
  instrumentAddress: string,
  ledger: Ledger,
): InitiateTradeInput {
  return {
    tradeId: uuid(),
    tradeDate: new Date('2020-01-06T00:00:00'),
    settlementDate: new Date('2020-02-07T00:00:00'),
    operationId: '2a51014c-e29d-4c1a-903a-e7211e1cfe75',
    instrumentAddress,
    instrumentLedger: ledger,
    sellerAddresses: {
      deliveryAccountNumber: addressesByLedger?.get(ledger)?.ISSUER_1 as string,
      paymentAccountNumber: 'issuerIBAN',
      legalEntityId: 'issuerLegalEntityId',
    },
    buyerAddresses: {
      deliveryAccountNumber: addressesByLedger?.get(ledger)?.DEALER_2 as string,
      paymentAccountNumber: 'investor2IBAN',
      legalEntityId: 'investor2LegalEntityId',
    },
    intermediateAccountIBAN: 'settlerIBAN',
    deliveryQuantity: 100,
    paymentAmount: 1000,
    paymentCurrency: Currency.EUR,
    additionalReaderAddresses: [],
    settlementModel: SettlementModel.INDIRECT,
  };
}

export function getInitiateRedemptionInput(
  instrumentAddress: string,
  ledger: Ledger,
): InitiateRedemptionInput {
  return {
    tradeId: 'ba4d9c75-d9c8-4345-87a6-1b70db218324',
    tradeDate: new Date('2020-01-06T00:00:00'),
    settlementDate: new Date('2020-01-07T00:00:00'),
    operationId: '3a51014c-e29d-4c1a-903a-e7211e1cfe75',
    instrumentAddress,
    instrumentLedger: ledger,
    intermediateAccountIBAN: 'settlerIBAN',
    issuerAddresses: {
      paymentAccountNumber: addressesByLedger?.get(Ledger.TEZOS)
        ?.ISSUER_1 as string,
      legalEntityId: 'issuerLegalEntityId',
    },
    participantsAddresses: [
      {
        deliveryAccountNumber: addressesByLedger?.get(ledger)
          ?.DEALER_1 as string,
        paymentAccountNumber: 'investorIBAN',
        legalEntityId: 'investorLegalEntityId',
      },
      {
        deliveryAccountNumber: addressesByLedger?.get(ledger)
          ?.DEALER_2 as string,
        paymentAccountNumber: 'investor2IBAN',
        legalEntityId: 'investor2LegalEntityId',
      },
      {
        deliveryAccountNumber: addressesByLedger?.get(ledger)
          ?.SETTLEMENT_AGENT as string,
        paymentAccountNumber: 'settlerIBAN',
        legalEntityId: 'settlerLegalEntityId',
      },
    ],
    additionalReaderAddresses: [],
    settlementModel: SettlementModel.INDIRECT,
  };
}

export function getCreateOracleSettlementTransactionInput(): CreateOracleSettlementTransactionInput {
  return {
    id: '',
    operationId: '',
    instrumentLedger: Ledger.ETHEREUM,
    instrumentPublicAddress: 'whatever',
    settlementType: SettlementTransactionType.DVP,
    tradeDate: new Date(),
    settlementDate: new Date(),
    tradeId: '',
    hash: '',
    movements: [],
    deliveryQuantity: 100,
    deliveryReceiverAccountNumber: '',
    deliverySenderAccountNumber: '',
    paymentCurrency: Currency.EUR,
    paymentAmount: 10000000,
    paymentReceiverAccountNumber: 'RECEIVER_ACCOUNT',
    paymentSenderAccountNumber: 'SENDER_ACCOUNT',
    additionalReaderAddresses: [],
    paymentSenderLegalEntityId: '',
    paymentReceiverLegalEntityId: '',
    settlementModel: SettlementModel.INDIRECT,
  };
}
