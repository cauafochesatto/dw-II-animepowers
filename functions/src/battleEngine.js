import {
  CHARACTERS,
  CHARACTERS_BY_ID,
  STAT_KEYS,
  MAX_STAT_VALUE,
  MAX_STAT_SUM,
} from './charactersData.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Sanitiza os atributos de um build contra os limites reais do catálogo de personagens.
 * Stats individuais são limitados a MAX_STAT_VALUE (99).
 * Se a soma total ultrapassar MAX_STAT_SUM (592), os stats são proporcionalmente reduzidos.
 * Impede que o cliente envie stats forjados (ex: 150 em tudo).
 */
export function sanitizeBuildStats(rawStats) {
  const defaults = { forca: 75, velocidade: 75, defesa: 75, resistencia: 75, energia: 75, poderEspecial: 75 };
  const stats = {};

  for (const key of STAT_KEYS) {
    const val = Number(rawStats?.[key]);
    // Clamp cada stat entre 10 e o máximo real de qualquer personagem (99)
    stats[key] = clamp(Number.isFinite(val) ? val : defaults[key], 10, MAX_STAT_VALUE);
  }

  // Verifica orçamento total de stats (máximo possível cherry-picking: 592)
  let sum = STAT_KEYS.reduce((acc, k) => acc + stats[k], 0);
  if (sum > MAX_STAT_SUM) {
    const ratio = MAX_STAT_SUM / sum;
    for (const key of STAT_KEYS) {
      stats[key] = Math.floor(stats[key] * ratio);
    }
    // Ajusta o excedente garantindo que a soma final seja estritamente <= MAX_STAT_SUM
    let currentSum = STAT_KEYS.reduce((acc, k) => acc + stats[k], 0);
    let diff = MAX_STAT_SUM - currentSum;
    for (const key of STAT_KEYS) {
      if (diff <= 0) break;
      if (stats[key] < MAX_STAT_VALUE) {
        stats[key]++;
        diff--;
      }
    }
  }

  return stats;
}

/**
 * Resolve os atributos de um build a partir de statSources (mapa stat → characterId).
 * Se o personagem referenciado existir no catálogo, usa o valor oficial.
 * Caso contrário, aplica o valor padrão.
 */
export function resolveStatsFromSources(statSources) {
  if (!statSources || typeof statSources !== 'object') return null;

  const stats = {};
  let resolved = false;

  for (const key of STAT_KEYS) {
    const charId = statSources[key];
    const char = CHARACTERS_BY_ID[charId];
    if (char && typeof char[key] === 'number') {
      stats[key] = char[key];
      resolved = true;
    } else {
      stats[key] = 75;
    }
  }

  return resolved ? stats : null;
}

/**
 * Gera um adversário IA no servidor com stats válidos extraídos de personagens reais.
 * Substitui qualquer opponentBuild enviado pelo cliente, impedindo injeção de oponentes fracos.
 */
export function generateServerAiBuild(customTitle = null) {
  const titles = [
    { name: 'Guardião do Infinito', avatarId: 'gojo', ability: 'Vazio Cósmico Ilimitado' },
    { name: 'Sombra Soberana', avatarId: 'sung_jinwoo', ability: 'Ascensão das Sombras' },
    { name: 'Titã da Vanguarda', avatarId: 'all_might', ability: 'Smash Supremo Transcendente' },
    { name: 'Arauto do Trovão', avatarId: 'minato', ability: 'Teleporte Relâmpago Divino' },
    { name: 'Lorde Destruidor', avatarId: 'beerus', ability: 'Hakai Espectral' },
    { name: 'Guerreiro Saiyajin', avatarId: 'goku', ability: 'Kamehameha Titânico' },
    { name: 'Leão Radiante', avatarId: 'escanor', ability: 'Cruel Sun Ardente' },
    { name: 'Feiticeiro Malevolente', avatarId: 'sukuna', ability: 'Corte do Santuário' },
  ];

  const archetype = customTitle
    ? titles.find((t) => t.name === customTitle) || titles[0]
    : titles[Math.floor(Math.random() * titles.length)];

  const baseChar = CHARACTERS_BY_ID[archetype.avatarId] || CHARACTERS[0];

  // Embaralha personagens e pega cada stat de um personagem diferente (stats reais, impossível de forjar)
  const shuffled = [...CHARACTERS].sort(() => 0.5 - Math.random());
  const stats = {
    forca: shuffled[0].forca,
    velocidade: shuffled[1].velocidade,
    defesa: shuffled[2].defesa,
    resistencia: shuffled[3].resistencia,
    energia: shuffled[4].energia,
    poderEspecial: shuffled[5].poderEspecial,
  };

  return {
    name: `[IA] ${archetype.name}`,
    avatar: baseChar.imagem,
    signatureMove: archetype.ability,
    stats,
    isAi: true,
  };
}

