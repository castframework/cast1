import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { getLogger, Logger } from '../../utils/logger';
import { SharedConfig } from '../shared.config';
import {
  ForgeBond,
  ForgeBondFactory,
  ForgeContractType,
  ForgeEmtnFactory,
  ForgeInstrumentRegistry,
  ForgeInstrumentRegistryViewMappers,
  ForgeTokenEventMappers,
  ForgeTokenFactoryEventMappers,
  ForgeTokenFactoryViewMappers,
  ForgeTokenViewMappers,
  getAbi,
} from '@castframework/cast-interface-v1';
import {
  BlockchainDriver,
  BlockchainSpecificParamsOf,
  BlockchainSpecificTransactionInfoOf,
  BlockInfo,
  CancelReceipt,
  TransactionInfo,
  TransactionManager,
  TransactionReceipt,
} from '@castframework/transaction-manager';
import {
  EthereumBlockchainDriver,
  PrivateKeySigner,
} from '@castframework/blockchain-driver-eth';
import {
  PrivateKeySigner as TezosPrivateKeySigner,
  TezosBlockchainDriver,
} from '@castframework/blockchain-driver-tz';
import { Ledger } from '@castframework/models';

export type DriverOf<SpecificLedger extends Ledger> =
  SpecificLedger extends Ledger.ETHEREUM
    ? EthereumBlockchainDriver
    : SpecificLedger extends Ledger.TEZOS
    ? TezosBlockchainDriver
    : never;

@Injectable()
export class BlockchainService implements OnModuleDestroy {
  private logger: Logger = getLogger(this.constructor.name);

  private readonly transactionManagers = new Map<
    Ledger,
    TransactionManager<BlockchainDriver<unknown, unknown>>
  >();
  private readonly registriesAdresses = new Map<Ledger, string>();

  public constructor(public readonly sharedConfig: SharedConfig) {
    this.registerEth();
    this.registerTz();
  }

  private registerEth(): void {
    const logger = getLogger(this.constructor.name, 'registerEth');
    const nodeURL = this.sharedConfig.ethConfig.blockchainProvideLocation;

    logger.debug(`Using ethereum provider: ${nodeURL}`);

    if (nodeURL === '' || nodeURL === undefined) {
      logger.warn(
        'No provider location provided for ETHEREUM. No action will be possible on ETHEREUM blockchain',
      );
    } else {
      const driver = new EthereumBlockchainDriver({
        config: {
          numberOfConfirmation:
            this.sharedConfig.ethConfig.numberOfConfirmation,
          eventDelayInBlocks: this.sharedConfig.ethConfig.eventDelayInBlocks,
          keepAliveIntervalInSeconds:
            this.sharedConfig.ethConfig.keepAliveIntervalInSeconds,
          // txRetryInitialIntervalInMs: this.sharedConfig.ethConfig
          //   .txRetryInitialIntervalInMs,
          // txRetryMaxIntervalInMs: this.sharedConfig.ethConfig
          //   .txRetryMaxIntervalInMs,
          // txRetryMaxRetries: this.sharedConfig.ethConfig.txRetryMaxRetries,
          minGasPriceInGWei: this.sharedConfig.ethConfig.minGasPriceInGWei,
          maxGasPriceInGWei: this.sharedConfig.ethConfig.maxGasPriceInGWei,
          gasPriceFactor: this.sharedConfig.ethConfig.gasPriceFactor,
          routineCallLoggingPeriod: this.sharedConfig.routineCallLoggingPeriod,
        },
        signer: new PrivateKeySigner(this.sharedConfig.ethConfig.privateKey),
        nodeURL,
      });

      this.transactionManagers.set(
        Ledger.ETHEREUM,
        new TransactionManager({
          logger: getLogger('TransactionManagerEth'),
          driver: driver,
        }),
      );

      this.registriesAdresses.set(
        Ledger.ETHEREUM,
        this.sharedConfig.ethConfig.registryAddress,
      );
    }
  }

  private registerTz(): void {
    const logger = getLogger(this.constructor.name, 'registerTz');
    const nodeURL = this.sharedConfig.tzConfig.blockchainProvideLocation;

    logger.debug(`Using tezos provider: ${nodeURL}`);

    if (nodeURL === '' || nodeURL === undefined) {
      logger.warn(
        'No provider location provided for tezos. No action will be possible on tezos blockchain',
      );
    } else {
      const driver = new TezosBlockchainDriver({
        config: {
          pollingIntervalInSeconds:
            this.sharedConfig.tzConfig.pollingIntervalInSeconds,
          defaultConfirmationCount:
            this.sharedConfig.tzConfig.numberOfConfirmation,
          confirmationPollingTimeoutSecond: 3600,
          confirmationPollingIntervalSecond:
            this.sharedConfig.tzConfig.pollingIntervalInSeconds,
        },
        signer: new TezosPrivateKeySigner(
          this.sharedConfig.tzConfig.privateKey,
        ),
        nodeURL,
      });

      this.transactionManagers.set(
        Ledger.TEZOS,
        new TransactionManager({
          logger: getLogger('TransactionManagerTz'),
          driver: driver,
        }),
      );

      this.registriesAdresses.set(
        Ledger.TEZOS,
        this.sharedConfig.tzConfig.factoryAddress,
      );
    }
  }

