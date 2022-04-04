import { Property } from 'ts-convict';

export class GraphqlConfig {
  @Property({
    default: false,
    env: 'GRAPHQL_ENABLE_INSTROSPECTION',
    format: Boolean,
  })
  public enableIntrospection: boolean;

  @Property({
    default: false,
    env: 'GRAPHQL_ENABLE_PLAYGROUND',
    format: Boolean,
  })
  public enablePlayground: boolean;

  @Property({
    default: false,
    env: 'GRAPHQL_ENABLE_DEBUG',
    format: Boolean,
  })
  public enableDebug: boolean;

  @Property({
    default: false,
    env: 'GRAPHQL_ENABLE_TRACING',
    format: Boolean,
  })
  public enableTracing: boolean;
}
