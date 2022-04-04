import { extractAddressFromSecret, getTezosToolkitCoinbase } from './utils';
import { smpLog } from './logger';
import { NetworkConfig } from './type';

export async function printInfos(networkConfig: NetworkConfig): Promise<void> {
  const toolkit = await getTezosToolkitCoinbase(networkConfig);

  const mutezToTezDivisor = 1000000;
  const privateKeys = networkConfig.keysConfig;
  const coinbase = networkConfig.coinbase;

  const coinbaseAddress = extractAddressFromSecret(coinbase);
  const coinbaseBalanceInTez = (await toolkit.tz.getBalance(coinbaseAddress))
    .div(mutezToTezDivisor)
    .toNumber();

  smpLog.info(`COINBASE[${coinbaseAddress}]: ${coinbaseBalanceInTez}ꜩ`);

  for (const account of Object.keys(privateKeys)) {
    const privateKey = privateKeys[account];
    const address = extractAddressFromSecret(privateKey);
    const accountCurrentBalanceInTez = (
      await toolkit.tz.getBalance(address)
    ).div(mutezToTezDivisor);
    smpLog.info(`${account}[${address}]: ${accountCurrentBalanceInTez}ꜩ`);
  }
}
