import { getLogger, Logger } from '../../utils/logger';
import BigNumber from 'bignumber.js';
import { BadRequestException, Injectable } from '@nestjs/common';

import { STRSettlementTransaction } from '@castframework/models';
import { errorAsString } from '../../utils/errorAsString';
import { asyncForEach } from '../../utils/promiseUtils';
import { StrClientService } from '@castframework/oracle-clients';
import { BlockchainService } from '../../shared/services/blockchain.service';
import uuidToHex = require('uuid-to-hex');

@Injectable()
export class FsoService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    private readonly blockchainService: BlockchainService,
    private readonly strClientService: StrClientService,
  ) {}

  public async confirmPaymentReceived(
    paymentReference: string,
  ): Promise<string[]> {
    const logger = getLogger(this.constructor.name, 'confirmPaymentReceived');
    let settlementTransactions: STRSettlementTransaction[] | null;
    try {
      settlementTransactions =
        await this.strClientService.getSettlementTransactionsByPaymentReference(
          paymentReference,
        );
      if (
        settlementTransactions === null ||
        settlementTransactions.length === 0
      ) {
        const errorMessage = `No settlement transaction found for paymentReference[${paymentReference}].`;
        throw new BadRequestException(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error getting settlement transactions for paymentReference[${paymentReference}] from STR. Error[${errorAsString(
        error,
      )}]`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    const transactionHashes = await asyncForEach(
      settlementTransactions,
      async (settlementTransaction): Promise<string> => {
        const ledger = settlementTransaction.instrumentLedger;

        const instrumentPublicAddress =
          settlementTransaction.instrumentPublicAddress;

        const bondContract = await this.blockchainService.getForgeBond(
          ledger,
          instrumentPublicAddress,
        );

        const hexa: number = uuidToHex(settlementTransaction.id);
        const idBigNumber: BigNumber = new BigNumber(hexa, 16);

        logger.info(
          `Calling blockchain for confirm payment received for settlement transaction ${settlementTransaction.id} on ${settlementTransaction.instrumentLedger}`,
        );

        const { transactionId } = await bondContract.confirmPaymentReceived(
          idBigNumber,
        );

        logger.info(
          `Blockchain called for confirm payment received for settlement transaction ${settlementTransaction.id} on ${settlementTransaction.instrumentLedger} (transaction hash: ${transactionId})`,
        );

        return transactionId;
      },
    );

    return transactionHashes;
  }

  public async confirmPaymentTransferred(
    paymentReference: string,
  ): Promise<string[]> {
    const logger = getLogger(
      this.constructor.name,
      'confirmPaymentTransferred',
    );
    let settlementTransactions: STRSettlementTransaction[] | null;
    try {
      settlementTransactions =
        await this.strClientService.getSettlementTransactionsByPaymentReference(
          paymentReference,
        );
      if (
        settlementTransactions === null ||
        settlementTransactions.length === 0
      ) {
        const errorMessage = `No settlement transaction found for paymentReference[${paymentReference}].`;
        logger.error(errorMessage);
        throw new BadRequestException(errorMessage);
      }
    } catch (error) {
      const errorMessage = `Error getting settlement transactions for paymentReference[${paymentReference}] from STR. Error[${errorAsString(
        error,
      )}]`;
      logger.error(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    const txHashes = await asyncForEach(
      settlementTransactions,
      async (settlementTransaction): Promise<string> => {
        const ledger = settlementTransaction.instrumentLedger;

        const instrumentPublicAddress =
          settlementTransaction.instrumentPublicAddress;
        const bondContract = await this.blockchainService.getForgeBond(
          ledger,
          instrumentPublicAddress,
        );

        const hexa: number = uuidToHex(settlementTransaction.id);
        const idBigNumber: BigNumber = new BigNumber(hexa, 16);

        logger.info(
          `Calling blockchain for confirm payment transferred for settlement transaction ${settlementTransaction.id} on ${settlementTransaction.instrumentLedger}`,
        );

        const { transactionId } = await bondContract.confirmPaymentTransferred(
          idBigNumber,
        );

        logger.info(
          `Blockchain called for confirm payment transferred for settlement transaction ${settlementTransaction.id} on ${settlementTransaction.instrumentLedger} (transaction hash: ${transactionId})`,
        );

        return transactionId;
      },
    );

    return txHashes;
  }
}
