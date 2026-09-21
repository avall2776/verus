"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BotDetectorMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotDetectorMiddleware = void 0;
const common_1 = require("@nestjs/common");
const AI_AND_SCRAPER_SIGNATURES = [
    'gptbot',
    'chatgpt-user',
    'anthropic-ai',
    'claude-web',
    'claudebot',
    'ccbot',
    'bytespider',
    'cohere-ai',
    'diffbot',
    'facebookbot',
    'omgilibot',
    'perplexitybot',
    'scrapy',
    'headlesschrome',
    'phantomjs',
    'selenium',
    'puppeteer',
    'playwright',
    'python-requests',
    'aiohttp',
    'libwww-perl',
    'petalbot',
    'yandexbot',
    'ahrefsbot',
    'semrushbot',
];
let BotDetectorMiddleware = BotDetectorMiddleware_1 = class BotDetectorMiddleware {
    constructor() {
        this.logger = new common_1.Logger(BotDetectorMiddleware_1.name);
    }
    use(req, res, next) {
        const rawUserAgent = String(req.headers['user-agent'] || '').toLowerCase();
        const reqPath = req.path || req.originalUrl || req.url || '';
        const isWebhook = reqPath.startsWith('/webhooks') || reqPath.startsWith('/api/webhooks');
        const isMedia = reqPath.startsWith('/media') || reqPath.startsWith('/api/media') || reqPath.includes('/media/');
        if (isWebhook || isMedia) {
            return next();
        }
        if (!rawUserAgent && req.method !== 'OPTIONS') {
            this.logger.warn(`[Security Honeypot] Requisição bloqueada sem User-Agent: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
            return res.status(403).json({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Acesso negado: Requisição sem identificador de cliente válido.',
            });
        }
        const matchedSignature = AI_AND_SCRAPER_SIGNATURES.find(sig => rawUserAgent.includes(sig));
        if (matchedSignature) {
            this.logger.warn(`[Security Firewall] Crawler de IA/Scraper bloqueado: "${matchedSignature}" | IP: ${req.ip} | URL: ${req.originalUrl}`);
            return res.status(403).json({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Acesso automatizado ou de inteligência artificial não autorizado neste ecossistema corporativo.',
                code: 'AI_CRAWLER_BLOCKED',
                shield: 'VERSUS_ENTERPRISE_FIREWALL'
            });
        }
        next();
    }
};
exports.BotDetectorMiddleware = BotDetectorMiddleware;
exports.BotDetectorMiddleware = BotDetectorMiddleware = BotDetectorMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], BotDetectorMiddleware);
//# sourceMappingURL=bot-detector.middleware.js.map