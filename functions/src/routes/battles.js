import { Hono } from 'hono';
import { query, withTransaction } from '../db.js';
import {
  simulate1v1,
  scaleFighterStats,
  validateTournamentChampion,
  sanitizeBuildStats,
  resolveStatsFromSources,
  generateServerAiBuild,
} from '../battleEngine.js';
import { getAuthenticatedUser } from '../authHelper.js';

export const battlesRouter = new Hono();

/**
 * Valida e sanitiza o build do jogador.
 * Se o jogador possuir um build ativo com statSources no banco de dados,
 * os stats são resolvidos a partir dos personagens oficiais (server-side).
 * Caso contrário, os stats enviados pelo cliente são clampados ao máximo real (99 por stat).
 */
async function getValidatedPlayerBuild(playerBuild, userId) {
  // 1. Tenta carregar o build ativo do banco de dados
  try {
    const dbBuild = await query(
      'SELECT stat_sources, name, avatar_id, signature_move FROM character_builds WHERE user_id = $1 AND is_active = true LIMIT 1',
      [userId]
    );
    if (dbBuild.rows.length > 0) {
      const row = dbBuild.rows[0];
      const statSources = typeof row.stat_sources === 'string' ? JSON.parse(row.stat_sources) : row.stat_sources;
      const resolvedStats = resolveStatsFromSources(statSources);
      if (resolvedStats) {
        return {
          ...playerBuild,
          stats: resolvedStats,
          name: playerBuild?.name || row.name,
          _validatedFrom: 'database',
        };
      }
    }
  } catch (err) {
    console.warn('[Build Validation] Erro ao carregar build do banco:', err?.message);
  }

  // 2. Se o build possui statSources inline, resolve a partir dos personagens oficiais
  if (playerBuild?.statSources && typeof playerBuild.statSources === 'object') {
    const resolvedStats = resolveStatsFromSources(playerBuild.statSources);
    if (resolvedStats) {
      return {
        ...playerBuild,
        stats: resolvedStats,
        _validatedFrom: 'statSources',
      };
    }
  }

  // 3. Fallback: sanitiza os stats enviados pelo cliente (clampa a 99 por stat, 592 total)
  return {
    ...playerBuild,
    stats: sanitizeBuildStats(playerBuild?.stats),
    _validatedFrom: 'sanitized',
  };
}

/**
 * Resolução e validação de batalha na Arena
 * Executa a simulação de batalha no backend para garantir autenticidade.
 * Concede 0 giros (Regra da Economia: Arena não concede giros).
 * Proteção contra duplicação de recompensa via battleId único.
 */
