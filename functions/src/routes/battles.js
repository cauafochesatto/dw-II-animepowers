import { Hono } from 'hono';
import { query, withTransaction } from '../db.js';
import { simulate1v1, scaleFighterStats, getRewardSpins } from '../battleEngine.js';

export const battlesRouter = new Hono();

/**
 * Resolução e validação de batalha na Arena
 * Executa a simulação de batalha no backend para garantir autenticidade.
 * Concede 2 giros por vitória e 0 em caso de derrota.
 * Proteção contra duplicação de recompensa via battleId único.
 */
battlesRouter.post('/arena/resolve', async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      battleId,
      playerBuild,
      opponentBuild,
      mode = '1v1',
    } = body;

    if (!userId || !battleId || !playerBuild || !opponentBuild) {
      return c.json({ error: 'Dados incompletos para validação da batalha.' }, 400);
    }

    // 1. Verificação de idempotência: se a batalha já foi registrada, retorna resultado existente
    const existingReward = await query(
      'SELECT id, spins_awarded, created_at FROM rewards_log WHERE battle_id = $1',
      [battleId]
    );

    if (existingReward.rows.length > 0) {
      const uRes = await query('SELECT spins_balance FROM users WHERE id = $1', [userId]);
      return c.json({
        success: true,
        alreadyProcessed: true,
        message: 'Esta batalha já foi contabilizada anteriormente.',
        spinsAwarded: existingReward.rows[0].spins_awarded,
        currentSpins: uRes.rows[0]?.spins_balance ?? 0,
      });
    }

    // 2. Executa a simulação oficial no backend (não confia no resultado enviado pelo cliente)
    const simulation = simulate1v1(playerBuild, opponentBuild);
    const isPlayerWinner = simulation.isPlayerWinner;

    const rewardSpins = isPlayerWinner ? getRewardSpins('arena', null, true) : 0;

    // 3. Transação atômica no Neon: histórico + recompensa + saldo de giros + ranking
    const result = await withTransaction(async (client) => {
      // Grava no histórico de batalhas
      await client.query(
        `INSERT INTO battles_history
         (id, user_id, mode, is_win, player_placement, opponent_name, opponent_avatar, player_build_snapshot, total_rounds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          battleId,
          userId,
          mode,
          isPlayerWinner,
          isPlayerWinner ? 1 : 2,
          opponentBuild.name || 'Adversário da Arena',
          opponentBuild.avatar || null,
          JSON.stringify(playerBuild),
          simulation.totalRounds,
        ]
      );

      // Registra a recompensa para travar idempotência
      await client.query(
        `INSERT INTO rewards_log (id, user_id, battle_id, source, difficulty, spins_awarded)
         VALUES ($1, $2, $3, 'arena', NULL, $4)`,
        ['rew_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), userId, battleId, rewardSpins]
      );

      // Atualiza saldo de giros se houve vitória
      let newBalance = null;
      if (rewardSpins > 0) {
        const updateBalance = await client.query(
          `UPDATE users
           SET spins_balance = spins_balance + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING spins_balance`,
          [rewardSpins, userId]
        );
        newBalance = updateBalance.rows[0]?.spins_balance;
      } else {
        const cur = await client.query('SELECT spins_balance FROM users WHERE id = $1', [userId]);
        newBalance = cur.rows[0]?.spins_balance;
      }

      // Atualiza ranking_stats do jogador
      await client.query(
        `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
         VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
         ON CONFLICT (user_id) DO UPDATE SET
            player_name = EXCLUDED.player_name,
            avatar = COALESCE(EXCLUDED.avatar, ranking_stats.avatar),
            wins = ranking_stats.wins + $5,
            losses = ranking_stats.losses + $6,
            total = ranking_stats.total + 1,
            win_rate = ROUND(((ranking_stats.wins + $5)::numeric / (ranking_stats.total + 1)::numeric) * 100),
            updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          playerBuild.name || 'Guerreiro',
          playerBuild.avatar || null,
          playerBuild.classification?.rank || 'A',
          isPlayerWinner ? 1 : 0,
          isPlayerWinner ? 0 : 1,
          isPlayerWinner ? 100 : 0,
        ]
      );

      return {
        isPlayerWinner,
        rewardSpins,
        newBalance,
        simulation,
      };
    });

    return c.json({
      success: true,
      isPlayerWinner: result.isPlayerWinner,
      rewardSpins: result.rewardSpins,
      spinsAwarded: result.rewardSpins,
      newBalance: result.newBalance,
      simulation: result.simulation,
      message: result.isPlayerWinner
        ? `Vitória Conquistada! Você recebeu +${result.rewardSpins} giros de recompensa!`
        : 'Derrota. Batalhe novamente para conquistar recompensas!',
    });
  } catch (err) {
    console.error('[Arena Resolve Error]', err);
    return c.json({ error: 'Erro ao validar e registrar resultado da batalha.' }, 500);
  }
});

