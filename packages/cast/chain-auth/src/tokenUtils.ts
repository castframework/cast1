import { ForgeJws, jwsHeader } from './types';

export function checkSender(sender: string, jws: ForgeJws): boolean {
  return sender === jws.data.iss;
}

export function getIss(jws: ForgeJws): string {
  return jws.data.iss;
}

export function getAlg(jws: ForgeJws): jwsHeader['alg'] {
  return jws.header.alg;
}
export function isTokenExpired(jws: ForgeJws): boolean {
  const now = Date.now();

  if (now < jws.data.iat) {
    return true;
  }

  if (now > jws.data.exp) {
    return true;
  }

  return false;
}
