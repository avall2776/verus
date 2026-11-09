"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractClientIp = extractClientIp;
exports.parseDeviceAndBrowser = parseDeviceAndBrowser;
exports.isMobilePlatform = isMobilePlatform;
exports.resolveClientLocation = resolveClientLocation;
exports.extractFullTelemetry = extractFullTelemetry;
const axios_1 = require("axios");
const geoCache = new Map();
function extractClientIp(req) {
    if (!req)
        return '127.0.0.1';
    const forwarded = req.headers?.['x-forwarded-for'];
    if (forwarded) {
        const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
        if (first)
            return cleanIp(first);
    }
    const cfConnectingIp = req.headers?.['cf-connecting-ip'];
    if (cfConnectingIp && typeof cfConnectingIp === 'string') {
        return cleanIp(cfConnectingIp.trim());
    }
    const xRealIp = req.headers?.['x-real-ip'];
    if (xRealIp && typeof xRealIp === 'string') {
        return cleanIp(xRealIp.trim());
    }
    const direct = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    return cleanIp(direct || '127.0.0.1');
}
function cleanIp(raw) {
    let ip = raw.replace('::ffff:', '').trim();
    if (ip === '::1' || ip === 'localhost')
        return '127.0.0.1';
    return ip;
}
function parseDeviceAndBrowser(userAgentHeader) {
    const ua = userAgentHeader || '';
    let device = 'Computador';
    if (/windows/i.test(ua))
        device = 'Windows PC';
    else if (/macintosh|mac os x/i.test(ua))
        device = 'Apple Mac';
    else if (/iphone/i.test(ua))
        device = 'iPhone';
    else if (/ipad/i.test(ua))
        device = 'iPad';
    else if (/android/i.test(ua))
        device = 'Android';
    else if (/linux/i.test(ua))
        device = 'Linux PC';
    let browser = 'Navegador Web';
    if (/edg\//i.test(ua))
        browser = 'Microsoft Edge';
    else if (/opr\/|opera/i.test(ua))
        browser = 'Opera';
    else if (/chrome|crios/i.test(ua))
        browser = 'Google Chrome';
    else if (/firefox|fxios/i.test(ua))
        browser = 'Mozilla Firefox';
    else if (/safari/i.test(ua) && !/chrome/i.test(ua))
        browser = 'Apple Safari';
    return { device, browser };
}
function isMobilePlatform(userAgent, device) {
    const ua = userAgent || '';
    const dev = device || '';
    if (/mobile|android|iphone|ipad|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
        return true;
    }
    if (['iPhone', 'iPad', 'Android', 'Mobile'].includes(dev)) {
        return true;
    }
    return false;
}
async function resolveClientLocation(ip) {
    if (!ip ||
        ip === '127.0.0.1' ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
        return {
            city: 'Passo Fundo',
            state: 'RS',
            country: 'BR',
        };
    }
    if (geoCache.has(ip)) {
        return geoCache.get(ip);
    }
    try {
        const res = await axios_1.default.get(`http://ip-api.com/json/${ip}?fields=status,city,regionName,countryCode`, {
            timeout: 2500,
        });
        if (res.data && res.data.status === 'success') {
            const geo = {
                city: res.data.city || 'Desconhecida',
                state: res.data.regionName || 'BR',
                country: res.data.countryCode || 'BR',
            };
            geoCache.set(ip, geo);
            return geo;
        }
    }
    catch (e) {
    }
    return {
        city: 'Brasil',
        state: 'BR',
        country: 'BR',
    };
}
async function extractFullTelemetry(req) {
    const ip = extractClientIp(req);
    const userAgent = req?.headers?.['user-agent'] || '';
    const { device, browser } = parseDeviceAndBrowser(userAgent);
    const location = await resolveClientLocation(ip);
    return {
        ip,
        city: location.city,
        state: location.state,
        country: location.country,
        device,
        browser,
        userAgent,
    };
}
//# sourceMappingURL=client-telemetry.util.js.map