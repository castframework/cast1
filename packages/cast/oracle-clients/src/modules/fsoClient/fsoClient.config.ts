import { Property } from 'ts-convict';

export class FsoClientConfig {
  @Property({
    default: null,
    env: 'FSO_GQL_URL',
    format: String,
  })
  public fsoGraphQLEndpoint: string;

  @Property({
    default: 100,
    env: 'HEARTBEAT_LOG_PERIOD',
    format: Number,
    doc: 'Example: 5 means it will log 1 every 5 heartbeat',
  })
  public heartbeatLogPeriod: number;
}
