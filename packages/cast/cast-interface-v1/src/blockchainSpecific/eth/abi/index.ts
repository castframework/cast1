import ForgeFactory = require('./ForgeBondFactory.json');
import ForgeBond = require('./ForgeBond.json');
import InstrumentRegistry = require('./ForgeInstrumentRegistry.json');
import { ForgeContractType } from '../../../types';

type ContractTypeMapping = {
  [key in ForgeContractType]: any;
};

export const AbiMapping: ContractTypeMapping = {
  [ForgeContractType.BOND]: ForgeBond,
  [ForgeContractType.BOND_FACTORY]: ForgeFactory,
  [ForgeContractType.EMTN_FACTORY]: null,
  [ForgeContractType.INSTRUMENT_REGISTRY]: InstrumentRegistry,
};

export function getAbi(type: ForgeContractType ): any {
  return AbiMapping[type];
}
