import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TimeFrame {
  @Field(() => Date)
  public start: Date;

  @Field(() => Date)
  public end: Date;
}
