var Web3 = require('web3');
const fs = require('fs');
const minimist = require('minimist');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const utils = require('./dist/tools/utils');


module.exports = async function (callback) {

  async function startGiveMoney() {
    const argv = minimist(process.argv.slice(2));
    const ganacheAddress = process.env.GANACHE_ADDRESS;
    const networkFolder = argv['network-folder'] ?? process.env['NETWORK_FOLDER'];
    const amount = argv['amount'];
  
    if (typeof networkFolder !== 'string') {
      console.error('Network folder argument must be set')
      process.exit(1)
    }
  
  
    if (typeof amount !== 'number') {
      console.error('Amount argument must be set')
      process.exit(1)
    }
  
    if (isNaN(amount) || amount === 0) {
      console.error('Incorrect amount argument has been set')
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

    const giveThreshold = Math.round(amount * 0.8); // Do not give ETH if account have at least this amount
    console.log(`Threshold is ${giveThreshold} ETH. Accounts with less than ${giveThreshold} ETH will not receive anything.`);

    try {
      for (const [account, key] of Object.entries(keys)){
        const ethAddress = utils.getEthAddress(key);
        const balance = await web3.eth.getBalance(ethAddress);

        console.log(
          `${account}[${ethAddress}] has ${web3.utils.fromWei(balance, 'ether')} ETH`,
        );

        if (web3.utils.fromWei(balance, 'ether') >= giveThreshold) {
          console.log(
            `${account}[${ethAddress}] balance is more than give threshold (${giveThreshold}): ${web3.utils.fromWei(balance, 'ether')} ETH. Skipping`,
          );
          continue;
        }

        const amountToSend = amount - web3.utils.fromWei(balance, 'ether');

        console.log(
          `Transferring ${amountToSend} to ${account}[${ethAddress}]`,
        );

        await web3.eth.sendTransaction({
          from: ganacheAddress,
          to: ethAddress,
          value: web3.utils.toWei(amountToSend.toString(), 'ether'),
        });
        const balance_after = await web3.eth.getBalance(ethAddress);

        console.log(
          `${account}[${ethAddress}] balance updated from ${web3.utils.fromWei(balance, 'ether')} ETH to ${web3.utils.fromWei(balance_after, 'ether')} ETH`,
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
