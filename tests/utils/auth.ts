import jwt from 'jsonwebtoken';

/**
 * Creates a JWT token for testing purposes
 * 
 * @param payload The JWT payload
 * @returns A signed JWT token
 */
export function createJWTForTest(payload: any): string {
  const secret = process.env.CLERK_SECRET_KEY || 'test-secret-key';
  
  // Create a token that expires in 1 hour
  return jwt.sign(
    {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    },
    secret
  );
}

/**
 * Verifies a JWT token and returns the decoded payload
 * 
 * @param token The JWT token to verify
 * @returns The decoded payload if valid
 */
export function verifyJWT(token: string): any {
  const secret = process.env.CLERK_SECRET_KEY || 'test-secret-key';
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts the user ID from a Clerk JWT token
 * 
 * @param token The JWT token
 * @returns The user ID or null if token is invalid
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = verifyJWT(token);
  
  if (!payload || !payload.sub) {
    return null;
  }
  
  return payload.sub;
}
