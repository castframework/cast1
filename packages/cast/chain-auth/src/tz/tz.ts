import { Alg } from '../types';
import {
  checkSignature,
  lowSign,
  tzPrefix,
  base58decode,
  pkToPkh,
} from './utils';

export function verifySign(
  claim: string,
  signature: string,
  senderPk: string,
): boolean {
  const claimBuffer = Buffer.from(claim);
  const pkBuffer = base58decode(senderPk, tzPrefix.edpk);
  const signatureBuffer = base58decode(signature, tzPrefix.edsig);

  return checkSignature(claimBuffer, signatureBuffer, pkBuffer);
}

export function sign(message: string, privateKey: string): string {
  const bytes = Buffer.from(message);
  const sk = base58decode(privateKey, tzPrefix.edsk);

  return lowSign(bytes, sk);
}

export function addressFromPk(pk: string): string {
  return pkToPkh(pk);
}

export const tzAlg: Alg = {
  verifySign,
  addressFromPk,
  sign,
};
