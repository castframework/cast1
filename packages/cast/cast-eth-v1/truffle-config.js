var Web3 = require('web3');
const fs = require('fs');
const minimist = require('minimist');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const argv = minimist(process.argv.slice(2));

const networkFolder = argv['network-folder'] ?? process.env['NETWORK_FOLDER'];

let networkObject = {};
let keys = {};
if (typeof networkFolder !== 'string') {
  console.error('No network folder set');
} else {
  const nodeFilePath = `${networkFolder}/ethereum/node.json`;
  let nodeFile;
  try {
    nodeFile = fs.readFileSync(nodeFilePath, 'utf8');
  } catch (e) {
    console.error(
      `Could not read node.json file for network: ${e.toString()}`,
    );
    throw e;
  }

  try {
    networkObject = JSON.parse(nodeFile);
  } catch (e) {
    console.error(
      `Could not parse node.json file for network: ${e.toString()}`,
    );
    throw e;
  }


  const keysFilePath = `${networkFolder}/ethereum/keys.json`;
  let keysFile;
  try {
    keysFile = fs.readFileSync(keysFilePath, 'utf8');
  } catch (e) {
    console.error(
      `Could not read keys.json file for network: ${e.toString()}`,
    );
    throw e;
  }

  try {
    keys = JSON.parse(keysFile);
  } catch (e) {
    console.error(
      `Could not parse keys.json file for network: ${e.toString()}`,
    );
    throw e;
  }

  let provider = undefined;
  if (!typeof networkObject.host === 'string') {
    throw Error(`Host property for network ${network} must be set`);
  }

  provider = () => new HDWalletProvider(
        {
          privateKeys: [...Object.values(keys), process.env.GANACHE_PRIV],
          provider: networkObject.host,
          addressIndex: 0,
          numberOfAddresses: 15          
         }
      );

  networkObject = {
    ...networkObject,
    provider,
  };
}


module.exports = {
  contracts_build_directory: "./dist/contracts",
  migrations_directory: "./dist/migrations",
  plugins: ['solidity-coverage', 'truffle-security'],
  mocha: {
    // not working currently because globals(artifacts, web3, assert, expect) are not shared between processes
    // package: require('mocha-parallel-tests').default,
    require: 'esm',
    reporter: 'mocha-multi-reporters',
    reporterOptions: { configFile: 'mocha-multi-reporters.json' },
    slow: 1000,
  },
  compilers: {
    solc: {
      version: '0.8.0',
      docker: false,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  networks: {
    default: networkObject,
  },
};
