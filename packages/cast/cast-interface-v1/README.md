# ForgeBondFactory 
## Usage

```typescript
import { getLogger } from 'log4js';
import { PrivateKeySigner, TezosBlockchainDriver } from '@castframework/blockchain-driver-tz';
import { TransactionManager } from '@castframework/transaction-manager';
import {
    ForgeBondFactory,
    ForgeTokenFactoryEventMappers,
    ForgeTokenFactoryViewMappers
} from '@castframework/cast-interface-v1';

// Initialize a driver for the chosen blockchain
const driver = new TezosBlockchainDriver({
    config: { pollingIntervalInSeconds: 1, defaultConfirmationCount: 1 },
    nodeURL: 'https://localhost:20000/',
    signer: new PrivateKeySigner('<Insert Private Key>')
});
driver.setLogger(getLogger('Driver Tezos'));
await driver.initialize();

// Create a TransactionManager using the created driver
const transactionManager = new TransactionManager({
    logger: getLogger('TransactionManager'),
    driver: driver,
});

const forgeBondFactory = new ForgeBondFactory(
    '<Insert Smart Contract Address>',
    transactionManager,
    { viewMappers: ForgeTokenFactoryViewMappers, eventMappers: ForgeTokenFactoryEventMappers });

// Example values for a test
const createForgeBondParams = {
    initialSupply: 1000,
    isinCode: faker.random.alphaNumeric(10),
    name: faker.random.alphaNumeric(10),
    symbol: faker.random.alphaNumeric(10),
    denomination: 100,
    divisor: 1000,
    startDate: 1577833200,
    initialMaturityDate: 1609455600,
    firstCouponDate: 1578265200,
    couponFrequencyInMonths: 10,
    interestRateInBips: 10,
    callable: true,
    isSoftBullet: true,
    softBulletPeriodInMonths: 10,
    currency: 'EUR',
    registrar: '<Insert Registrar Address>',
    settler: '<Insert Settler Address>',
    owner: '<Insert Owner Address>',
  };

  // Use the ForgeBondFactory interface to create a Forge bond
  const result = await forgeBondFactory.createForgeBond('<Insert Registrar Address>', createForgeBondParams);
```

## Configuration

| Property | Type | Description |
| ------- | ----------- | ----------- |
| `smartContractAddress` | string | Address of the Smart Contract |
| `transactionManager` | TransactionManager<Driver> | Transaction Manager|
| `contractBlockchainSpecificParams` | Partial<BlockchainSpecificParamsOf<Driver>> | Parameters specific to the blockchain |

# ForgeBond
## Usage

```typescript
import { ForgeBond, ForgeBondABI } from '@castframework/cast-interface-v1';
const forgeBondAbi = ForgeBondABI as unknown as AbiItem;

// Get an instrument address
const instrumentListed = forgeBondFactory
    .InstrumentListed()
    .pipe(multicast(() => new ReplaySubject(1))) as unknown as ObservableToConnectableObservable<
    ReturnType<ForgeBondFactory<EthereumBlockchainDriver>['InstrumentListed']>
    >;
const instrumentListedEvent = await instrumentListed.pipe(first()).toPromise();
const newInstrumentAddress = instrumentListedEvent.payload._instrumentAddress;

// Create a ForgeBond using the transaction manager (see ForgeBondFactory usage)
const bond = new ForgeBond(newInstrumentAddress, transactionManager, { abi: forgeBondAbi });
const result = await bond.initiateSubscription(
    {
        txId: uuidToFixed('<Insert UUID>'),
        txHash: 'txHash',
        operationId: uuidToFixed('<Insert UUID>'),
        deliverySenderAccountNumber: '<Insert Address>',
        deliveryReceiverAccountNumber: '<Insert Address>',
        deliveryQuantity: 100
    },
    transactionParams);
```

## Configuration

| Property | Type | Description |
| ------- | ----------- | ----------- |
| `smartContractAddress` | string | Address of the Smart Contract |
| `transactionManager` | TransactionManager<Driver> | Transaction Manager|
| `contractBlockchainSpecificParams` | Partial<BlockchainSpecificParamsOf<Driver>> | Parameters specific to the blockchain |