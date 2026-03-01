import crypto from 'crypto'
import { generateDataKey, decryptDataKey, isKMSConfigured } from './kms'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16 // AES block size
const KEY_LENGTH = 32 // 256 bits

/**
 * Get the local encryption key from env.
 * Phase 1: reads FILE_ENCRYPTION_KEY (64-char hex = 32 bytes).
 * Phase 2: this will be replaced by KMS-generated data keys per file.
 */
export function getLocalEncryptionKey(): Buffer {
  const keyHex = process.env.FILE_ENCRYPTION_KEY

  if (!keyHex) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FILE_ENCRYPTION_KEY env var is required in production')
    }
    // Dev fallback — deterministic but not secret, never use in prod
    console.warn('[encrypt] WARNING: FILE_ENCRYPTION_KEY not set. Using dev fallback key. Set this in .env.')
    return Buffer.alloc(KEY_LENGTH, 'dev-key-not-for-production')
  }

  const key = Buffer.from(keyHex, 'hex')
  if (key.length !== KEY_LENGTH) {
    throw new Error(`FILE_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex chars (${KEY_LENGTH} bytes). Got ${key.length} bytes.`)
  }
  return key
}

/**
 * Encrypt a file buffer using AES-256-CBC.
 * Returns: [16-byte IV][ciphertext] — IV is not secret, safe to store.
 *
 * Phase 2 note: key will come from KMS generateDataKey() instead of env var.
 * The function signature stays the same — only the key source changes.
 */
export function encryptFile(buffer: Buffer, key: Buffer): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes`)
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])

  // Prepend IV to ciphertext: [IV (16 bytes)][ciphertext]
  return Buffer.concat([iv, encrypted])
}

/**
 * Decrypt a file buffer that was encrypted with encryptFile().
 * Expects: [16-byte IV][ciphertext]
 *
 * Phase 2 note: key will come from KMS decryptDataKey() instead of env var.
 */
export function decryptFile(encryptedBuffer: Buffer, key: Buffer): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`Decryption key must be ${KEY_LENGTH} bytes`)
  }
  if (encryptedBuffer.length < IV_LENGTH) {
    throw new Error('Encrypted buffer too short — missing IV')
  }

  const iv = encryptedBuffer.subarray(0, IV_LENGTH)
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

// ---------------------------------------------------------------------------
// Phase 2: KMS-backed encrypt / decrypt
// Each file gets its own KMS-generated data key. The encrypted key blob is
// stored per-document in the DB. Falls back to local env key if KMS is not
// configured (for local dev without AWS).
// ---------------------------------------------------------------------------

/**
 * Encrypt a file using a KMS-generated per-file data key.
 * Returns the encrypted file buffer AND the encrypted key blob to store in DB.
 *
 * Falls back to Phase 1 local key if KMS is not configured.
 */
export async function encryptFileWithKMS(buffer: Buffer): Promise<{
  encryptedBuffer: Buffer
  encryptedKey: Buffer | null // null when using local fallback key
}> {
  if (!isKMSConfigured()) {
    console.warn('[encrypt] KMS not configured — falling back to local env key')
    const key = getLocalEncryptionKey()
    const encryptedBuffer = encryptFile(buffer, key)
    return { encryptedBuffer, encryptedKey: null }
  }

  const { plaintext, encryptedKey } = await generateDataKey()
  const encryptedBuffer = encryptFile(buffer, plaintext)

  // Zero out the plaintext key immediately after use
  plaintext.fill(0)

  return { encryptedBuffer, encryptedKey }
}

/**
 * Decrypt a file using a KMS-encrypted key blob from the DB.
 * Pass encryptedKey=null to use the local fallback key (Phase 1 files).
 */
export async function decryptFileWithKMS(
  encryptedBuffer: Buffer,
  encryptedKey: Buffer | null
): Promise<Buffer> {
  if (!encryptedKey || !isKMSConfigured()) {
    // Phase 1 fallback: decrypt with local env key
    const key = getLocalEncryptionKey()
    return decryptFile(encryptedBuffer, key)
  }

  const plaintext = await decryptDataKey(encryptedKey)
  const decrypted = decryptFile(encryptedBuffer, plaintext)

  // Zero out the plaintext key immediately after use
  plaintext.fill(0)

  return decrypted
}
