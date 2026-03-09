// Cloudflare Pages Function to generate presigned URLs for R2
import { AwsClient } from 'aws4fetch'

interface Env {
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_ACCOUNT_ID: string
  R2_BUCKET_NAME: string
  R2_PUBLIC_URL: string // e.g., https://pub-d91108a6d61c4699bbf1f5aa4cbe6572.r2.dev
}

interface RequestBody {
  filename: string
  contentType: string
  operation?: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context

  try {
    // Check for required environment variables
    const missingVars = []
    if (!env.R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID')
    if (!env.R2_SECRET_ACCESS_KEY) missingVars.push('R2_SECRET_ACCESS_KEY')
    if (!env.R2_ACCOUNT_ID) missingVars.push('R2_ACCOUNT_ID')
    if (!env.R2_BUCKET_NAME) missingVars.push('R2_BUCKET_NAME')
    if (!env.R2_PUBLIC_URL) missingVars.push('R2_PUBLIC_URL')

    if (missingVars.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing environment variables: ${missingVars.join(', ')}` }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { filename, contentType, operation = 'PUT' } = (await request.json()) as RequestBody

    if (!filename || !contentType) {
      return new Response(JSON.stringify({ error: 'Missing filename or contentType' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize AWS client for R2
    const r2 = new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    })

  // Generate presigned URL
  const bucketUrl = `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const objectKey = `uploads/${Date.now()}-${filename}`
  const url = `${bucketUrl}/${objectKey}`

  const signed = await r2.sign(
    new Request(url, {
      method: operation,
      headers: {
        'Content-Type': contentType,
      },
    }),
    {
      aws: { signQuery: true },
    }
  )

  // Return the presigned URL and public URL
  const publicUrl = `${env.R2_PUBLIC_URL}/${objectKey}`

    return new Response(
      JSON.stringify({
        uploadUrl: signed.url,
        publicUrl: publicUrl,
        objectKey: objectKey,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
