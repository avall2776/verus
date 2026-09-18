import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface ClientBucket {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimiterMiddleware.name);
  private clients = new Map<string, ClientBucket>();

  constructor() {
    // Limpeza periódica da memória a cada 5 minutos
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of this.clients.entries()) {
        if (now > bucket.resetTime) {
          this.clients.delete(key);
        }
      }
    }, 5 * 60 * 1000);
    cleanupTimer.unref?.();
  }

  use(req: Request, res: Response, next: NextFunction) {
    const reqPath = req.path || req.originalUrl || req.url || '';

    // Webhooks de mensageria em lote não sofrem throttling por este middleware
    if (reqPath.startsWith('/webhooks') || req.method === 'OPTIONS') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const isAuthRoute = reqPath.includes('/auth/login') || reqPath.includes('/reset-password');
    
    // Limite rigoroso para autenticação (prevenção de força bruta) e padrão para rotas gerais
    const limit = isAuthRoute ? 25 : 150; 
    const windowMs = 60 * 1000; // Janela de 1 minuto
    const key = `${ip}:${isAuthRoute ? 'auth' : 'api'}`;
    const now = Date.now();

    let bucket = this.clients.get(key);
    if (!bucket || now > bucket.resetTime) {
      bucket = { count: 1, resetTime: now + windowMs };
      this.clients.set(key, bucket);
    } else {
      bucket.count++;
    }

    // Headers de telemetria de Rate Limit padrão RFC 6585
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - bucket.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > limit) {
      const retryAfterSec = Math.ceil((bucket.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      this.logger.warn(`[RateLimit Defense] IP ${ip} atingiu o limite na rota ${req.originalUrl} (${bucket.count}/${limit})`);

      return res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Muitas requisições detectadas. Proteção ativa contra varredura automatizada. Tente novamente em ${retryAfterSec} segundos.`,
        retryAfter: retryAfterSec,
      });
    }

    next();
  }
}
