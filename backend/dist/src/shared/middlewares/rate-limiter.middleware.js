"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RateLimiterMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RateLimiterMiddleware = RateLimiterMiddleware_1 = class RateLimiterMiddleware {
    constructor() {
        this.logger = new common_1.Logger(RateLimiterMiddleware_1.name);
        this.clients = new Map();
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
    use(req, res, next) {
        const reqPath = req.path || req.originalUrl || req.url || '';
        if (reqPath.startsWith('/webhooks') || req.method === 'OPTIONS') {
            return next();
        }
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
        const isAuthRoute = reqPath.includes('/auth/login') || reqPath.includes('/reset-password');
        const limit = isAuthRoute ? 25 : 150;
        const windowMs = 60 * 1000;
        const key = `${ip}:${isAuthRoute ? 'auth' : 'api'}`;
        const now = Date.now();
        let bucket = this.clients.get(key);
        if (!bucket || now > bucket.resetTime) {
            bucket = { count: 1, resetTime: now + windowMs };
            this.clients.set(key, bucket);
        }
        else {
            bucket.count++;
        }
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
};
exports.RateLimiterMiddleware = RateLimiterMiddleware;
exports.RateLimiterMiddleware = RateLimiterMiddleware = RateLimiterMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RateLimiterMiddleware);
//# sourceMappingURL=rate-limiter.middleware.js.map