import { v4 } from 'uuid';
import { expect } from 'chai';
import {
  bnToUuid,
  uuidToBn,
  uuidToFixed,
} from '../../../src/utils/bigNumberUtils';
import BigNumber from 'bignumber.js';

describe('[Unit] bigNumberUtils Tests', () => {
  it('[bigNumberUtils] Test UUID to Big Number then UUID', async () => {
    const uuid = v4();
    const bn = uuidToBn(uuid);
    const result = bnToUuid(bn);

    expect(result).to.equal(uuid);
  });

  it('[bigNumberUtils] Test UUID to Big Number fixed then UUID', async () => {
    const uuid = v4();
    const uuidtoFixed = uuidToFixed(uuid);
    const result = bnToUuid(new BigNumber(uuidtoFixed));

    expect(result).to.equal(uuid);
  });
});