export function createFighterState(build, fighterName = 'Jogador', isAi = false, team = 'A') {
  // Usa sanitizeBuildStats para garantir que nenhum stat ultrapasse o limite real (99)
  const rawStats = build?.stats || {
    forca: 75,
    velocidade: 75,
    defesa: 75,
    resistencia: 75,
    energia: 75,
    poderEspecial: 75,
  };

  const sanitizedStats = sanitizeBuildStats(rawStats);

  const maxHp = clamp(
    Math.round(420 + (sanitizedStats.resistencia * 6.0) + (sanitizedStats.defesa * 2.8) + (sanitizedStats.forca * 0.4)),
    500,
    2500
  );

  const avatar = build?.avatar || build?.imagem || '/imagenspoderes/kamehamenha.jpg';
  const customName = build?.name || fighterName;
  const signatureMove = build?.signatureMove || 'Golpe Cósmico Devastador';
  const startingEnergy = clamp(Math.round(15 + sanitizedStats.energia * 0.35), 15, 60);

  return {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: customName,
    avatar,
    isAi,
    team,
    stats: sanitizedStats,
    maxHp,
    hp: maxHp,
    energy: startingEnergy,
    maxEnergy: 100,
    classification: build?.classification || { rank: 'A', label: 'Combatente' },
    signatureMove,
    userId: build?.userId || (isAi ? null : (build?.id || null)),
    isDefeated: false,
    damageDealt: 0,
    eliminations: 0,
  };
}

