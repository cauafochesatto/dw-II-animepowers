import { serve } from '@hono/node-server';
import 'dotenv/config';
import app from './index.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

console.log(`[Neon Functions Dev Server] Iniciando na porta ${port}...`);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`[Neon Functions Dev Server] Pronto em http://localhost:${info.port}`);
  }
);

