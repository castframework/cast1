import { getLogger, Logger } from '../../utils/logger';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Ledger,
  CreateOracleSettlementTransactionInput,
  STRSettlementTransaction,
} from '@castframework/models';
import { AuthClaimService } from '../../shared/services/authClaim.service';
import {
  CreateSettlementTransaction,
  CreateSettlementTransactionMutation,
  CreateSettlementTransactionMutationVariables,
  GetLedgerForPaymentReference,
  GetLedgerForPaymentReferenceQuery,
  GetLedgerForPaymentReferenceQueryVariables,
  GetLedgerForTransaction,
  GetLedgerForTransactionQuery,
  GetLedgerForTransactionQueryVariables,
  GetSettlementTransaction,
  GetSettlementTransactionByTimeFrame,
  GetSettlementTransactionByTimeFrameQuery,
  GetSettlementTransactionByTimeFrameQueryVariables,
  GetSettlementTransactionQuery,
  GetSettlementTransactionQueryVariables,
  GetSettlementTransactionsByInstrumentAddress,
  GetSettlementTransactionsByPaymentReference,
  GetSettlementTransactionsByPaymentReferenceQuery,
  GetSettlementTransactionsByPaymentReferenceQueryVariables,
  GetSettlementTransactionsByInstrumentAddressQuery,
  GetSettlementTransactionsByInstrumentAddressQueryVariables,
} from './generated/graphql';
import { ApolloClient, QueryOptions } from '@apollo/client/core';
import { StrClientConfig } from './strClient.config';
import { asyncForEach } from '../../utils/promiseUtils';
import {
  extractGraphqlErrorMessageFromApolloError,
  getApolloClientWithoutSubscription,
  getSchema,
} from '../../shared/utils/oracleUtils';
import * as generatedSchema from './generated/schema.json';
import { mutateWithAuth, query } from '../../shared/utils/graphQLUtils';

@Injectable()
export class StrClientService implements OnModuleDestroy {
  private apolloClient: ApolloClient<any>;
  private graphQlEndpoint: string;
  private logger: Logger = getLogger(this.constructor.name);
  private clientName = 'str';

  public constructor(
    private readonly strClientConfig: StrClientConfig,
    private readonly authClaimService: AuthClaimService,
  ) {
    const schema = getSchema(generatedSchema);
    const client = getApolloClientWithoutSubscription(
      {
        graphQlEndpoint: this.strClientConfig.strGraphQLEndpoint,
      },
      schema,
      this.clientName + '-client',
    );

    this.graphQlEndpoint = this.strClientConfig.strGraphQLEndpoint;
    this.apolloClient = client;
  }

  public async createSettlementTransactions(
    settlementTransactionInputs: CreateOracleSettlementTransactionInput[],
  ): Promise<STRSettlementTransaction[]> {
    const settlementTransactions = await asyncForEach(
      settlementTransactionInputs,
      async (input) => this.createSettlementTransaction(input),
    );

    this.logger.debug(
      `All settlementTransactions returned by str: ${JSON.stringify(
        settlementTransactions,
      )}`,
    );
    return settlementTransactions;
  }

