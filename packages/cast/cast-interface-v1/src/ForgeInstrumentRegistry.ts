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

type getAllFactoryTypesReturnType = string[];
type factoriesReturnType = string;
type getInstrumentByNameReturnType = string;
type getInstrumentByIsinCodeReturnType = string;
type getAllInstrumentsReturnType = string[];
type isFactoryAuthorizedReturnType = boolean;

type AllEvents = never;

export class ForgeInstrumentRegistry<
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

  public async getAllFactoryTypes(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<getAllFactoryTypesReturnType>> {
    return this._call<[], getAllFactoryTypesReturnType>(
      'getAllFactoryTypes',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async getFactory(
    factoryType: string,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<factoriesReturnType>> {
    return this._call<[string], factoriesReturnType>(
      'getFactory',
      [factoryType],
      transactionBlockchainSpecificParams,
    );
  }

  public async getInstrumentByName(
    name: string,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<getInstrumentByNameReturnType>> {
    return this._call<[string], getInstrumentByNameReturnType>(
      'getInstrumentByName',
      [name],
      transactionBlockchainSpecificParams,
    );
  }

  public async getInstrumentByIsinCode(
    isinCode: string,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<getInstrumentByIsinCodeReturnType>> {
    return this._call<[string], getInstrumentByIsinCodeReturnType>(
      'getInstrumentByIsinCode',
      [isinCode],
      transactionBlockchainSpecificParams,
    );
  }

  public async getAllInstruments(
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<getAllInstrumentsReturnType>> {
    return this._call<never[], getAllInstrumentsReturnType>(
      'getAllInstruments',
      [],
      transactionBlockchainSpecificParams,
    );
  }

  public async isFactoryAuthorized(
    factoryAddress: string,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<isFactoryAuthorizedReturnType>> {
    return this._call<[string], isFactoryAuthorizedReturnType>(
      'isFactoryAuthorized',
      [factoryAddress],
      transactionBlockchainSpecificParams,
    );
  }

  public async listInstrument(
    name: string,
    isinCode: string,
    instrumentAddress: string,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[string, string, string]>(
      'listInstrument',
      [name, isinCode, instrumentAddress],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public async unlistInstrument(
    isinCode: string,
    transactionParams?: TransactionParams,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<TransactionReceipt> {
    return this._send<[string]>(
      'unlistInstrument',
      [isinCode],
      transactionParams,
      transactionBlockchainSpecificParams,
    );
  }

  public allEvents(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<Event<AllEvents>> {
    return this._listen('allEvents', listenBlockchainSpecificParams, from);
  }
}
