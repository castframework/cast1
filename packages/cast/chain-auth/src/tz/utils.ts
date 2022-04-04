import nacl from 'tweetnacl';
import * as Bs58check from 'bs58check';
import { blake2b } from 'blakejs';

export const tzPrefix = {
  tz1: new Uint8Array([6, 161, 159]),
  tz2: new Uint8Array([6, 161, 161]),
  tz3: new Uint8Array([6, 161, 164]),
  edpk: new Uint8Array([13, 15, 37, 217]),
  edsk: new Uint8Array([43, 246, 78, 7]),
  edsig: new Uint8Array([9, 245, 205, 134, 18]),
};

export function checkSignature(
  message: Buffer,
  signature: Buffer,
  pk: Buffer,
): boolean {
  return nacl.sign.detached.verify(message, signature, pk);
}

export function lowSign(message: Buffer, sk: Buffer): string {
  const uintArray = nacl.sign.detached(message, sk);
  return base58encode(uintArray, tzPrefix.edsig);
}

export function pkToPkh(pk: string): string {
  const pkDecoded = base58decode(pk, tzPrefix.edpk);
  return base58encode(blake2b(pkDecoded, undefined, 20), tzPrefix.tz1);
}

function concatTypedArray(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

export function base58encode(payload: Uint8Array, prefix: Uint8Array): string {
  return Bs58check.encode(Buffer.from(concatTypedArray(prefix, payload)));
}

export function base58decode(bs58String: string, prefix: Uint8Array): Buffer {
  return Bs58check.decode(bs58String).slice(prefix.length);
}

export function skToPk(sk: string) {
  const bufferSk = base58decode(sk, tzPrefix.edsk);

  const pair = nacl.sign.keyPair.fromSecretKey(bufferSk);

  return base58encode(pair.publicKey, tzPrefix.edpk);
}

export const TzKeyUtils = {
  skToPk,
  pkToPkh,
};
