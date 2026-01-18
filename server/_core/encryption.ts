/**
 * Military-Grade Encryption Module
 * AES-256-GCM encryption for sensitive data at rest
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { ENV } from './env';

// AES-256-GCM configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const AUTH_TAG_LENGTH = 16;

/**
 * Derive encryption key from master secret using scrypt
 * Scrypt is resistant to hardware brute-force attacks
 */
function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return scryptSync(masterSecret, salt, KEY_LENGTH);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns: base64 encoded string with format: salt:iv:authTag:encryptedData
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return '';
  
  const masterSecret = ENV.encryptionKey || ENV.jwtSecret;
  if (!masterSecret) {
    throw new Error('[Encryption] Master secret not configured');
  }

  // Generate random salt and IV for each encryption
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  
  // Derive key from master secret
  const key = deriveKey(masterSecret, salt);
  
  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt data
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Combine salt, IV, auth tag, and encrypted data
  const result = [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
  
  return result;
}

/**
 * Decrypt data encrypted with AES-256-GCM
 * Input format: salt:iv:authTag:encryptedData
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  
  const masterSecret = ENV.encryptionKey || ENV.jwtSecret;
  if (!masterSecret) {
    throw new Error('[Encryption] Master secret not configured');
  }

  try {
    // Split the components
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('[Encryption] Invalid ciphertext format');
    }

    const [saltB64, ivB64, authTagB64, encrypted] = parts;
    
    // Decode from base64
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    
    // Derive key
    const key = deriveKey(masterSecret, salt);
    
    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    throw new Error('[Encryption] Failed to decrypt data');
  }
}

/**
 * Hash sensitive data for searching (one-way)
 * Uses SHA-256 for deterministic hashing
 */
export function hashForSearch(data: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(data.toLowerCase())
    .digest('hex');
}

/**
 * Encrypt multiple fields in an object
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = encrypt(result[field] as string) as any;
    }
  }
  return result;
}

/**
 * Decrypt multiple fields in an object
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        result[field] = decrypt(result[field] as string) as any;
      } catch (error) {
        console.error(`[Encryption] Failed to decrypt field ${String(field)}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }
  return result;
}
