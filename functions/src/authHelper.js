import crypto from 'node:crypto';

const AUTH_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'animepowers_jwt_secret_2026_neon_secure_key';

/**
 * Cria um token de autenticação seguro assinado com HMAC-SHA256
 */
export function createAuthToken(user) {
  if (!user || !user.id) return null;
  const payload = {
    uid: user.id,
    email: user.email || null,
    username: user.username || user.name || null,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // Validade de 7 dias
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Valida o token e retorna o payload do usuário autenticado ou null se inválido/expirado
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extrai o usuário autenticado do cabeçalho Authorization: Bearer <token>
 */
export function getAuthenticatedUser(c) {
  const authHeader = c.req.header('Authorization') || c.req.header('authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifyAuthToken(match[1]);
}

