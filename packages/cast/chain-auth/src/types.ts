export interface AuthReport {
  success: boolean;
  jws: ForgeJws;
  address: string; // address according to the jwsHeader.alg and jwsData.iss fields
  errorMessage?: string;
}

export type jwsHeader = {
  alg: 'ETH' | 'TZ';
  typ: 'JWT'; // Note as eth is not supported by jwt rfc this is not a real jwt
};

export type jwsData = {
  iss: string; // The pk you claim to control
  iat: number; // mint date
  aud: string; // your expected receiver
  exp: number; // exp date
  jti?: string;
};

export interface ForgeJws {
  header: jwsHeader;
  data: jwsData;
  signature?: string;
}

export interface Alg {
  verifySign(claim: string, signature: string, pk: string): boolean;
  addressFromPk(pk: string): string;
  sign(message: string, sk: string): string;
}

export type AlgRegister = {
  [alg in jwsHeader['alg']]: Alg;
};
