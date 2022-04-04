/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

import { Ledger } from '@castframework/models';

export class ForgeInputs {
  enchantement: string;
  description?: string;
}

export class NewTrade {
  kek: string;
}

export class Armor {
  name: string;
  enchantements: string[];
  description: string;
  armorClass: number;
}

export class Equipment {
  name: string;
  enchantements: string[];
  description: string;
}

export abstract class IMutation {
  abstract post(newTrade: NewTrade): Trade | Promise<Trade>;

  abstract burn(): boolean | Promise<boolean>;

  abstract forge(): Weapon | Promise<Weapon>;

  abstract forgeMagick(magickArgs: ForgeInputs): Weapon | Promise<Weapon>;

  abstract smith(): Armor | Promise<Armor>;
}

export abstract class IQuery {
  abstract trade(id?: string): Trade[] | Promise<Trade[]>;

  abstract shop(): Equipment[] | Promise<Equipment[]>;

  abstract shopWeapon(): Weapon[] | Promise<Weapon[]>;

  abstract rollDmg(
    strengthMod: number,
    weaponName: string,
  ): number | Promise<number>;

  abstract shopArmor(): Armor[] | Promise<Armor[]>;

  abstract tradesCSV(): string | Promise<string>;
}

export abstract class ISubscription {
  abstract newWeapon(): Weapon | Promise<Weapon>;

  abstract newArmor(): Armor | Promise<Armor>;
}

export class Trade {
  id: string;
  operationId: number;
  instrumentId: number;
  ledger: Ledger;
  contractAddress: string;
  buyerId: number;
  sellerId: number;
  quantity: number;
  price: number;
  amount: number;
  amountCurrency: string;
  fees: number;
  feesCurrency: string;
  executionDate: string;
  settlementDate: string;
  settlementType: string;
  transactionType: string;
  buyerCashAccount: string;
  buyerLedgerAddress: string;
  sellerCashAddress: string;
  sellerLedgerAddress: string;
  settlementCashAccount: string;
}

export class Weapon {
  name: string;
  enchantements: string[];
  description: string;
  diceType: number;
  numberOfDice: number;
}
