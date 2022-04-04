import { Module, Global, HttpModule } from '@nestjs/common';
import { FileService } from './shared/services/file.service';
import { ForgePubSub } from './utils/PubSub.wrapper';
import { GqlModuleOptions, GraphQLModule } from '@nestjs/graphql';
import { getLogger } from './utils/logger';
import * as qs from 'qs';
import { typesMap } from '@castframework/models';
import { AuthClaimService } from './shared/services/authClaim.service';
import { ConfigModule } from './modules/config/config.module';
import { SharedConfig } from './shared/shared.config';
import { ShutdownService } from './shared/services/shutdown.service';
import { GraphqlConfig } from './graphql.config';
import { BlockchainService } from './shared/services/blockchain.service';

const providers = [
  ShutdownService,
  FileService,
  ForgePubSub,
  BlockchainService,
  AuthClaimService,
];

const imports = [
  HttpModule.register({
    timeout: 10000,
    maxRedirects: 5,
    paramsSerializer: (params) => qs.stringify(params),
  }),
  GraphQLModule.forRootAsync({
    imports: [ConfigModule.forConfig(GraphqlConfig)],
    useFactory: (graphqlConfig: GraphqlConfig): GqlModuleOptions => {
      const logger = getLogger('GraphQLModule');
      logger.debug(
        `Init GraphQLModule with introspection[${graphqlConfig.enableIntrospection}] debug[${graphqlConfig.enableDebug}] tracing[${graphqlConfig.enableTracing}] playground[${graphqlConfig.enablePlayground}]`,
      );
      return {
        // force instropection when playground is activated as this is required
        introspection:
          graphqlConfig.enableIntrospection || graphqlConfig.enablePlayground,
        debug: graphqlConfig.enableDebug,
        playground: graphqlConfig.enablePlayground,
        autoSchemaFile: true,
        installSubscriptionHandlers: true,
        resolvers: { ...typesMap },
        subscriptions: {
          'subscriptions-transport-ws': {
            keepAlive: 10000,
            onConnect: (connectionParams) => {
              logger.debug(
                `Client connected with connectionParams[${JSON.stringify(
                  connectionParams,
                )}]`,
              );
            },
            onDisconnect: () => {
              logger.debug(`Client disconnected.`);
            },
          },
        },
        context: ({ req }) => ({ req }),
        plugins: [],
        cors: {
          origin: [
            /localhost:[0-9]*$/,
            /forge.local$/,
            /sgforge.org$/,
            /sgforge.com$/,
            /sgforge.fr$/,
          ],
          methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
          preflightContinue: true,
          optionsSuccessStatus: 204,
          credentials: true,
        },
      };
    },
    inject: [GraphqlConfig],
  }),
];

@Global()
@Module({
  providers,
  imports: [...imports, ConfigModule.forConfig([SharedConfig])],
  exports: [...providers, ...imports],
})
export class SharedModule {}
