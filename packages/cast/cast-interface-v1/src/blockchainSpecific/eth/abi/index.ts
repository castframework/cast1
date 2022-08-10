import ForgeFactory = require('@castframework/cast-eth-v1/dist/abi/ForgeBondFactory.json');
import ForgeBond = require('@castframework/cast-eth-v1/dist/abi/ForgeBond.json');
import InstrumentRegistry = require('@castframework/cast-eth-v1/dist/abi/ForgeInstrumentRegistry.json');
import OnDemandOracle = require('@castframework/cast-eth-v1/dist/abi/OnDemandOracle.json');
import { ForgeContractType } from '../../../types';

type ContractTypeMapping = {
  [key in ForgeContractType]: any;
};

export const AbiMapping: ContractTypeMapping = {
  [ForgeContractType.BOND]: ForgeBond,
  [ForgeContractType.BOND_FACTORY]: ForgeFactory,
  [ForgeContractType.EMTN_FACTORY]: null,
  [ForgeContractType.INSTRUMENT_REGISTRY]: InstrumentRegistry,
  [ForgeContractType.ON_DEMAND]: OnDemandOracle,
};

export function getAbi(type: ForgeContractType): any {
  return AbiMapping[type];
}
