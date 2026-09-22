"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptApiKey = encryptApiKey;
exports.decryptApiKey = decryptApiKey;
exports.maskApiKey = maskApiKey;
const crypto = require("crypto");
function getEncryptionKey() {
    const secret = process.env.ENCRYPTION_KEY ||
        process.env.JWT_SECRET ||
        'versus_secure_master_encryption_key_2026';
    return crypto.createHash('sha256').update(secret).digest();
}
function encryptApiKey(plainText) {
    if (!plainText || typeof plainText !== 'string')
        return '';
    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(plainText, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }
    catch (error) {
        console.error('[CryptoUtil] Erro ao criptografar chave:', error);
        throw new Error('Falha na criptografia de chave sensível.');
    }
}
function decryptApiKey(cipherText) {
    if (!cipherText || typeof cipherText !== 'string')
        return '';
    if (cipherText.startsWith('sk-') && !cipherText.includes(':')) {
        return cipherText;
    }
    try {
        const parts = cipherText.split(':');
        if (parts.length !== 3) {
            return cipherText;
        }
        const [ivHex, authTagHex, encryptedHex] = parts;
        const key = getEncryptionKey();
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        console.error('[CryptoUtil] Erro ao descriptografar chave:', error);
        return '';
    }
}
function maskApiKey(key) {
    if (!key || typeof key !== 'string')
        return '';
    const trimmed = key.trim();
    if (trimmed.length <= 8) {
        return '••••••••';
    }
    const prefix = trimmed.startsWith('sk-proj-')
        ? 'sk-proj-'
        : trimmed.startsWith('sk-')
            ? 'sk-'
            : trimmed.slice(0, 3);
    const suffix = trimmed.slice(-4);
    return `${prefix}••••••••••••••••${suffix}`;
}
//# sourceMappingURL=crypto.util.js.map