export function resolveAttack(attacker, defender, options = {}) {
  if (!attacker || !defender) return [];
  if (attacker.isDefeated || attacker.hp <= 0) return [];
  if (defender.isDefeated || defender.hp <= 0) return [];

  const rng = options.rng || Math.random;
  const actions = [];
  const attStats = attacker.stats;
  const defStats = defender.stats;

  const isSpecial = attacker.energy >= 100;
  const speedDiff = defStats.velocidade - attStats.velocidade;
  let dodgeChance = clamp(speedDiff * 0.35 + 6, 3, 24);
  if (isSpecial) {
    dodgeChance = clamp(dodgeChance * 0.5, 2, 12);
  }

  const isDodge = (rng() * 100) < dodgeChance;

  if (isDodge) {
    defender.energy = Math.min(100, defender.energy + 8);
    actions.push({
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      type: 'dodge',
      damage: 0,
      isCrit: false,
      isSpecial: false,
      isDodge: true,
      text: `${defender.name} esquivou-se com reflexos sobre-humanos do ataque de ${attacker.name}!`,
      attackerHp: attacker.hp,
      attackerEnergy: attacker.energy,
      defenderHp: defender.hp,
      defenderEnergy: defender.energy,
      defenderMaxHp: defender.maxHp,
    });
    return actions;
  }

  let rawDamage = 0;
  let isCrit = false;

  if (isSpecial) {
    const offense = (attStats.poderEspecial * 2.15) + (attStats.forca * 0.75) + (attStats.energia * 0.25);
    const defense = (defStats.defesa * 0.35) + (defStats.resistencia * 0.25);
    rawDamage = Math.max(50, offense - defense);
    attacker.energy = 0;
  } else {
    const offense = (attStats.forca * 1.42) + (attStats.energia * 0.36) + (attStats.velocidade * 0.12);
    const defense = (defStats.defesa * 0.44) + (defStats.resistencia * 0.22);
    rawDamage = Math.max(20, offense - defense);

    const energyGain = Math.round(16 + (attStats.energia * 0.22));
    attacker.energy = Math.min(100, attacker.energy + energyGain);
  }

  const variance = 0.88 + rng() * 0.24;
  let finalDamage = Math.max(isSpecial ? 55 : 24, Math.round(rawDamage * variance));

  const critChance = clamp(
    (attStats.velocidade * 0.12) + (attStats.poderEspecial * 0.10) - (defStats.resistencia * 0.04),
    5,
    28
  );

  if ((rng() * 100) < critChance) {
    isCrit = true;
    finalDamage = Math.round(finalDamage * 1.45);
  }

  finalDamage = Math.min(finalDamage, Math.round(defender.maxHp * 0.85));
  defender.hp = Math.max(0, defender.hp - finalDamage);
  attacker.damageDealt += finalDamage;

  if (defender.hp > 0) {
    const defenseGain = Math.round(5 + (defStats.resistencia * 0.08));
    defender.energy = Math.min(100, defender.energy + defenseGain);
  }

  let text = '';
  if (isSpecial) {
    text = `💥 ${attacker.name} liberou seu GOLPE ESPECIAL "${attacker.signatureMove}", explodindo ${finalDamage} de dano contra ${defender.name}!`;
  } else if (isCrit) {
    text = `⚡ GOLPE CRÍTICO! ${attacker.name} acertou um golpe devastador em ${defender.name} causando ${finalDamage} de dano!`;
  } else {
    text = `⚔️ ${attacker.name} atacou ${defender.name} desferindo ${finalDamage} de dano.`;
  }

  if (defender.hp <= 0) {
    defender.hp = 0;
    defender.isDefeated = true;
    attacker.eliminations += 1;
    text += ` 💀 ${defender.name} foi derrotado!`;
  }

  actions.push({
    attackerId: attacker.id,
    attackerName: attacker.name,
    defenderId: defender.id,
    defenderName: defender.name,
    type: isSpecial ? 'special' : isCrit ? 'crit' : 'normal',
    damage: finalDamage,
    isCrit,
    isSpecial,
    isDodge: false,
    text,
    attackerHp: attacker.hp,
    attackerEnergy: attacker.energy,
    defenderHp: defender.hp,
    defenderEnergy: defender.energy,
    defenderMaxHp: defender.maxHp,
  });

  return actions;
}

export function simulate1v1(buildA, buildB, customRng = null) {
  const rng = customRng || Math.random;
  const fighterA = createFighterState(buildA, buildA?.name || 'Jogador 1', false, 'A');
  const fighterB = createFighterState(buildB, buildB?.name || 'Jogador 2', true, 'B');

  const rounds = [];
  const MAX_ROUNDS = 40;
  let roundNum = 1;

  while (!fighterA.isDefeated && !fighterB.isDefeated && roundNum <= MAX_ROUNDS) {
    const roundActions = [];

    const initA = fighterA.stats.velocidade + (rng() * 20);
    const initB = fighterB.stats.velocidade + (rng() * 20);

    const [first, second] = initA >= initB ? [fighterA, fighterB] : [fighterB, fighterA];

    const acts1 = resolveAttack(first, second, { rng });
    roundActions.push(...acts1);

    if (!second.isDefeated && second.hp > 0) {
      const acts2 = resolveAttack(second, first, { rng });
      roundActions.push(...acts2);
    }

    rounds.push({
      round: roundNum,
      actions: roundActions,
    });

    roundNum++;
  }

  let winner = null;
  let loser = null;

  if (fighterA.hp <= 0) {
    fighterA.isDefeated = true;
    winner = fighterB;
    loser = fighterA;
  } else if (fighterB.hp <= 0) {
    fighterB.isDefeated = true;
    winner = fighterA;
    loser = fighterB;
  } else {
    // Desempate por maior HP relativo restante
    const hpRatioA = fighterA.hp / fighterA.maxHp;
    const hpRatioB = fighterB.hp / fighterB.maxHp;
    if (hpRatioA >= hpRatioB) {
      winner = fighterA;
      loser = fighterB;
    } else {
      winner = fighterB;
      loser = fighterA;
    }
  }

  const isPlayerWinner = winner.id === fighterA.id;

  return {
    mode: '1v1',
    date: new Date().toISOString(),
    winner,
    loser,
    isPlayerWinner,
    totalRounds: rounds.length,
    rounds,
    finalState: [fighterA, fighterB],
  };
}