  public async doesRegistryHaveFactories(
    ledger: Ledger,
    logger: Logger,
  ): Promise<boolean> {
    logger.debug(
      `doesRegistryHaveFactories for Ledger: ${JSON.stringify(
        ledger,
      )} with registry address: ${this.registriesAdresses.get(ledger)}`,
    );
    const instrumentRegistry = await this.getRegistryFromLedger(ledger, logger);

    const registryFactories = await instrumentRegistry.getAllFactoryTypes();

    logger.info(
      `Registry have ${
        registryFactories.length
      } factories. (${registryFactories.join(', ')})`,
    );
    if (registryFactories.length === 0) {
      return false;
    }
    return true;
  }

  public get supportedLedgers(): Ledger[] {
    return Array.from(this.transactionManagers.keys());
  }

  public async getCurrentBlockInfo(ledger: Ledger): Promise<BlockInfo> {
    const transactionManager = this.transactionManagers.get(ledger);

    if (transactionManager === undefined) {
      throw new Error(`No transaction manager found for ledger ${ledger}`);
    }

    return await transactionManager.getLastBlock();
  }

  public async waitForConfirmation<SpecificLedger extends Ledger>(
    ledger: SpecificLedger,
    transactionId: string,
  ): Promise<void> {
    const transactionManager = this.transactionManagers.get(
      ledger,
    ) as TransactionManager<DriverOf<SpecificLedger>>;

    if (transactionManager === undefined) {
      throw new Error(`No transaction manager found for ledger ${ledger}`);
    }
    return transactionManager.waitForConfirmation(transactionId);
  }

  public async getTransactionInfo<SpecificLedger extends Ledger>(
    ledger: SpecificLedger,
    transactionId: string,
  ): Promise<
    TransactionInfo<
      BlockchainSpecificTransactionInfoOf<DriverOf<SpecificLedger>>,
      BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>
    >
  > {
    const transactionManager = this.transactionManagers.get(
      ledger,
    ) as TransactionManager<DriverOf<SpecificLedger>>;

    if (transactionManager === undefined) {
      throw new Error(`No transaction manager found for ledger ${ledger}`);
    }

    return await transactionManager.getTransactionInfo(transactionId);
  }

  public async boostTransaction<SpecificLedger extends Ledger>(
    ledger: SpecificLedger,
    transactionId: string,
    blockchainSpecificParams?: BlockchainSpecificParamsOf<
      DriverOf<SpecificLedger>
    >,
  ): Promise<TransactionReceipt> {
    const transactionManager = this.transactionManagers.get(
      ledger,
    ) as TransactionManager<DriverOf<SpecificLedger>>;

    if (transactionManager === undefined) {
      throw new Error(`No transaction manager found for ledger ${ledger}`);
    }

    return await transactionManager.boostTransaction(
      transactionId,
      blockchainSpecificParams,
    );
  }

  public async cancelTransaction<SpecificLedger extends Ledger>(
    ledger: SpecificLedger,
    transactionId: string,
    blockchainSpecificParams?: BlockchainSpecificParamsOf<
      DriverOf<SpecificLedger>
    >,
  ): Promise<CancelReceipt> {
    const transactionManager = this.transactionManagers.get(
      ledger,
    ) as TransactionManager<DriverOf<SpecificLedger>>;

    if (transactionManager === undefined) {
      throw new Error(`No transaction manager found for ledger ${ledger}`);
    }

    return await transactionManager.cancelTransaction(
      transactionId,
      blockchainSpecificParams,
    );
  }

  public async getRegistryFromLedger(
    ledger: Ledger,
    logger: Logger,
  ): Promise<ForgeInstrumentRegistry<DriverOf<Ledger>>> {
    logger.trace(`Retrieving registry for ledger [${ledger}]`);

    const registryAddress = this.getRegistryAddress(ledger);

    if (registryAddress === null || registryAddress === undefined) {
      throw new Error(`No registry address found for ledger ${ledger}`);
    }

    const registry = await this.getInstrumentRegistry(ledger, registryAddress);

    logger.debug(
      `Using instrument registry at ${registryAddress} for ${ledger}`,
    );

    return registry;
  }

  public async getFactoryFromLedger(
    ledger: Ledger,
    logger: Logger,
  ): Promise<ForgeInstrumentRegistry<DriverOf<Ledger>>> {
    logger.trace(`Retrieving factory for ledger [${ledger}]`);

    const registry = await this.getRegistryFromLedger(ledger, logger);

    const factoryAddress = await registry.getFactory('Bond');
    const registryAddress = this.getForgeBondFactory(ledger, factoryAddress);

    if (registryAddress === null || registryAddress === undefined) {
      throw new Error(`No registry address found for ledger ${ledger}`);
    }

    logger.debug(`Using instrument factory at ${factoryAddress} for ${ledger}`);

    return registry;
  }

