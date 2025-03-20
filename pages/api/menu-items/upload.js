import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import formidable from 'formidable'
import { uploadFileToS3 } from '../../../utils/s3Uploader'
import dbConnect from '../../../lib/db'

// Disable the default body parser so we can handle form data
export const config = {
  api: {
    bodyParser: false,
  },
}

// Define allowed file types and max size
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Connect to database
  await dbConnect()

  try {
    // Parse form data with size limit
    const form = formidable({
      multiples: false,
      maxFileSize: MAX_FILE_SIZE,
    })

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err)
          reject(err)
        }
        resolve([fields, files])
      })
    })

    const imageFile = files.image

    if (!imageFile) {
      return res.status(400).json({ message: 'No image file provided' })
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(imageFile.mimetype)) {
      return res.status(400).json({
        message: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(
          ', '
        )}`,
        providedType: imageFile.mimetype,
      })
    }

    // Validate file size explicitly
    if (imageFile.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        message: `File too large. Maximum size: ${
          MAX_FILE_SIZE / (1024 * 1024)
        }MB`,
        providedSize: Math.round(imageFile.size / 1024) + 'KB',
      })
    }

    // Log file details for debugging
    console.log('File details:', {
      name: imageFile.originalFilename,
      type: imageFile.mimetype,
      size: imageFile.size,
      path: imageFile.filepath,
    })

    // Upload to S3
    console.log('Uploading file to S3:', imageFile.originalFilename)

    // Read file buffer
    const fileBuffer = await readFileAsBuffer(imageFile.filepath)
    console.log('File buffer read successfully, size:', fileBuffer.length)

    // Upload to S3 and get the URL
    const imageUrl = await uploadFileToS3(
      fileBuffer,
      imageFile.originalFilename,
      'menu-items'
    )

    console.log('S3 upload successful, URL:', imageUrl)

    // Return the S3 URL
    res.status(200).json({ imageUrl })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({
      message: 'Error uploading image',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

// Helper function to read file as buffer
async function readFileAsBuffer(filePath) {
  try {
    const fs = require('fs').promises
    const buffer = await fs.readFile(filePath)
    return buffer
  } catch (error) {
    console.error('Error reading file:', error)
    throw new Error(`Failed to read file: ${error.message}`)
  }
}
