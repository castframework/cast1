import { Property } from 'ts-convict';

export class EthConfig {
  @Property({
    // Needed for API, set default to null if it is possible
    default: '',
    env: 'ETH_BLOCKCHAIN_PROVIDE_LOCATION',
    format: String,
  })
  public blockchainProvideLocation: string;

  @Property({
    default: null,
    env: 'ETH_PRIVATE_KEY',
    format: String,
  })
  public privateKey: string;

  // @Property({
  //   default: null,
  //   env: 'ETH_CHAIN_ID',
  //   format: String,
  // })
  // public chainId: string;

  @Property({
    default: null,
    env: 'ETH_REGISTRY_ADDRESS',
    format: String,
  })
  public registryAddress: string;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 1,
    env: 'ETH_NUMBER_OF_CONFIRMATION',
    format: Number,
  })
  public numberOfConfirmation: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 0,
    env: 'ETH_EVENT_DELAY_IN_BLOCKS',
    format: Number,
  })
  public eventDelayInBlocks: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 10,
    env: 'ETH_KEEPALIVE_INTERVAL_IN_SECONDS',
    format: Number,
  })
  public keepAliveIntervalInSeconds: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 1000,
    env: 'ETH_TX_RETRY_INITIAL_INTERVAL_IN_MS',
    format: Number,
  })
  public txRetryInitialIntervalInMs: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 60000,
    env: 'ETH_TX_RETRY_MAX_INTERVAL_IN_MS',
    format: Number,
  })
  public txRetryMaxIntervalInMs: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 10,
    env: 'ETH_TX_RETRY_MAX_RETRIES',
    format: Number,
  })
  public txRetryMaxRetries: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 100,
    env: 'ETH_MIN_GASPRICE_IN_GWEI',
    format: Number,
  })
  public minGasPriceInGWei: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 350,
    env: 'ETH_MAX_GASPRICE_IN_GWEI',
    format: Number,
  })
  public maxGasPriceInGWei: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 1.2,
    env: 'ETH_GASPRICE_FACTOR',
    format: Number,
  })
  public gasPriceFactor: number;
}

export class TzConfig {
  @Property({
    // Needed for API, set default to null if it is possible
    default: '',
    env: 'TZ_BLOCKCHAIN_PROVIDE_LOCATION',
    format: String,
  })
  public blockchainProvideLocation: string;

  @Property({
    default: null,
    env: 'TZ_PRIVATE_KEY',
    format: String,
  })
  public privateKey: string;

  @Property({
    default: null,
    env: 'TZ_REGISTRY_ADDRESS',
    format: String,
  })
  public factoryAddress: string;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 1,
    env: 'TZ_NUMBER_OF_CONFIRMATION',
    format: Number,
  })
  public numberOfConfirmation: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 0,
    env: 'TZ_EVENT_DELAY_IN_BLOCKS',
    format: Number,
  })
  public eventDelayInBlocks: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 5,
    env: 'TZ_POLLING_INTERVAL_IN_SECONDS',
    format: Number,
  })
  public pollingIntervalInSeconds: number;

  @Property({
    // Needed for API, set default to null if it is possible
    default: 5,
    env: 'TZ_CONTRACT_EVENTS_CHECK_INTERVAL_IN_SECONDS',
    format: Number,
  })
  public contractEventsCheckIntervalInSeconds: number;
}
export class SharedConfig {
  @Property({
    default: 6660,
    env: 'PORT',
    format: 'port',
  })
  public port: number;

  @Property({
    default: false,
    env: 'BLOCKCHAIN_USE_MOCK',
    format: Boolean,
  })
  public blockchainUseMock: boolean;

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

  @Property({
    default: '.',
    env: 'FILE_DIRECTORY',
    format: String,
  })
  public fileDirectory: string;

  @Property({
    default: 100,
    env: 'ROUTINE_CALL_LOG_PERIOD',
    format: Number,
    doc: 'Example: 5 means it will log 1 every 5 routine call',
  })
  public routineCallLoggingPeriod: number;
}
