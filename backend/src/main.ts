import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryInterceptor } from './shared/interceptors/sentry.interceptor';

async function bootstrap() {
  // Inicializa o Sentry o mais cedo possível
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });

  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Habilita validação global (descarta campos não declarados no DTO)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Intercepta todos os erros e envia pro Sentry
  app.useGlobalInterceptors(new SentryInterceptor());

  // Habilita CORS para o Front-end conseguir fazer FETCH
  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 VERSUS Engine rodando na porta ${port}`);
}
bootstrap();
