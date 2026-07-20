const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function getSession(req: any) {
  const cookie = req.headers['cookie'];
  if (!cookie) return null;
  try {
    const res = await fetch(`${FRONTEND_URL}/api/auth/get-session`, {
      headers: { cookie, origin: FRONTEND_URL },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const user = body?.data?.user || body?.data?.session?.user || body?.user || body?.session?.user;
    if (!user?.id || !user?.email) return null;
    return { userId: user.id, email: user.email, role: user.role ?? 'user' };
  } catch {
    return null;
  }
}

module.exports = { getSession };
