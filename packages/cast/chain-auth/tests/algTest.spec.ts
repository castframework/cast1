import { AlgTestParam, testBuilder } from './algTest';

import { ethAlg } from '../src/eth/eth';
import { tzAlg } from '../src/tz/tz';

describe('Known Alg full interface test', () => {
  const testParams: AlgTestParam[] = [
    {
      algName: 'ETH',
      sk: '0x459975a29bf64c03a92388f8ae50bdc7eb7df4ff5ede58c58c626fa9be67a76a',
      pk:
        '0x58d9e3ac6ea256fa907db156e3a129f6b1228fc2a01748f2027706a79df5c90ca28f196d92c7417b90f520fef5f5c81d59ce745dfecce0e89b56d757f46f14dd',
      pkh: '0xe447fA2Bc17668112CAe2Dc7752387f695C322Cf',
      unsignedJws: `eyJhbGciOiJFVEgiLCJ0eXAiOiJKV1QifQ==.eyJpYXQiOjAsImV4cCI6NTAwMTU5Njc5OTE4NzE2NiwiaXNzIjoiMHg1OGQ5ZTNhYzZlYTI1NmZhOTA3ZGIxNTZlM2ExMjlmNmIxMjI4ZmMyYTAxNzQ4ZjIwMjc3MDZhNzlkZjVjOTBjYTI4ZjE5NmQ5MmM3NDE3YjkwZjUyMGZlZjVmNWM4MWQ1OWNlNzQ1ZGZlY2NlMGU4OWI1NmQ3NTdmNDZmMTRkZCIsImF1ZCI6Imh0dHBzOi8vdG8ud2hvLml0Lm1heS5jb25jZXJuIn0=`,
      sig:
        '0x5140dc90b169b2cfedeced8d39554b296ca782506ab0bd857502541ebfc3ea473842bfd7bda24bb3ae5dad2de1321531dfb250d8c6655e26d9446618582194461b',
      alg: ethAlg,
    },
    {
      algName: 'TZ',
      sk:
        'edskS5s6m6ACFPoNaNJY5xfrSBvKDdbCjFPTq5BiF23rmLL7zxc8tBhyzqorapc6gXofoNSKh1N17aBPYc5mhQXqUJ47TPZ6tg',
      pk: 'edpkuT4d9VwyPsLAsT4djGBnvjCjMzcbeogBRDGfWPPYSJVYrx89po',
      pkh: 'tz1iCQzPkQYTBcbE4bEPHorN6neQYbch83yz',
      unsignedJws: `eyJhbGciOiJFVEgiLCJ0eXAiOiJKV1QifQ==.eyJpYXQiOjAsImV4cCI6NTAwMTU5Njc5OTE4NzE2NiwiaXNzIjoiMHg1OGQ5ZTNhYzZlYTI1NmZhOTA3ZGIxNTZlM2ExMjlmNmIxMjI4ZmMyYTAxNzQ4ZjIwMjc3MDZhNzlkZjVjOTBjYTI4ZjE5NmQ5MmM3NDE3YjkwZjUyMGZlZjVmNWM4MWQ1OWNlNzQ1ZGZlY2NlMGU4OWI1NmQ3NTdmNDZmMTRkZCIsImF1ZCI6Imh0dHBzOi8vdG8ud2hvLml0Lm1heS5jb25jZXJuIn0=`,
      sig:
        'edsigteHdVrh36Muh6BrvjVQC3UGLGcwqwXC2YEq3thsmU7pNgJ9BgKmRxWD6eaFAjaBLxM2K642TChUj7ne2Y4h4fYmMGLDf61',
      alg: tzAlg,
    },
  ];

  testParams.forEach((element) => {
    describe(element.algName, testBuilder(element));
  });
});
