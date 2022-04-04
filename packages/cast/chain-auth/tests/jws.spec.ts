import 'mocha';
import { expect } from 'chai';
import {
  base64EncodeFromJS,
  base64DecodeToJS,
  trimJwsSignature,
  encodeUnsignedJws,
  decodeJws,
  generateNewJws,
} from '../src/jws';
import { ForgeJws } from '../src/types';

const aud = 'https://to.who.it.may.concern';
const newJws: ForgeJws = {
  header: {
    alg: 'ETH',
    typ: 'JWT',
  },
  data: {
    iat: 0,
    exp: 123456,
    iss: 'mario',
    aud,
  },
};
const encodedNewJws =
  'eyJhbGciOiJFVEgiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjAsImV4cCI6MTIzNDU2LCJpc3MiOiJtYXJpbyIsImF1ZCI6Imh0dHBzOi8vdG8ud2hvLml0Lm1heS5jb25jZXJuIn0';

const signedJws: ForgeJws = { ...newJws, signature: 'signature' };
const encodedJws =
  'eyJhbGciOiJFVEgiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjAsImV4cCI6MTIzNDU2LCJpc3MiOiJtYXJpbyIsImF1ZCI6Imh0dHBzOi8vdG8ud2hvLml0Lm1heS5jb25jZXJuIn0.signature';

describe('[JWS]', () => {
  describe('base64 encoding', () => {
    it('encode object', () => {
      const result = base64EncodeFromJS({ alg: 94810 });
      expect(result).to.eql('eyJhbGciOjk0ODEwfQ');
    });

    it('decode object', () => {
      const result = base64DecodeToJS('eyJhbGciOjk0ODEwfQ');
      expect(result).to.eql({ alg: 94810 });
    });
  });

  describe('jws utils', () => {
    it('trim signature', () => {
      const result = trimJwsSignature('the.witch.doctor');
      expect(result).to.eql('the.witch');
    });

    it('decode object', () => {
      const result = encodeUnsignedJws(newJws);
      expect(result).to.eql(encodedNewJws);
    });

    it('decode base 64 encoded token', () => {
      const result = decodeJws(encodedJws);
      expect(result).to.eql(signedJws);
    });

    it('generate new token', () => {
      const result = generateNewJws('0x', aud, 'ETH');

      expect(result.data.exp).to.eql(result.data.iat + 5000);
      expect(result.data.iss).to.eql('0x');
    });
    it('generate new token with exp data', () => {
      const result = generateNewJws('0x', aud, 'ETH', 123);

      expect(result.data.exp).to.eql(result.data.iat + 123);
      expect(result.data.iss).to.eql('0x');
    });
  });
});
