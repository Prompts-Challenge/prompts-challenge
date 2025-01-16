const CLIENT_ID = 'Ov23li5FzXmDStLNLIkY'
import fs from 'fs'
import dotenv from 'dotenv'
const envConfig = dotenv.parse(fs.readFileSync('.env'))
const CLIENT_SECRET = envConfig.GITHUB_CLIENT_SECRET

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*'
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return new Response('No code provided', { 
        status: 400,
        headers: CORS_HEADERS 
      })
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code
        })
      })

      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to exchange code' }), {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      })
    }
  }
}