import { Env, ScenarioData } from '../types';
import { validatePosition } from '../helpers/validatePosition';
import {
  Currency,
  InstrumentPosition,
  InstrumentType,
} from '@castframework/models';
import { expect } from 'chai';

export async function validatePositionsAfterIssuanceStep(
  env: Env,
  scenarioData: ScenarioData<InstrumentType>,
): Promise<void> {
  const positions = await env.froClient.getInstrumentPositions(
    scenarioData.instrumentAddress,
    scenarioData.ledger,
  );

  const issuerPosition = positions.find(
    (position) =>
      position.legalEntityAddress.toLowerCase() ===
      scenarioData.instrumentInput.issuerAddress?.toLowerCase(),
  );

  expect(issuerPosition).to.exist;

  const initialSupply =
    (scenarioData.instrumentInput.nominalAmount as number) /
    (scenarioData.instrumentInput.denomination as number);

  const expectedIssuerBalance = initialSupply;

  const expectedLockedIssuerBalance = 0;

  const expectedUnLockedIssuerBalance = initialSupply;

  const expectedPercentage = expectedIssuerBalance / initialSupply;

  await validatePosition(issuerPosition as InstrumentPosition, {
    instrumentAddress: scenarioData.instrumentAddress,
    ledger: scenarioData.ledger,
    balance: expectedIssuerBalance,
    legalEntityAddress: scenarioData.instrumentInput.issuerAddress as string,
    symbol: 'null',
    valueInFiat: 0,
    currency: scenarioData.instrumentInput.currency as Currency,
    percentage: expectedPercentage,
    unlocked: expectedUnLockedIssuerBalance,
    locked: expectedLockedIssuerBalance,
  });
}
