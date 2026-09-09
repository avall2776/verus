"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const Sentry = require("@sentry/node");
const profiling_node_1 = require("@sentry/profiling-node");
const sentry_interceptor_1 = require("./shared/interceptors/sentry.interceptor");
async function bootstrap() {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            (0, profiling_node_1.nodeProfilingIntegration)(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalInterceptors(new sentry_interceptor_1.SentryInterceptor());
    app.enableCors();
    const port = process.env.PORT || 3001;
    await app.listen(port);
    logger.log(`🚀 VERSUS Engine rodando na porta ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map