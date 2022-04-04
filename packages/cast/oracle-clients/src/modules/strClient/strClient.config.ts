import { Property } from 'ts-convict';

export class StrClientConfig {
  @Property({
    default: null,
    env: 'STR_GQL_URL',
    format: String,
  })
  public strGraphQLEndpoint: string;
}
