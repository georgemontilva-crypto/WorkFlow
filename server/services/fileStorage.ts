/**
 * File Storage Service
 * 
 * Handles file uploads to local filesystem.
 * Designed to be easily migrated to S3 or other cloud storage in the future.
 * 
 * IMPORTANT: This is a temporary solution using local filesystem.
 * In production, migrate to S3 or compatible object storage.
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Allowed MIME types for payment receipts
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/**
 * Maximum file size in bytes (800KB)
 */
const MAX_FILE_SIZE = 800 * 1024; // 800KB

/**
 * Base upload directory (relative to project root)
 */
const UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

/**
 * File metadata returned after successful upload
 */
export interface UploadedFile {
  relativePath: string; // Path relative to uploads dir (stored in DB)
  absolutePath: string; // Full filesystem path
  size: number;         // File size in bytes
  mime: string;         // MIME type
  filename: string;     // Generated filename
}

/**
 * Validate file before upload
 */
function validateFile(base64Data: string, mime: string): void {
  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mime as any)) {
    throw new Error(`Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Calculate file size from base64
  const base64Length = base64Data.length;
  const padding = (base64Data.match(/=/g) || []).length;
  const fileSize = (base64Length * 0.75) - padding;

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(`Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE / 1024}KB`);
  }

  if (fileSize === 0) {
    throw new Error('El archivo está vacío');
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(mime: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return extensions[mime] || 'bin';
}

/**
 * Ensure directory exists, create if not
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Save payment receipt to filesystem
 * 
 * @param userId - User ID for directory organization
 * @param base64Data - Base64 encoded file data (without data:image/... prefix)
 * @param mime - MIME type of the file
 * @returns File metadata
 */
export async function savePaymentReceipt(
  userId: number,
  base64Data: string,
  mime: string
): Promise<UploadedFile> {
  // Validate file
  validateFile(base64Data, mime);

  // Generate unique filename
  const uuid = randomUUID();
  const ext = getExtensionFromMime(mime);
  const filename = `payment_${uuid}.${ext}`;

  // Build directory structure: /uploads/users/{userId}/payments/
  const userDir = path.join(UPLOAD_BASE_DIR, 'users', userId.toString(), 'payments');
  await ensureDir(userDir);

  // Full path to save file
  const absolutePath = path.join(userDir, filename);

  // Relative path for database (from uploads dir)
  const relativePath = path.join('users', userId.toString(), 'payments', filename);

  // Convert base64 to buffer and write file
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(absolutePath, buffer);

  console.log(`[FileStorage] Saved payment receipt: ${relativePath} (${buffer.length} bytes)`);

  return {
    relativePath,
    absolutePath,
    size: buffer.length,
    mime,
    filename,
  };
}

/**
 * Delete payment receipt from filesystem
 * 
 * @param relativePath - Relative path stored in database
 */
export async function deletePaymentReceipt(relativePath: string): Promise<void> {
  try {
    const absolutePath = path.join(UPLOAD_BASE_DIR, relativePath);
    await fs.unlink(absolutePath);
    console.log(`[FileStorage] Deleted payment receipt: ${relativePath}`);
  } catch (error: any) {
    console.error(`[FileStorage] Failed to delete ${relativePath}:`, error.message);
    // Don't throw - file might already be deleted
  }
}

/**
 * Get absolute path from relative path
 * Used for serving files
 */
export function getAbsolutePath(relativePath: string): string {
  return path.join(UPLOAD_BASE_DIR, relativePath);
}

/**
 * Get public URL for a file
 * This will be served by the static file middleware
 */
export function getPublicUrl(relativePath: string): string {
  return `/uploads/${relativePath}`;
}
