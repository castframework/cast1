import { getLogger, Logger } from '../../utils/logger';
import * as fs from 'fs';

import { Injectable } from '@nestjs/common';
import { SharedConfig } from '../shared.config';

@Injectable()
export class FileService {
  private logger: Logger = getLogger(this.constructor.name);

  public constructor(private readonly sharedConfig: SharedConfig) {}

  public async writeToFile(fileName: string, content: string): Promise<void> {
    const directoryPath = this.sharedConfig.fileDirectory;

    this.logger.trace(`Writing to file : ${directoryPath}/${fileName}`);

    fs.writeFileSync(`${directoryPath}/${fileName}`, content);
  }
}
