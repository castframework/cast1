import { MichelsonMap } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { EventMappers, ViewMappers } from '@castframework/blockchain-driver-tz';

import {
  hexToAddress,
  isSettlementTransactionOperationType,
  isSingleSettlementTransaction,
} from '../..';

type RawBytes = {
  bytes: string;
};

export const blake2bHashed = (role: string): string => {
  switch (role) {
    case 'ADMIN':
      return '1189b3413a2038edf2d4c5b12a5de9aa753110000d02d9a90a2f463ef07e8f43';
    case 'ISSUER':
      return '05d96ab23a73b7ea426c12889bee06b4bda470a21c9b2266b993054f01bdcb69';
    case 'SETTLER':
      return '68716e5f1e14c77e9a2a1ab6193ace02657a10e6dc5206f22b0e8a047179202a';
    case 'CAN_RECEIVE':
      return '87209e9ae5e3a8dc5dde8c69a25373bb0fc95ec7204108fb2dc52a680b2c1e3a';
    case 'CANNOT_SEND':
      return 'bad602c7576a97fc6fcf281d186798387de6c66a11c33e4875546b397c1d3059';
    default:
      return 'ERROR';
  }
};

export enum HoldStatusCode {
  held = 'Held',
  executed = 'Executed',
  released = 'Released',
  nonExistent = 'Non existent',
}
export interface InstrumentProperties {
  name: string;
  isin: string;
  address: string;
}

export interface ContractWithEventsStorage {
  eventSinkContractAddress: string;
}

export interface ForgeInstrumentRegistryStorage
  extends ContractWithEventsStorage {
  instrumentRegistryAddress: string;
  tokensByIsinCode: MichelsonMap<string, InstrumentProperties>;
  tokensByName: Map<string, InstrumentProperties>;
  registrarAddress: string;
  factories: MichelsonMap<string, string>;
}

export interface ForgeTokenFactoryStorage extends ContractWithEventsStorage {
  instrumentRegistryAddress: string;
}

export interface SettlementTransaction {
  txId: BigNumber;
  operationId: BigNumber;
  deliverySenderAccountNumber: string;
  deliveryReceiverAccountNumber: string;
  deliveryQuantity: BigNumber;
  status: number;
  txHash: string;
}

export interface SettlementTransactionRepository {
  settlementTransactionById: MichelsonMap<string, SettlementTransaction>;
}

export interface Balance {
  balance: BigNumber;
  locked: BigNumber;
}

export interface ForgeTokenStorage extends ContractWithEventsStorage {
  owner: string;
  currentSupply: BigNumber;
  initialSupply: BigNumber;
  currency: string;
  isinCode: string;
  symbol: string;
  name: string;
  operatorsAuthorizations: MichelsonMap<string, BigNumber[]>;
  settlementTransactionRepository: SettlementTransactionRepository;
  balances: MichelsonMap<string, Balance>;
}

export interface HoldValue {
  amount: BigNumber;
  recipient: string;
  ref: string;
  sender: string;
  status: string;
}

export const REGISTRAR_ROLE = 1;
export const SETTLER_ROLE = 2;

export const ForgeInstrumentRegistryViewMappers: ViewMappers<ForgeInstrumentRegistryStorage> =
  {
    getAllFactoryTypes: async (storage: ForgeInstrumentRegistryStorage) => {
      return Array.from(storage.factories.keys());
    },
    getFactory: async (
      storage: ForgeInstrumentRegistryStorage,
      methodParameters: unknown[],
    ) => {
      return storage.factories.get(methodParameters[0] as string);
    },
    isFactoryAuthorized: async (
      storage: ForgeInstrumentRegistryStorage,
      methodParameters: unknown[],
    ) => {
      const authorizedFactories = Array.from(storage.factories.values());
      return authorizedFactories.includes(methodParameters[0] as string);
    },
    getAllInstruments: async (storage) => {
      const tokensByIsinCode = storage.tokensByIsinCode;

      return Array.from(tokensByIsinCode.entries()).map(
        ([, instrument]) => instrument.address,
      );
    },
    getInstrumentByIsinCode: async (
      storage: ForgeInstrumentRegistryStorage,
      methodParameters: unknown[],
    ) => {
      const tokensByIsinCode = storage.tokensByIsinCode;
      return tokensByIsinCode.get(methodParameters[0] as string)?.address;
    },
    getInstrumentByName: async (
      storage: ForgeInstrumentRegistryStorage,
      methodParameters: unknown[],
    ) => {
      const tokensByName = storage.tokensByName;
      return tokensByName.get(methodParameters[0] as string)?.address;
    },
  };

export const ForgeInstrumentRegistryEventMappers: EventMappers = {};

export const ForgeTokenFactoryViewMappers: ViewMappers<ForgeTokenFactoryStorage> =
  {
    getInstrumentRegistry: async (storage) => storage.instrumentRegistryAddress,
  };

export const ForgeTokenFactoryEventMappers: EventMappers = {
  InstrumentListed: (method, methodParameters) => {
    const ilRawBytes = methodParameters[0] as RawBytes;

    const instrumentAddress = hexToAddress(ilRawBytes.bytes);
    return { _instrumentAddress: instrumentAddress };
  },
};

