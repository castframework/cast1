import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware<Request, Response> {
  public use(req: Request, res: Response, next: () => void): void {
    this.getStrategy(req);

    next();
  }

  private getStrategy(req: Request): void {
    return;
  }
}
