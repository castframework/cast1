import { expect } from 'chai';
import { InstrumentPosition } from '@castframework/models';

export const validatePosition = (
  response: InstrumentPosition,
  instrumentPositionExpected: InstrumentPosition,
): void => {
  expect(response.instrumentAddress).to.equal(
    instrumentPositionExpected.instrumentAddress,
  );
  expect(response.ledger).to.equal(instrumentPositionExpected.ledger);
  expect(response.balance).to.equal(instrumentPositionExpected.balance);
  expect(response.legalEntityAddress.toLowerCase()).to.equal(
    instrumentPositionExpected.legalEntityAddress.toLowerCase(),
  );
  expect(response.currency).to.equal(instrumentPositionExpected.currency);
  expect(response.percentage).to.equal(instrumentPositionExpected.percentage);
  expect(response.unlocked).to.equal(instrumentPositionExpected.unlocked);
  expect(response.locked).to.equal(instrumentPositionExpected.locked);
};
