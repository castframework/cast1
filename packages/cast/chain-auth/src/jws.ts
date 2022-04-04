import { Base64 } from 'js-base64';
import { jwsData, jwsHeader, ForgeJws } from './types';

export function isJwsHeader(header: any): header is jwsHeader {
  return header.alg && header.typ;
}

export function isJwsData(data: any): data is jwsData {
  const { iss, iat, exp, aud } = data;
  return (
    iss !== undefined &&
    iat !== undefined &&
    exp !== undefined &&
    aud !== undefined
  );
}

export function constructJws(
  header: any,
  data: any,
  signature?: string,
): ForgeJws {
  if (!isJwsHeader(header)) {
    throw new Error('Header is not a valid jws header');
  }

  if (!isJwsData(data)) {
    throw new Error('Data is not a valid jws data');
  }

  return {
    header,
    data,
    signature,
  };
}

export function trimJwsSignature(jws: string) {
  return jws.split('.').slice(0, 2).join('.');
}

export function base64EncodeFromJS(object: any): string {
  return Base64.encode(JSON.stringify(object), true);
}

export function base64DecodeToJS(input: string): any {
  return JSON.parse(Base64.decode(input));
}

export function encodeUnsignedJws(jws: ForgeJws): string {
  const { header, data } = jws;

  return `${base64EncodeFromJS(header)}.${base64EncodeFromJS(data)}`;
}

export function decodeJws(jws: string): ForgeJws {
  const [_header, _data, signature, ...rest] = jws.split('.');

  if (rest.length !== 0) {
    throw new Error('Jws has extra field');
  }

  if (!_header || !_data || !signature) {
    throw new Error('Missing jws required construction information');
  }

  const header = base64DecodeToJS(_header);
  const data = base64DecodeToJS(_data);

  return constructJws(header, data, signature);
}

export function generateNewJws(
  publicKey: string,
  aud: string,
  alg: jwsHeader['alg'],
  expIn = 5000,
): ForgeJws {
  const header = {
    alg,
    typ: 'JWT',
  };

  const iat = Date.now();

  const data = {
    iss: publicKey,
    iat,
    exp: iat + expIn,
    aud,
  };

  return constructJws(header, data);
}
