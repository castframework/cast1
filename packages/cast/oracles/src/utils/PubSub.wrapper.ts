import { PubSub } from 'graphql-subscriptions';
import { Injectable } from '@nestjs/common';
import { getLogger } from './logger';
import { Logger } from 'log4js';

class AsyncIteratorWrapper<T> implements AsyncIterableIterator<T> {
  constructor(private asyncIterator: AsyncIterator<T>) {}

  public next(): Promise<IteratorResult<T, any>> {
    return this.asyncIterator.next();
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

@Injectable()
export class ForgePubSub extends PubSub {
  private logger: Logger = getLogger(this.constructor.name);

  public publish(triggerName: string, payload: any): Promise<void> {
    if (triggerName !== 'heartbeatNotification') {
      // avoid spam
      this.logger.debug(
        `Publish event trigger[${triggerName}] payload[${JSON.stringify(
          payload,
        )}]`,
      );
    }
    return super.publish(triggerName, { [triggerName]: payload });
  }

  public asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    // actually we have to return an AsyncIterableIterator because
    // SubscriptionServer expects an AsyncIterable
    // the subscription filtering mechanism(@nestjs/graphql/utils/asyn-iterator.util.ts) expects an AsyncIterator
    return new AsyncIteratorWrapper<T>(super.asyncIterator<T>(triggers));
  }
}
