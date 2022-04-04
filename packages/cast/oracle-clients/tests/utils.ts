import { StubbableType } from 'sinon';
import sinon = require('sinon');

export function getStubInstance<T>(constructor: StubbableType<T>): T {
  return sinon.createStubInstance(constructor) as unknown as T;
}
