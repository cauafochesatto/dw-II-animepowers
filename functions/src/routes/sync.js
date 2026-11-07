import { Hono } from 'hono';
import { withTransaction } from '../db.js';

export const syncRouter = new Hono();

/**
 * Endpoint de migração segura de dados locais existentes para o PostgreSQL Neon.
 * Importa builds, coleção, giros e registros de histórico do usuário sem duplicar.
 */
syncRouter.post('/migrate-local', async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      activeBuild,
      savedBuilds = [],
      collection = {},
      spins = 20,
      battleStats = { wins: 0, losses: 0, total: 0 },
      battleHistory = [],
    } = body;

    if (!userId) {
      return c.json({ error: 'Usuário não especificado para sincronização.' }, 400);
    }

    const migrationResult = await withTransaction(async (client) => {
      // 1. Garante que o usuário existe no Neon
      const userCheck = await client.query('SELECT id, spins_balance FROM users WHERE id = $1', [userId]);
      if (userCheck.rows.length === 0) {
        return { success: false, reason: 'Usuário ainda não registrado no servidor.' };
      }

      // Se o usuário tiver um saldo local maior do que o do banco (ex: acumulado antes da migração), preserva
      const currentDbSpins = userCheck.rows[0].spins_balance;
      const finalSpins = Math.max(currentDbSpins, Math.min(Number(spins) || 20, 200));

      await client.query(
        `UPDATE users
         SET spins_balance = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [finalSpins, userId]
      );

      // 2. Migra a coleção de personagens
      if (collection && typeof collection === 'object') {
        for (const [charId, data] of Object.entries(collection)) {
          const count = Math.max(1, Number(data?.count) || 1);
          await client.query(
            `INSERT INTO characters_collection (user_id, character_id, count, first_obtained, last_obtained)
             VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP), COALESCE($5, CURRENT_TIMESTAMP))
             ON CONFLICT (user_id, character_id) DO UPDATE SET
               count = GREATEST(characters_collection.count, EXCLUDED.count),
               last_obtained = CURRENT_TIMESTAMP`,
            [userId, charId, count, data?.firstObtained || null, data?.lastObtained || null]
          );
        }
      }

      // 3. Migra builds salvas
      const allBuilds = [activeBuild, ...savedBuilds].filter(Boolean);
      for (const b of allBuilds) {
        if (!b?.name) continue;
        const buildId = b.id || `bld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        await client.query(
          `INSERT INTO character_builds (id, user_id, name, avatar_id, signature_move, stat_sources, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             avatar_id = EXCLUDED.avatar_id,
             signature_move = EXCLUDED.signature_move,
             stat_sources = EXCLUDED.stat_sources,
             updated_at = CURRENT_TIMESTAMP`,
          [
            buildId,
            userId,
            b.name,
            b.avatarId || 'goku',
            b.signatureMove || null,
            JSON.stringify(b.statSources || {}),
            b.id === activeBuild?.id,
          ]
        );
      }

      // 4. Migra estatísticas do ranking local (para garantir que os combatentes locais reais fiquem salvos)
      const wins = Number(battleStats.wins) || 0;
      const losses = Number(battleStats.losses) || 0;
      const total = wins + losses;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      await client.query(
        `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
            wins = GREATEST(ranking_stats.wins, EXCLUDED.wins),
            losses = GREATEST(ranking_stats.losses, EXCLUDED.losses),
            total = GREATEST(ranking_stats.total, EXCLUDED.total),
            win_rate = CASE
              WHEN GREATEST(ranking_stats.total, EXCLUDED.total) > 0
              THEN ROUND((GREATEST(ranking_stats.wins, EXCLUDED.wins)::numeric / GREATEST(ranking_stats.total, EXCLUDED.total)::numeric) * 100)
              ELSE 0
            END,
            updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          activeBuild?.name || 'Guerreiro',
          activeBuild?.avatar || null,
          activeBuild?.classification?.rank || 'A',
          wins,
          losses,
          total,
          winRate,
        ]
      );

      // 5. Se houver oponentes reais com histórico local, importa como combatentes reais no ranking
      if (Array.isArray(battleHistory)) {
        const opponentAgg = {};
        for (const h of battleHistory) {
          if (!h.opponentName) continue;
          const oppName = h.opponentName;
          if (!opponentAgg[oppName]) {
            opponentAgg[oppName] = {
              name: oppName,
              avatar: h.opponentAvatar,
              wins: 0,
              losses: 0,
            };
          }
          if (h.isWin) {
            opponentAgg[oppName].losses += 1;
          } else {
            opponentAgg[oppName].wins += 1;
          }
        }

        for (const [oppName, oppData] of Object.entries(opponentAgg)) {
          const oppUserId = 'legacy_opp_' + oppName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const oppTotal = oppData.wins + oppData.losses;
          const oppWinRate = oppTotal > 0 ? Math.round((oppData.wins / oppTotal) * 100) : 0;

          // Cria usuário legado se não existir
          await client.query(
            `INSERT INTO users (id, name, username, email, avatar, role, spins_balance, provider)
             VALUES ($1, $2, $3, $4, $5, 'Combatente Importado', 20, 'legacy_import')
             ON CONFLICT (id) DO NOTHING`,
            [oppUserId, oppName, oppName.toLowerCase().replace(/\s+/g, '_'), `${oppUserId}@legacy.local`, oppData.avatar || null]
          );

          await client.query(
            `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
             VALUES ($1, $2, $3, 'A', $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
               wins = GREATEST(ranking_stats.wins, EXCLUDED.wins),
               losses = GREATEST(ranking_stats.losses, EXCLUDED.losses),
               total = GREATEST(ranking_stats.total, EXCLUDED.total),
               win_rate = EXCLUDED.win_rate,
               updated_at = CURRENT_TIMESTAMP`,
            [oppUserId, oppName, oppData.avatar || null, oppData.wins, oppData.losses, oppTotal, oppWinRate]
          );
        }
      }

      return {
        success: true,
        finalSpins,
        message: 'Dados locais migrados com sucesso para o banco de dados Neon!',
      };
    });

    return c.json(migrationResult);
  } catch (err) {
    console.error('[Migration Error]', err);
    return c.json({ error: 'Erro ao migrar dados locais para o servidor.' }, 500);
  }
});
