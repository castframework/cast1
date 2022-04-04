import { extractAddressFromSecret, getTezosToolkitCoinbase } from './utils';
import { smpLog } from './logger';
import { NetworkConfig } from './type';
import { BigNumber } from 'bignumber.js';

export async function distributeTez(
  networkConfig: NetworkConfig,
  amount: number,
): Promise<void> {
  const toolkit = await getTezosToolkitCoinbase(networkConfig);

  const mutezToTezDivisor = 1000000;
  const giveThreshold = Math.round(amount * 0.8); // Do not give Tez if account have at least this amount

  smpLog.info(
    `Threshold is ${giveThreshold}ꜩ. Accounts with less than ${giveThreshold}ꜩ will not receive anything.`,
  );

  const privateKeys = networkConfig.keysConfig;
  const coinbase = networkConfig.coinbase;

  const coinbaseAddress = extractAddressFromSecret(coinbase);
  const coinbaseBalanceInTez = (await toolkit.tz.getBalance(coinbaseAddress))
    .div(mutezToTezDivisor)
    .toNumber();

  smpLog.info(`Coinbase address: ${coinbaseAddress}`);
  smpLog.info(`Current coinbase balance: ${coinbaseBalanceInTez}ꜩ`);

  for (const account of Object.keys(privateKeys)) {
    const privateKey = privateKeys[account];
    const address = extractAddressFromSecret(privateKey);
    const accountCurrentBalanceInTez = (
      await toolkit.tz.getBalance(address)
    ).div(mutezToTezDivisor);
    smpLog.info(`${account}[${address}] has ${accountCurrentBalanceInTez}ꜩ`);

    if (
      accountCurrentBalanceInTez.isGreaterThan(new BigNumber(giveThreshold))
    ) {
      smpLog.info(
        `${account}[${address}] balance is more than give threshold (${giveThreshold}): ${accountCurrentBalanceInTez}ꜩ. Skipping`,
      );
      continue;
    }

    const amountToTransfer = Math.round(
      amount - accountCurrentBalanceInTez.toNumber(),
    );

    smpLog.info(`Transferring ${amountToTransfer} to ${account}[${address}]`);

    const transferOperation = await toolkit.contract.transfer({
      to: address,
      amount: amountToTransfer,
    });
    await transferOperation.confirmation();

    const accountNewBalanceInTez = (await toolkit.tz.getBalance(address)).div(
      mutezToTezDivisor,
    );

    smpLog.info(
      `${account}[${address}] balance updated from ${accountCurrentBalanceInTez}ꜩ to ${accountNewBalanceInTez}ꜩ`,
    );
  }
  const adminFinalBalanceInTez = (await toolkit.tz.getBalance(coinbaseAddress))
    .div(mutezToTezDivisor)
    .toNumber();

  smpLog.info(`Final coinbase balance: ${adminFinalBalanceInTez}ꜩ`);
}
