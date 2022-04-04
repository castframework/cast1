const SecurityTokenBalancesLibrary = artifacts.require(
  'SecurityTokenBalancesLibrary',
);
const IterableBalances = artifacts.require('IterableBalances');
const BasicTokenLibrary = artifacts.require('BasicTokenLibrary');
const OperatorManagerLibrary = artifacts.require('OperatorManagerLibrary');
const SettlementRepositoryLibrary = artifacts.require(
  'SettlementRepositoryLibrary',
);
const SettlementWorkflowLibrary = artifacts.require(
  'SettlementWorkflowLibrary',
);

module.exports = async function (deployer) {
  deployer.deploy(OperatorManagerLibrary);

  await deployer.deploy(SettlementRepositoryLibrary);
  deployer.link(SettlementRepositoryLibrary, SettlementWorkflowLibrary);

  await (deployer.deploy(IterableBalances) as unknown as Promise<void>);
  deployer.link(IterableBalances, [SecurityTokenBalancesLibrary]);

  await deployer.deploy(SecurityTokenBalancesLibrary);
  deployer.link(SecurityTokenBalancesLibrary, [
    BasicTokenLibrary,

    SettlementWorkflowLibrary,
  ]);

  await deployer.deploy(SettlementWorkflowLibrary);

  await (deployer.deploy(BasicTokenLibrary) as unknown as Promise<void>);
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
