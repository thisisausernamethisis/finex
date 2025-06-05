import { NextRequest, NextResponse } from 'next/server'

const DEV_USERNAME = 'admin'
const DEV_PASSWORD = 'wombat81'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    console.log('Dev auth attempt:', { username, hasPassword: !!password })

    if (username === DEV_USERNAME && password === DEV_PASSWORD) {
      // Create response with redirect to home
      const baseUrl = request.url.replace('/api/dev-auth', '')
      const response = NextResponse.redirect(new URL('/', baseUrl))
      
      // Set authentication cookie (expires in 24 hours)
      // Use more conservative cookie settings for compatibility
      response.cookies.set('dev-auth', 'authenticated', {
        httpOnly: true,
        secure: false, // Temporarily disable for debugging
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      })

      console.log('Dev auth successful, redirecting to:', new URL('/', baseUrl).toString())
      return response
    } else {
      console.log('Dev auth failed - invalid credentials')
      // Invalid credentials - return to login with error
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Development Access - Invalid Credentials</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .login-box { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
            input { display: block; width: 100%; margin: 0.75rem 0; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
            button { background: #1860e2; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-size: 16px; font-weight: 600; }
            button:hover { background: #1550c2; }
            h2 { text-align: center; color: #333; margin-bottom: 1.5rem; }
            .error { color: #dc2626; text-align: center; margin: 0.75rem 0; background: #fef2f2; padding: 0.5rem; border-radius: 4px; }
            .subtitle { text-align: center; color: #666; font-size: 0.9rem; margin-top: 1.5rem; }
          </style>
        </head>
        <body>
          <div class="login-box">
            <h2>🔒 Development Access</h2>
            <div class="error">❌ Invalid credentials. Please try again.</div>
            <form method="POST" action="/api/dev-auth">
              <input type="text" name="username" placeholder="Username" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Access Application</button>
            </form>
            <p class="subtitle">Development environment - authorized access only</p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 401
      })
    }
  } catch (error) {
    console.error('Dev auth error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 