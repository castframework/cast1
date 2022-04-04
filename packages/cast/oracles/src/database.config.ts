import { Property } from 'ts-convict';

export class DatabaseConfig {
  @Property({
    default: null,
    env: 'POSTGRES_HOST',
    format: String,
  })
  public host: string;

  @Property({
    default: null,
    env: 'POSTGRES_PORT',
    format: 'port',
  })
  public port: number;

  @Property({
    default: null,
    env: 'POSTGRES_USER',
    format: String,
  })
  public user: string;

  @Property({
    default: null,
    env: 'POSTGRES_PASSWORD',
    format: String,
  })
  public password: string;

  @Property({
    default: null,
    env: 'POSTGRES_DATABASE',
    format: String,
  })
  public database: string;

  @Property({
    default: false,
    env: 'POSTGRES_SSL',
    format: Boolean,
  })
  public ssl: boolean;
}
