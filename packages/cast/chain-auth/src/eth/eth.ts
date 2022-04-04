import { Alg } from '../types';
import { personalSign, extractPublicKey, normalize } from 'eth-sig-util';
import {
  pubToAddress,
  toBuffer,
  bufferToHex,
  addHexPrefix,
  toChecksumAddress,
} from 'ethereumjs-util';

export function verifySign(
  claim: string,
  signature: string,
  senderPk: string,
): boolean {
  try {
    const foundPk = extractPublicKey({
      data: claim,
      sig: signature,
    });

    return normalize(senderPk) === normalize(foundPk);
  } catch {
    return false;
  }
}

export function sign(message: string, privateKey: string): string {
  const privateKeyBuffer = Buffer.from(
    normalize(privateKey).substring(2),
    'hex',
  );

  return personalSign(privateKeyBuffer, { data: message });
}

export function addressFromPk(pk: string): string {
  try {
    return toChecksumAddress(
      addHexPrefix(bufferToHex(pubToAddress(toBuffer(pk)))),
    );
  } catch {
    return '';
  }
}

export const ethAlg: Alg = {
  verifySign,
  addressFromPk,
  sign,
};
