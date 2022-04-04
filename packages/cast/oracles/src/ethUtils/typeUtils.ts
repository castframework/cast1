export function ethBooleanValue(boolValues: boolean): number {
  return boolValues ? 1 : 0;
}

export function isoDateToSecond(isoString: Date): number {
  return Math.floor(isoString.getTime() / 1000);
}