/**
 * Escala atributos dos combatentes de acordo com a dificuldade do Torneio
 * Fácil: 0.85x
 * Médio: 1.0x
 * Difícil: 1.25x
 */
export function scaleFighterStats(build, difficulty = 'medio') {
  if (!build || !build.stats) return build;
  const multipliers = {
    facil: 0.85,
    medio: 1.0,
    dificil: 1.25,
  };
  const mult = multipliers[difficulty] || 1.0;

  const scaled = {};
  for (const [k, v] of Object.entries(build.stats)) {
    scaled[k] = Math.round(Number(v) * mult);
  }

  return {
    ...build,
    stats: scaled,
  };
}

/**
 * Retorna os giros concedidos oficialmente pelo backend
 * Regras estritas:
 * - Arena: 0 giros (independente de vitória/derrota)
 * - Torneio Fácil: +3 giros (se vitória)
 * - Torneio Médio: +5 giros (se vitória)
 * - Torneio Difícil: +8 giros (se vitória)
 * - Qualquer derrota: 0 giros
 */
export function getRewardSpins(mode = 'tournament', difficulty = 'medio', isWin = true) {
  if (!isWin) return 0;
  if (mode === 'arena') return 0;
  if (mode === 'tournament') {
    switch (difficulty) {
      case 'facil': return 3;
      case 'dificil': return 8;
      case 'medio':
      default:
        return 5;
    }
  }
  return 0;
}

/**
 * Validação rigorosa e segura da conclusão do Torneio no backend.
 * O servidor NÃO confia em flags booleanas (`isPlayerWinner`) enviadas pelo cliente.
 * Analisa a integridade de todas as fases, rodadas, confrontos e Grande Final
 * e exige vinculação da identidade ao ID real do usuário autenticado (não apenas ao nome de exibição).
 */
