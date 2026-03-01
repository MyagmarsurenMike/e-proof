import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms'

const KMS_KEY_ID = process.env.KMS_KEY_ID

/**
 * Returns a KMS client, or null if AWS credentials are not configured.
 * This allows the app to fall back to Phase 1 local-key mode when KMS is unavailable.
 */
function getKMSClient(): KMSClient | null {
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !KMS_KEY_ID
  ) {
    return null
  }
  return new KMSClient({ region: process.env.AWS_REGION })
}

export function isKMSConfigured(): boolean {
  return getKMSClient() !== null
}

/**
 * Generate a one-time AES-256 data key via KMS.
 * Returns:
 *   - plaintext: raw 32-byte key — use to encrypt the file, then zero it out
 *   - encryptedKey: KMS-encrypted blob — store this in DB (safe, useless without KMS access)
 */
export async function generateDataKey(): Promise<{
  plaintext: Buffer
  encryptedKey: Buffer
}> {
  const client = getKMSClient()
  if (!client) {
    throw new Error(
      'KMS is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and KMS_KEY_ID.'
    )
  }

  const res = await client.send(
    new GenerateDataKeyCommand({
      KeyId: KMS_KEY_ID!,
      KeySpec: 'AES_256',
    })
  )

  if (!res.Plaintext || !res.CiphertextBlob) {
    throw new Error('KMS returned incomplete data key response')
  }

  return {
    plaintext: Buffer.from(res.Plaintext),
    encryptedKey: Buffer.from(res.CiphertextBlob),
  }
}

/**
 * Decrypt a KMS-encrypted data key blob back to the raw AES key.
 * Call this only when you need to decrypt a file — never store the result.
 */
export async function decryptDataKey(encryptedKey: Buffer): Promise<Buffer> {
  const client = getKMSClient()
  if (!client) {
    throw new Error(
      'KMS is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and KMS_KEY_ID.'
    )
  }

  const res = await client.send(
    new DecryptCommand({ CiphertextBlob: encryptedKey })
  )

  if (!res.Plaintext) {
    throw new Error('KMS returned empty plaintext during decryption')
  }

  return Buffer.from(res.Plaintext)
}
