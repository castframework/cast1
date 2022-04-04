import {
  BlockchainDriver,
  BlockchainSpecificParamsOf,
  CallResult,
  Event,
  TransactionManager,
  TransactionParams,
  TransactionReceipt,
} from '@castframework/transaction-manager';
import { Observable } from 'rxjs';
import { SmartContract } from './SmartContract';

export type CreateForgeBondParams = {
  initialSupply: number;
  isinCode: string;
  name: string;
  symbol: string;
  denomination: number;
  divisor: number;
  startDate: number;
  initialMaturityDate: number;
  firstCouponDate: number;
  couponFrequencyInMonths: number;
  interestRateInBips: number;
  callable: boolean;
  isSoftBullet: boolean;
  softBulletPeriodInMonths: number;
  currency: string;
  registrar: string;
  settler: string;
  owner: string;
};

export const FORGEBONDFACTORY_CONTRACT_EVENT_ALL_EVENTS = 'allEvents';

export const FORGEBONDFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED =
  'InstrumentListed';
export type ForgeBondFactoryInstrumentListedPayload = {
  _instrumentAddress: string;
};
export type ForgeBondFactoryInstrumentListedEvent = Event<
  typeof FORGEBONDFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED,
  ForgeBondFactoryInstrumentListedPayload
>;

export type ForgeBondFactoryInstrumentCreated = unknown;
export type ForgeBondFactoryGetInstrumentRegistryReturnType = string;

export type ForgeBondFactoryAllEvents = ForgeBondFactoryInstrumentListedEvent;

export class ForgeBondFactory<
  Driver extends BlockchainDriver<unknown, unknown>,
> extends SmartContract<Driver> {
  constructor(
    smartContractAddress: string,
    transactionManager: TransactionManager<Driver>,
    contractBlockchainSpecificParams: Partial<
      BlockchainSpecificParamsOf<Driver>
    > = {},
  ) {
    super(
      smartContractAddress,
      transactionManager,
      contractBlockchainSpecificParams,
    );
  }

  public async createForgeBond(
    registryAddress: string,
    createForgeBondParams: CreateForgeBondParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[string, CreateForgeBondParams]>(
      'createForgeBond',
      [registryAddress, createForgeBondParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public InstrumentListed(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondFactoryInstrumentListedEvent> {
    return this._listen(
      FORGEBONDFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED,
      listenBlockchainSpecificParams,
      from,
    );
  }

  // Unused ?
  // public InstrumentCreated(
  //   from?: number,
  //   listenBlockchainSpecificParams?: Partial<
  //     BlockchainSpecificParamsOf<Driver>
  //   >,
  // ): Observable<InstrumentListedEvent> {
  //   return this.event(
  //     'InstrumentCreated',
  //     listenBlockchainSpecificParams,
  //     from,
  //   );
  // }

  public allEvents(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondFactoryAllEvents> {
    return this._listen(
      FORGEBONDFACTORY_CONTRACT_EVENT_ALL_EVENTS,
      listenBlockchainSpecificParams,
      from,
    );
  }
}
