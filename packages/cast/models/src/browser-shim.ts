/*
  Copyed from type-graphql repo and adapted to our need.
  
  Original type-graphql documentation :

  This "shim" can be used on the frontend to prevent from errors on undefined decorators,
  when you are sharing same classes across backend and frontend.
  To use this shim, simply set up your Webpack configuration
  to use this file instead of a normal TypeGraphQL module.
  ```js
  plugins: [
    // ...here are any other existing plugins that you already have
    new webpack.NormalModuleReplacementPlugin(/type-graphql$/, resource => {
      resource.request = resource.request.replace(/type-graphql/, "type-graphql/dist/browser-shim");
    }),
  ]
  ```
  However, in some TypeScript projects like the ones using Angular,
  which AoT compiler requires that a full `*.ts` file is provided
  instead of just a `*.js` and `*.d.ts` files, to use this shim
  we have to simply set up our TypeScript configuration in `tsconfig.json`
  to use this file instead of a normal TypeGraphQL module:
  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "type-graphql": [
          "./node_modules/type-graphql/dist/browser-shim.ts"
        ]
      }
    }
  }
  ```
*/

export const dummyValue = '';
export function dummyFn(): void {
  return;
}
export function dummyDecorator(): () => void {
  return dummyFn;
}

export const Args: any = dummyDecorator;
export const ArgsType: any = dummyDecorator;
export const Authorized: any = dummyDecorator;
export const createUnionType: any = dummyFn as any;
export const Ctx: any = dummyDecorator;
export const CustomScalar: any = dummyDecorator;
export const Field: any = dummyDecorator;
export const FieldResolver: any = dummyDecorator;
export const Float: any = dummyValue as any;
export const GraphQLISODateTime: any = dummyValue as any;
export const GraphQLTimestamp: any = dummyValue as any;
export const ID: any = dummyValue as any;
export const Info: any = dummyDecorator;
export const InputType: any = dummyDecorator;
export const Int: any = dummyValue as any;
export const InterfaceType: any = dummyDecorator;
export const Mutation: any = dummyDecorator;
export const ObjectType: any = dummyDecorator;
export const OmitType: any = (type) => type;
export const Query: any = dummyDecorator;
export const registerEnumType: any = dummyFn;
export const Resolver: any = dummyDecorator;
export const Root: any = dummyDecorator;
export const Scalar: any = dummyDecorator;
export const Subscription: any = dummyDecorator;
export const UseMiddleware: any = dummyDecorator;
