import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import * as _ from 'lodash';

/**
 * @example
 *   @ApiModelProperty()
 *   @IsInt()
 *   startAge: number;
 *
 *   @ApiModelProperty()
 *   @IsInt()
 *   @IsGreaterThan('startAge')
 *   endAge: number;
 * @param {string} property
 * @param {ValidationOptions} validationOptions
 * @returns {PropertyDecorator}
 * @constructor
 */
export function IsGreaterThan(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      name: 'isGreaterThan',
      target: object.constructor,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: number, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue: number = args.object[relatedPropertyName];
          return (
            _.isNumber(value) &&
            _.isNumber(relatedValue) &&
            value > relatedValue
          );
        },
      },
    });
  };
}
