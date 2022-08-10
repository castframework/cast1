import { Property } from 'ts-convict';

export class DpoClientConfig {
  @Property({
    default: null,
    env: 'API_DPO_GQL_EP',
    format: String,
  })
  public dpoGraphQLEndpoint: string;

  @Property({
    default: 100,
    env: 'HEARTBEAT_LOG_PERIOD',
    format: Number,
    doc: 'Example: 5 means it will log 1 every 5 heartbeat',
  })
  public heartbeatLogPeriod: number;
}
