// Cloudflare Pages Function to generate presigned DELETE URLs for R2
import { AwsClient } from 'aws4fetch'

interface Env {
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_ACCOUNT_ID: string
  R2_BUCKET_NAME: string
}

interface RequestBody {
  objectKey: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context
  const { objectKey } = (await request.json()) as RequestBody

  if (!objectKey) {
    return new Response(JSON.stringify({ error: 'Missing objectKey' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const r2 = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  })

  const bucketUrl = `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const url = `${bucketUrl}/${objectKey}`

  const signed = await r2.sign(new Request(url, { method: 'DELETE' }), {
    aws: { signQuery: true },
  })

  return new Response(JSON.stringify({ deleteUrl: signed.url }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
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
