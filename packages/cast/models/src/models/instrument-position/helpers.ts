import { InstrumentPosition } from './instrument-position';
import { Ledger } from '../constants';
import * as faker from 'faker';
import { Currency } from '../operations';

export class InstrumentPositionHelpers {
  public static givenInstrumentPosition(
    partialInstrumentPosition: Partial<InstrumentPosition> = {},
  ): InstrumentPosition {
    const balance = faker.datatype.number({
      min: 0.01,
      max: 1000,
      precision: 2,
    });

    const denomination =
      1000 *
      faker.datatype.number({
        min: 1,
        max: 100,
        precision: 0,
      });

    const ledger = faker.helpers.randomize<Ledger>(
      Object.keys(Ledger).map((key) => Ledger[key]),
    );
    const currency = faker.helpers.randomize<Currency>(
      Object.keys(Currency).map((key) => Currency[key]),
    );

    const data = {
      instrumentAddress: faker.finance.ethereumAddress(),
      legalEntityAddress: faker.finance.ethereumAddress(),
      ledger: ledger,
      balance: balance,
      currency: currency,
      symbol: faker.finance.currencySymbol(),
      valueInFiat: balance * denomination,
    };

    return {
      ...data,
      ...partialInstrumentPosition,
    };
  }

  public static givenNInstrumentPosition(
    n: number,
    partialInstrumentPosition: Partial<InstrumentPosition> = {},
  ): InstrumentPosition[] {
    return new Array(n)
      .fill(undefined)
      .map(() =>
        InstrumentPositionHelpers.givenInstrumentPosition(
          partialInstrumentPosition,
        ),
      );
  }

  public static givenInstrumentPositionFor(
    instrumentAddress: string,
    legalEntityAddress: string,
    ledger: Ledger,
  ): InstrumentPosition {
    const balance = faker.datatype.number({
      min: 0.01,
      max: 1000,
      precision: 2,
    });

    const denomination =
      1000 *
      faker.datatype.number({
        min: 1,
        max: 100,
        precision: 0,
      });

    const currency = faker.helpers.randomize<Currency>(
      Object.keys(Currency).map((key) => Currency[key]),
    );

    return {
      instrumentAddress: instrumentAddress,
      legalEntityAddress: legalEntityAddress,
      ledger,
      balance,
      currency,
      symbol: faker.finance.currencySymbol(),
      valueInFiat: balance * denomination,
    };
  }
}
