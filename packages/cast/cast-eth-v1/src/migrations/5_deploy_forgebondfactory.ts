import {
  ForgeBondFactoryInstance,
  ForgeInstrumentRegistryInstance,
} from '../../dist/types';
import { getRegistrarAddressForNetwork } from '../tools/utils';
import minimist from 'minimist';
const BasicTokenLibrary = artifacts.require('BasicTokenLibrary');
const SecurityTokenBalancesLibrary = artifacts.require(
  'SecurityTokenBalancesLibrary',
);
const ForgeInstrumentRegistry = artifacts.require('ForgeInstrumentRegistry');
const ForgeBondFactory = artifacts.require('ForgeBondFactory');
const OperatorManagerLibrary = artifacts.require('OperatorManagerLibrary');
const SettlementRepositoryLibrary = artifacts.require(
  'SettlementRepositoryLibrary',
);
const SettlementWorkflowLibrary = artifacts.require(
  'SettlementWorkflowLibrary',
);
const IterableBalances = artifacts.require('IterableBalances');

module.exports = async function (deployer, network, accounts) {
  const argv = minimist(process.argv.slice(2));
  const networkFolder = argv['network-folder'] ?? process.env['NETWORK_FOLDER'];

  deployer.link(IterableBalances, ForgeBondFactory);
  deployer.link(SecurityTokenBalancesLibrary, ForgeBondFactory);
  deployer.link(BasicTokenLibrary, ForgeBondFactory);
  deployer.link(OperatorManagerLibrary, ForgeBondFactory);
  deployer.link(SettlementRepositoryLibrary, ForgeBondFactory);
  deployer.link(SettlementRepositoryLibrary, ForgeBondFactory);
  deployer.link(SettlementWorkflowLibrary, ForgeBondFactory);

  if (typeof networkFolder !== 'string') {
    console.error('Network folder argument must be set to deploy Bond factory');
    return;
  }

  const registrarAddress = getRegistrarAddressForNetwork(networkFolder);

  const instrumentRegistry: ForgeInstrumentRegistryInstance =
    await ForgeInstrumentRegistry.deployed();
  console.log(
    `Deploying bond factory for registrarAddress[${registrarAddress}] instrumentRegistryAddress[${instrumentRegistry.address}]`,
  );
  await deployer.deploy(ForgeBondFactory, registrarAddress);
  const factory: ForgeBondFactoryInstance = await ForgeBondFactory.deployed();

  console.log(
    `Registering factory[${factory.address}] on instrument registry[${instrumentRegistry.address}]`,
  );
  await instrumentRegistry.authorizeFactory('Bond', factory.address, {
    from: registrarAddress,
  });
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
//Serializer.set(ForgeBondFactory.contractName, ForgeBondFactory.address)
