export class BiMap<A extends string, B extends string> {
  private map: { [key: string]: B } = {};
  private reverse: { [key: string]: A } = {};

  constructor(seed: { [key: string]: B }) {
    this.map = { ...seed };
    Object.entries(seed).forEach(([key, val]) => {
      this.reverse[val] = key as any;
    });
  }

  get(key: A): B {
    return this.map[key];
  }

  rev(key: B): A {
    return this.reverse[key];
  }
}