export const ForgeTokenViewMappers: ViewMappers<ForgeTokenStorage> = {
  isOperatorWithRoleAuthorized: async (
    storage: ForgeTokenStorage,
    methodParameters: unknown[],
  ) => {
    const operatorsAuthorizations = storage.operatorsAuthorizations;
    const roleNameBN: BigNumber = new BigNumber(methodParameters[1] as number);

    return (
      operatorsAuthorizations.has(methodParameters[0] as string) &&
      operatorsAuthorizations
        .get(methodParameters[0] as string)
        ?.some((value) => value.eq(roleNameBN))
    );
  },
  owner: async (storage: ForgeTokenStorage, methodParameters: unknown[]) =>
    storage.owner,
  settler: async (storage: ForgeTokenStorage, methodParameters: unknown[]) => {
    const entries = (await storage).operatorsAuthorizations.entries();
    const obj = Array.from(entries).find(([, bb]) =>
      bb.map((bn) => bn.toNumber()).includes(SETTLER_ROLE),
    );
    return obj === undefined ? undefined : obj[0];
  },
  registrar: async (
    storage: ForgeTokenStorage,
    methodParameters: unknown[],
  ) => {
    const entries = (await storage).operatorsAuthorizations.entries();
    const obj = Array.from(entries).find(([, bb]) =>
      bb.map((bn) => bn.toNumber()).includes(REGISTRAR_ROLE),
    );
    return obj === undefined ? undefined : obj[0];
  },
  currentSupply: async (
    storage: ForgeTokenStorage,
    methodParameters: unknown[],
  ) => storage.currentSupply,
  initialSupply: async (
    storage: ForgeTokenStorage,
    methodParameters: unknown[],
  ) => storage.initialSupply,
  name: async (storage: ForgeTokenStorage, methodParameters: unknown[]) =>
    storage.name,
  currency: async (storage: ForgeTokenStorage, methodParameters: unknown[]) =>
    storage.currency,
  isinCode: async (storage: ForgeTokenStorage, methodParameters: unknown[]) =>
    storage.isinCode,
  symbol: async (storage: ForgeTokenStorage, methodParameters: unknown[]) =>
    storage.symbol,
  getFullBalances: async (
    storage: ForgeTokenStorage,
    methodParameters: unknown[],
  ) => {
    const balances = Array.from(storage.balances.entries());
    return balances.map(([address, balance]) => ({
      _balance: balance.balance,
      _address: address,
      _locked: balance.locked,
    }));
  },
  denomination: async () => 1000, // TODO: map to real denomination
  divisor: async () => 100,
  startDate: async () => new Date(),
  maturityDate: async () => new Date(),
  firstCouponDate: async () => new Date(),
  couponFrequencyInMonths: async () => 12,
  interestRateInBips: async () => 0,
  callable: async () => false,
  isSoftBullet: async () => false,
  softBulletPeriodInMonths: async () => 0,
  getCurrentState: async (storage: ForgeTokenStorage, [txId]: [string]) => {
    const tx =
      storage.settlementTransactionRepository.settlementTransactionById.get(
        txId,
      );

    return tx?.status;
  },
};

export const ForgeTokenEventMappers: EventMappers = {
  SubscriptionInitiated: (method, methodParameters) => {
    const rawBN = methodParameters[0] as BigNumber;
    const payload = {
      settlementTransactionId: rawBN.toFixed(),
    };

    if (!isSingleSettlementTransaction(payload)) {
      throw new Error(`Bad return value format: ${payload}`);
    }
    return payload;
  },
  PaymentTransferred: (method, methodParameters) => {
    const ptRawBN0 = methodParameters[0] as BigNumber;
    const ptRawBN1 = methodParameters[1] as BigNumber;

    const payload = {
      settlementTransactionId: ptRawBN0.toFixed(),
      settlementTransactionOperationType: ptRawBN1.toFixed(),
    };
    if (
      !isSingleSettlementTransaction(payload) ||
      !isSettlementTransactionOperationType(payload)
    ) {
      throw new Error(`Bad return value format: ${payload}`);
    }
    return payload;
  },
  PaymentReceived: (method, methodParameters) => {
    const prRawBN0 = methodParameters[0] as BigNumber;
    const prRawBN1 = methodParameters[1] as BigNumber;

    const payload = {
      settlementTransactionId: prRawBN0.toFixed(),
      settlementTransactionOperationType: prRawBN1.toFixed(),
    };
    if (
      !isSingleSettlementTransaction(payload) ||
      !isSettlementTransactionOperationType(payload)
    ) {
      throw new Error(`Bad return value format: ${payload}`);
    }
    return payload;
  },
  Transfer: (method, methodParameters) => {
    const ttRawBytes0 = methodParameters[0] as RawBytes;
    const ttRawBytes1 = methodParameters[1] as RawBytes;
    const value = methodParameters[2];

    const fromAddress = hexToAddress(ttRawBytes0.bytes);
    const toAddress = hexToAddress(ttRawBytes1.bytes);
    return {
      _from: fromAddress,
      _to: toAddress,
      _value: value,
    };
  },
};
