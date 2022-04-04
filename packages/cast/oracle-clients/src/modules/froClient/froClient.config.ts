import { Property } from 'ts-convict';

export class FroClientConfig {
  @Property({
    default: null,
    env: 'API_FRO_GQL_EP',
    format: String,
  })
  public froGraphQLEndpoint: string;

  @Property({
    default: 100,
    env: 'HEARTBEAT_LOG_PERIOD',
    format: Number,
    doc: 'Example: 5 means it will log 1 every 5 heartbeat',
  })
  public heartbeatLogPeriod: number;
}
