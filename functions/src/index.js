import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authRouter } from './routes/auth.js';
import { spinsRouter } from './routes/spins.js';
import { battlesRouter } from './routes/battles.js';
import { friendsRouter } from './routes/friends.js';
import { rankingRouter } from './routes/ranking.js';
import { syncRouter } from './routes/sync.js';

const app = new Hono();

// Habilita CORS para o Render Static Site e ambientes locais
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposeHeaders: ['Content-Length', 'X-Total-Count'],
    maxAge: 86400,
    credentials: false,
  })
);

// Healthcheck
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Anime Powers Neon Functions API',
    runtime: 'Node.js 24 (Hono)',
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.route('/api/auth', authRouter);
app.route('/api/spins', spinsRouter);
app.route('/api/battles', battlesRouter);
app.route('/api/friends', friendsRouter);
app.route('/api/ranking', rankingRouter);
app.route('/api/sync', syncRouter);

// Fallback para rota não encontrada
app.notFound((c) => {
  return c.json({ error: 'Endpoint não encontrado na API Neon Functions' }, 404);
});

// Tratamento de erros globais
app.onError((err, c) => {
  console.error('[Unhandled Neon Function Error]', err);
  return c.json({ error: 'Erro interno no processamento da Neon Function.' }, 500);
});

export default app;
export const fetch = app.fetch;

