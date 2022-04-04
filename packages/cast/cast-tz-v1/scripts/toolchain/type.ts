export type MichelsonExpression = string;
export type TezosAddress = string;
export type TezosKey = string;

export type JSONMichelsonArgs = {
  prim: string;
  annots?: Array<string>;
  args?: Array<JSONMichelsonArgs | Array<JSONMichelsonArgs>>;
};

export type JSONMichelson = Array<JSONMichelsonArgs>;

export type FlexTesaAccount = {
  publicAddress: TezosAddress;
  publicKey: TezosKey;
  privateKey: TezosKey;
};

export type EnvironmentConfig = {
  factoryAddress: TezosAddress;
  eventSinkContractAddress: TezosAddress;
  builderContractAddress: TezosAddress;
};

export type ContractsConfig = { [contractName: string]: string };
export type KeysConfig = {
  SG_FORGE: TezosKey;
  REGISTRAR: TezosKey;
  ISSUER_1: TezosKey;
  DEALER_1: TezosKey;
  DEALER_2: TezosKey;
  SETTLEMENT_AGENT: TezosKey;
  STR: TezosKey;
};
export type ContractConfig = {
  ADMIN: TezosKey;
  REGISTRAR: TezosKey;
  SINK: TezosKey;
  REGISTRY: TezosKey;
  LAMBDA_BOND: TezosKey;
  FACTORY_BOND: TezosKey;
  LAMBDA_EMTN: TezosKey;
  FACTORY_EMTN: TezosKey;
};
export type NodeConfig = { host: string };

export type NetworkConfig = {
  coinbase: TezosKey;
  keysConfig: KeysConfig;
  nodeConfig: NodeConfig;
  contractConfig: ContractConfig;
};

export type SmpConfig = {
  srcDir: string;
  pattern: string;
};
