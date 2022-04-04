import { getLogger, Logger } from '../../utils/logger';

import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class ShutdownService {
  private logger: Logger = getLogger(this.constructor.name);

  private shutdownListener$: ReplaySubject<void> = new ReplaySubject();

  public subscribeToShutdown(shutdownFn: () => void): void {
    this.shutdownListener$.subscribe(() => shutdownFn());
  }

  public shutdown(): void {
    this.logger.debug(`ShutdownService - Shutting down`);
    this.shutdownListener$.next();
  }
}
