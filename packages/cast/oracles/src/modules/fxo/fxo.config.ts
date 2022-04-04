import { Property } from 'ts-convict';

export class FxoConfig {
  @Property({
    default: null,
    env: 'STR_GQL_URL',
    format: String,
  })
  public strGraphQLEndpoint: string;

  @Property({
    default: 10000,
    env: 'HEARTBEAT_INTERVAL_MS',
    format: Number,
  })
  public heartbeatInterval: number;
}
