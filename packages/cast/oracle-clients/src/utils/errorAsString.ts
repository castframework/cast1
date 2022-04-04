import { GraphQLError } from 'graphql/error/GraphQLError';

export function errorAsString(err: any): string {
  return err instanceof Error ? (err as Error).message : JSON.stringify(err);
}

export function graphqlErrorsAsString(
  errors: ReadonlyArray<GraphQLError>,
): string {
  return errors?.join(', ');
}
