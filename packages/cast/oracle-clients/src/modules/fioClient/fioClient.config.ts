import { Property } from 'ts-convict';

export class FioClientConfig {
  @Property({
    default: null,
    env: 'FIO_GQL_URL',
    format: String,
  })
  public fioGraphQLEndpoint: string;

  @Property({
    default: 100,
    env: 'HEARTBEAT_LOG_PERIOD',
    format: Number,
    doc: 'Example: 5 means it will log 1 every 5 heartbeat',
  })
  public heartbeatLogPeriod: number;
}