/**
 * Resolução e validação de confronto no Torneio
 * Aplica modificador de dificuldade aos adversários:
 * - Fácil: 0.85x atributos, 3 giros por vitória
 * - Médio: 1.0x atributos, 5 giros por vitória
 * - Difícil: 1.25x atributos, 8 giros por vitória
 */
battlesRouter.post('/tournament/match', async (c) => {
  try {
    const body = await c.req.json();
    const {
      userId,
      matchId,
      playerBuild,
      opponentBuild,
      difficulty = 'medio',
    } = body;

    if (!userId || !matchId || !playerBuild || !opponentBuild) {
      return c.json({ error: 'Dados insuficientes para a partida do torneio.' }, 400);
    }

    // 1. Verificação de idempotência por matchId
    const existing = await query(
      'SELECT id, spins_awarded FROM rewards_log WHERE battle_id = $1',
      [matchId]
    );

    if (existing.rows.length > 0) {
      const uRes = await query('SELECT spins_balance FROM users WHERE id = $1', [userId]);
      return c.json({
        success: true,
        alreadyProcessed: true,
        message: 'Este confronto já foi contabilizado anteriormente.',
        spinsAwarded: existing.rows[0].spins_awarded,
        currentSpins: uRes.rows[0]?.spins_balance ?? 0,
      });
    }

    // 2. Escala os atributos do oponente baseado na dificuldade real
    const scaledOpponent = scaleFighterStats(opponentBuild, difficulty);

    // 3. Simula confronto no backend
    const simulation = simulate1v1(playerBuild, scaledOpponent);
    const isPlayerWinner = simulation.isPlayerWinner;

    const rewardSpins = isPlayerWinner ? getRewardSpins('tournament', difficulty, true) : 0;

    // 4. Grava transação no Neon
    const result = await withTransaction(async (client) => {
      // Registra no histórico de batalhas
      await client.query(
        `INSERT INTO battles_history
         (id, user_id, mode, is_win, player_placement, opponent_name, opponent_avatar, player_build_snapshot, total_rounds)
         VALUES ($1, $2, 'Torneio', $3, $4, $5, $6, $7, $8)`,
        [
          matchId,
          userId,
          isPlayerWinner,
          isPlayerWinner ? 1 : 2,
          scaledOpponent.name || 'Rival do Torneio',
          scaledOpponent.avatar || null,
          JSON.stringify(playerBuild),
          simulation.totalRounds,
        ]
      );

      // Idempotência de recompensa
      await client.query(
        `INSERT INTO rewards_log (id, user_id, battle_id, source, difficulty, spins_awarded)
         VALUES ($1, $2, $3, 'tournament', $4, $5)`,
        ['rew_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), userId, matchId, difficulty, rewardSpins]
      );

      // Atualiza saldo de giros
      let newBalance = null;
      if (rewardSpins > 0) {
        const updateBalance = await client.query(
          `UPDATE users
           SET spins_balance = spins_balance + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING spins_balance`,
          [rewardSpins, userId]
        );
        newBalance = updateBalance.rows[0]?.spins_balance;
      } else {
        const cur = await client.query('SELECT spins_balance FROM users WHERE id = $1', [userId]);
        newBalance = cur.rows[0]?.spins_balance;
      }

      // Atualiza ranking
      await client.query(
        `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
         VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
         ON CONFLICT (user_id) DO UPDATE SET
            player_name = EXCLUDED.player_name,
            avatar = COALESCE(EXCLUDED.avatar, ranking_stats.avatar),
            wins = ranking_stats.wins + $5,
            losses = ranking_stats.losses + $6,
            total = ranking_stats.total + 1,
            win_rate = ROUND(((ranking_stats.wins + $5)::numeric / (ranking_stats.total + 1)::numeric) * 100),
            updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          playerBuild.name || 'Guerreiro',
          playerBuild.avatar || null,
          playerBuild.classification?.rank || 'A',
          isPlayerWinner ? 1 : 0,
          isPlayerWinner ? 0 : 1,
          isPlayerWinner ? 100 : 0,
        ]
      );

      return {
        isPlayerWinner,
        rewardSpins,
        newBalance,
        simulation,
      };
    });

    return c.json({
      success: true,
      isPlayerWinner: result.isPlayerWinner,
      rewardSpins: result.rewardSpins,
      spinsAwarded: result.rewardSpins,
      newBalance: result.newBalance,
      simulation: result.simulation,
      difficulty,
      message: result.isPlayerWinner
        ? `Vitória no Torneio (${difficulty.toUpperCase()})! Você recebeu +${result.rewardSpins} giros!`
        : 'Você foi eliminado desta partida do torneio.',
    });
  } catch (err) {
    console.error('[Tournament Match Error]', err);
    return c.json({ error: 'Erro ao processar partida do torneio.' }, 500);
  }
});
