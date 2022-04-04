import {
  BlockchainDriver,
  BlockchainSpecificParamsOf,
  CallResult,
  TransactionManager,
  TransactionReceipt,
  Event,
  TransactionParams,
} from '@castframework/transaction-manager';
import { Observable } from 'rxjs';
import { SmartContract } from './SmartContract';

export type CreateForgeEMTNParams = {
  currency: string;
  initialSupply: number;
  isinCode: string;
  name: string;
  owner: string;
  registrar: string;
  registryAddress: string;
  settler: string;
  symbol: string;
};

export const FORGEEMTNFACTORY_CONTRACT_EVENT_ALL_EVENTS = 'allEvents';

export const FORGEEMTNFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED =
  'InstrumentListed';
export type ForgeEmtnFactoryInstrumentListedPayload = {
  _instrumentAddress: string;
};
export type ForgeEmtnFactoryInstrumentListedEvent = Event<
  typeof FORGEEMTNFACTORY_CONTRACT_EVENT_INSTRUMENT_LISTED,
  ForgeEmtnFactoryInstrumentListedPayload
>;

export type ForgeEmtnFactoryAllEvents = ForgeEmtnFactoryInstrumentListedEvent;

export type ForgeEmtnFactoryInstrumentCreated = unknown;
export type ForgeEmtnFactoryGetInstrumentRegistryReturnType = string;

export class ForgeEmtnFactory<
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

  public async createForgeEmtn(
    createForgeEmtnParams: CreateForgeEMTNParams,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[CreateForgeEMTNParams]>(
      'createForgeEmtn',
      [createForgeEmtnParams],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public async getInstrumentRegistry(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<ForgeEmtnFactoryGetInstrumentRegistryReturnType>> {
    return this._call<never[], ForgeEmtnFactoryGetInstrumentRegistryReturnType>(
      'getInstrumentRegistry',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public InstrumentListed(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeEmtnFactoryInstrumentListedEvent> {
    return this._listen(
      'InstrumentListed',
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
  // ): Observable<ForgeEmtnFactoryInstrumentCreated> {
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
  ): Observable<ForgeEmtnFactoryAllEvents> {
    return this._listen(
      typeof FORGEEMTNFACTORY_CONTRACT_EVENT_ALL_EVENTS,
      listenBlockchainSpecificParams,
      from,
    );
  }
}