  onModuleDestroy(): void {
    this.transactionManagers.forEach(async (transactionManager, key) => {
      this.logger.debug(`Closing connection for ${key}`);
      await transactionManager.close();
    });
  }

  public async getFactoryAddress(
    ledger: Ledger,
    factoryType: string,
  ): Promise<string> {
    const registry = await this.getRegistryFromLedger(ledger, this.logger);

    return await registry.getFactory(factoryType);
  }

  public getRegistryAddress(ledger: Ledger): string | undefined {
    return this.registriesAdresses.get(ledger);
  }

  async getInstrumentRegistry<SpecificLedger extends Ledger>(
    ledger: SpecificLedger,
    address: string,
  ): Promise<ForgeInstrumentRegistry<DriverOf<SpecificLedger>>> {
    const transactionManager = this.transactionManagers.get(ledger);

    if (transactionManager === undefined) {
      throw new Error(`No transaction manager found for ledger ${ledger}`);
    }

    let contractBlockchainSpecificParams: Partial<
      BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>
    > = {};

    switch (ledger) {
      case Ledger.ETHEREUM:
        contractBlockchainSpecificParams = {
          abi: getAbi(ForgeContractType.INSTRUMENT_REGISTRY),
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
      case Ledger.TEZOS:
        contractBlockchainSpecificParams = {
          viewMappers: ForgeInstrumentRegistryViewMappers,
          eventMappers: ForgeInstrumentRegistryViewMappers,
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
    }

    return new ForgeInstrumentRegistry(
      address,
      transactionManager,
      contractBlockchainSpecificParams,
    );
  }

  async getForgeBondFactory<SpecificLedger extends Ledger>(
    ledger: SpecificLedger,
    address: string,
  ): Promise<ForgeBondFactory<DriverOf<Ledger.ETHEREUM>>> {
    const transactionManager = this.transactionManagers.get(ledger);

    if (transactionManager === undefined) {
      throw new Error('No transaction manager found for this ledger');
    }

    let contractBlockchainSpecificParams: Partial<
      BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>
    > = {};

    switch (ledger) {
      case Ledger.ETHEREUM:
        contractBlockchainSpecificParams = {
          abi: getAbi(ForgeContractType.BOND_FACTORY),
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
      case Ledger.TEZOS:
        contractBlockchainSpecificParams = {
          viewMappers: ForgeTokenFactoryViewMappers,
          eventMappers: ForgeTokenFactoryEventMappers,
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
    }

    return new ForgeBondFactory(
      address,
      transactionManager,
      contractBlockchainSpecificParams,
    );
  }

  async getForgeEMTNFactory<SpecificLedger extends Ledger>(
    ledger: Ledger,
    address: string,
  ): Promise<ForgeEmtnFactory<DriverOf<SpecificLedger>>> {
    const transactionManager = this.transactionManagers.get(ledger);

    if (transactionManager === undefined) {
      throw new Error('No transaction manager found for this ledger');
    }

    let contractBlockchainSpecificParams: Partial<
      BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>
    > = {};

    switch (ledger) {
      case Ledger.ETHEREUM:
        contractBlockchainSpecificParams = {
          abi: getAbi(ForgeContractType.BOND_FACTORY),
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
      case Ledger.TEZOS:
        contractBlockchainSpecificParams = {
          viewMappers: ForgeTokenFactoryViewMappers,
          eventMappers: ForgeTokenFactoryEventMappers,
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
    }
    return new ForgeEmtnFactory(
      address,
      transactionManager,
      contractBlockchainSpecificParams,
    );
  }

  async getForgeBond<SpecificLedger extends Ledger>(
    ledger: Ledger,
    address: string,
  ): Promise<ForgeBond<DriverOf<SpecificLedger>>> {
    const transactionManager = this.transactionManagers.get(ledger);
    if (transactionManager === undefined) {
      throw new Error('No transaction manager found for this ledger');
    }

    let contractBlockchainSpecificParams: Partial<
      BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>
    > = {};

    switch (ledger) {
      case Ledger.ETHEREUM:
        contractBlockchainSpecificParams = {
          abi: getAbi(ForgeContractType.BOND),
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
      case Ledger.TEZOS:
        contractBlockchainSpecificParams = {
          viewMappers: ForgeTokenViewMappers,
          eventMappers: ForgeTokenEventMappers,
        } as BlockchainSpecificParamsOf<DriverOf<SpecificLedger>>;
        break;
    }
    return new ForgeBond(
      address,
      transactionManager,
      contractBlockchainSpecificParams,
    );
  }
}
