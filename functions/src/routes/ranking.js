import { Hono } from 'hono';
import { query } from '../db.js';

export const rankingRouter = new Hono();

// Retorna o ranking global oficial com combatentes reais do PostgreSQL Neon
rankingRouter.get('/', async (c) => {
  try {
    const res = await query(
      `SELECT
         r.user_id AS id,
         COALESCE(u.name, r.player_name) AS name,
         COALESCE(u.avatar, r.avatar) AS avatar,
         r.rank,
         r.wins,
         r.losses,
         r.total,
         r.win_rate,
         r.updated_at
       FROM ranking_stats r
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.wins DESC, r.win_rate DESC, r.total DESC
       LIMIT 100`
    );

    return c.json({
      success: true,
      isOnline: true,
      totalPlayers: res.rows.length,
      ranking: res.rows.map((row) => ({
        id: row.id,
        name: row.name,
        avatar: row.avatar || '/poderesanime/imagenspoderes/kamehamenha.jpg',
        classification: { rank: row.rank || 'A', label: `Combatente Rank ${row.rank || 'A'}` },
        wins: Number(row.wins) || 0,
        losses: Number(row.losses) || 0,
        total: Number(row.total) || 0,
        winRate: Number(row.win_rate) || 0,
      })),
    });
  } catch (err) {
    console.error('[Ranking Error]', err);
    return c.json({ error: 'Erro ao carregar tabela de classificação do servidor.' }, 500);
  }
});

