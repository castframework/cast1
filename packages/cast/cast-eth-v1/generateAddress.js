const ethereumjsWallet = require('ethereumjs-wallet').default;
const fs = require('fs');

async function startGenerateAddress() {
  const outFilePath = './../../../.env';
  const wallet = ethereumjsWallet.generate();
  fs.writeFileSync(outFilePath, `GANACHE_ADDRESS="${wallet.getAddressString()}"\nGANACHE_PRIV="${wallet.getPrivateKeyString()}"`);
}

startGenerateAddress();
