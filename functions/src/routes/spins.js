import { Hono } from 'hono';
import { query } from '../db.js';
import { getAuthenticatedUser } from '../authHelper.js';

export const spinsRouter = new Hono();

// Consulta o saldo oficial no banco de dados Neon
spinsRouter.get('/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const res = await query('SELECT spins_balance FROM users WHERE id = $1', [userId]);

    if (res.rows.length === 0) {
      return c.json({ error: 'Usuário não encontrado.' }, 404);
    }

    return c.json({
      success: true,
      spins: res.rows[0].spins_balance,
    });
  } catch (err) {
    console.error('[Get Spins Error]', err);
    return c.json({ error: 'Erro ao consultar saldo de giros.' }, 500);
  }
});

// Consumo atômico e validado de giros
spinsRouter.post('/consume', async (c) => {
  try {
    const authUser = getAuthenticatedUser(c);
    const body = await c.req.json();
    const { userId, count = 1 } = body;

    const effectiveUserId = authUser ? authUser.uid : userId;
    if (authUser && userId && userId !== authUser.uid) {
      return c.json({ error: 'Acesso negado: você não pode consumir giros de outra conta.', code: 'FORBIDDEN' }, 403);
    }

    const spinsToDeduct = Math.max(1, parseInt(count, 10) || 1);

    if (!effectiveUserId) {
      return c.json({ error: 'Identificador do jogador ausente.' }, 400);
    }

    // Decremento atômico com trava contra saldo negativo
    const res = await query(
      `UPDATE users
       SET spins_balance = spins_balance - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND spins_balance >= $1
       RETURNING spins_balance`,
      [spinsToDeduct, effectiveUserId]
    );

    if (res.rows.length === 0) {
      // Verifica se o usuário não existe ou se não tem saldo suficiente
      const check = await query('SELECT spins_balance FROM users WHERE id = $1', [userId]);
      if (check.rows.length === 0) {
        return c.json({ error: 'Usuário não encontrado.' }, 404);
      }
      return c.json(
        {
          error: `Giros insuficientes. Seu saldo é de ${check.rows[0].spins_balance} giros.`,
          currentSpins: check.rows[0].spins_balance,
        },
        400
      );
    }

    return c.json({
      success: true,
      consumed: spinsToDeduct,
      remainingSpins: res.rows[0].spins_balance,
    });
  } catch (err) {
    console.error('[Consume Spins Error]', err);
    return c.json({ error: 'Erro ao processar consumo de giros.' }, 500);
  }
});

