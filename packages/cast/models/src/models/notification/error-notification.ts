import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ErrorNotificationName } from './constants';

@ObjectType()
export class ErrorNotification {
  public constructor(transactionHash: string, message: string) {
    this.transactionHash = transactionHash;
    this.message = message;
    this.notificationName = ErrorNotificationName.Error;
  }
  @Field((returns) => ErrorNotificationName)
  public notificationName: ErrorNotificationName;

  @Field((type) => ID)
  public transactionHash: string;

  @Field({ nullable: true })
  public message: string;
}

export function isErrorNotification(
  errorNotification: any,
): errorNotification is ErrorNotification {
  if (!errorNotification || !errorNotification.notificationName) {
    return false;
  }

  if (ErrorNotificationName[errorNotification.notificationName]) {
    return true;
  }

  return false;
}
