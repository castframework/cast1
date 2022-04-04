import { AuthClaimService } from '../../shared/services/authClaim.service';
import { FileService } from '../../shared/services/file.service';
import { arrayToCSV } from '../../utils/serializationTools';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Ledger } from '@castframework/models';
import { getLogger, Logger } from '../../utils/logger';
import { FioConfig } from './fio.config';
import { BlockchainService } from '../../shared/services/blockchain.service';

interface Position {
  symbol: string;
  value: number;
}

@Injectable()
export class ReportService implements OnModuleDestroy {
  private logger: Logger = getLogger(this.constructor.name);
  private reportPositionIntervalId: NodeJS.Timeout;

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly fileService: FileService,
    private readonly authClaimService: AuthClaimService,
    private readonly fioConfig: FioConfig,
  ) {
    // Un module officiel existe pour les jobs (nestjs/schedule)
    // pour l'instant il ne fonctionne pas (mais il est sortit le 13 Décembre donc on leur en veux pas)
    const interval = fioConfig.positionReportIntervalInMinute;

    if (interval !== 0) {
      this.reportPositionIntervalId = setInterval(
        this.reportPosition.bind(this),
        interval * 60 * 1000,
      );
    }
  }

  public onModuleDestroy(): void {
    this.logger.debug('Stopping position reporting timer');
    if (this.reportPositionIntervalId) {
      clearInterval(this.reportPositionIntervalId);
    }
  }

  public async reportPosition(): Promise<void> {
    const contractAddresses = await this.getAddressesFromContract(); // ou getAddressFromContract();

    const positions = await this.getPositionOnContract(contractAddresses);

    const csvData = arrayToCSV(positions || []);

    await this.fileService.writeToFile(
      `Positon_Report_${new Date().toJSON()}.csv`,
      csvData,
    );
  }

  public async getPositionOnContract(
    contractAddresses: string[],
  ): Promise<Position[] | undefined> {
    const ownAddress = this.authClaimService.whoAmI(Ledger.ETHEREUM);

    const positions: Promise<Position | undefined>[] = contractAddresses.map(
      async (address: string): Promise<Position | undefined> => {
        const contract = await this.blockchainService.getForgeBond(
          Ledger.ETHEREUM,
          address,
        );

        const symbol = await contract.symbol();
        const value = (await contract.getBalance(ownAddress)) as number;

        if (value) {
          return {
            symbol,
            value,
          };
        } else {
          return undefined;
        }
      },
    );

    const promiseResult = await Promise.all(positions);
    return promiseResult.filter((e) => e !== undefined) as Position[];
  }

  public async getAddressesFromContract(): Promise<string[]> {
    const instrumentRegistry =
      await this.blockchainService.getRegistryFromLedger(
        Ledger.ETHEREUM,
        this.logger,
      );

    return await instrumentRegistry.getAllInstruments();
  }
}
