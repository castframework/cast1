/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  ApolloClient,
  ApolloQueryResult,
  FetchResult,
  MutationOptions,
  OperationVariables,
  QueryOptions,
  Observable as ApolloObservable,
  SubscriptionOptions,
} from '@apollo/client/core';
import { buildClientSchema, GraphQLSchema, IntrospectionQuery } from 'graphql';
import { Logger } from '../../utils/logger';

export const getSchema = (introspectionResult: unknown): GraphQLSchema =>
  buildClientSchema(introspectionResult as unknown as IntrospectionQuery);

export function mutate<T = any, TVariables = OperationVariables>(
  mutation: MutationOptions<T, TVariables>,
  apolloClient: ApolloClient<any>,
  graphQlErrorForwarder: any,
  logger: Logger,
  oracleName: string,
  _this: any,
): Promise<FetchResult<T>> {
  logger.trace(
    `Send graphql mutation to ${oracleName} : ${JSON.stringify(mutation)}`,
  );
  return apolloClient
    .mutate<T, TVariables>(mutation)
    .catch(graphQlErrorForwarder.bind(_this));
}

export function mutateWithAuth<T = any, TVariables = OperationVariables>(
  mutation: MutationOptions<T, TVariables>,
  apolloClient: ApolloClient<any>,
  graphQlErrorForwarder: any,
  logger: Logger,
  oracleName: string,
  claim: string,
  _this: any,
): Promise<FetchResult<T>> {
  const mutationWithAuth = {
    ...mutation,
    context: {
      ...mutation.context,
      headers: {
        ...mutation.context?.headers,
        Authorization: `Bearer ${claim}`,
      },
    },
  };
  logger.trace(
    `Send graphql mutation to ${oracleName} : ${JSON.stringify(
      mutationWithAuth,
    )}`,
  );
  return apolloClient
    .mutate<T, TVariables>(mutationWithAuth)
    .catch(graphQlErrorForwarder.bind(_this));
}

export function query<T = any, TVariables = OperationVariables>(
  query: QueryOptions<TVariables>,
  apolloClient: ApolloClient<any>,
  graphQlErrorForwarder: any,
  logger: Logger,
  oracleName: string,
  _this: any,
): Promise<ApolloQueryResult<T>> {
  logger.trace(
    `Send graphql query to ${oracleName} : ${JSON.stringify(query)}`,
  );

  return apolloClient
    .query<T, TVariables>(query)
    .catch(graphQlErrorForwarder.bind(_this));
}

export function subscribe<T = any, TVariables = OperationVariables>(
  subscription: SubscriptionOptions<TVariables>,
  apolloClient: ApolloClient<any>,
  logger: Logger,
  oracleName: string,
): ApolloObservable<FetchResult<T>> {
  logger.trace(
    `Send graphql subscription to ${oracleName} : ${JSON.stringify(
      subscription,
    )}`,
  );

  return apolloClient.subscribe<T, TVariables>(subscription);
}
