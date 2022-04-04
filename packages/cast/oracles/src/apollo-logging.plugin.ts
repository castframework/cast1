import { getLogger, Logger } from './utils/logger';
import {
  ApolloServerPlugin,
  GraphQLServiceContext,
  GraphQLRequestContext,
  WithRequired,
  GraphQLResponse,
  GraphQLRequestListener,
  GraphQLRequestListenerParsingDidEnd,
  GraphQLRequestListenerValidationDidEnd,
  GraphQLRequestExecutionListener,
  GraphQLServerListener,
} from 'apollo-server-plugin-base';

class ApolloLoggingGraphQLRequestListener implements GraphQLRequestListener {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  private logger: Logger = getLogger(this.constructor.name);

  public parsingDidStart(
    requestContext: WithRequired<
      GraphQLRequestContext,
      'metrics' | 'source' | 'logger'
    >,
  ): Promise<GraphQLRequestListenerParsingDidEnd | void> {
    this.logger.debug(
      `parsingDidStart with request[${JSON.stringify(requestContext.request)}]`,
    );
    return new Promise((error) => {
      if (error) {
        this.logger.error(
          `Request parsing failed with error[${JSON.stringify(error)}]`,
        );
      }
    });
  }

  public validationDidStart(
    requestContext: WithRequired<
      GraphQLRequestContext,
      'metrics' | 'source' | 'document' | 'logger'
    >,
  ): Promise<GraphQLRequestListenerValidationDidEnd | void> {
    this.logger.debug(
      `validationDidStart with request[${JSON.stringify(
        requestContext.request,
      )}]`,
    );
    return new Promise((error) => {
      if (error) {
        this.logger.error(
          `Request validating failed with error[${JSON.stringify(error)}]`,
        );
      }
    });
  }
  public didResolveOperation(
    requestContext: WithRequired<
      GraphQLRequestContext,
      'metrics' | 'source' | 'document' | 'operationName' | 'operation'
    >,
  ): Promise<void> {
    this.logger.debug(
      `didResolveOperation with request[${JSON.stringify(
        requestContext.request,
      )}] operation[${JSON.stringify(requestContext.operation)}]`,
    );
    return Promise.resolve();
  }
  public didEncounterErrors(
    requestContext: WithRequired<
      GraphQLRequestContext,
      'metrics' | 'source' | 'errors' | 'logger'
    >,
  ): Promise<void> {
    this.logger.debug(
      `didEncounterErrors with request[${JSON.stringify(
        requestContext.request,
      )}] errors[${JSON.stringify(requestContext.errors)}]`,
    );
    return Promise.resolve();
  }
  public responseForOperation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    requestContext: WithRequired<
      GraphQLRequestContext,
      | 'metrics'
      | 'source'
      | 'document'
      | 'operationName'
      | 'operation'
      | 'logger'
    >,
  ): Promise<GraphQLResponse | null> {
    return Promise.resolve(null);
  }
  public executionDidStart(
    requestContext: WithRequired<
      GraphQLRequestContext,
      | 'metrics'
      | 'source'
      | 'document'
      | 'operationName'
      | 'operation'
      | 'logger'
    >,
  ): Promise<GraphQLRequestExecutionListener | void> {
    this.logger.debug(
      `executionDidStart with request[${JSON.stringify(
        requestContext.request,
      )}]`,
    );
    return Promise.resolve();
  }
  public willSendResponse(
    requestContext: WithRequired<
      GraphQLRequestContext,
      'metrics' | 'response' | 'logger'
    >,
  ): Promise<void> {
    this.logger.debug(
      `willSendResponse with request[${JSON.stringify(
        requestContext.request,
      )}] response[${JSON.stringify(requestContext.response)}]`,
    );
    return Promise.resolve();
  }
}

export class ApolloLoggingPlugin implements ApolloServerPlugin {
  private logger: Logger = getLogger(this.constructor.name);
  public serverWillStart(
    service: GraphQLServiceContext,
  ): Promise<GraphQLServerListener | void> {
    this.logger.debug(
      `Apollo server starting with context[${JSON.stringify(service)}]`,
    );
    return Promise.resolve();
  }
  public requestDidStart(
    requestContext: GraphQLRequestContext,
  ): Promise<GraphQLRequestListener | void> {
    this.logger.debug(
      `requestDidStart with request[${JSON.stringify(requestContext.request)}]`,
    );
    return Promise.resolve(new ApolloLoggingGraphQLRequestListener());
  }
}
