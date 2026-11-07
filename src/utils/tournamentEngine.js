/**
 * Motor de Torneios do Anime Powers
 * Gerencia a chave eliminatória (Single Elimination), avanço de fases,
 * resolução com o motor de batalha (battleEngine.js) e coroação do campeão.
 */

import { simulate1v1, createFighterState, generateAiBuild } from './battleEngine';
import { CHARACTERS } from '../data/characters';

const ROUND_NAMES = {
  16: { 1: 'Oitavas de Final', 2: 'Quartas de Final', 3: 'Semifinais', 4: 'Grande Final' },
  8: { 1: 'Quartas de Final', 2: 'Semifinais', 3: 'Grande Final' },
  4: { 1: 'Semifinais', 2: 'Grande Final' },
};

export const TOURNAMENT_SIZES = [4, 8, 16];

export const TOURNAMENT_DIFFICULTIES = {
  facil: {
    key: 'facil',
    label: 'Fácil',
    badge: 'Iniciante',
    statMultiplier: 0.85,
    rewardSpins: 3,
    description: 'Oponentes mais acessíveis com atributos atenuados. Recompensa: +3 Giros por vitória.',
  },
  medio: {
    key: 'medio',
    label: 'Médio',
    badge: 'Desafiante',
    statMultiplier: 1.0,
    rewardSpins: 5,
    description: 'Dificuldade padrão do torneio competitivo. Recompensa: +5 Giros por vitória.',
  },
  dificil: {
    key: 'dificil',
    label: 'Difícil',
    badge: 'Supremo',
    statMultiplier: 1.25,
    rewardSpins: 8,
    description: 'Guerreiros de elite com atributos amplificados em 25%. Recompensa: +8 Giros por vitória.',
  },
};

export const EPIC_TOURNAMENT_NAMES = [
  'Torneio das Trevas Cósmicas',
  'Grande Torneio Celestial de Budokai',
  'Exame Chunin Supremo',
  'Batalha do Vazio Infinito',
  'Copa das Seitas Marciais',
  'Guerra Sagrada do Santuário',
  'Torneio dos Soberanos das Sombras',
  'Festival Esportivo dos Campeões',
];

export function getRandomTournamentName() {
  return EPIC_TOURNAMENT_NAMES[Math.floor(Math.random() * EPIC_TOURNAMENT_NAMES.length)];
}

/**
 * Cria a chave inicial do torneio com 4, 8 ou 16 participantes e dificuldade selecionável.
 */
