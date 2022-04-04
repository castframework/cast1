import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  public tableName(className: string, customName: string): string {
    return customName ? customName : snakeCase(className);
  }

  public columnName(
    propertyName: string,
    customName: string,
    embeddedPrefixes: string[],
  ): string {
    return (
      snakeCase(embeddedPrefixes.join('_')) +
      (customName ? customName : snakeCase(propertyName))
    );
  }

  public relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }

  public joinColumnName(
    relationName: string,
    referencedColumnName: string,
  ): string {
    return snakeCase(relationName + '_' + referencedColumnName);
  }

  public joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    // _secondPropertyName: string,
  ): string {
    return snakeCase(
      firstTableName +
        '_' +
        firstPropertyName.replace(/\./gi, '_') +
        '_' +
        secondTableName,
    );
  }

  public joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return snakeCase(
      tableName + '_' + (columnName ? columnName : propertyName),
    );
  }

  public classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string,
  ): string {
    return snakeCase(parentTableName + '_' + parentTableIdPropertyName);
  }
}
