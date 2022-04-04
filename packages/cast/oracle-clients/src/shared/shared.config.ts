import { Property } from 'ts-convict';

export class EthConfig {
  @Property({
    default: null,
    env: 'ETH_PRIVATE_KEY',
    format: String,
  })
  public privateKey: string;
}

export class TzConfig {
  @Property({
    default: null,
    env: 'TZ_PRIVATE_KEY',
    format: String,
  })
  public privateKey: string;
}

export class SharedConfig {
  @Property({
    default: 6660,
    env: 'PORT',
    format: 'port',
  })
  public port: number;

  @Property(EthConfig)
  public ethConfig: EthConfig;

  @Property(TzConfig)
  public tzConfig: TzConfig;

  @Property({
    default: 500000,
    env: 'EXP_TIME',
    format: Number,
  })
  public expirationTime: number;
}
