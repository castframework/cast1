# Forge Tezos SmartContracts.

# Diagram

![Smart Contract Diagram](../cast-eth-v1/SmartContractDiagram.png "Smart Contract Diagram")

# Adding a Variable to a Smart Contract

1. Add the field to the storage of the Smart Contract (`types.py`):

```python
T_forgeBondStorage = sp.TRecord(
    isinCode=sp.TString
)
```

2. Add the field to the `viewMapper.ts` file in `cast-interface-v1`. This file is shared with other blockchains, such as Tezos.

```typescript
isinCode: async (storage: ForgeTokenStorage, methodParameters: unknown[]) =>
  storage.isinCode,
```

3. Deploy the changes. If the environment is already running, run the command `make redeploy-tz`. Otherwise, run the command `make start`.

# Adding a Constant to a Smart Contract

1. Add the field to the `viewMapper.ts` file in `cast-interface-v1`. This file is shared with other blockchains, such as Tezos.

```typescript
export const REGISTRAR_ROLE = 1;
```

2. Deploy the changes. If the environment is already running, run the command `make redeploy-tz`. Otherwise, run the command `make start`.

# Adding a Function to a Smart Contract

1. Add the function to the Python file:

```python
@sp.entry_point
def confirmPaymentTransferred(self, params):

    L_confirmPaymentTransferred = loadLambda(
        self.data.entrypointsBigMap,
        LAMBDA.CONFIRM_PAYMENT_TRANSFERRED,
        S_ConfirmPaymentTransferred
    )

    result = L_confirmPaymentTransferred(sp.record(
        txId=params.txId,
        sender=sp.sender,
        owner=self.data.owner,
        operatorsAuthorizations=self.data.operatorsAuthorizations,
        settlementTransactionRepository=self.data.settlementTransactionRepository,
    ))

    self.data.settlementTransactionRepository = result

    self.callEventSinkWithSettlementIdAndSettlementTransactionOperationType(
        settlementId=params.txId,
        settlementTransactionOperationType=OP.SUBSCRIPTION,
        eventName=EVENT.PAYMENT_TRANSFERRED
    )
```

2. Add the function to the TypeScript file in `cast-interface-v1`. This file is shared with other blockchains, such as Tezos.

```typescript
public async confirmPaymentTransferred(
  confirmPaymentTransferredParams: ConfirmPaymentTransferredParams,
  transactionParams?: TransactionParams,
  transactionBlockchainSpecificParams?: Partial<
    BlockchainSpecificParamsOf<Driver>
  >,
): Promise<TransactionReceipt> {
  return this._send<[ConfirmPaymentTransferredParams]>(
    'confirmPaymentTransferred',
    [confirmPaymentTransferredParams],
    transactionParams,
    transactionBlockchainSpecificParams,
  );
}
```

3. Deploy the changes. If the environment is already running, run the command `make redeploy-tz`. Otherwise, run the command `make start`.

### Installation

#### SmartPy

```sh
$ npm install
$ sh <(curl -s https://smartpy.io/dev-20200830-61244befe2c4c321c0ae6f807873e3a77811f20a/cli/SmartPy.sh) local-install-auto
```

### Building

You need to first compile the contract and then the deploy script

#### Contracts

You need to have building command inside your smartPy contract. e.g. :

```python
  sp.compile_contract(
    ForgeInstrumentRegistry(sp.address("KT1-eventSinkContractAddress")),
    target_directory = "dist",
  )
```

And then run it using SmartPy Cli

```sh
~/smartpy-cli/SmartPy.sh run ForgeInstrumentRegistry.py
```

#### Deploy script

Those are still a work in progress

Run `npmr buildDeploy` in cast-tz-v1, use node to run them.

To deploy a contract use `node ./dist/originate ./path/to/directory`

with the following file in the directory: 
- contract_compiled.json
- constract_storage_init.tz

You can also use npm scripts :
- `originateBondFactory`
- `originateBondBuilder`
- `originateEventSink`
- `originateInstrumentRegistry`
 
### Running tests

```sh

yarn  test-createSubscription # test createSubscription  entrypoint

  

ForgeToken: createSubscription

===== BEGIN  BEFORE  HOOK =====

Originating  new  token  contract...

new  tokenContractAddress: KT1CCTNkKYixS1RrQpu52xDSpatDewFQD69p

===== END  BEFORE  HOOK =====

1.  createSubscriptionOpHash: onfGVNoZh2s6Kjcgw6y3C63CEfEsmwvLib9ubmSLotS5YNBNBKh
✓ should  lock  seller  token  when  his  balance  is  higher  than  the  transaction  AMOUNT (25400ms)

2.  createSubscriptionOpHash: oogDK52JhviTeFB6imHNe5Gswu4FydvM2tbGUHmzJbdxLJdBTCP
✓ should  lock  seller  token  when  his  balance  is  equal  to  the  transaction  AMOUNT (26508ms)

3.  createSubscriptionOpHash: ooZjKsjTJuomVkukkbfkbGeSNUBFHMXEAJWQUqZ8TGHwa9wRd31
✓ should  fail  when  not  enough  token  are  available  on  the  seller  balance (35777ms)

MESSAGE: undefined  operator
✓ should  fail  when  operator  is  not  authorised (2667ms)
4  passing (3m)  
✨ Done  in 162.12s.

```

 
```sh

yarn  test-forgeTokenFactory # test  createForgeToken  in  Factory

ForgeTokenFactory: createForgeToken

createForgeTokenOpHash: oo7wherqhyMsaQJBN7t7s3ncNtLYMupS3W6LYAkDtongLFZJ8ry
✓ should  create  a  valid  ForgeToken (should  not  fail  if  no  contract  exists  with  same  name  or  isin) (31149ms)

✓ should  fail  if  a  contract  with  the  same  name  already  exists (2931ms)

✓ should  fail  if  a  contract  with  the  same  isin  code  already  exists (2564ms)

✓ should  fail  if  a  creator  is  not  the  registrar (2529ms)

4  passing (41s)
✨ Done  in 45.95s.
```

# License

Apache 2.0
