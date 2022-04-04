import { getLogger, Logger } from '../../utils/logger';
import {
  addHexPrefix,
  bufferToHex,
  privateToAddress,
  toBuffer,
  privateToPublic,
} from 'ethereumjs-util';

import { generateNewJws, signJws, TzKeyUtils } from '@castframework/chain-auth';
import { Injectable } from '@nestjs/common';
import { Ledger } from '@castframework/models';
import { chainToAlg } from '../../utils/authUtils';
import { SharedConfig } from '../shared.config';

@Injectable()
export class AuthClaimService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(private readonly sharedConfig: SharedConfig) {
    this.logger.info(
      `Starting with ethereum address ${this.getAddress(Ledger.ETHEREUM)}`,
    );
    this.logger.info(
      `Starting with tezos address ${this.getAddress(Ledger.TEZOS)}`,
    );
  }

  private getAddress(ledger: Ledger): string {
    const account = this.getAccount(ledger);

    switch (ledger) {
      case Ledger.ETHEREUM:
        return this.getEthAddress(account.secretkey);
      case Ledger.TEZOS:
        return TzKeyUtils.pkToPkh(account.publickey);
      default:
        throw new Error(`Unknown ledger ${ledger}`);
    }
  }

  private getEthAddress(privateKey: string): string {
    return addHexPrefix(bufferToHex(privateToAddress(toBuffer(privateKey)))); // nearly ready for lisp eh ?
  }

  private getEthPublicKey(sk: string): string {
    return addHexPrefix(bufferToHex(privateToPublic(toBuffer(sk)))); // Again !
  }

  public whoAmI(ledger: Ledger): string {
    return this.getAddress(ledger);
  }

  public get ownerLTAddress(): string {
    return 'SOGEFRP0AGSS';
  }

  public getClaim(ledger: Ledger, aud: string): string {
    const { secretkey, publickey } = this.getAccount(ledger);

    const expTime = this.sharedConfig.expirationTime;

    const claim = generateNewJws(publickey, aud, chainToAlg(ledger), expTime);

    const signedClaim = signJws(claim, secretkey);

    this.logger.trace(`${JSON.stringify({ claim, signedClaim })}`);

    return signedClaim;
  }

  public getTzClaim(aud: string): string {
    return this.getClaim(Ledger.TEZOS, aud);
  }

  public getEthClaim(aud: string): string {
    return this.getClaim(Ledger.ETHEREUM, aud);
  }

  private getAccount(ledger: Ledger): { secretkey: string; publickey: string } {
    switch (ledger) {
      case Ledger.ETHEREUM: {
        const sk = this.sharedConfig.ethConfig.privateKey;
        return {
          secretkey: sk,
          publickey: this.getEthPublicKey(sk),
        };
      }
      case Ledger.TEZOS: {
        const sk = this.sharedConfig.tzConfig.privateKey;
        return {
          secretkey: sk,
          publickey: TzKeyUtils.skToPk(sk),
        };
      }
    }
  }
}
