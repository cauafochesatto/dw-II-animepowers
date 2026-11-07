import { Hono } from 'hono';
import { query, withTransaction } from '../db.js';

export const authRouter = new Hono();

// Registro de novo usuário com 20 giros iniciais garantidos
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { name, username, email, password, avatar } = body;

    if (!email || !name) {
      return c.json({ error: 'Nome e e-mail são obrigatórios.' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = (username || cleanEmail.split('@')[0]).trim();
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

    // Verifica e-mail existente
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return c.json({ error: 'Já existe um guerreiro cadastrado com este e-mail.' }, 409);
    }

    const user = await withTransaction(async (client) => {
      // 1. Cria usuário com 20 giros
      const insertUser = await client.query(
        `INSERT INTO users (id, name, username, email, password, avatar, role, spins_balance, provider)
         VALUES ($1, $2, $3, $4, $5, $6, 'Guerreiro', 20, 'local')
         RETURNING id, name, username, email, avatar, role, spins_balance, provider, created_at`,
        [userId, name, cleanUsername, cleanEmail, password || null, avatar || null]
      );

      // 2. Cria registro inicial no ranking
      await client.query(
        `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
         VALUES ($1, $2, $3, 'D', 0, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, name, avatar || null]
      );

      return insertUser.rows[0];
    });

    return c.json({
      success: true,
      message: 'Conta criada com sucesso! Você recebeu 20 giros iniciais.',
      user,
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return c.json({ error: 'Erro ao cadastrar usuário no banco de dados.' }, 500);
  }
});

// Login
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, username, password } = body;

    let userRes;
    if (email) {
      userRes = await query(
        'SELECT id, name, username, email, password, avatar, role, spins_balance, provider FROM users WHERE LOWER(email) = $1',
        [email.trim().toLowerCase()]
      );
    } else if (username) {
      userRes = await query(
        'SELECT id, name, username, email, password, avatar, role, spins_balance, provider FROM users WHERE LOWER(username) = $1',
        [username.trim().toLowerCase()]
      );
    } else {
      return c.json({ error: 'Informe e-mail ou username.' }, 400);
    }

    if (userRes.rows.length === 0) {
      return c.json({ error: 'Guerreiro não encontrado no sistema.' }, 404);
    }

    const user = userRes.rows[0];

    // Validação de senha se existir no banco
    if (user.password && password && user.password !== password) {
      return c.json({ error: 'Senha incorreta.' }, 401);
    }

    delete user.password;
    return c.json({
      success: true,
      message: `Bem-vindo de volta, ${user.name}!`,
      user,
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return c.json({ error: 'Erro ao autenticar usuário.' }, 500);
  }
});

// Autenticação e sincronização com Google OAuth
authRouter.post('/google', async (c) => {
  try {
    const body = await c.req.json();
    const { sub, email, name, picture } = body;

    if (!email) {
      return c.json({ error: 'E-mail do Google ausente.' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query(
      'SELECT id, name, username, email, avatar, role, spins_balance, provider FROM users WHERE LOWER(email) = $1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      // Atualiza usuário existente mantendo saldo
      const current = existing.rows[0];
      const updated = await query(
        `UPDATE users
         SET avatar = COALESCE($1, avatar),
             name = COALESCE($2, name),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING id, name, username, email, avatar, role, spins_balance, provider`,
        [picture || null, name || null, current.id]
      );
      return c.json({
        success: true,
        message: `Bem-vindo de volta, ${updated.rows[0].name}!`,
        user: updated.rows[0],
      });
    }

    // Cria novo usuário do Google com exatamente 20 giros
    const userId = 'google_' + (sub || Date.now());
    const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '');

    const newUser = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO users (id, name, username, email, avatar, role, spins_balance, provider)
         VALUES ($1, $2, $3, $4, $5, 'Guerreiro Google', 20, 'google')
         RETURNING id, name, username, email, avatar, role, spins_balance, provider`,
        [userId, name || username, username, cleanEmail, picture || null]
      );

      await client.query(
        `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
         VALUES ($1, $2, $3, 'D', 0, 0, 0, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, name || username, picture || null]
      );

      return ins.rows[0];
    });

    return c.json({
      success: true,
      message: `Conta Google cadastrada! Você recebeu 20 giros iniciais.`,
      user: newUser,
    });
  } catch (err) {
    console.error('[Google Auth Error]', err);
    return c.json({ error: 'Erro ao autenticar com o Google.' }, 500);
  }
});

