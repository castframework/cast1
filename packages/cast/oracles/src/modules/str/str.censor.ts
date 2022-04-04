import { getLogger, Logger } from '../../utils/logger';
import { Injectable } from '@nestjs/common';
import { Ledger, STRSettlementTransaction } from '@castframework/models';
import { OperatorRole } from '../../constants/operatorRoles';
import { ChainUser } from '../../guards/ChainRoles.guard';
import { errorAsString } from '../../utils/errorAsString';
import { BlockchainService } from '../../shared/services/blockchain.service';

@Injectable()
export class SettlementTransactionCensor {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(private blockchainService: BlockchainService) {}

  public async censor(
    settlementTransactions: STRSettlementTransaction[],
    user: ChainUser,
  ): Promise<STRSettlementTransaction[]> {
    this.logger.debug(`Censor Called for user ${user.address}`);

    const filtered = settlementTransactions.map(this.censorElement(user));

    const promiseResult = await Promise.all(filtered);
    return promiseResult.filter(
      (e) => e !== undefined,
    ) as STRSettlementTransaction[];
  }

  protected censorElement =
    (user: ChainUser) =>
    async (
      st: STRSettlementTransaction,
    ): Promise<STRSettlementTransaction | undefined> => {
      const {
        id,
        instrumentLedger,
        deliveryReceiverAccountNumber,
        deliverySenderAccountNumber,
        instrumentPublicAddress,
      } = st;

      if (instrumentLedger !== user.chain) {
        this.logger.debug(
          `[settlementTransaction #${id}] User has wrong auth for this st`,
        );
        return undefined;
      }

      const isPartOfTransaction =
        user.address.toLowerCase() ===
          deliveryReceiverAccountNumber.toLowerCase() ||
        user.address.toLowerCase() ===
          deliverySenderAccountNumber.toLowerCase();

      const isOperator = await this.userIsOperator(
        user.address,
        instrumentPublicAddress,
        user.chain,
      );

      const isAdditionalReader =
        st.additionalReaderAddresses
          ?.map((value) => value.toLowerCase())
          ?.includes(user.address.toLowerCase()) || false;

      const total = isPartOfTransaction || isOperator || isAdditionalReader;

      this.logger.debug(
        `[settlementTransaction #${id}] Censor report for ${
          user.address
        } ${JSON.stringify({
          isPartOfTransaction,
          isOperator,
          isAdditionalReader,
          total,
        })}`,
      );

      return total ? st : undefined;
    };

  private async userIsOperator(
    address: string,
    contract: string,
    blockchainType: Ledger,
  ): Promise<boolean> {
    try {
      this.logger.trace(
        `Fetching Role of user [${address}] fro contract [${contract}]`,
      );

      const bond = await this.blockchainService.getForgeBond(
        blockchainType,
        contract,
      );

      const isSettler = await bond.isOperatorWithRoleAuthorized(
        address,
        OperatorRole.SETTLER,
      );

      this.logger.trace(
        `[${address}] isSettler for [${contract}] : ${isSettler}`,
      );

      const issuer = await bond.owner();
      const isIssuer = issuer.toLowerCase() === address.toLowerCase();

      this.logger.trace(`[${address}] isIssuer [${contract}] : ${isIssuer}`);

      const isRegistrar = await bond.isOperatorWithRoleAuthorized(
        address,
        OperatorRole.REGISTRAR,
      );

      this.logger.trace(
        `[${address}] isRegistrar [${contract}] : ${isRegistrar}`,
      );

      return isSettler || isIssuer || isRegistrar;
    } catch (err) {
      this.logger.error(
        `userIsOperator : address[${address}] contract[${contract}] error[${errorAsString(
          err,
        )}]`,
      );
    }

    return false;
  }
}