export function createTournament(name = '', size = 8, customParticipants = [], userBuild = null, difficulty = 'medio') {
  const sanitizedSize = [4, 8, 16].includes(Number(size)) ? Number(size) : 8;
  const tournamentName = (name || '').trim() || getRandomTournamentName();
  const selectedDiff = TOURNAMENT_DIFFICULTIES[difficulty] ? difficulty : 'medio';
  const diffConfig = TOURNAMENT_DIFFICULTIES[selectedDiff];

  // 1. Monta a lista completa de participantes
  const participants = [];

  // Se o usuário passou sua build e quer participar, ele é o 1º competidor
  if (userBuild) {
    participants.push(createFighterState(userBuild, userBuild.name || 'Sua Construção', false, 'A'));
  }

  // Adiciona participantes customizados (amigos ou builds salvas)
  if (Array.isArray(customParticipants)) {
    customParticipants.forEach((p) => {
      if (participants.length < sanitizedSize) {
        participants.push(createFighterState(p, p.name || 'Combatente', p.isAi ?? true, 'B'));
      }
    });
  }

  // Preenche as vagas restantes com combatentes IA legítimos escalados pela dificuldade real
  const availableChars = [...CHARACTERS].sort(() => 0.5 - Math.random());
  let charIdx = 0;

  while (participants.length < sanitizedSize) {
    const aiChar = availableChars[charIdx % availableChars.length];
    const ai = generateAiBuild('standard', null);
    if (aiChar) {
      ai.name = `[IA] ${aiChar.nome}`;
      ai.avatar = aiChar.imagem;
      ai.signatureMove = aiChar.habilidadeEspecial;
    }

    // Escala os atributos dos oponentes com base na dificuldade escolhida
    const mult = diffConfig.statMultiplier;
    const scaledStats = {};
    for (const [k, v] of Object.entries(ai.stats)) {
      scaledStats[k] = Math.max(15, Math.min(150, Math.round(Number(v) * mult)));
    }
    ai.stats = scaledStats;

    participants.push(createFighterState(ai, ai.name, true, 'B'));
    charIdx++;
  }

  // Embaralha para confrontos justos (mantendo ou distribuindo seeds)
  const seeded = [...participants];

  // 2. Constrói a árvore de confrontos (rounds)
  const totalRounds = Math.log2(sanitizedSize);
  const rounds = [];
  let currentRoundSize = sanitizedSize;

  for (let r = 1; r <= totalRounds; r++) {
    const matchCount = currentRoundSize / 2;
    const roundName = ROUND_NAMES[sanitizedSize]?.[r] || `Fase ${r}`;
    const matches = [];

    for (let m = 0; m < matchCount; m++) {
      const matchId = `r${r}_m${m + 1}`;
      const nextMatchIndex = Math.floor(m / 2) + 1;
      const nextMatchId = r < totalRounds ? `r${r + 1}_m${nextMatchIndex}` : null;
      const nextMatchSlot = m % 2 === 0 ? 'fighter1' : 'fighter2';

      let fighter1 = null;
      let fighter2 = null;

      // Na primeira rodada, aloca os participantes semeados
      if (r === 1) {
        fighter1 = seeded[m * 2] || null;
        fighter2 = seeded[m * 2 + 1] || null;
      }

      const isReady = Boolean(fighter1 && fighter2);
      const isBye = Boolean((fighter1 && !fighter2) || (!fighter1 && fighter2));

      matches.push({
        id: matchId,
        round: r,
        roundName,
        matchNumber: m + 1,
        fighter1,
        fighter2,
        winner: isBye ? (fighter1 || fighter2) : null,
        loser: null,
        status: isBye ? 'bye' : isReady ? 'ready' : 'scheduled',
        battleResult: null,
        nextMatchId,
        nextMatchSlot,
      });
    }

    rounds.push({
      roundNumber: r,
      name: roundName,
      matches,
    });

    currentRoundSize = matchCount;
  }

  const tournamentId = `tourn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id: tournamentId,
    name: tournamentName,
    size: sanitizedSize,
    difficulty: selectedDiff,
    rewardSpinsPerWin: diffConfig.rewardSpins,
    totalRounds,
    currentRound: 1,
    status: 'in_progress', // 'in_progress', 'completed'
    champion: null,
    participants,
    rounds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Resolve um confronto do torneio usando o motor de batalha 1v1 oficial.
 * Garante que confrontos já concluídos não sejam reexecutados.
 */
export function resolveTournamentMatch(tournament, matchId, options = {}) {
  if (!tournament || !matchId) return tournament;

  // Localiza a partida na chave
  let targetMatch = null;

  for (const r of tournament.rounds) {
    const found = r.matches.find((m) => m.id === matchId);
    if (found) {
      targetMatch = found;
      break;
    }
  }

  if (!targetMatch) return tournament;
  // Impede que um mesmo confronto seja contabilizado mais de uma vez
  if (targetMatch.status === 'completed' && targetMatch.winner) return tournament;
  if (!targetMatch.fighter1 || !targetMatch.fighter2) return tournament;

  // Executa o combate 1v1 oficial
  const result = simulate1v1(targetMatch.fighter1, targetMatch.fighter2, options);

  const winnerFighter = result.winner;
  const loserFighter = result.loser;

  // Atualiza o estado da partida
  targetMatch.winner = winnerFighter;
  targetMatch.loser = loserFighter;
  targetMatch.status = 'completed';
  targetMatch.battleResult = result;

  // Se houver próxima rodada, avança o vencedor automaticamente
  if (targetMatch.nextMatchId) {
    for (const r of tournament.rounds) {
      const next = r.matches.find((m) => m.id === targetMatch.nextMatchId);
      if (next) {
        if (targetMatch.nextMatchSlot === 'fighter1') {
          next.fighter1 = { ...winnerFighter, hp: winnerFighter.maxHp, energy: Math.round(winnerFighter.stats.energia * 0.35) };
        } else {
          next.fighter2 = { ...winnerFighter, hp: winnerFighter.maxHp, energy: Math.round(winnerFighter.stats.energia * 0.35) };
        }

        // Se ambos os lutadores da próxima partida estiverem definidos, fica pronta
        if (next.fighter1 && next.fighter2) {
          next.status = 'ready';
        }
        break;
      }
    }
  }

  // Verifica se a Grande Final foi concluída
  const finalRound = tournament.rounds[tournament.rounds.length - 1];
  const finalMatch = finalRound.matches[0];

  if (finalMatch && finalMatch.status === 'completed' && finalMatch.winner) {
    tournament.champion = finalMatch.winner;
    tournament.status = 'completed';
  } else {
    // Atualiza round atual do torneio
    for (let i = 0; i < tournament.rounds.length; i++) {
      const allDone = tournament.rounds[i].matches.every((m) => m.status === 'completed' || m.status === 'bye');
      if (!allDone) {
        tournament.currentRound = i + 1;
        break;
      }
    }
  }

  tournament.updatedAt = new Date().toISOString();
  return { ...tournament };
}

/**
 * Simula todas as partidas pendentes de um round ou de todo o torneio de uma vez.
 */
export function autoSimulateTournament(tournament, options = {}) {
  let current = { ...tournament };

  for (const round of current.rounds) {
    for (const match of round.matches) {
      if (match.status === 'ready' && match.fighter1 && match.fighter2) {
        current = resolveTournamentMatch(current, match.id, options);
      }
    }
  }

  return current;
}
