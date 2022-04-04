'use strict';

import { Transform, TransformFnParams } from 'class-transformer';
import * as _ from 'lodash';

/**
 * @description trim spaces from start and end, replace multiple spaces with one.
 * @example
 * @ApiModelProperty()
 * @IsString()
 * @Trim()
 * name: string;
 * @returns {(target: any, key: string) => void}
 * @constructor
 */
export function Trim(): (target: unknown, key: string) => void {
  return Transform((params: TransformFnParams) => {
    if (_.isArray(params.value)) {
      return params.value.map((v) => _.trim(v).replace(/\s\s+/g, ' '));
    }
    return _.trim(params.value).replace(/\s\s+/g, ' ');
  });
}
