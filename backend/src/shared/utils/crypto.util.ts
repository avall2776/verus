import * as crypto from 'crypto';

/**
 * Obtém a chave de 32 bytes para o AES-256 derivada das variáveis de ambiente.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'versus_secure_master_encryption_key_2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Criptografa uma chave de API ou texto sensível usando AES-256-GCM.
 * Retorna no formato: "ivHex:authTagHex:encryptedHex"
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') return '';
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('[CryptoUtil] Erro ao criptografar chave:', error);
    throw new Error('Falha na criptografia de chave sensível.');
  }
}

/**
 * Descriptografa uma chave sensível criptografada com AES-256-GCM.
 */
export function decryptApiKey(cipherText: string): string {
  if (!cipherText || typeof cipherText !== 'string') return '';
  
  // Se por ventura já for uma chave em texto puro (ex: sk-...), retorna diretamente
  if (cipherText.startsWith('sk-') && !cipherText.includes(':')) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      // Se não estiver no formato iv:tag:data, retorna como está para retrocompatibilidade
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
  } catch (error) {
    console.error('[CryptoUtil] Erro ao descriptografar chave:', error);
    return '';
  }
}

/**
 * Mascara uma chave de API para exibição segura na interface visual.
 * Exemplo: "sk-proj-abc123456789xyz" -> "sk-proj-•••••••••••••xyz"
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  
  // Preserva prefixo (ex: sk- ou sk-proj-) e os últimos 4 caracteres
  const prefix = trimmed.startsWith('sk-proj-')
    ? 'sk-proj-'
    : trimmed.startsWith('sk-')
    ? 'sk-'
    : trimmed.slice(0, 3);
  
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}
