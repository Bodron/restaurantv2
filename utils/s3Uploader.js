import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import mime from 'mime-types'

// Debugging logs
console.log('AWS Config:', {
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Exists ✅' : 'Missing ❌',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    ? 'Exists ✅'
    : 'Missing ❌',
})

// Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

/**
 * Uploads a file to AWS S3 using AWS SDK v3
 */
export async function uploadFileToS3(
  fileBuffer,
  originalName,
  folder = 'uploads'
) {
  try {
    console.log('Uploading file:', originalName)

    if (!process.env.AWS_S3_BUCKET) {
      throw new Error('AWS_S3_BUCKET is missing from .env.local!')
    }

    const fileExtension = mime.extension(mime.lookup(originalName)) || 'bin'
    const uniqueFileName = `${folder}/${crypto.randomUUID()}.${fileExtension}`

    console.log('Generated file name:', uniqueFileName)

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mime.lookup(originalName) || 'application/octet-stream',
      ACL: 'public-read',
    }

    const result = await s3.send(new PutObjectCommand(uploadParams))
    console.log('S3 Upload Result:', result)

    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`
  } catch (error) {
    console.error('S3 Upload Error:', error)
    throw new Error('File upload failed: ' + error.message)
  }
}
