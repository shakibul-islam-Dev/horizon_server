import { Request } from 'express';
import { jwtVerify } from 'jose-cjs';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://horizon-client-eight.vercel.app';

export async function getSession(req: Request) {
  // 1. Try JWT verification from Authorization header (fast, stateless)
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const secret = process.env.BETTER_AUTH_SECRET;
    
    if (secret) {
      try {
        const secretKey = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(token, secretKey);
        
        if (payload && payload.userId && payload.email) {
          return {
            userId: payload.userId as string,
            email: payload.email as string,
            role: (payload.role as string) || 'user',
          };
        }
      } catch (error: any) {
        console.error('Stateless JWT verification failed, falling back to session cookie:', error.message || error);
      }
    } else {
      console.warn('BETTER_AUTH_SECRET is missing on the server, skipping JWT verification');
    }
  }

  // 2. Fallback to standard Better Auth cookie validation
  const cookie = req.headers['cookie'];
  if (!cookie) return null;
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/get-session`, {
      headers: { cookie, origin: FRONTEND_URL },
    });
    if (!res.ok) return null;
    const body: any = await res.json();
    const user = body?.data?.user || body?.data?.session?.user || body?.user || body?.session?.user;
    if (!user?.id || !user?.email) return null;
    return { userId: user.id, email: user.email, role: user.role ?? 'user' };
  } catch {
    return null;
  }
}

