import 'mocha';
import { expect } from 'chai';
import { generateNewJws } from '../src/jws';
import { signJws, authenticate } from '../src/auth';
import { ForgeJws } from '../src/types';
import { checkSender } from '../src/tokenUtils';

const privateKey =
  '0x459975a29bf64c03a92388f8ae50bdc7eb7df4ff5ede58c58c626fa9be67a76a';
const publicKey =
  '0x58d9e3ac6ea256fa907db156e3a129f6b1228fc2a01748f2027706a79df5c90ca28f196d92c7417b90f520fef5f5c81d59ce745dfecce0e89b56d757f46f14dd';
const publicAddress = '0xe447fA2Bc17668112CAe2Dc7752387f695C322Cf';

const jws = {
  header: { alg: 'ETH', typ: 'JWT' },
  data: {
    iat: 0,
    exp: 5001596799187166,
    iss: publicKey,
    aud: 'https://to.who.it.may.concern',
  },
  signature:
    '0x5140dc90b169b2cfedeced8d39554b296ca782506ab0bd857502541ebfc3ea473842bfd7bda24bb3ae5dad2de1321531dfb250d8c6655e26d9446618582194461b',
};
const signedJws = `eyJhbGciOiJFVEgiLCJ0eXAiOiJKV1QifQ==.eyJpYXQiOjAsImV4cCI6NTAwMTU5Njc5OTE4NzE2NiwiaXNzIjoiMHg1OGQ5ZTNhYzZlYTI1NmZhOTA3ZGIxNTZlM2ExMjlmNmIxMjI4ZmMyYTAxNzQ4ZjIwMjc3MDZhNzlkZjVjOTBjYTI4ZjE5NmQ5MmM3NDE3YjkwZjUyMGZlZjVmNWM4MWQ1OWNlNzQ1ZGZlY2NlMGU4OWI1NmQ3NTdmNDZmMTRkZCIsImF1ZCI6Imh0dHBzOi8vdG8ud2hvLml0Lm1heS5jb25jZXJuIn0=.0x5140dc90b169b2cfedeced8d39554b296ca782506ab0bd857502541ebfc3ea473842bfd7bda24bb3ae5dad2de1321531dfb250d8c6655e26d9446618582194461b`;

const newJws: ForgeJws = {
  header: {
    alg: 'ETH',
    typ: 'JWT',
  },
  data: {
    iat: 0,
    exp: Date.now() + 5000000000000000,
    iss: publicKey,
    aud: 'https://to.who.it.may.concern',
  },
  signature: 'signature',
};

describe('[AUTH] Eth', () => {
  it('sign the jws', () => {
    const result = signJws(newJws, privateKey);

    expect(result).to.be.not.null;
  });

  it('check sender', () => {
    const result = checkSender(publicKey, newJws);

    expect(result).to.be.true;
  });

  it('should authenticate good jws', () => {
    const result = authenticate(signedJws);

    expect(result).to.eql({
      success: true,
      jws: jws,
      address: publicAddress,
    });
  });

  it('should fail for expired token', () => {
    const jws = generateNewJws(
      publicKey,
      'https://to.who.it.may.concern',
      'ETH',
      -1,
    );

    const signedJws = signJws(jws, privateKey);

    const result = authenticate(signedJws);

    expect(result.success).to.be.false;
  });

  it('should fail for incorrect iss', () => {
    const jws = generateNewJws('0xFF', 'https://to.who.it.may.concern', 'ETH');

    const signedJws = signJws(jws, privateKey);

    const result = authenticate(signedJws);

    expect(result.success).to.be.false;
  });
});
