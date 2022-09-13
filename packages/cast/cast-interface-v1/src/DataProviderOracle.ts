import {
  BlockchainDriver,
  BlockchainSpecificParamsOf,
  CallResult,
  TransactionManager,
  Event,
} from '@castframework/transaction-manager';
import { Observable } from 'rxjs';
import { SmartContract } from './SmartContract';

export const FORGEBOND_CONTRACT_EVENT_DATAREQUEST = 'DataRequest';
export type ForgeBondDataRequestPayload = {
  id: number;
};
export type ForgeBondDataRequestEvent = Event<
  typeof FORGEBOND_CONTRACT_EVENT_DATAREQUEST,
  ForgeBondDataRequestPayload
>;

export class DataProviderOracle<
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

  public SubmitRequest(
    from?: number,
    listenBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Observable<ForgeBondDataRequestEvent> {
    return this._listen(
      FORGEBOND_CONTRACT_EVENT_DATAREQUEST,
      listenBlockchainSpecificParams,
      from,
    );
  }

  public async WriteResult(
    jobId: number,
    result: number,
    decimals: number,
    timestamp: number,
    transactionBlockchainSpecificParams?: Partial<
      BlockchainSpecificParamsOf<Driver>
    >,
  ): Promise<CallResult<void>> {
    return this._call<number[], void>(
      'WriteResult',
      [jobId, result, decimals, timestamp],
      transactionBlockchainSpecificParams,
    );
  }
}