  public async createSettlementTransaction(
    settlementTransactionInput: CreateOracleSettlementTransactionInput,
  ): Promise<STRSettlementTransaction> {
    const claim = this.authClaimService.getClaim(
      settlementTransactionInput.instrumentLedger,
      this.graphQlEndpoint,
    );
    const result = await mutateWithAuth<
      CreateSettlementTransactionMutation,
      CreateSettlementTransactionMutationVariables
    >(
      {
        mutation: CreateSettlementTransaction,
        variables: {
          settlementTransaction: settlementTransactionInput,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      claim,
      this,
    );

    this.logger.debug(`Response from str: ${JSON.stringify(result)}`);

    if (!!result.errors) {
      this.logger.error(
        `Errors returned in createSettlementTransaction mutation ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error('Error when saving settlement transactions in str');
    }

    if (!result.data || !result.data.createSettlementTransaction) {
      this.logger.error(
        `No data in str response to createSettlementTransaction mutation ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error(
        'No data returned when saving settlement transactions in str',
      );
    }

    this.logger.debug(
      `Return createSettlementTransaction: ${JSON.stringify(
        result.data.createSettlementTransaction,
      )}`,
    );

    return result.data.createSettlementTransaction as STRSettlementTransaction;
  }

  public async getSettlementTransaction(
    id: string,
  ): Promise<STRSettlementTransaction | null> {
    this.logger.debug(
      `getSettlementTransaction - get settlement transaction with id[${id}] from STR`,
    );

    const ledger = await this.getLedgerForTransaction(id);
    if (!ledger) {
      this.logger.debug(
        `getSettlementTransaction - the STR doesn't know this transactionId[${id}]`,
      );
      return null;
    }
    const result = await query<
      GetSettlementTransactionQuery,
      GetSettlementTransactionQueryVariables
    >(
      this.addAuth(
        {
          query: GetSettlementTransaction,
          variables: { id },
        },
        ledger,
      ),
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    this.logger.debug(
      `getSettlementTransaction - Response from str: ${JSON.stringify(result)}`,
    );

    if (!!result.errors) {
      this.logger.error(
        `Errors returned in getSettlementTransaction mutation ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error('Error when getting settlement transaction from str');
    }

    if (!result.data) {
      this.logger.error(
        `No data in str response getSettlementTransaction mutation ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error(
        'No data returned when getting settlement transaction in str',
      );
    }

    this.logger.debug(
      `Return getSettlementTransaction: ${JSON.stringify(
        result.data.getSettlementTransaction,
      )}`,
    );

    return result.data.getSettlementTransaction as STRSettlementTransaction;
  }

  public async getSettlementTransactions(
    ledgers: Ledger[],
    instrumentAddress?: string,
  ): Promise<STRSettlementTransaction[]> {
    const settlementTransactionsFromAllLedgers = await Promise.all(
      ledgers.map((ledger) =>
        this.getSettlementTransactionsFromLedger(ledger, instrumentAddress),
      ),
    );
    return settlementTransactionsFromAllLedgers.flat();
  }

  public async getSettlementTransactionsFromLedger(
    ledger: Ledger,
    instrumentAddress?: string,
  ): Promise<STRSettlementTransaction[]> {
    this.logger.debug(
      `getSettlementTransactionsFromLedger - get settlement transactions from STR - instrumentAddress: [${instrumentAddress}] - ledger: [${ledger}]`,
    );

    const result = await query<
      GetSettlementTransactionsByInstrumentAddressQuery,
      GetSettlementTransactionsByInstrumentAddressQueryVariables
    >(
      this.addAuth(
        {
          query: GetSettlementTransactionsByInstrumentAddress,
          variables: {
            instrumentAddress,
          },
        },
        ledger,
      ),
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    this.logger.debug(
      `getSettlementTransactionsFromLedger - Response from str: ${JSON.stringify(
        result,
      )}`,
    );

    if (!!result.errors) {
      this.logger.error(
        `Errors returned in getSettlementTransactions mutation ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error('Error when getting settlement transactions from str');
    }

    if (!result.data || !result.data.getSettlementTransactions) {
      this.logger.error(
        `No data in str response getSettlementTransacitons mutation ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error(
        'No data returned when getting settlement transactions in str',
      );
    }

    this.logger.debug(
      `Return getSettlementTransactionsFromLedger: ${JSON.stringify(
        result.data.getSettlementTransactions,
      )}`,
    );

    return result.data.getSettlementTransactions as STRSettlementTransaction[];
  }

  public async getSettlementTransactionByTimeFrame(
    ledger: Ledger,
    begin: Date,
    end: Date,
  ): Promise<STRSettlementTransaction[]> {
    this.logger.debug(
      `getSettlementTransactionByTimeFrame - get settlement transactions between begin[${begin.toLocaleString()}] and end[${end.toLocaleString()}] time frame from STR`,
    );

    const result = await query<
      GetSettlementTransactionByTimeFrameQuery,
      GetSettlementTransactionByTimeFrameQueryVariables
    >(
      this.addAuth(
        {
          query: GetSettlementTransactionByTimeFrame,
          variables: { begin, end },
        },
        ledger,
      ),
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );

    this.logger.debug(
      `getSettlementTransactionByTimeFrame - Response from str: ${JSON.stringify(
        result,
      )}`,
    );

    if (!!result.errors) {
      this.logger.error(
        `Errors returned in getSettlementTransactionByTimeFrame mutation ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error(
        `Error when getting settlement transactions between begin[${begin.toLocaleString()}] and end[${end.toLocaleString()}] time frame from STR`,
      );
    }

    if (!result.data || !result.data.getSettlementTransactionByTimeFrame) {
      this.logger.error(
        `No data in str response getSettlementTransactionByTimeFrame mutation ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error(
        `No data returned when getting settlement transactions between begin[${begin.toLocaleString()}] and end[${end.toLocaleString()}] time frame from STR`,
      );
    }

    this.logger.debug(
      `Return getSettlementTransactionByTimeFrame: ${JSON.stringify(
        result.data.getSettlementTransactionByTimeFrame,
      )}`,
    );

    return result.data
      .getSettlementTransactionByTimeFrame as STRSettlementTransaction[];
  }

  public async getSettlementTransactionsByPaymentReference(
    paymentReference: string,
  ): Promise<STRSettlementTransaction[] | null> {
    this.logger.debug(
      `getSettlementTransactionsByPaymentReference - get settlement transactions from STR with paymentReference[${paymentReference}]`,
    );
    const ledger = await this.getLedgerForPaymentReference(paymentReference);
    if (!ledger) {
      this.logger.debug(
        `getSettlementTransaction - the STR doesn't know this paymentReference[${paymentReference}]`,
      );
      return null;
    }

    const result = await query<
      GetSettlementTransactionsByPaymentReferenceQuery,
      GetSettlementTransactionsByPaymentReferenceQueryVariables
    >(
      this.addAuth(
        {
          query: GetSettlementTransactionsByPaymentReference,
          variables: {
            paymentReference,
          },
        },
        ledger,
      ),
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );
    this.logger.debug(
      `getSettlementTransactionsByPaymentReference - Response from str: ${JSON.stringify(
        result,
      )}`,
    );
    if (!!result.errors) {
      this.logger.error(
        `Errors returned in getSettlementTransactionsByPaymentReference query ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error('Error when getting settlement transactions from str');
    }
    if (
      !result.data ||
      !result.data.getSettlementTransactionsByPaymentReference
    ) {
      this.logger.error(
        `No data in str response getSettlementTransactionsByPaymentReference query ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error(
        'No data returned when getting settlement transactions in str',
      );
    }
    this.logger.debug(
      `Return getSettlementTransactionsByPaymentReference: ${JSON.stringify(
        result.data.getSettlementTransactionsByPaymentReference,
      )}`,
    );
    return result.data
      .getSettlementTransactionsByPaymentReference as STRSettlementTransaction[];
  }

  public async getLedgerForTransaction(
    settlementTransactionId: string,
  ): Promise<Ledger> {
    this.logger.debug(
      `getLedgerForTransaction - get ledger from STR with settlementTransactionId[${settlementTransactionId}]`,
    );

    const result = await query<
      GetLedgerForTransactionQuery,
      GetLedgerForTransactionQueryVariables
    >(
      {
        query: GetLedgerForTransaction,
        variables: {
          transactionId: settlementTransactionId,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );
    this.logger.debug(
      `getLedgerForTransaction - Response from str: ${JSON.stringify(result)}`,
    );
    if (!!result.errors) {
      this.logger.error(
        `Errors returned in getLedgerForTransaction query ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error('Error when getting ledger from str');
    }
    if (
      result.data === undefined ||
      result.data.getLedgerForTransaction === undefined
    ) {
      this.logger.error(
        `No data in str response getLedgerForTransaction query ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error('No data returned when getting ledger in str');
    }
    this.logger.debug(
      `Return getLedgerForTransaction: ${JSON.stringify(
        result.data.getLedgerForTransaction,
      )}`,
    );
    return result.data.getLedgerForTransaction as Ledger;
  }

  public async getLedgerForPaymentReference(
    paymentReference: string,
  ): Promise<Ledger> {
    this.logger.debug(
      `getLedgerForPaymentReference - get ledger from STR with paymentReference[${paymentReference}]`,
    );

    const result = await query<
      GetLedgerForPaymentReferenceQuery,
      GetLedgerForPaymentReferenceQueryVariables
    >(
      {
        query: GetLedgerForPaymentReference,
        variables: {
          paymentReference,
        },
      },
      this.apolloClient,
      this.graphQlErrorForwarder,
      this.logger,
      this.clientName,
      this,
    );
    this.logger.debug(
      `getLedgerForPaymentReference - Response from str: ${JSON.stringify(
        result,
      )}`,
    );
    if (!!result.errors) {
      this.logger.error(
        `Errors returned in getLedgerForPaymentReference query ${JSON.stringify(
          result.errors,
        )}`,
      );
      throw new Error('Error when getting ledger from str');
    }
    if (
      result.data === undefined ||
      result.data.getLedgerForPaymentReference === undefined
    ) {
      this.logger.error(
        `No data in str response getLedgerForPaymentReference query ${JSON.stringify(
          result,
        )}`,
      );
      throw new Error('No data returned when getting ledger in str');
    }
    this.logger.debug(
      `Return getLedgerForPaymentReference: ${JSON.stringify(
        result.data.getLedgerForPaymentReference,
      )}`,
    );
    return result.data.getLedgerForPaymentReference as Ledger;
  }

  private addAuth<TVariables>(
    query: QueryOptions<TVariables>,
    instrumentLedger: Ledger,
  ): QueryOptions<TVariables> {
    const claim = this.authClaimService.getClaim(
      instrumentLedger,
      this.graphQlEndpoint,
    );
    return {
      ...query,
      context: {
        ...query.context,
        headers: {
          ...query.context?.headers,
          Authorization: `Bearer ${claim}`,
        },
      },
    };
  }

  private graphQlErrorForwarder(e: any): void {
    const error = extractGraphqlErrorMessageFromApolloError(e);
    throw new Error(error);
  }

  public onModuleDestroy(): void {
    this.logger.debug('Stopping STR client graphql service');
    this.apolloClient.stop();
  }
}
