function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function createFighterState(build, fighterName = 'Jogador', isAi = false, team = 'A') {
  const stats = build?.stats || {
    forca: 75,
    velocidade: 75,
    defesa: 75,
    resistencia: 75,
    energia: 75,
    poderEspecial: 75,
  };

  const sanitizedStats = {
    forca: clamp(Number(stats.forca) || 75, 10, 150),
    velocidade: clamp(Number(stats.velocidade) || 75, 10, 150),
    defesa: clamp(Number(stats.defesa) || 75, 10, 150),
    resistencia: clamp(Number(stats.resistencia) || 75, 10, 150),
    energia: clamp(Number(stats.energia) || 75, 10, 150),
    poderEspecial: clamp(Number(stats.poderEspecial) || 75, 10, 150),
  };

  const maxHp = clamp(
    Math.round(420 + (sanitizedStats.resistencia * 6.0) + (sanitizedStats.defesa * 2.8) + (sanitizedStats.forca * 0.4)),
    500,
    2500
  );

  const avatar = build?.avatar || build?.imagem || '/poderesanime/imagenspoderes/kamehamenha.jpg';
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
 * Recompensas oficiais em giros:
 * - Arena Vitória: 2 giros
 * - Torneio Fácil: 3 giros por vitória
 * - Torneio Médio: 5 giros por vitória
 * - Torneio Difícil: 8 giros por vitória
 */
export function getRewardSpins(source, difficulty = null, isWin = true) {
  if (!isWin) return 0;
  if (source === 'arena') return 2;
  if (source === 'tournament') {
    if (difficulty === 'facil') return 3;
    if (difficulty === 'dificil') return 8;
    return 5; // medio
  }
  return 0;
}

