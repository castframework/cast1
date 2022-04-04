'use strict';

import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UtilsService } from '../providers/utils.service';

export abstract class AbstractEntity<T> {
  @PrimaryGeneratedColumn('uuid')
  protected id: string;

  @CreateDateColumn({ type: 'timestamp without time zone', name: 'created_at' })
  protected createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', name: 'updated_at' })
  protected updatedAt: Date;

  abstract dtoClass: new (entity: unknown) => T;

  public toDto(): T {
    return UtilsService.toDto(this.dtoClass, this);
  }
}
