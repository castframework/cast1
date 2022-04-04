import { getLogger, Logger } from '../../../utils/logger';
import { Injectable } from '@nestjs/common';
import { Ledger, Currency, InstrumentPosition } from '@castframework/models';
import { BlockchainService } from '../../../shared/services/blockchain.service';

@Injectable()
export class PositionService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(private readonly blockchainService: BlockchainService) {}

  public async getInstrumentPositions(
    instrumentAddress: string,
    ledger: Ledger,
  ): Promise<InstrumentPosition[]> {
    this.logger.debug(
      `Received request getInstrumentPositions for ${instrumentAddress} on ${ledger}`,
    );

    const contract = await this.blockchainService.getForgeBond(
      ledger,
      instrumentAddress,
    );

    const balances = await contract.getFullBalances();

    const symbol = await contract.symbol();
    const denomination = Number(await contract.denomination());
    const currentSupply = Number(await contract.currentSupply());

    return balances.map((balance) => ({
      instrumentAddress: instrumentAddress,
      ledger: ledger,
      balance: Number(balance._balance),
      legalEntityAddress: balance._address,
      symbol: symbol,
      valueInFiat: Number(balance._balance) * denomination,
      currency: Currency.EUR, // TODO store currency in blockchain
      percentage: Number(balance._balance) / currentSupply,
      unlocked: Number(balance._balance) - Number(balance._locked),
      locked: Number(balance._locked),
    }));
  }
}
