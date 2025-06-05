import { NextRequest, NextResponse } from 'next/server'

const DEV_USERNAME = 'admin'
const DEV_PASSWORD = 'wombat81'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (username === DEV_USERNAME && password === DEV_PASSWORD) {
      // Create response with redirect to home
      const response = NextResponse.redirect(new URL('/', request.url))
      
      // Set authentication cookie (expires in 24 hours)
      response.cookies.set('dev-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      })

      return response
    } else {
      // Invalid credentials - return to login with error
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Development Access</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
            .login-box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            input { display: block; width: 100%; margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #1860e2; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
            button:hover { background: #1550c2; }
            h2 { text-align: center; color: #333; }
            .error { color: red; text-align: center; margin: 0.5rem 0; }
          </style>
        </head>
        <body>
          <div class="login-box">
            <h2>🔒 Development Access</h2>
            <div class="error">Invalid credentials. Please try again.</div>
            <form method="POST" action="/api/dev-auth">
              <input type="text" name="username" placeholder="Username" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Access Application</button>
            </form>
            <p style="text-align: center; color: #666; font-size: 0.9rem; margin-top: 1rem;">
              Development environment - authorized access only
            </p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
} 