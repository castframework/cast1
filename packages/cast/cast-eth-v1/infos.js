var Web3 = require('web3');
const fs = require('fs');
const minimist = require('minimist');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const utils = require('./dist/tools/utils')


module.exports = async function (callback) {

  async function startGiveMoney() {
    const argv = minimist(process.argv.slice(2));

    const networkFolder = argv['network-folder'] ?? process.env['NETWORK_FOLDER'];
  
    if (typeof networkFolder !== 'string') {
      console.error('Network folder argument must be set')
      process.exit(1)
    }
  

    let keys = {};
    if (typeof networkFolder !== 'string') {
      console.error('No network folder set');
      process.exit(1)
    }

    const nodeFilePath = `${networkFolder}/ethereum/node.json`;
    let nodeFile;
    try {
      nodeFile = fs.readFileSync(nodeFilePath, 'utf8');
    } catch (e) {
      console.error(
        `Could not read node.json file for network: ${e.toString()}`,
      );
      process.exit(1)
    }

    try {
      networkObject = JSON.parse(nodeFile);
    } catch (e) {
      console.error(
        `Could not parse node.json file for network: ${e.toString()}`,
      );
      process.exit(1)
    }


    const keysFilePath = `${networkFolder}/ethereum/keys.json`;
    let keysFile;
    try {
      keysFile = fs.readFileSync(keysFilePath, 'utf8');
    } catch (e) {
      console.error(
        `Could not read keys.json file for network: ${e.toString()}`,
      );
      process.exit(1)
    }

    try {
      keys = JSON.parse(keysFile);
    } catch (e) {
      console.error(
        `Could not parse keys.json file for network: ${e.toString()}`,
      );
      process.exit(1)
    }

    try {
      for (const [account, key] of Object.entries(keys)){
        const publicKey = utils.getEthAddress(key);
        const balance = await web3.eth.getBalance(publicKey);
        console.log(
          `${account}[${publicKey}]: ${web3.utils.fromWei(balance, 'ether')} ETH`,
        );
      };
    } catch (err) {
      console.log(err)
      process.exit(1)
    }

    callback();

  }

  startGiveMoney();
}
