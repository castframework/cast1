import { getLogger } from '../../utils/logger';
import {
  buildCreateForgeBondArgs,
  buildCreateForgeEMTNArgs,
} from '../../ethUtils/methodArgsBuilders';
import { CreateBondInput, CreateEMTNInput } from '@castframework/models';
import { Injectable } from '@nestjs/common/';
import { ShutdownService } from '../../shared/services/shutdown.service';
import { errorAsString } from '../../utils/errorAsString';
import { BlockchainService } from '../../shared/services/blockchain.service';

import { AuthClaimService } from '../../shared/services/authClaim.service';
@Injectable()
export class FroService {
  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly shutdownService: ShutdownService,
    private readonly authClaimService: AuthClaimService,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.initFRO();
  }

  public async initFRO(): Promise<void> {
    const logger = getLogger(this.constructor.name, 'initFRO');
    for (const ledger of this.blockchainService.supportedLedgers) {
      logger.info(`FRO init - doesRegistryHaveFactories on ledger ${ledger}`);
      let doesRegistryHaveFactories = false;
      try {
        doesRegistryHaveFactories =
          await this.blockchainService.doesRegistryHaveFactories(
            ledger,
            logger,
          );
      } catch (error) {
        const errorMessage = errorAsString(error);
        logger.error(
          `Error[${errorMessage}] checking if registry has factories for ledger ${ledger}. Considering it is not.`,
        );
      }
      if (
        !doesRegistryHaveFactories ||
        doesRegistryHaveFactories === undefined
      ) {
        logger.info(
          `FRO init - doesRegistryHaveFactories false on ledger ${ledger} - ShutDown FRO`,
        );
        this.shutdownService.shutdown();
      }
    }
  }

  public async createEMTN(emtn: CreateEMTNInput): Promise<string> {
    const logger = getLogger(this.constructor.name, 'createEMTN');
    emtn = this.maybeReplaceRegistrarAddress(emtn);

    const factoryAddress = await this.blockchainService.getFactoryAddress(
      emtn.ledger,
      'EMTN',
    );

    if (!factoryAddress) {
      throw new Error(`No factory address found for ledger ${emtn.ledger}`);
    }

    const factoryContract = await this.blockchainService.getForgeEMTNFactory(
      emtn.ledger,
      factoryAddress,
    );

    const registryAddress = this.blockchainService.getRegistryAddress(
      emtn.ledger,
    );

    if (registryAddress === undefined) {
      throw new Error('No registry');
    }

    const emtnArgs = buildCreateForgeEMTNArgs(emtn, registryAddress);

    logger.debug(
      `createEMTN factoryAddress[${factoryAddress}], emtnArgs[${JSON.stringify(
        emtnArgs,
      )}]`,
    );

    logger.info(`Creating EMTN ${emtn.symbol} on ${emtn.ledger}`);

    const { transactionId } = await factoryContract.createForgeEmtn(emtnArgs);

    return transactionId;
  }

  public async createBond(bond: CreateBondInput): Promise<string> {
    const logger = getLogger(this.constructor.name, 'createBond');

    bond = this.maybeReplaceRegistrarAddress(bond);

    const factoryAddress = await this.blockchainService.getFactoryAddress(
      bond.ledger,
      'Bond',
    );

    if (!factoryAddress) {
      throw new Error(`No factory address found for ledger ${factoryAddress}`);
    }

    const factoryContract = await this.blockchainService.getForgeBondFactory(
      bond.ledger,
      factoryAddress,
    );

    const bondArgs = buildCreateForgeBondArgs(bond);

    logger.info(
      `Calling blockchain for creating bond ${bond.symbol} on ${bond.ledger}`,
    );
    logger.debug(
      `Creating bond ${bond.symbol} on ${bond.ledger}`,
      JSON.stringify(bondArgs),
    );

    const registryAddress = this.blockchainService.getRegistryAddress(
      bond.ledger,
    );

    if (registryAddress === undefined) {
      throw new Error('No registry');
    }

    const { transactionId } = await factoryContract.createForgeBond(
      registryAddress,
      bondArgs,
    );

    logger.info(
      `Blockchain called for creating bond ${bond.symbol} on ${bond.ledger} (transaction hash: ${transactionId})`,
    );

    return transactionId;
  }

  private maybeReplaceRegistrarAddress<
    T extends CreateBondInput | CreateEMTNInput,
  >(instrumentInput: T): T {
    const logger = getLogger(
      this.constructor.name,
      'maybeReplaceRegistrarAddress',
    );
    const registrarAddress = this.authClaimService.whoAmI(
      instrumentInput.ledger,
    );
    if (instrumentInput.registrarAgentAddress !== registrarAddress) {
      logger.warn(
        `Ignoring provided registrarAgentAddress[${instrumentInput.registrarAgentAddress}] and replacing with fro's address[${registrarAddress}]`,
      );
      instrumentInput.registrarAgentAddress = registrarAddress;
    }
    return instrumentInput;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setupPlatformLevel(level: number): Promise<boolean> {
    // 1) deploy factory(with all libraries)
    // 2) Once finished, publish PLATFORM_LEVEL_PREPARED event
    return Promise.resolve(true);
  }
}
