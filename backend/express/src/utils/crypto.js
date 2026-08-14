import crypto from 'crypto';
import logger from './logger.js';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'msr-insight-secret-key-default-2026')
  .digest();

/**
 * Encrypts a plain text string (e.g. 4-digit PIN) using AES-256-GCM.
 * @param {string} text
 * @returns {string} iv:authTag:encrypted
 */
export function encryptText(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string back to plain text.
 * @param {string} encryptedHash
 * @returns {string}
 */
export function decryptText(encryptedHash) {
  if (!encryptedHash || typeof encryptedHash !== 'string' || !encryptedHash.includes(':')) return '';
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedHash.split(':');
    if (!ivHex || !authTagHex || !encryptedText) return '';
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error(`Decryption failed: ${error.message}`);
    return '';
  }
}

export default { encryptText, decryptText };
