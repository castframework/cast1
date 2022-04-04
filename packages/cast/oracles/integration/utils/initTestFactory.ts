import { NestFactory, Reflector } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';

import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';

import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { parse } from 'qs';

import { AppModule } from '../../src/app.dyno.module';
import { getNestJsLoggerService } from '../../src/utils/logger';
import { ExtendedClassSerializerInterceptor } from '../../src/interceptors/extended-class-serializer-interceptor';
import { Repository } from 'typeorm';

const Logger = getNestJsLoggerService('initTestFactory');

export async function initTestFactory(
  options: string[],
  port: number,
): Promise<INestApplication> {
  const module = AppModule.forRoot(options);

  initializeTransactionalContext();
  if (!Repository.prototype.hasOwnProperty('manager')) {
    patchTypeORMRepositoryWithBaseRepository();
  }
  const app = await NestFactory.create<NestExpressApplication>(
    module,
    new ExpressAdapter(),
    {
      logger: Logger,
    },
  );
  app.enable('trust proxy'); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  app.set('query parser', (str: string) =>
    parse(str, { arrayLimit: Infinity }),
  );
  app.use(helmet());
  app.use(compression());

  const reflector = app.get(Reflector);

  app.enableShutdownHooks();

  app.useGlobalInterceptors(new ExtendedClassSerializerInterceptor(reflector));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: false,
      dismissDefaultMessages: true,
      validationError: {
        target: false,
      },
    }),
  );

  await app.listen(port);

  Logger.log(`server running on port ${port}`);

  return app;
}
