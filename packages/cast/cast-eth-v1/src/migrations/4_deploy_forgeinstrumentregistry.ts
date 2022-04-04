import { getRegistrarAddressForNetwork } from '../tools/utils';
import minimist from 'minimist';

const ForgeInstrumentRegistry = artifacts.require('ForgeInstrumentRegistry');

module.exports = function (deployer, network, accounts) {
  const argv = minimist(process.argv.slice(2));
  const networkFolder = argv['network-folder'] ?? process.env['NETWORK_FOLDER'];

  if (typeof networkFolder !== 'string') {
    console.error('Network folder argument must be set to deploy Registry');
    return;
  }

  const registrarAddress = getRegistrarAddressForNetwork(networkFolder);

  console.log(
    `Deploying instrument registry for registrarAddress[${registrarAddress}]`,
  );
  return deployer.deploy(ForgeInstrumentRegistry, registrarAddress);
} as Truffle.Migration;

// because of https://stackoverflow.com/questions/40900791/cannot-redeclare-block-scoped-variable-in-unrelated-files
export {};