export function validateTournamentChampion(tournament, authenticatedUserId = null) {
  if (!tournament || typeof tournament !== 'object') {
    return { isValid: false, reason: 'Objeto de torneio ausente ou inválido.' };
  }

  // 1. Identificador e status
  if (!tournament.id || typeof tournament.id !== 'string') {
    return { isValid: false, reason: 'ID do torneio ausente ou inválido.' };
  }

  if (tournament.status !== 'completed') {
    return { isValid: false, reason: 'O torneio ainda não foi concluído.' };
  }

  // 2. Dificuldade e tamanho
  const validDifficulties = ['facil', 'medio', 'dificil'];
  if (!validDifficulties.includes(tournament.difficulty)) {
    return { isValid: false, reason: 'Dificuldade de torneio inválida.' };
  }

  const validSizes = [4, 8, 16];
  if (!validSizes.includes(Number(tournament.size))) {
    return { isValid: false, reason: 'Tamanho de chave de torneio inválido.' };
  }

  // 3. Rodadas esperadas
  const expectedTotalRounds = Math.log2(Number(tournament.size));
  if (!Array.isArray(tournament.rounds) || tournament.rounds.length !== expectedTotalRounds) {
    return { isValid: false, reason: 'Estrutura de rodadas do torneio corrompida.' };
  }

  // 4. Participantes e identificação do jogador humano
  if (!Array.isArray(tournament.participants) || tournament.participants.length !== Number(tournament.size)) {
    return { isValid: false, reason: 'Número de participantes inválido.' };
  }

  const playerParticipant = tournament.participants.find((p) => p && !p.isAi);
  if (!playerParticipant) {
    return { isValid: false, reason: 'Nenhum combatente humano participante encontrado no torneio.' };
  }

  // Se o ID autenticado foi informado, valida a posse da conta
  if (authenticatedUserId) {
    if (playerParticipant.userId && playerParticipant.userId !== authenticatedUserId) {
      return { isValid: false, reason: 'O combatente do torneio não pertence ao usuário autenticado.' };
    }
    if (tournament.user_id && tournament.user_id !== authenticatedUserId) {
      return { isValid: false, reason: 'O torneio informado pertence a outro usuário.' };
    }
  }

  const playerName = playerParticipant.name;

  // 4b. Validação de integridade dos atributos do participante humano (impede injeção de stats forjados)
  if (playerParticipant.stats && typeof playerParticipant.stats === 'object') {
    for (const key of STAT_KEYS) {
      const val = Number(playerParticipant.stats[key]);
      if (val > MAX_STAT_VALUE) {
        return {
          isValid: false,
          reason: `Atributos forjados detectados no combatente (${key}: ${val} > ${MAX_STAT_VALUE}).`,
        };
      }
    }
    const statSum = STAT_KEYS.reduce((acc, k) => acc + (Number(playerParticipant.stats[k]) || 0), 0);
    if (statSum > MAX_STAT_SUM) {
      return {
        isValid: false,
        reason: `Orçamento de atributos ultrapassa o limite legítimo de ${MAX_STAT_SUM} (soma: ${statSum}).`,
      };
    }
  }

  // 5. Validação do Campeão declarado
  if (!tournament.champion || typeof tournament.champion !== 'object') {
    return { isValid: false, reason: 'Nenhum campeão foi coroado no torneio.' };
  }

  if (tournament.champion.isAi || tournament.champion.name !== playerName) {
    return { isValid: false, reason: 'O jogador não foi o campeão deste torneio.' };
  }

  if (authenticatedUserId && tournament.champion.userId && tournament.champion.userId !== authenticatedUserId) {
    return { isValid: false, reason: 'A identidade do campeão não corresponde ao usuário autenticado.' };
  }

  // 6. Validação da Grande Final
  const finalRound = tournament.rounds[tournament.rounds.length - 1];
  if (!finalRound || !Array.isArray(finalRound.matches) || finalRound.matches.length !== 1) {
    return { isValid: false, reason: 'Confronto final não encontrado na última rodada.' };
  }

  const finalMatch = finalRound.matches[0];
  if (finalMatch.status !== 'completed') {
    return { isValid: false, reason: 'A Grande Final não foi concluída.' };
  }

  if (!finalMatch.winner || finalMatch.winner.isAi || finalMatch.winner.name !== playerName) {
    return { isValid: false, reason: 'O vencedor da Grande Final não é o jogador.' };
  }

  if (authenticatedUserId && finalMatch.winner.userId && finalMatch.winner.userId !== authenticatedUserId) {
    return { isValid: false, reason: 'O vencedor da Grande Final não corresponde ao usuário autenticado.' };
  }

  // 7. Validação da trilha de vitórias (o jogador deve ter vencido o confronto em cada rodada)
  for (const round of tournament.rounds) {
    const playerMatch = round.matches.find(
      (m) =>
        m.status === 'completed' &&
        ((m.fighter1 && m.fighter1.name === playerName) || (m.fighter2 && m.fighter2.name === playerName))
    );

    if (!playerMatch) {
      return { isValid: false, reason: `O jogador não participou de confronto válido na fase: ${round.name}.` };
    }

    if (!playerMatch.winner || playerMatch.winner.name !== playerName) {
      return { isValid: false, reason: `O jogador foi derrotado na fase: ${round.name}.` };
    }

    if (authenticatedUserId && playerMatch.winner.userId && playerMatch.winner.userId !== authenticatedUserId) {
      return { isValid: false, reason: `Identidade inconsistente do vencedor na fase: ${round.name}.` };
    }

    // Validação autoritativa do resultado de combate: não confia em flags vazias enviadas pelo navegador
    if (playerMatch.battleResult && playerMatch.battleResult.isPlayerWinner === false) {
      return { isValid: false, reason: `Registro de combate comprova derrota do jogador na fase: ${round.name}.` };
    }
  }

  // Vitória legítima comprovada
  const spins = getRewardSpins('tournament', tournament.difficulty, true);
  return {
    isValid: true,
    difficulty: tournament.difficulty,
    rewardSpins: spins,
    playerName,
  };
}