battlesRouter.post('/arena/resolve', async (c) => {
  try {
    const authUser = getAuthenticatedUser(c);
    if (!authUser) {
      return c.json({ error: 'Sessão inválida ou ausente. Faça login para registrar batalhas na Arena.', code: 'UNAUTHORIZED' }, 401);
    }

    const body = await c.req.json();
    const {
      userId,
      battleId,
      playerBuild,
      opponentBuild,
      mode = '1v1',
    } = body;

    // Nunca confia no userId do corpo: usa a identidade do token autenticado
    const effectiveUserId = authUser.uid;
    if (userId && userId !== effectiveUserId) {
      return c.json({ error: 'Acesso negado: você não pode registrar batalhas para outro usuário.', code: 'FORBIDDEN' }, 403);
    }

    if (!battleId || !playerBuild) {
      return c.json({ error: 'Dados incompletos para validação da batalha.' }, 400);
    }

    // 1. Verificação de idempotência: se a batalha já foi registrada, retorna resultado existente
    const existingReward = await query(
      'SELECT id, spins_awarded, created_at FROM rewards_log WHERE battle_id = $1',
      [battleId]
    );

    if (existingReward.rows.length > 0) {
      const uRes = await query('SELECT spins_balance FROM users WHERE id = $1', [effectiveUserId]);
      return c.json({
        success: true,
        alreadyProcessed: true,
        message: 'Esta batalha já foi contabilizada anteriormente.',
        spinsAwarded: existingReward.rows[0].spins_awarded,
        currentSpins: uRes.rows[0]?.spins_balance ?? 0,
      });
    }

    // 2. Valida o build do jogador contra os dados oficiais dos personagens (impede stats forjados)
    const validatedPlayerBuild = await getValidatedPlayerBuild(playerBuild, effectiveUserId);

    // 3. Gera um adversário IA no servidor (não confia no opponentBuild enviado pelo cliente)
    const serverOpponent = generateServerAiBuild(opponentBuild?.name?.replace('[IA] ', ''));

    // 4. Executa a simulação oficial no backend com builds validados
    const simulation = simulate1v1(validatedPlayerBuild, serverOpponent);
    const isPlayerWinner = simulation.isPlayerWinner;

    // Regra da Economia: Arena NÃO concede giros
    const rewardSpins = 0;

    // 3. Transação atômica no Neon: histórico + recompensa (0) + ranking
    const result = await withTransaction(async (client) => {
      // Grava no histórico de batalhas
      await client.query(
        `INSERT INTO battles_history
         (id, user_id, mode, is_win, player_placement, opponent_name, opponent_avatar, player_build_snapshot, total_rounds)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          battleId,
          effectiveUserId,
          mode,
          isPlayerWinner,
          isPlayerWinner ? 1 : 2,
          opponentBuild?.name || serverOpponent?.name || 'Adversário da Arena',
          opponentBuild?.avatar || serverOpponent?.avatar || null,
          JSON.stringify(validatedPlayerBuild),
          simulation.totalRounds,
        ]
      );

      // Registra a recompensa para travar idempotência
      await client.query(
        `INSERT INTO rewards_log (id, user_id, battle_id, source, difficulty, spins_awarded)
         VALUES ($1, $2, $3, 'arena', NULL, $4)`,
        ['rew_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), effectiveUserId, battleId, rewardSpins]
      );

      // Consulta saldo atual
      const cur = await client.query('SELECT spins_balance FROM users WHERE id = $1', [effectiveUserId]);
      const newBalance = cur.rows[0]?.spins_balance ?? 0;

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
          effectiveUserId,
          validatedPlayerBuild.name || 'Guerreiro',
          validatedPlayerBuild.avatar || null,
          validatedPlayerBuild.classification?.rank || 'A',
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
        ? 'Vitória Conquistada na Arena!'
        : 'Derrota. Batalhe novamente para subir no Ranking!',
    });
  } catch (err) {
    console.error('[Arena Resolve Error]', err);
    return c.json({ error: 'Erro ao validar e registrar resultado da batalha.' }, 500);
  }
});

/**
 * Registro inicial ou sincronização de chave de Torneio no Neon
 */
battlesRouter.post('/tournament/start', async (c) => {
  try {
    const authUser = getAuthenticatedUser(c);
    if (!authUser) {
      return c.json({ error: 'Sessão inválida ou ausente. Faça login para registrar torneios.', code: 'UNAUTHORIZED' }, 401);
    }

    const body = await c.req.json();
    const { tournament } = body;

    if (!tournament || !tournament.id) {
      return c.json({ error: 'Dados do torneio ausentes ou inválidos.' }, 400);
    }

    const tournId = tournament.id;
    const name = tournament.name || 'Torneio Eliminatório';
    const size = Number(tournament.size) || 8;
    const difficulty = tournament.difficulty || 'medio';

    await query(
      `INSERT INTO tournaments (id, user_id, name, size, status, champion, bracket_data, difficulty)
       VALUES ($1, $2, $3, $4, 'in_progress', NULL, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
          bracket_data = EXCLUDED.bracket_data,
          updated_at = CURRENT_TIMESTAMP`,
      [tournId, authUser.uid, name, size, JSON.stringify(tournament), difficulty]
    );

    return c.json({ success: true, message: 'Torneio registrado com sucesso no servidor.', tournamentId: tournId });
  } catch (err) {
    console.error('[Tournament Start Error]', err);
    return c.json({ error: 'Erro ao registrar torneio no servidor.' }, 500);
  }
});

/**
 * Resolução e validação de confronto no Torneio
 * Aplica modificador de dificuldade aos adversários:
 * - Fácil: 0.85x atributos
 * - Médio: 1.0x atributos
 * - Difícil: 1.25x atributos
 * Regra da Economia: Partidas individuais NÃO concedem giros (0 giros). Apenas a vitória final do campeonato concede giros.
 */
battlesRouter.post('/tournament/match', async (c) => {
  try {
    const authUser = getAuthenticatedUser(c);
    if (!authUser) {
      return c.json({ error: 'Sessão inválida ou ausente. Faça login para registrar partidas de torneio.', code: 'UNAUTHORIZED' }, 401);
    }

    const body = await c.req.json();
    const {
      userId,
      matchId,
      playerBuild,
      opponentBuild,
      difficulty = 'medio',
    } = body;

    // Nunca confia no userId do corpo: usa a identidade autenticada
    const effectiveUserId = authUser.uid;
    if (userId && userId !== effectiveUserId) {
      return c.json({ error: 'Acesso negado: você não pode registrar confrontos para outro usuário.', code: 'FORBIDDEN' }, 403);
    }

    if (!matchId || !playerBuild || !opponentBuild) {
      return c.json({ error: 'Dados insuficientes para a partida do torneio.' }, 400);
    }

    // 1. Verificação de idempotência por matchId
    const existing = await query(
      'SELECT id, spins_awarded FROM rewards_log WHERE battle_id = $1',
      [matchId]
    );

    if (existing.rows.length > 0) {
      const uRes = await query('SELECT spins_balance FROM users WHERE id = $1', [effectiveUserId]);
      return c.json({
        success: true,
        alreadyProcessed: true,
        message: 'Este confronto já foi contabilizado anteriormente.',
        spinsAwarded: 0,
        currentSpins: uRes.rows[0]?.spins_balance ?? 0,
      });
    }

    // 2. Valida o build do jogador contra os dados oficiais dos personagens (impede stats forjados)
    const validatedPlayerBuild = await getValidatedPlayerBuild(playerBuild, effectiveUserId);

    // 3. Sanitiza e escala os atributos do oponente baseado na dificuldade real
    const sanitizedOpponent = {
      ...opponentBuild,
      stats: sanitizeBuildStats(opponentBuild?.stats),
    };
    const scaledOpponent = scaleFighterStats(sanitizedOpponent, difficulty);

    // 4. Simula confronto no backend com combatentes validados
    const simulation = simulate1v1(validatedPlayerBuild, scaledOpponent);
    const isPlayerWinner = simulation.isPlayerWinner;

    // Regra da Economia: Partidas individuais do torneio NÃO concedem giros (0 giros)
    const rewardSpins = 0;

    // 5. Grava transação no Neon
    const result = await withTransaction(async (client) => {
      // Registra no histórico de batalhas
      await client.query(
        `INSERT INTO battles_history
         (id, user_id, mode, is_win, player_placement, opponent_name, opponent_avatar, player_build_snapshot, total_rounds)
         VALUES ($1, $2, 'Torneio', $3, $4, $5, $6, $7, $8)`,
        [
          matchId,
          effectiveUserId,
          isPlayerWinner,
          isPlayerWinner ? 1 : 2,
          scaledOpponent.name || 'Rival do Torneio',
          scaledOpponent.avatar || null,
          JSON.stringify(validatedPlayerBuild),
          simulation.totalRounds,
        ]
      );

      // Idempotência de recompensa (0 giros)
      await client.query(
        `INSERT INTO rewards_log (id, user_id, battle_id, source, difficulty, spins_awarded)
         VALUES ($1, $2, $3, 'tournament', $4, $5)`,
        ['rew_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), effectiveUserId, matchId, difficulty, rewardSpins]
      );

      // Consulta saldo de giros (inalterado em confrontos individuais)
      const cur = await client.query('SELECT spins_balance FROM users WHERE id = $1', [effectiveUserId]);
      const newBalance = cur.rows[0]?.spins_balance ?? 0;

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
          effectiveUserId,
          validatedPlayerBuild.name || 'Guerreiro',
          validatedPlayerBuild.avatar || null,
          validatedPlayerBuild.classification?.rank || 'A',
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
        ? `Vitória na partida do Torneio (${difficulty.toUpperCase()})!`
        : 'Você foi eliminado desta partida do torneio.',
    });
  } catch (err) {
    console.error('[Tournament Match Error]', err);
    return c.json({ error: 'Erro ao processar partida do torneio.' }, 500);
  }
});

/**
 * Resolução oficial e segura da Vitória de Torneio (Conclusão do Campeonato)
 * O backend NÃO confia em flags (`isPlayerWinner`) enviadas pelo cliente.
 * Requer o objeto do torneio completo e validação estrutural da chave e Grande Final.
 * Concede a recompensa única de giros baseada na dificuldade:
 * - Fácil: +3 giros
 * - Médio: +5 giros
 * - Difícil: +8 giros
 * - Derrota ou fraude: 0 giros
 * Proteção atômica e idempotência estrita via chave composta (user_id, battle_id).
 */
battlesRouter.post('/tournament/resolve', async (c) => {
  try {
    const authUser = getAuthenticatedUser(c);
    if (!authUser) {
      return c.json({ error: 'Sessão inválida ou ausente. Faça login para reivindicar recompensas.', code: 'UNAUTHORIZED' }, 401);
    }

    const body = await c.req.json();
    const {
      userId,
      tournament,
      tournamentId,
      playerBuild,
    } = body;

    // Nunca confia no userId do corpo: usa estritamente a identidade autenticada
    const effectiveUserId = authUser.uid;
    if (userId && userId !== effectiveUserId) {
      return c.json({ error: 'Acesso negado: você não pode reivindicar recompensas para outro usuário.', code: 'FORBIDDEN' }, 403);
    }

    if (!tournament && !tournamentId) {
      return c.json({ error: 'Identificador do torneio é obrigatório.' }, 400);
    }

    // 1. Validação de segurança obrigatória: não aceita chamadas sem a estrutura completa
    if (!tournament || typeof tournament !== 'object') {
      return c.json({
        success: false,
        error: 'Validação de integridade: a chave completa do torneio é obrigatória para verificação.',
        spinsAwarded: 0,
        isValid: false,
      }, 403);
    }

    // 2. Validação rigorosa no backend (participantes, rodadas, invencibilidade, Grande Final e vinculação com ID real do usuário)
    const validation = validateTournamentChampion(tournament, effectiveUserId);
    if (!validation.isValid) {
      return c.json({
        success: false,
        error: validation.reason,
        spinsAwarded: 0,
        isValid: false,
      }, 403);
    }

    const officialTournamentId = tournament.id || tournamentId;
    // Identificador único com namespace de usuário: evita que dois jogadores com mesmo ID de torneio se bloqueiem
    const battleLogId = `tourn_${effectiveUserId}_${officialTournamentId}`;
    const legacyBattleLogId = `tourn_${officialTournamentId}`;

    // 3. Verificação de idempotência prévia
    const existing = await query(
      'SELECT id, spins_awarded FROM rewards_log WHERE (battle_id = $1 AND user_id = $2) OR (battle_id = $3 AND user_id = $2)',
      [battleLogId, effectiveUserId, legacyBattleLogId]
    );

    if (existing.rows.length > 0) {
      const uRes = await query('SELECT spins_balance FROM users WHERE id = $1', [effectiveUserId]);
      return c.json({
        success: true,
        alreadyProcessed: true,
        message: 'A recompensa deste torneio já foi creditada anteriormente.',
        spinsAwarded: 0,
        currentSpins: uRes.rows[0]?.spins_balance ?? 0,
      });
    }

    const rewardSpins = validation.rewardSpins;
    const finalDifficulty = validation.difficulty;

    // Sincroniza estado de conclusão no banco de dados na tabela tournaments
    try {
      await query(
        `INSERT INTO tournaments (id, user_id, name, size, status, champion, bracket_data, difficulty)
         VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
            status = 'completed',
            champion = EXCLUDED.champion,
            bracket_data = EXCLUDED.bracket_data,
            updated_at = CURRENT_TIMESTAMP`,
        [
          officialTournamentId,
          effectiveUserId,
          tournament.name || 'Torneio Eliminatório',
          Number(tournament.size) || 8,
          JSON.stringify(tournament.champion || { userId: effectiveUserId, name: validation.playerName }),
          JSON.stringify(tournament),
          finalDifficulty,
        ]
      );
    } catch (tErr) {
      console.warn('[Tournament DB Sync Warning]', tErr?.message);
    }

    // Valida o build do jogador para registrar snapshot com atributos autoritativos
    const validatedPlayerBuild = await getValidatedPlayerBuild(playerBuild, effectiveUserId);

    // 4. Transação atômica no Neon PostgreSQL com trava FOR UPDATE
    let result;
    try {
      result = await withTransaction(async (client) => {
        // Bloqueia linha do usuário para evitar concorrência simultânea
        const userLock = await client.query(
          'SELECT id, spins_balance FROM users WHERE id = $1 FOR UPDATE',
          [effectiveUserId]
        );

        if (userLock.rows.length === 0) {
          throw new Error('Guerreiro não encontrado no banco de dados.');
        }

        // Dupla checagem dentro da transação protegida pelo bloqueio
        const recheck = await client.query(
          'SELECT id FROM rewards_log WHERE (battle_id = $1 AND user_id = $2) OR (battle_id = $3 AND user_id = $2)',
          [battleLogId, effectiveUserId, legacyBattleLogId]
        );

        if (recheck.rows.length > 0) {
          return {
            alreadyProcessed: true,
            rewardSpins: 0,
            newBalance: userLock.rows[0].spins_balance,
          };
        }

        // Registra no histórico de batalhas
        await client.query(
          `INSERT INTO battles_history
           (id, user_id, mode, is_win, player_placement, opponent_name, opponent_avatar, player_build_snapshot, total_rounds)
           VALUES ($1, $2, 'Torneio', true, 1, 'Grande Final do Torneio', NULL, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [
            battleLogId,
            effectiveUserId,
            JSON.stringify(validatedPlayerBuild || { name: validation.playerName || 'Campeão' }),
            Array.isArray(tournament.rounds) ? tournament.rounds.length : 1,
          ]
        );

        // Registra no log de recompensas (chave única)
        await client.query(
          `INSERT INTO rewards_log (id, user_id, battle_id, source, difficulty, spins_awarded)
           VALUES ($1, $2, $3, 'tournament', $4, $5)`,
          [
            'rew_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            effectiveUserId,
            battleLogId,
            finalDifficulty,
            rewardSpins,
          ]
        );

        // Credita os giros ao saldo do usuário no PostgreSQL
        const updateBalance = await client.query(
          `UPDATE users
           SET spins_balance = spins_balance + $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING spins_balance`,
          [rewardSpins, effectiveUserId]
        );

        const newBalance = updateBalance.rows[0]?.spins_balance ?? 0;

        // Atualiza ranking_stats do campeão
        await client.query(
          `INSERT INTO ranking_stats (user_id, player_name, avatar, rank, wins, losses, total, win_rate)
           VALUES ($1, $2, $3, 'S', 1, 0, 1, 100)
           ON CONFLICT (user_id) DO UPDATE SET
              wins = ranking_stats.wins + 1,
              total = ranking_stats.total + 1,
              win_rate = ROUND(((ranking_stats.wins + 1)::numeric / (ranking_stats.total + 1)::numeric) * 100),
              updated_at = CURRENT_TIMESTAMP`,
          [
            effectiveUserId,
            validatedPlayerBuild?.name || validation.playerName || 'Campeão',
            validatedPlayerBuild?.avatar || null,
          ]
        );

        return { newBalance, rewardSpins, alreadyProcessed: false };
      });
    } catch (txErr) {
      // Verifica especificamente violação do índice único de recompensas (idempotência).
      // Outros erros 23505 (como conflito de PK em battles_history) NÃO são tratados aqui.
      if (
        txErr.code === '23505' &&
        (txErr.constraint === 'idx_rewards_user_battle_unique' ||
          txErr.constraint === 'rewards_log_battle_id_key' ||
          (txErr.detail && txErr.detail.includes('battle_id')))
      ) {
        const uRes = await query('SELECT spins_balance FROM users WHERE id = $1', [effectiveUserId]);
        return c.json({
          success: true,
          alreadyProcessed: true,
          message: 'A recompensa deste torneio já foi creditada anteriormente.',
          spinsAwarded: 0,
          currentSpins: uRes.rows[0]?.spins_balance ?? 0,
        });
      }
      throw txErr;
    }

    if (result.alreadyProcessed) {
      return c.json({
        success: true,
        alreadyProcessed: true,
        message: 'A recompensa deste torneio já foi creditada anteriormente.',
        spinsAwarded: 0,
        currentSpins: result.newBalance,
      });
    }

    return c.json({
      success: true,
      isPlayerWinner: true,
      spinsAwarded: result.rewardSpins,
      newBalance: result.newBalance,
      difficulty: finalDifficulty,
      message: `🏆 CAMPEÃO DO TORNEIO (${finalDifficulty.toUpperCase()})! Você conquistou +${result.rewardSpins} Giros!`,
    });
  } catch (err) {
    console.error('[Tournament Resolve Error]', err);
    return c.json({ error: 'Erro ao validar e registrar premiação do torneio.' }, 500);
  }
});
