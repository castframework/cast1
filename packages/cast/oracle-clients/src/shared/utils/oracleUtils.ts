import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  split,
} from '@apollo/client/core';
import fetch from 'isomorphic-fetch';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import * as ws from 'ws';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from 'apollo-utilities';
import { withScalars } from 'apollo-link-scalars';
import { typesMap } from '@castframework/models';
import { buildClientSchema, GraphQLSchema, IntrospectionQuery } from 'graphql';

export type ApolloClientParams = {
  graphQlEndpoint: string;
  graphQlSubscriptionEndpoint: string;
};

export type ApolloClientWithoutSubscriptionParams = {
  graphQlEndpoint: string;
};

export const getApolloClient = (
  params: ApolloClientParams,
  schema: GraphQLSchema,
  clientName: string,
): [ApolloClient<any>, SubscriptionClient] => {
  const cache = new InMemoryCache({
    addTypename: false,
  });

  const httpLink = new HttpLink({
    uri: params.graphQlEndpoint,
    fetch,
  });

  const subscriptionClient = new SubscriptionClient(
    params.graphQlSubscriptionEndpoint,
    {
      reconnect: true,
      connectionParams: { clientName },
    },
    ws,
  );

  const subLink = new WebSocketLink(subscriptionClient);

  const splitLink = split(
    // split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    subLink,
    httpLink,
  );

  const link = ApolloLink.from([
    withScalars({
      schema,
      typesMap,
    }),
    splitLink,
  ]);

  const client = new ApolloClient({
    // Provide required constructor fields
    cache: cache,
    link: link,

    // Provide some optional constructor fields
    name: clientName,
    queryDeduplication: false,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  });

  return [client, subscriptionClient];
};

export const getApolloClientWithoutSubscription = (
  params: ApolloClientWithoutSubscriptionParams,
  schema: GraphQLSchema,
  clientName: string,
): ApolloClient<any> => {
  const cache = new InMemoryCache({
    addTypename: false,
  });

  const httpLink = new HttpLink({
    uri: params.graphQlEndpoint,
    fetch,
  });

  const link = ApolloLink.from([
    withScalars({
      schema,
      typesMap,
    }),
    httpLink,
  ]);

  const client = new ApolloClient({
    // Provide required constructor fields
    cache: cache,
    link: link,

    // Provide some optional constructor fields
    name: clientName,
    queryDeduplication: false,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'no-cache',
      },
      query: {
        fetchPolicy: 'no-cache',
      },
    },
  });

  return client;
};

export const getSchema = (introspectionResult: unknown): GraphQLSchema =>
  buildClientSchema(introspectionResult as unknown as IntrospectionQuery);

export function extractGraphqlErrorMessageFromApolloError(ne: any): string {
  try {
    if (ne.networkError && ne.networkError.name === 'ServerError') {
      const errors = ne.networkError.result.errors;

      return errors.reduce(
        (acc: string, e: any) => `${acc}\n\t${e.message}`,
        'GraphQL Server Error :',
      );
    }

    return `Networking Error : ${JSON.stringify(ne)}`;
  } catch {
    return 'Unknown Error while retrieving graphql error';
  }
}
