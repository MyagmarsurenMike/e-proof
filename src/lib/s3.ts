import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { Readable } from 'stream'
import crypto from 'crypto'

const BUCKET = process.env.S3_BUCKET_NAME

/**
 * Returns an S3 client, or null if S3 is not configured.
 * Falls back to local filesystem when null (Phase 1/2 behaviour).
 */
function getS3Client(): S3Client | null {
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !BUCKET
  ) {
    return null
  }
  return new S3Client({ region: process.env.AWS_REGION })
}

export function isS3Configured(): boolean {
  return getS3Client() !== null
}

/**
 * Upload an encrypted buffer to S3.
 * The key is a unique object path within the bucket.
 * Returns the S3 object key (not a presigned URL — URL can change, key is stable).
 */
export async function uploadToS3(
  encryptedBuffer: Buffer,
  originalFileName: string
): Promise<string> {
  const client = getS3Client()
  if (!client || !BUCKET) {
    throw new Error('S3 is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME.')
  }

  // Build a collision-resistant object key: documents/<uuid>/<sanitised-name>
  const uuid = crypto.randomUUID()
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)
  const s3Key = `documents/${uuid}/${safeName}`

  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: encryptedBuffer,
      ContentType: 'application/octet-stream', // always encrypted binary
      ServerSideEncryption: 'AES256',           // S3-side encryption on top
    })
  )

  return s3Key
}

/**
 * Download an encrypted buffer from S3 by its object key.
 * The caller is responsible for decryption (via decryptFileWithKMS).
 */
export async function downloadFromS3(s3Key: string): Promise<Buffer> {
  const client = getS3Client()
  if (!client || !BUCKET) {
    throw new Error('S3 is not configured.')
  }

  const res = await client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: s3Key })
  )

  if (!res.Body) {
    throw new Error(`S3 returned empty body for key: ${s3Key}`)
  }

  // Convert the readable stream to a Buffer
  const stream = res.Body as Readable
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

/**
 * Delete an object from S3 (used on upload error cleanup).
 */
export async function deleteFromS3(s3Key: string): Promise<void> {
  const client = getS3Client()
  if (!client || !BUCKET) return

  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }))
}
