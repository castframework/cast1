import { CASTJws, jwsHeader } from './types';

export function checkSender(sender: string, jws: CASTJws): boolean {
  return sender === jws.data.iss;
}

export function getIss(jws: CASTJws): string {
  return jws.data.iss;
}

export function getAlg(jws: CASTJws): jwsHeader['alg'] {
  return jws.header.alg;
}
export function isTokenExpired(jws: CASTJws): boolean {
  const now = Date.now();

  if (now < jws.data.iat) {
    return true;
  }

  if (now > jws.data.exp) {
    return true;
  }

  return false;
}
