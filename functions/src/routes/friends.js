import { Hono } from 'hono';
import { query } from '../db.js';

export const friendsRouter = new Hono();

// Busca usuários reais cadastrados no PostgreSQL
friendsRouter.get('/users/search', async (c) => {
  try {
    const q = (c.req.query('q') || '').trim().toLowerCase();
    const currentUserId = c.req.query('currentUserId') || '';

    let res;
    if (q) {
      res = await query(
        `SELECT id, name, username, email, avatar, role, created_at
         FROM users
         WHERE (LOWER(name) LIKE $1 OR LOWER(username) LIKE $1 OR LOWER(email) LIKE $1)
           AND id != $2
         LIMIT 20`,
        [`%${q}%`, currentUserId]
      );
    } else {
      res = await query(
        `SELECT id, name, username, email, avatar, role, created_at
         FROM users
         WHERE id != $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [currentUserId]
      );
    }

    return c.json({
      success: true,
      users: res.rows,
    });
  } catch (err) {
    console.error('[Search Users Error]', err);
    return c.json({ error: 'Erro ao buscar jogadores.' }, 500);
  }
});

// Lista todas as amizades e solicitações do usuário
friendsRouter.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');

    // 1. Amigos aceitos
    const friendsRes = await query(
      `SELECT
         f.id AS friendship_id,
         f.created_at AS friendship_date,
         u.id AS friend_id,
         u.name,
         u.username,
         u.email,
         u.avatar,
         u.role,
         r.rank,
         r.wins,
         r.losses,
         r.total,
         r.win_rate
       FROM friendships f
       JOIN users u ON (CASE WHEN f.user_id = $1 THEN f.friend_id ELSE f.user_id END) = u.id
       LEFT JOIN ranking_stats r ON r.user_id = u.id
       WHERE (f.user_id = $1 OR f.friend_id = $1)
         AND f.status = 'accepted'`,
      [userId]
    );

    // 2. Solicitações recebidas (outros pediram para mim)
    const receivedRes = await query(
      `SELECT
         f.id AS request_id,
         f.created_at,
         u.id AS sender_id,
         u.name,
         u.username,
         u.email,
         u.avatar
       FROM friendships f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1
         AND f.status = 'pending'`,
      [userId]
    );

    // 3. Solicitações enviadas (eu pedi para outros)
    const sentRes = await query(
      `SELECT
         f.id AS request_id,
         f.created_at,
         u.id AS target_id,
         u.name,
         u.username,
         u.email,
         u.avatar
       FROM friendships f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1
         AND f.status = 'pending'`,
      [userId]
    );

    return c.json({
      success: true,
      friends: friendsRes.rows,
      receivedRequests: receivedRes.rows,
      sentRequests: sentRes.rows,
    });
  } catch (err) {
    console.error('[Get Friends Error]', err);
    return c.json({ error: 'Erro ao carregar lista de amizades.' }, 500);
  }
});

// Envia solicitação de amizade (com proteção contra auto-amizade e duplicadas)
friendsRouter.post('/request', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, targetId } = body;

    if (!userId || !targetId) {
      return c.json({ error: 'Identificadores de usuários inválidos.' }, 400);
    }

    if (userId === targetId) {
      return c.json({ error: 'Você não pode enviar solicitação de amizade para si mesmo.' }, 400);
    }

    // Verifica se já existe relação em qualquer sentido
    const existing = await query(
      `SELECT id, user_id, friend_id, status FROM friendships
       WHERE (user_id = $1 AND friend_id = $2)
          OR (user_id = $2 AND friend_id = $1)`,
      [userId, targetId]
    );

    if (existing.rows.length > 0) {
      const rel = existing.rows[0];
      if (rel.status === 'accepted') {
        return c.json({ error: 'Vocês já são amigos!' }, 409);
      }
      if (rel.user_id === userId && rel.status === 'pending') {
        return c.json({ error: 'Você já enviou uma solicitação para este guerreiro. Aguarde a resposta.' }, 409);
      }
      if (rel.user_id === targetId && rel.status === 'pending') {
        // Reciprocidade: o outro já havia enviado pedido, então aceita automaticamente
        await query(
          `UPDATE friendships
           SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [rel.id]
        );
        return c.json({
          success: true,
          message: 'Amizade confirmada automaticamente! Vocês agora são amigos.',
          status: 'accepted',
        });
      }
    }

    // Cria novo pedido
    const friendshipId = 'fr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    await query(
      `INSERT INTO friendships (id, user_id, friend_id, status)
       VALUES ($1, $2, $3, 'pending')`,
      [friendshipId, userId, targetId]
    );

    return c.json({
      success: true,
      message: 'Solicitação de amizade enviada com sucesso!',
      friendshipId,
    });
  } catch (err) {
    console.error('[Send Friend Request Error]', err);
    return c.json({ error: 'Erro ao enviar pedido de amizade.' }, 500);
  }
});

// Atualiza status da solicitação (aceitar ou recusar)
friendsRouter.put('/status', async (c) => {
  try {
    const body = await c.req.json();
    const { friendshipId, status } = body;

    if (!friendshipId || !['accepted', 'declined'].includes(status)) {
      return c.json({ error: 'Parâmetros inválidos.' }, 400);
    }

    const res = await query(
      `UPDATE friendships
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status`,
      [status, friendshipId]
    );

    if (res.rows.length === 0) {
      return c.json({ error: 'Solicitação não encontrada.' }, 404);
    }

    return c.json({
      success: true,
      message: status === 'accepted' ? 'Solicitação aceita!' : 'Solicitação recusada.',
      friendship: res.rows[0],
    });
  } catch (err) {
    console.error('[Update Friend Status Error]', err);
    return c.json({ error: 'Erro ao atualizar solicitação.' }, 500);
  }
});

// Remove amizade ou cancela solicitação
friendsRouter.delete('/', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, targetId } = body;

    if (!userId || !targetId) {
      return c.json({ error: 'Identificadores inválidos.' }, 400);
    }

    await query(
      `DELETE FROM friendships
       WHERE (user_id = $1 AND friend_id = $2)
          OR (user_id = $2 AND friend_id = $1)`,
      [userId, targetId]
    );

    return c.json({
      success: true,
      message: 'Amizade ou solicitação removida com sucesso.',
    });
  } catch (err) {
    console.error('[Delete Friendship Error]', err);
    return c.json({ error: 'Erro ao remover amizade.' }, 500);
  }
});

