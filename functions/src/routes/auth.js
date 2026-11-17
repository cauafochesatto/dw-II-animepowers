import { Hono } from 'hono';
import { query, withTransaction } from '../db.js';
import { createAuthToken } from '../authHelper.js';

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
    // O servidor SEMPRE gera o identificador único para garantir integridade e isolamento
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

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
      token: createAuthToken(user),
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return c.json({ error: 'Erro ao cadastrar usuário no banco de dados.' }, 500);
  }
});

// Login com autenticação inequívoca e prevenção de colisão de nomes
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, username, password } = body;

    const cleanInput = (email || username || '').trim().toLowerCase();
    if (!cleanInput) {
      return c.json({ error: 'Informe e-mail ou username.' }, 400);
    }

    let user = null;

    if (cleanInput.includes('@')) {
      // 1. Busca estrita por e-mail (chave única)
      const emailRes = await query(
        `SELECT id, name, username, email, password, avatar, role, spins_balance, provider
         FROM users
         WHERE LOWER(email) = $1`,
        [cleanInput]
      );
      if (emailRes.rows.length > 0) {
        user = emailRes.rows[0];
      }
    } else {
      // 2. Busca estrita por username
      const usernameRes = await query(
        `SELECT id, name, username, email, password, avatar, role, spins_balance, provider
         FROM users
         WHERE LOWER(username) = $1`,
        [cleanInput]
      );

      if (usernameRes.rows.length === 1) {
        user = usernameRes.rows[0];
      } else if (usernameRes.rows.length === 0) {
        // 3. Fallback seguro para display name: só aceita se for estritamente unívoco
        const nameRes = await query(
          `SELECT id, name, username, email, password, avatar, role, spins_balance, provider
           FROM users
           WHERE LOWER(name) = $1`,
          [cleanInput]
        );

        if (nameRes.rows.length > 1) {
          return c.json({
            error: 'Existem múltiplos guerreiros com este nome de exibição. Por favor, acesse utilizando seu e-mail cadastrado.',
          }, 409);
        } else if (nameRes.rows.length === 1) {
          user = nameRes.rows[0];
        }
      }
    }

    if (!user) {
      return c.json({ error: 'Guerreiro não encontrado no sistema.' }, 404);
    }

    // Validação de senha se existir no banco
    if (user.password && password && user.password !== password) {
      return c.json({ error: 'Senha incorreta.' }, 401);
    }

    delete user.password;
    const token = createAuthToken(user);
    return c.json({
      success: true,
      message: `Bem-vindo de volta, ${user.name}!`,
      user,
      token,
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
      const userObj = updated.rows[0];
      return c.json({
        success: true,
        message: `Bem-vindo de volta, ${userObj.name}!`,
        user: userObj,
        token: createAuthToken(userObj),
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
      token: createAuthToken(newUser),
    });
  } catch (err) {
    console.error('[Google Auth Error]', err);
    return c.json({ error: 'Erro ao autenticar com o Google.' }, 500);
  }
});

