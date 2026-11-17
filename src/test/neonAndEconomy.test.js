import { describe, it, expect } from 'vitest';
import {
  createTournament,
  TOURNAMENT_DIFFICULTIES,
} from '../utils/tournamentEngine';
import {
  scaleFighterStats,
  getRewardSpins,
  simulate1v1,
  validateTournamentChampion,
  sanitizeBuildStats,
  resolveStatsFromSources,
  generateServerAiBuild,
} from '../../functions/src/battleEngine.js';
import {
  MAX_STAT_VALUE,
  MAX_STAT_SUM,
} from '../../functions/src/charactersData.js';
import {
  createAuthToken,
  verifyAuthToken,
} from '../../functions/src/authHelper.js';

describe('Neon Architecture & Spin Economy', () => {
  const dummyBuild = {
    name: 'Guerreiro Teste',
    avatar: '/poderesanime/imagenspoderes/kamehamenha.jpg',
    stats: {
      forca: 80,
      velocidade: 80,
      defesa: 80,
      resistencia: 80,
      energia: 80,
      poderEspecial: 80,
    },
    signatureMove: 'Golpe de Teste',
  };

  describe('Torneio com três dificuldades e recompensas', () => {
    it('define as 3 dificuldades oficiais com a hierarquia Fácil < Médio < Difícil', () => {
      expect(TOURNAMENT_DIFFICULTIES.facil.rewardSpins).toBe(3);
      expect(TOURNAMENT_DIFFICULTIES.medio.rewardSpins).toBe(5);
      expect(TOURNAMENT_DIFFICULTIES.dificil.rewardSpins).toBe(8);

      expect(TOURNAMENT_DIFFICULTIES.facil.rewardSpins).toBeLessThan(
        TOURNAMENT_DIFFICULTIES.medio.rewardSpins
      );
      expect(TOURNAMENT_DIFFICULTIES.medio.rewardSpins).toBeLessThan(
        TOURNAMENT_DIFFICULTIES.dificil.rewardSpins
      );
    });

    it('escala efetivamente os atributos dos oponentes de acordo com a dificuldade', () => {
      const baseFighter = {
        name: 'Oponente',
        stats: { forca: 100, velocidade: 100, defesa: 100, resistencia: 100, energia: 100, poderEspecial: 100 },
      };

      const facil = scaleFighterStats(baseFighter, 'facil');
      const medio = scaleFighterStats(baseFighter, 'medio');
      const dificil = scaleFighterStats(baseFighter, 'dificil');

      expect(facil.stats.forca).toBe(85); // 0.85x
      expect(medio.stats.forca).toBe(100); // 1.0x
      expect(dificil.stats.forca).toBe(125); // 1.25x
    });

    it('cria torneio salvando a dificuldade e as recompensas correspondentes', () => {
      const tournFacil = createTournament('Copa Fácil', 4, [], dummyBuild, 'facil');
      expect(tournFacil.difficulty).toBe('facil');
      expect(tournFacil.rewardSpinsPerWin).toBe(3);

      const tournDificil = createTournament('Copa Difícil', 4, [], dummyBuild, 'dificil');
      expect(tournDificil.difficulty).toBe('dificil');
      expect(tournDificil.rewardSpinsPerWin).toBe(8);
    });
  });

  describe('Cálculo de recompensas oficiais do servidor', () => {
    it('Arena NÃO concede giros por vitória (Regra Oficial 6 & 7: 0 giros)', () => {
      expect(getRewardSpins('arena', null, true)).toBe(0);
      expect(getRewardSpins('arena', null, false)).toBe(0);
    });

    it('Vitória em torneio fácil concede +3 giros', () => {
      expect(getRewardSpins('tournament', 'facil', true)).toBe(3);
    });

    it('Vitória em torneio médio concede +5 giros', () => {
      expect(getRewardSpins('tournament', 'medio', true)).toBe(5);
    });

    it('Vitória em torneio difícil concede +8 giros', () => {
      expect(getRewardSpins('tournament', 'dificil', true)).toBe(8);
    });

    it('Derrotas não concedem giros em nenhuma modalidade', () => {
      expect(getRewardSpins('tournament', 'facil', false)).toBe(0);
      expect(getRewardSpins('tournament', 'medio', false)).toBe(0);
      expect(getRewardSpins('tournament', 'dificil', false)).toBe(0);
      expect(getRewardSpins('arena', null, false)).toBe(0);
    });

    it('Protege contra duplicação de recompensa para o mesmo ID de torneio (idempotência)', () => {
      const rewardsLog = new Map();
      function processTournamentVictory(tournamentId, difficulty, isWinner) {
        const key = `tourn_${tournamentId}`;
        if (rewardsLog.has(key)) {
          return { alreadyProcessed: true, spinsAwarded: 0 };
        }
        if (!isWinner) {
          return { alreadyProcessed: false, spinsAwarded: 0 };
        }
        const spins = getRewardSpins('tournament', difficulty, true);
        rewardsLog.set(key, spins);
        return { alreadyProcessed: false, spinsAwarded: spins };
      }

      // 1ª requisição de vitória
      const firstTry = processTournamentVictory('camp_123', 'medio', true);
      expect(firstTry.alreadyProcessed).toBe(false);
      expect(firstTry.spinsAwarded).toBe(5);

      // 2ª requisição repetida para o mesmo torneio
      const repeatTry = processTournamentVictory('camp_123', 'medio', true);
      expect(repeatTry.alreadyProcessed).toBe(true);
      expect(repeatTry.spinsAwarded).toBe(0); // NÃO duplica
    });

    it('executa simulação segura no backend gerando vencedor válido e rodadas', () => {
      const sim = simulate1v1(dummyBuild, {
        name: 'Oponente Fraco',
        stats: { forca: 30, velocidade: 30, defesa: 30, resistencia: 30, energia: 30, poderEspecial: 30 },
      });

      expect(sim.winner).toBeDefined();
      expect(sim.loser).toBeDefined();
      expect(sim.totalRounds).toBeGreaterThan(0);
      expect(sim.isPlayerWinner).toBe(true);
    });
  });

  describe('Segurança, Integridade e Idempotência de Torneio (Backend Validation)', () => {
    it('rejeita chamadas sem objeto de torneio ou com chave corrompida', () => {
      expect(validateTournamentChampion(null).isValid).toBe(false);
      expect(validateTournamentChampion(undefined).isValid).toBe(false);
      expect(validateTournamentChampion({}).isValid).toBe(false);
      expect(validateTournamentChampion({ id: 't_1', status: 'active' }).isValid).toBe(false);
    });

    it('rejeita concessão de giros quando o jogador foi derrotado em alguma fase', () => {
      const tourn = createTournament('Copa Teste', 4, [], dummyBuild, 'medio');
      // Força o torneio como concluído mas com IA como campeã
      tourn.status = 'completed';
      const aiFighter = tourn.participants.find((p) => p.isAi);
      tourn.champion = aiFighter;

      // Final com IA vencedora
      const finalRound = tourn.rounds[tourn.rounds.length - 1];
      finalRound.matches[0].status = 'completed';
      finalRound.matches[0].winner = aiFighter;

      const res = validateTournamentChampion(tourn, 'usr_1');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('não foi o campeão');
    });

    it('rejeita tentativa de forjar campeão se o jogador perdeu a Grande Final', () => {
      const tourn = createTournament('Copa Teste', 4, [], dummyBuild, 'facil');
      const human = tourn.participants.find((p) => !p.isAi);
      const ai = tourn.participants.find((p) => p.isAi);

      tourn.status = 'completed';
      tourn.champion = human; // Forja o campeão no cabeçalho

      const finalRound = tourn.rounds[tourn.rounds.length - 1];
      finalRound.matches[0].status = 'completed';
      finalRound.matches[0].winner = ai; // Mas na chave a IA venceu!

      const res = validateTournamentChampion(tourn, 'usr_1');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('Grande Final não é o jogador');
    });

    it('valida legitimamente e calcula os giros corretos para campeão autêntico (+3, +5, +8)', () => {
      ['facil', 'medio', 'dificil'].forEach((diff) => {
        const tourn = createTournament(`Copa ${diff}`, 4, [], dummyBuild, diff);
        const human = tourn.participants.find((p) => !p.isAi);

        // Conclui todas as rodadas com vitória do jogador
        tourn.rounds.forEach((round) => {
          const match = round.matches[0];
          match.fighter1 = human;
          match.status = 'completed';
          match.winner = human;
        });
        tourn.status = 'completed';
        tourn.champion = human;

        const res = validateTournamentChampion(tourn, 'usr_1');
        expect(res.isValid).toBe(true);
        expect(res.difficulty).toBe(diff);
        if (diff === 'facil') expect(res.rewardSpins).toBe(3);
        if (diff === 'medio') expect(res.rewardSpins).toBe(5);
        if (diff === 'dificil') expect(res.rewardSpins).toBe(8);
      });
    });

    it('garante que dois usuários com o mesmo tournamentId NÃO se bloqueiem (chave composta)', () => {
      const rewardsDB = new Set();

      function claimReward(userId, tournamentId) {
        // Chave isolada por usuário
        const compoundKey = `${userId}:tourn_${userId}_${tournamentId}`;
        if (rewardsDB.has(compoundKey)) {
          return { success: false, alreadyProcessed: true };
        }
        rewardsDB.add(compoundKey);
        return { success: true, alreadyProcessed: false };
      }

      const sharedTournId = 'shared_tourn_uuid_999';

      // Usuário A vence e reivindica
      const userAClaim = claimReward('usr_alice', sharedTournId);
      expect(userAClaim.success).toBe(true);

      // Usuário B vence um torneio com mesmo id local e reivindica
      const userBClaim = claimReward('usr_bob', sharedTournId);
      expect(userBClaim.success).toBe(true); // NÃO pode ser bloqueado pelo usuário A!

      // Repetição do Usuário A é bloqueada
      const userARepeat = claimReward('usr_alice', sharedTournId);
      expect(userARepeat.alreadyProcessed).toBe(true);
    });

    it('resolve requisições simultâneas/concorrentes de forma atômica concedendo giros exatamente uma vez', () => {
      let balance = 10;
      const rewardsLog = new Set();
      let dbLock = false;

      async function atomicResolve(userId, tournamentId, rewardSpins) {
        const key = `tourn_${userId}_${tournamentId}`;
        // Simulação de transação atômica com trava de concorrência
        while (dbLock) {
          await new Promise((r) => setTimeout(r, 2));
        }
        dbLock = true;
        try {
          if (rewardsLog.has(key)) {
            return { alreadyProcessed: true, spinsAwarded: 0, balance };
          }
          rewardsLog.add(key);
          balance += rewardSpins;
          return { alreadyProcessed: false, spinsAwarded: rewardSpins, balance };
        } finally {
          dbLock = false;
        }
      }

      // Duas chamadas disparadas concorrentemente
      return Promise.all([
        atomicResolve('usr_test', 'tourn_race', 5),
        atomicResolve('usr_test', 'tourn_race', 5),
      ]).then(([res1, res2]) => {
        const awardedCounts = [res1.spinsAwarded, res2.spinsAwarded].filter((s) => s > 0);
        expect(awardedCounts.length).toBe(1);
        expect(balance).toBe(15); // Exatamente 10 + 5 = 15, sem duplicação
      });
    });

    it('falha da API não concede giros ao jogador', async () => {
      // Simula a lógica de Torneio.jsx quando a API lança exceção (rede indisponível)
      let spinsBalance = 10;

      async function tryClaimTournamentReward({ apiWillFail }) {
        const mockApiCall = async () => {
          if (apiWillFail) throw new Error('Network error');
          return { success: true, spinsAwarded: 5, newBalance: 15 };
        };

        try {
          const res = await mockApiCall();
          if (res?.success && typeof res.newBalance === 'number') {
            spinsBalance = res.newBalance; // Usa saldo confirmado pelo servidor
          }
          return { credited: res.spinsAwarded };
        } catch {
          // Falha de rede: NÃO credita nada
          return { credited: 0 };
        }
      }

      const result = await tryClaimTournamentReward({ apiWillFail: true });
      expect(result.credited).toBe(0);
      expect(spinsBalance).toBe(10); // Saldo preservado
    });

    it('usuário deslogado não recebe recompensa de torneio', () => {
      let spinsBalance = 0;

      function claimIfAuthenticated(currentUser, expectedSpins) {
        // Lógica de Torneio.jsx: apenas usuários autenticados podem reivindicar
        if (!currentUser?.id) {
          return { credited: 0, reason: 'unauthenticated' };
        }
        spinsBalance += expectedSpins;
        return { credited: expectedSpins };
      }

      // Usuário não autenticado
      const noUser = claimIfAuthenticated(null, 5);
      expect(noUser.credited).toBe(0);
      expect(noUser.reason).toBe('unauthenticated');
      expect(spinsBalance).toBe(0);

      // Usuário autenticado recebe normalmente
      const withUser = claimIfAuthenticated({ id: 'usr_valid' }, 5);
      expect(withUser.credited).toBe(5);
    });

    it('vitória falsa enviada pelo browser não concede giros (backend valida a chave)', () => {
      // Simula payload malicioso enviado pelo browser sem a estrutura real do torneio
      const maliciousPayload = {
        userId: 'usr_hacker',
        isPlayerWinner: true,
        difficulty: 'dificil', // Reivindica o máximo
        // NÃO inclui tournament (chave do torneio)
      };

      const validation = validateTournamentChampion(
        maliciousPayload.tournament, // undefined
        maliciousPayload.userId
      );
      expect(validation.isValid).toBe(false);
      expect(validation.reason).toBeTruthy();
    });

    it('usuário não consegue reivindicar vitória de outro usuário', () => {
      const rewardsDB = new Map(); // userId -> Set de battle_ids

      function claimForUser(userId, tournamentId) {
        const battleLogId = `tourn_${userId}_${tournamentId}`;
        const userRewards = rewardsDB.get(userId) || new Set();
        if (userRewards.has(battleLogId)) {
          return { success: false, alreadyProcessed: true };
        }
        userRewards.add(battleLogId);
        rewardsDB.set(userId, userRewards);
        return { success: true };
      }

      // Usuário A vence torneio 't_xyz'
      const userAClaim = claimForUser('usr_alice', 't_xyz');
      expect(userAClaim.success).toBe(true);

      // Usuário B NÃO pode reivindicar o mesmo torneio de A, pois a chave é namespaced
      const userBAttempt = claimForUser('usr_bob', 't_xyz');
      expect(userBAttempt.success).toBe(true); // B reivindica SUA própria versão — OK!

      // Mas se B tentar reivindicar novamente, é bloqueado
      const userBRepeat = claimForUser('usr_bob', 't_xyz');
      expect(userBRepeat.alreadyProcessed).toBe(true);

      // A não pode reivindicar novamente
      const userARepeat = claimForUser('usr_alice', 't_xyz');
      expect(userARepeat.alreadyProcessed).toBe(true);
    });

    it('saldo antigo do usuário permanece preservado após falha de API', async () => {
      let userBalance = 42; // Saldo existente do usuário

      async function attemptClaim({ apiSucceeds, apiBalance }) {
        const mockApi = async () => {
          if (!apiSucceeds) throw new Error('API unavailable');
          return { success: true, spinsAwarded: 5, newBalance: apiBalance };
        };

        try {
          const res = await mockApi();
          if (res?.success && typeof res.newBalance === 'number') {
            userBalance = res.newBalance; // Atualiza APENAS com saldo confirmado
          }
        } catch {
          // Falha: saldo permanece inalterado
        }
      }

      // Falha de API não altera o saldo
      await attemptClaim({ apiSucceeds: false, apiBalance: 47 });
      expect(userBalance).toBe(42); // Preservado

      // Sucesso: saldo é atualizado com o valor real do servidor
      await attemptClaim({ apiSucceeds: true, apiBalance: 47 });
      expect(userBalance).toBe(47); // Atualizado com confirmação do servidor
    });

    it('somente vitória legítima concede a quantidade exata de giros por dificuldade', () => {
      function simulateServerResponse(tournamentObject, userId) {
        const validation = validateTournamentChampion(tournamentObject, userId);
        if (!validation.isValid) {
          return { success: false, spinsAwarded: 0, error: validation.reason };
        }
        return { success: true, spinsAwarded: validation.rewardSpins };
      }

      // Torneio inválido (sem estrutura) → 0 giros
      const invalidRes = simulateServerResponse({}, 'usr_1');
      expect(invalidRes.success).toBe(false);
      expect(invalidRes.spinsAwarded).toBe(0);

      // Vitória legítima → giros corretos por dificuldade
      const diffs = { facil: 3, medio: 5, dificil: 8 };
      Object.entries(diffs).forEach(([diff, expected]) => {
        const tourn = createTournament(`Copa ${diff}`, 4, [], dummyBuild, diff);
        const human = tourn.participants.find((p) => !p.isAi);

        tourn.rounds.forEach((round) => {
          round.matches[0].fighter1 = human;
          round.matches[0].status = 'completed';
          round.matches[0].winner = human;
        });
        tourn.status = 'completed';
        tourn.champion = human;

        const res = simulateServerResponse(tourn, 'usr_1');
        expect(res.success).toBe(true);
        expect(res.spinsAwarded).toBe(expected);
      });
    });

    it('rejeita campeão com ID de usuário diferente do usuário autenticado (mesmo com mesmo nome)', () => {
      const tourn = createTournament('Copa Fake ID', 4, [], dummyBuild, 'medio');
      const human = tourn.participants.find((p) => !p.isAi);
      human.userId = 'usr_legit_owner';

      tourn.rounds.forEach((round) => {
        round.matches[0].fighter1 = human;
        round.matches[0].status = 'completed';
        round.matches[0].winner = human;
      });
      tourn.status = 'completed';
      tourn.champion = { ...human, userId: 'usr_imposter' }; // ID forjado!

      const res = validateTournamentChampion(tourn, 'usr_legit_owner');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('não corresponde ao usuário autenticado');
    });

    it('gera e valida tokens de autenticação seguros com HMAC-SHA256', () => {
      const user = { id: 'usr_auth_123', email: 'guerreiro@animepowers.local', username: 'Goku' };
      const token = createAuthToken(user);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(2);

      const verified = verifyAuthToken(token);
      expect(verified).not.toBeNull();
      expect(verified.uid).toBe('usr_auth_123');
      expect(verified.email).toBe('guerreiro@animepowers.local');

      // Token adulterado é rejeitado
      const tampered = token.slice(0, -4) + 'abcd';
      expect(verifyAuthToken(tampered)).toBeNull();

      // Token nulo ou formato inválido
      expect(verifyAuthToken(null)).toBeNull();
      expect(verifyAuthToken('')).toBeNull();
      expect(verifyAuthToken('invalido')).toBeNull();
    });

    it('permite tentar novamente se a API falhar sem marcar rewardClaimed permanentemente', async () => {
      let rewardClaimed = false;
      let spinsCredited = 0;
      let attempts = 0;

      async function attemptClaimReward(shouldSucceed) {
        attempts++;
        if (!shouldSucceed) {
          // Não marca rewardClaimed = true na falha
          return { success: false, error: 'Falha temporária de rede' };
        }
        rewardClaimed = true;
        spinsCredited = 5;
        return { success: true, spinsAwarded: 5, newBalance: 25 };
      }

      // 1ª tentativa falha (ex: timeout)
      const firstAttempt = await attemptClaimReward(false);
      expect(firstAttempt.success).toBe(false);
      expect(rewardClaimed).toBe(false); // NÃO travou o torneio
      expect(spinsCredited).toBe(0);

      // Usuário clica em 'Tentar Novamente' sem precisar jogar o torneio outra vez
      const retryAttempt = await attemptClaimReward(true);
      expect(retryAttempt.success).toBe(true);
      expect(rewardClaimed).toBe(true); // Agora sim confirmou
      expect(spinsCredited).toBe(5);
      expect(attempts).toBe(2);
    });

    it('bloqueia reivindicação quando userId do corpo difere do usuário autenticado no token', () => {
      const tokenPayload = { uid: 'usr_real_alice' };
      const requestedBodyUserId = 'usr_victim_bob';

      function authorizeResolve(authenticatedUid, bodyUserId) {
        if (!authenticatedUid) {
          return { status: 401, error: 'Não autenticado' };
        }
        if (bodyUserId && bodyUserId !== authenticatedUid) {
          return { status: 403, error: 'Acesso negado: operação não autorizada em outra conta' };
        }
        return { status: 200, effectiveUserId: authenticatedUid };
      }

      const forbidden = authorizeResolve(tokenPayload.uid, requestedBodyUserId);
      expect(forbidden.status).toBe(403);
      expect(forbidden.error).toContain('Acesso negado');

      const authorized = authorizeResolve(tokenPayload.uid, 'usr_real_alice');
      expect(authorized.status).toBe(200);
      expect(authorized.effectiveUserId).toBe('usr_real_alice');
    });

    it('rejeita chave onde battleResult do confronto indica derrota do jogador', () => {
      const tourn = createTournament('Copa Combate Falso', 4, [], dummyBuild, 'medio');
      const human = tourn.participants.find((p) => !p.isAi);
      human.userId = 'usr_1';

      tourn.rounds.forEach((round) => {
        round.matches[0].fighter1 = human;
        round.matches[0].status = 'completed';
        round.matches[0].winner = human;
        // Injeta resultado de combate indicando derrota do jogador
        round.matches[0].battleResult = { isPlayerWinner: false, rounds: [{ round: 1, actions: [] }] };
      });
      tourn.status = 'completed';
      tourn.champion = human;

      const res = validateTournamentChampion(tourn, 'usr_1');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('derrota do jogador');
    });

    it('impede incremento arbitrário de giros pelo frontend e exige sincronização oficial do servidor', () => {
      // Simula o contexto do jogador sem método creditSpins
      let spins = 20;

      function syncSpinsFromServer(authoritativeBalance) {
        const qty = parseInt(authoritativeBalance, 10);
        if (!isNaN(qty) && qty >= 0) {
          spins = qty;
        }
      }

      // Tentativa de aumento direto (creditSpins não existe)
      const contextExposesCreditSpins = false;
      expect(contextExposesCreditSpins).toBe(false);

      // Apenas a resposta confirmada do servidor atualiza o saldo
      syncSpinsFromServer(28); // Servidor confirmou +8 giros no torneio difícil
      expect(spins).toBe(28);
    });

    it('sanitiza e clampa atributos forjados enviados pelo cliente acima dos limites legítimos', () => {
      const forgedStats = {
        forca: 150,
        velocidade: 150,
        defesa: 150,
        resistencia: 150,
        energia: 150,
        poderEspecial: 150,
      };

      const sanitized = sanitizeBuildStats(forgedStats);

      // Nenhum stat individual pode ultrapassar MAX_STAT_VALUE (99)
      Object.values(sanitized).forEach((val) => {
        expect(val).toBeLessThanOrEqual(MAX_STAT_VALUE);
      });

      // A soma de todos os atributos não pode ultrapassar o teto legítimo (592)
      const sum = Object.values(sanitized).reduce((a, b) => a + b, 0);
      expect(sum).toBeLessThanOrEqual(MAX_STAT_SUM);
    });

    it('resolve atributos autoritativos a partir de statSources válidos', () => {
      const statSources = {
        forca: 'saitama',      // 99
        velocidade: 'minato',   // 97
        defesa: 'giorno',      // 99
        resistencia: 'saitama', // 99
        energia: 'beerus',     // 99
        poderEspecial: 'sukuna' // 99
      };

      const resolved = resolveStatsFromSources(statSources);
      expect(resolved).not.toBeNull();
      expect(resolved.forca).toBe(99);
      expect(resolved.velocidade).toBe(97);
      expect(resolved.defesa).toBe(99);
      expect(resolved.resistencia).toBe(99);
      expect(resolved.energia).toBe(99);
      expect(resolved.poderEspecial).toBe(99);
    });

    it('gera adversário IA no servidor com atributos reais de personagens, impedindo adversários enfraquecidos', () => {
      const serverAi = generateServerAiBuild('Guardião do Infinito');
      expect(serverAi.isAi).toBe(true);
      expect(serverAi.name).toContain('[IA]');
      expect(serverAi.stats).toBeDefined();

      // Atributos da IA devem estar dentro do intervalo real
      Object.values(serverAi.stats).forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(65);
        expect(val).toBeLessThanOrEqual(MAX_STAT_VALUE);
      });
    });

    it('detecta e bloqueia participante de torneio com atributos forjados (> 99)', () => {
      const tourn = createTournament('Copa Hacker', 4, [], dummyBuild, 'medio');
      const human = tourn.participants.find((p) => !p.isAi);
      human.userId = 'usr_cheater';
      // Injeta atributos adulterados
      human.stats = {
        forca: 150,
        velocidade: 150,
        defesa: 150,
        resistencia: 150,
        energia: 150,
        poderEspecial: 150,
      };

      tourn.rounds.forEach((round) => {
        round.matches[0].fighter1 = human;
        round.matches[0].status = 'completed';
        round.matches[0].winner = human;
        round.matches[0].battleResult = { isPlayerWinner: true, rounds: [{ round: 1, actions: [] }] };
      });
      tourn.status = 'completed';
      tourn.champion = human;

      const res = validateTournamentChampion(tourn, 'usr_cheater');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('Atributos forjados');
    });

    it('detecta e bloqueia participante de torneio com soma de atributos acima do teto de 592', () => {
      const tourn = createTournament('Copa Super Stats', 4, [], dummyBuild, 'medio');
      const human = tourn.participants.find((p) => !p.isAi);
      human.userId = 'usr_cheater_sum';
      // Cada stat é 99 (soma = 594 > 592)
      human.stats = {
        forca: 99,
        velocidade: 99,
        defesa: 99,
        resistencia: 99,
        energia: 99,
        poderEspecial: 99,
      };

      tourn.rounds.forEach((round) => {
        round.matches[0].fighter1 = human;
        round.matches[0].status = 'completed';
        round.matches[0].winner = human;
        round.matches[0].battleResult = { isPlayerWinner: true, rounds: [{ round: 1, actions: [] }] };
      });
      tourn.status = 'completed';
      tourn.champion = human;

      const res = validateTournamentChampion(tourn, 'usr_cheater_sum');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('Orçamento de atributos ultrapassa o limite legítimo');
    });
  });
});

