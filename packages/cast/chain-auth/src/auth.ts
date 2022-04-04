import { AuthReport, ForgeJws } from './types';
import { decodeJws, trimJwsSignature, encodeUnsignedJws } from './jws';
import { getIss, getAlg, isTokenExpired } from './tokenUtils';

import { algRegister } from './algRegister';

export function authenticate(encodedJws: string): AuthReport {
  const jws = decodeJws(encodedJws);

  const { signature } = jws;
  const claim = trimJwsSignature(encodedJws);
  const senderPk = getIss(jws);
  const alg = getAlg(jws);
  const { verifySign, addressFromPk } = algRegister[alg];

  const isSignatureValid = verifySign(claim, signature as string, senderPk);
  const senderAddress = addressFromPk(senderPk);

  if (isTokenExpired(jws)) {
    return {
      success: false,
      jws,
      address: '',
      errorMessage: 'Jws has expired',
    };
  } else if (!isSignatureValid) {
    return {
      success: false,
      jws,
      address: senderAddress,
      errorMessage: 'Invalid signature',
    };
  } else {
    return {
      success: true,
      jws,
      address: senderAddress,
    };
  }
}

export function signJws(claim: ForgeJws, secretKey: string): string {
  const toSign = encodeUnsignedJws(claim);
  const alg = getAlg(claim);
  const { sign } = algRegister[alg];

  const signature = sign(toSign, secretKey);

  return `${toSign}.${signature}`;
}
