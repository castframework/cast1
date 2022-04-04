import { expect } from 'chai';
import { generateNewJws } from '../src/jws';
import { signJws, authenticate } from '../src/auth';
import { Alg, jwsHeader } from '../src/types';

export type AlgTestParam = {
  algName: jwsHeader['alg'];
  sk: string;
  pk: string;
  pkh: string;
  unsignedJws: string;
  sig: string;
  alg: Alg;
};
export const testBuilder = (params: AlgTestParam) => () => {
  const { sk, pk, pkh, unsignedJws, sig, algName, alg } = params;

  it('fn : verifySign', () => {
    const result = alg.verifySign(unsignedJws, sig, pk);
    expect(result).to.be.true;
  });

  it('fn : sign', () => {
    const result = alg.sign(unsignedJws, sk);
    expect(result).to.be.not.null;
  });

  it('fn : addressFromPk', () => {
    const result = alg.addressFromPk(pk);
    expect(result).to.be.equal(pkh);
  });

  it('Integration : sign and auth', () => {
    const jsToken = generateNewJws(pk, 'to.who.it.may.concern', algName);
    const token = signJws(jsToken, sk);
    const result = authenticate(token);

    //console.log({token, result, jsToken, jwtDecoded : JSON.stringify(result.jws)});

    expect(result.success).to.be.true;
    expect(result.address).to.be.equal(pkh);
  });
};
