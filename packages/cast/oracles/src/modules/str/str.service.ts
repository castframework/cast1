import { getLogger, Logger } from '../../utils/logger';
import { Between, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Ledger,
  CreateOracleSettlementTransactionInput,
  Movement,
  STRSettlementTransaction,
} from '@castframework/models';
import { OperatorRole } from '../../constants/operatorRoles';
import { nameof } from '../../utils/nameof';
import { ChainUser, formatChainUser } from '../../guards/ChainRoles.guard';
import { SettlementTransactionCensor } from './str.censor';
import { BlockchainService } from '../../shared/services/blockchain.service';

@Injectable()
export class SettlementTransactionService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(
    @InjectRepository(STRSettlementTransaction)
    private readonly settlementTransactionRepository: Repository<STRSettlementTransaction>,
    @InjectRepository(Movement)
    private readonly movementRepository: Repository<Movement>,
    private readonly settlementTransactionCensor: SettlementTransactionCensor,
    private readonly blockchainService: BlockchainService,
  ) {}

  public async getLedgerForTransactionId(
    transactionId: string,
  ): Promise<Ledger | null> {
    const settlementTransaction =
      await this.settlementTransactionRepository.findOne(transactionId);
    return settlementTransaction !== undefined
      ? settlementTransaction.instrumentLedger
      : null;
  }

  public async getLedgerForPaymentReference(
    paymentReference: string,
  ): Promise<Ledger | null> {
    const movement = await this.movementRepository.findOne({
      where: { paymentReference },
      relations: [nameof<Movement>('settlementTransactions')],
    });
    return movement !== undefined &&
      movement.settlementTransactions !== undefined
      ? movement.settlementTransactions[0].instrumentLedger
      : null;
  }

  public async create(
    settlementTransaction: CreateOracleSettlementTransactionInput,
    user: ChainUser,
  ): Promise<STRSettlementTransaction | undefined> {
    const logger = getLogger(this.constructor.name, 'create');
    if (
      !(await this.hasRole(
        user.address,
        settlementTransaction.instrumentPublicAddress,
        settlementTransaction.instrumentLedger,
        OperatorRole.REGISTRAR,
      ))
    ) {
      logger.trace(
        `${formatChainUser(user)} is not registrar of instrument at address ${
          settlementTransaction.instrumentPublicAddress
        }`,
      );
      throw new Error(
        `Only registrar agent of instrument at address ${settlementTransaction.instrumentPublicAddress} can create transactions`,
      );
    }

    if (
      await this.settlementTransactionRepository.findOne(
        settlementTransaction.id,
      )
    ) {
      throw new Error(
        `Settlement transaction with id[${settlementTransaction.id}] already exists.`,
      );
    }

    logger.debug(
      `Saving settlement transaction ${
        settlementTransaction.id
      }: ${JSON.stringify(settlementTransaction)}`,
    );

    await this.settlementTransactionRepository.save(settlementTransaction);

    logger.debug(
      `Settlement transaction ${
        settlementTransaction.id
      } created by ${formatChainUser(user)}`,
    );

    const str = this.settlementTransactionRepository.findOne(
      {
        id: settlementTransaction.id,
      },
      {
        relations: ['movements'],
      },
    );

    logger.info(`Settlement transaction ${settlementTransaction.id} created`);
    return str;
  }

  public async getSettlementTransactions(
    user: ChainUser,
    instrumentAddress?: string,
  ): Promise<STRSettlementTransaction[]> {
    const settlementTransactions =
      await this.settlementTransactionRepository.find({
        where: {
          instrumentLedger: user.chain,
          ...(instrumentAddress !== undefined
            ? { instrumentPublicAddress: instrumentAddress }
            : {}),
        },
        relations: [nameof<STRSettlementTransaction>('movements')],
      });
    return this.settlementTransactionCensor.censor(
      settlementTransactions,
      user,
    );
  }

  public async getSettlementTransactionByTimeFrame(
    user: ChainUser,
    begin: Date,
    end: Date,
  ): Promise<STRSettlementTransaction[]> {
    const settlementTransactions =
      await this.settlementTransactionRepository.find({
        where: {
          settlementDate: Between(begin, end),
        },
        relations: [nameof<STRSettlementTransaction>('movements')],
      });
    return this.settlementTransactionCensor.censor(
      settlementTransactions,
      user,
    );
  }

  public async getSettlementTransaction(
    user: ChainUser,
    id: string,
  ): Promise<STRSettlementTransaction | null> {
    const settlementTransaction =
      await this.settlementTransactionRepository.findOne({
        where: {
          instrumentLedger: user.chain,
          id,
        },
        relations: [nameof<STRSettlementTransaction>('movements')],
      });
    if (!settlementTransaction) {
      return null;
    }
    const [result] = await this.settlementTransactionCensor.censor(
      [settlementTransaction],
      user,
    );
    return result || null;
  }

  public async getSettlementTransactionsByPaymentReference(
    user: ChainUser,
    paymentReference: string,
  ): Promise<STRSettlementTransaction[]> {
    const settlementTransactions = await this.settlementTransactionRepository
      .createQueryBuilder('str_settlement_transaction')
      .innerJoin(
        'settlement_transaction_movement',
        'settlement_transaction_movement_inner',
        'settlement_transaction_movement_inner.str_settlement_transaction_id=str_settlement_transaction.id',
      )
      .innerJoin(
        'movement',
        'movement_inner',
        'movement_inner.id = settlement_transaction_movement_inner.movement_id and movement_inner.paymentReference = :paymentReference',
        { paymentReference },
      )
      .leftJoinAndSelect('str_settlement_transaction.movements', 'movement')
      .where(
        'str_settlement_transaction.instrumentLedger = :instrumentLedger',
        { instrumentLedger: user.chain },
      )
      .getMany();
    return this.settlementTransactionCensor.censor(
      settlementTransactions,
      user,
    );
  }

  private async hasRole(
    userAddress: string,
    contractAddress: string,
    ledger: Ledger,
    role: OperatorRole,
  ): Promise<boolean> {
    let result = false;
    try {
      const bond = await this.blockchainService.getForgeBond(
        ledger,
        contractAddress,
      );

      result = await bond.isOperatorWithRoleAuthorized(userAddress, role);

      this.logger.debug(
        `hasRole : address[${userAddress}] contract[${contractAddress}] role[${role}] result[${result}]`,
      );
    } catch (error) {
      this.logger.error(
        `hasRole : address[${userAddress}] contract[${contractAddress}] role[${role}] error[${error}]`,
      );
      throw error;
    }
    return result;
  }
}
