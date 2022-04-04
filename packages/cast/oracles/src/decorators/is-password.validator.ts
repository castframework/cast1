import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsPassword(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (object: any, propertyName: string) => {
    registerDecorator({
      propertyName,
      name: 'isPassword',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string /* _args: ValidationArguments */) {
          return /^[a-zA-Z0-9!@#$%^&*]*$/.test(value);
        },
      },
    });
  };
}
