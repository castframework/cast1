import { StubbableType } from 'sinon';
import { Repository } from 'typeorm';
import sinon = require('sinon');

type StubRepository<T> = Repository<T>;

export function getStubRepository<T>(): StubRepository<T> {
  return sinon.createStubInstance(Repository) as unknown as Repository<T>;
}

export function getStubInstance<T>(constructor: StubbableType<T>): T {
  return sinon.createStubInstance(constructor) as unknown as T;
}
