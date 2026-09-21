import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Assinaturas de User-Agent de crawlers de IA, scrapers e headless browsers não autorizados
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

@Injectable()
export class BotDetectorMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BotDetectorMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const rawUserAgent = String(req.headers['user-agent'] || '').toLowerCase();
    const reqPath = req.path || req.originalUrl || req.url || '';
    const isWebhook = reqPath.startsWith('/webhooks') || reqPath.startsWith('/api/webhooks');
    const isMedia = reqPath.startsWith('/media') || reqPath.startsWith('/api/media') || reqPath.includes('/media/');

    // Libera webhooks legítimos (Meta, Evolution API, Stripe, etc.) e mídias do chat (áudio, imagens, PDFs)
    if (isWebhook || isMedia) {
      return next();
    }

    // 1. Bloqueia requisições sem User-Agent em rotas de API sensíveis
    if (!rawUserAgent && req.method !== 'OPTIONS') {
      this.logger.warn(`[Security Honeypot] Requisição bloqueada sem User-Agent: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Acesso negado: Requisição sem identificador de cliente válido.',
      });
    }

    // 2. Detecta assinaturas conhecidas de IA e crawlers automatizados
    const matchedSignature = AI_AND_SCRAPER_SIGNATURES.find(sig => rawUserAgent.includes(sig));
    if (matchedSignature) {
      this.logger.warn(`[Security Firewall] Crawler de IA/Scraper bloqueado: "${matchedSignature}" | IP: ${req.ip} | URL: ${req.originalUrl}`);
      
      // Resposta Honeypot: Retorna payload falso com status 403
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
}
