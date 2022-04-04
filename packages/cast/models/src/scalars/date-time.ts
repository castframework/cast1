import { GraphQLScalarType, Kind } from 'graphql';

export const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  parseValue(value) {
    return new Date(value); // value from the client
  },
  serialize(value: Date) {
    return value.toISOString(); // value sent to the client
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return ast.value; // ast value is always in string format
    }
    return null;
  },
});
