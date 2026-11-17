/**
 * Motor de Combate do Anime Powers.
 * Simula confrontos baseados nos atributos selecionados na construção.
 * Suporta formatos: 1v1, 2v2 e Modo de Grupo / Battle Royale (3 a 6 combatentes).
 */

import { CHARACTERS, CHARACTERS_BY_ID, calculateBuildClassification } from '../data/characters';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Cria o estado inicial de um lutador para o combate.
 */
export function createFighterState(build, fighterName = 'Jogador', isAi = false, team = 'A') {
  const stats = build?.stats || {
    forca: 75,
    velocidade: 75,
    defesa: 75,
    resistencia: 75,
    energia: 75,
    poderEspecial: 75,
  };

  // Garante limites seguros em todos os atributos
  const sanitizedStats = {
    forca: clamp(Number(stats.forca) || 75, 10, 150),
    velocidade: clamp(Number(stats.velocidade) || 75, 10, 150),
    defesa: clamp(Number(stats.defesa) || 75, 10, 150),
    resistencia: clamp(Number(stats.resistencia) || 75, 10, 150),
    energia: clamp(Number(stats.energia) || 75, 10, 150),
    poderEspecial: clamp(Number(stats.poderEspecial) || 75, 10, 150),
  };

  // Fórmula balanceada de HP com limites seguros (500 a 2500)
  const maxHp = clamp(
    Math.round(420 + (sanitizedStats.resistencia * 6.0) + (sanitizedStats.defesa * 2.8) + (sanitizedStats.forca * 0.4)),
    500,
    2500
  );

  const classification = build?.classification || calculateBuildClassification(sanitizedStats);
  const avatar = build?.avatar || build?.imagem || '/poderesanime/imagenspoderes/kamehamenha.jpg';
  const customName = build?.name || fighterName;
  const signatureMove = build?.signatureMove || 'Golpe Cósmico Devastador';

  // Energia inicial equilibrada (entre 15 e 60)
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
    classification,
    signatureMove,
    userId: build?.userId || (isAi ? null : (build?.id || null)),
    isDefeated: false,
    damageDealt: 0,
    eliminations: 0,
  };
}

/**
 * Gera um adversário IA equilibrado e válido com base em personagens reais.
 */
export function generateAiBuild(difficulty = 'standard', customTitle = null, options = {}) {
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

  const rng = options.rng || options.random || Math.random;

  const archetype = customTitle
    ? titles.find((t) => t.name === customTitle) || titles[0]
    : titles[Math.floor(rng() * titles.length)];

  const baseChar = CHARACTERS_BY_ID[archetype.avatarId] || CHARACTERS[0];

  // Monta atributos válidos respeitando personagens existentes
  const randomChars = [...CHARACTERS].sort(() => 0.5 - rng());
  const stats = {
    forca: randomChars[0].forca,
    velocidade: randomChars[1].velocidade,
    defesa: randomChars[2].defesa,
    resistencia: randomChars[3].resistencia,
    energia: randomChars[4].energia,
    poderEspecial: randomChars[5].poderEspecial,
  };

  const classification = calculateBuildClassification(stats);

  return {
    name: `[IA] ${archetype.name}`,
    avatar: baseChar.imagem,
    signatureMove: archetype.ability,
    stats,
    classification,
    isAi: true,
  };
}

/**
 * Resolve o ataque de um combatente contra outro de maneira balanceada e determinística se o RNG for provido.
 */
export function resolveAttack(attacker, defender, options = {}) {
  // Combatentes derrotados ou inválidos não podem agir nem ser atacados repetidamente
  if (!attacker || !defender) return [];
  if (attacker.isDefeated || attacker.hp <= 0) return [];
  if (defender.isDefeated || defender.hp <= 0) return [];

  const rng = options.rng || options.random || Math.random;
  const actions = [];
  const attStats = attacker.stats;
  const defStats = defender.stats;

  // Verifica se atacante tem energia total para Golpe Especial
  const isSpecial = attacker.energy >= 100;

  // Esquiva baseada na diferença de velocidade
  const speedDiff = defStats.velocidade - attStats.velocidade;
  // Chance entre 3% e 24% para golpes comuns, ou reduzida pela metade se o golpe for especial
  let dodgeChance = clamp(speedDiff * 0.35 + 6, 3, 24);
  if (isSpecial) {
    dodgeChance = clamp(dodgeChance * 0.5, 2, 12);
  }

  const isDodge = (rng() * 100) < dodgeChance;

  if (isDodge) {
    // Pequena recuperação tática de energia para o defensor ao esquivar
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
    // FÓRMULA DE ATAQUE ESPECIAL
    // Impacto dominante de Poder Especial e Força com mitigação equilibrada de Defesa e Resistência
    const offense = (attStats.poderEspecial * 2.15) + (attStats.forca * 0.75) + (attStats.energia * 0.25);
    const defense = (defStats.defesa * 0.35) + (defStats.resistencia * 0.25);
    rawDamage = Math.max(50, offense - defense);
    attacker.energy = 0; // consome 100% da energia acumulada
  } else {
    // FÓRMULA DE ATAQUE BÁSICO
    const offense = (attStats.forca * 1.42) + (attStats.energia * 0.36) + (attStats.velocidade * 0.12);
    const defense = (defStats.defesa * 0.44) + (defStats.resistencia * 0.22);
    rawDamage = Math.max(20, offense - defense);

    // Recuperação de energia ao atacar normalmente
    const energyGain = Math.round(16 + (attStats.energia * 0.22));
    attacker.energy = Math.min(100, attacker.energy + energyGain);
  }

  // Variação de dano controlada (±12%)
  const variance = 0.88 + rng() * 0.24;
  let finalDamage = Math.max(isSpecial ? 55 : 24, Math.round(rawDamage * variance));

  // Chance de crítico baseada em velocidade e poder especial, mitigada pela resistência
  const critChance = clamp(
    (attStats.velocidade * 0.12) + (attStats.poderEspecial * 0.10) - (defStats.resistencia * 0.04),
    5,
    28
  );

  if ((rng() * 100) < critChance) {
    isCrit = true;
    finalDamage = Math.round(finalDamage * 1.45);
  }

  // Teto seguro de dano máximo em um único golpe (evita one-shots infinitos)
  finalDamage = Math.min(finalDamage, Math.round(defender.maxHp * 0.85));

  defender.hp = Math.max(0, defender.hp - finalDamage);
  attacker.damageDealt += finalDamage;

  // O defensor ganha uma pequena quantidade de adrenalina/energia ao sofrer dano (se sobreviveu)
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

/**
 * Simula um combate 1v1 completo.
 */
export function simulate1v1(playerBuild, opponentBuild, options = {}) {
  const rng = options.rng || options.random || Math.random;
  const f1 = createFighterState(playerBuild, playerBuild?.name || 'Jogador 1', false, 'A');
  const f2 = createFighterState(opponentBuild, opponentBuild?.name || 'Adversário', opponentBuild?.isAi ?? true, 'B');

  const rounds = [];
  let roundNum = 1;
  const maxRounds = options.maxRounds || 30;

  const fightersInitial = [
    { ...f1, stats: { ...f1.stats } },
    { ...f2, stats: { ...f2.stats } },
  ];

  while (!f1.isDefeated && !f2.isDefeated && roundNum <= maxRounds) {
    const roundLog = {
      round: roundNum,
      actions: [],
      f1Hp: f1.hp,
      f2Hp: f2.hp,
      f1Energy: f1.energy,
      f2Energy: f2.energy,
    };

    // Determina ordem de ataque pela velocidade + variação de iniciativa
    const f1Speed = f1.stats.velocidade + (rng() * 6 - 3);
    const f2Speed = f2.stats.velocidade + (rng() * 6 - 3);

    const first = f1Speed >= f2Speed ? f1 : f2;
    const second = first === f1 ? f2 : f1;

    // Primeiro ataca (se vivo)
    if (!first.isDefeated && first.hp > 0) {
      const acts1 = resolveAttack(first, second, { rng });
      roundLog.actions.push(...acts1);
    }

    // Se o segundo sobreviveu, contra-ataca
    if (!second.isDefeated && second.hp > 0) {
      const acts2 = resolveAttack(second, first, { rng });
      roundLog.actions.push(...acts2);
    }

    roundLog.f1HpAfter = f1.hp;
    roundLog.f2HpAfter = f2.hp;
    roundLog.f1EnergyAfter = f1.energy;
    roundLog.f2EnergyAfter = f2.energy;

    rounds.push(roundLog);
    roundNum++;
  }

  // Avaliação do desfecho do combate
  let winner = null;
  let loser = null;
  let isDraw = false;
  let isTimeout = false;

  if (f1.isDefeated && !f2.isDefeated) {
    winner = f2;
    loser = f1;
  } else if (f2.isDefeated && !f1.isDefeated) {
    winner = f1;
    loser = f2;
  } else if (f1.isDefeated && f2.isDefeated) {
    isDraw = true;
  } else {
    // Ambos vivos ao atingir o limite máximo de rodadas (Timeout)
    isTimeout = true;
    if (f1.hp > f2.hp) {
      winner = f1;
      loser = f2;
    } else if (f2.hp > f1.hp) {
      winner = f2;
      loser = f1;
    } else {
      isDraw = true;
    }
  }

  return {
    mode: '1v1',
    winner,
    loser,
    isDraw,
    isTimeout,
    isPlayerWinner: winner === f1,
    fighters: fightersInitial,
    finalState: [f1, f2],
    rounds,
    totalRounds: rounds.length,
    date: new Date().toISOString(),
  };
}

/**
 * Simula um combate 2v2 completo.
 */
export function simulate2v2(teamABuilds, teamBBuilds, options = {}) {
  const rng = options.rng || options.random || Math.random;

  // Garante 2 lutadores por equipe
  const listA = [...(teamABuilds || [])];
  while (listA.length < 2) {
    listA.push(generateAiBuild('standard', 'Arauto do Trovão', { rng }));
  }

  const listB = [...(teamBBuilds || [])];
  while (listB.length < 2) {
    listB.push(generateAiBuild('standard', 'Lorde Destruidor', { rng }));
  }

  const teamA = listA.slice(0, 2).map((b, idx) =>
    createFighterState(b, b.name || `Aliado ${idx + 1}`, b.isAi ?? (idx > 0), 'A')
  );
  const teamB = listB.slice(0, 2).map((b, idx) =>
    createFighterState(b, b.name || `Inimigo ${idx + 1}`, b.isAi ?? true, 'B')
  );

  const allFighters = [...teamA, ...teamB];
  const fightersInitial = allFighters.map((f) => ({ ...f, stats: { ...f.stats } }));

  const rounds = [];
  let roundNum = 1;
  const maxRounds = options.maxRounds || 35;

  const isTeamDefeated = (team) => team.every((f) => f.isDefeated || f.hp <= 0);

  while (!isTeamDefeated(teamA) && !isTeamDefeated(teamB) && roundNum <= maxRounds) {
    const roundLog = {
      round: roundNum,
      actions: [],
      states: allFighters.map((f) => ({ id: f.id, name: f.name, hp: f.hp, energy: f.energy })),
    };

    // Ordena todos os combatentes vivos por iniciativa
    const activeFighters = allFighters
      .filter((f) => !f.isDefeated && f.hp > 0)
      .sort((a, b) => (b.stats.velocidade + rng() * 8) - (a.stats.velocidade + rng() * 8));

    for (const attacker of activeFighters) {
      if (attacker.isDefeated || attacker.hp <= 0) continue;

      const opposingTeam = attacker.team === 'A' ? teamB : teamA;
      const aliveTargets = opposingTeam.filter((f) => !f.isDefeated && f.hp > 0);
      if (aliveTargets.length === 0) break;

      // Seleção tática de alvo: foca no alvo mais fragilizado ou de menor vida
      const target = aliveTargets.reduce((lowest, curr) => (curr.hp < lowest.hp ? curr : lowest), aliveTargets[0]);

      const acts = resolveAttack(attacker, target, { rng });
      roundLog.actions.push(...acts);
    }

    rounds.push(roundLog);
    roundNum++;
  }

  const teamADefeated = isTeamDefeated(teamA);
  const teamBDefeated = isTeamDefeated(teamB);

  let winnerTeam = null;
  let isPlayerWinner = false;
  let isDraw = false;
  let isTimeout = false;

  if (teamBDefeated && !teamADefeated) {
    winnerTeam = 'Equipe A';
    isPlayerWinner = true;
  } else if (teamADefeated && !teamBDefeated) {
    winnerTeam = 'Equipe B';
    isPlayerWinner = false;
  } else if (teamADefeated && teamBDefeated) {
    winnerTeam = 'Empate';
    isDraw = true;
  } else {
    // Ambos possuem sobreviventes ao atingir limite de rodadas
    isTimeout = true;
    const hpA = teamA.reduce((sum, f) => sum + Math.max(0, f.hp), 0);
    const hpB = teamB.reduce((sum, f) => sum + Math.max(0, f.hp), 0);

    if (hpA > hpB) {
      winnerTeam = 'Equipe A';
      isPlayerWinner = true;
    } else if (hpB > hpA) {
      winnerTeam = 'Equipe B';
      isPlayerWinner = false;
    } else {
      winnerTeam = 'Empate';
      isDraw = true;
    }
  }

  return {
    mode: '2v2',
    winnerTeam,
    isPlayerWinner,
    isDraw,
    isTimeout,
    teamA,
    teamB,
    fighters: fightersInitial,
    finalState: allFighters,
    rounds,
    totalRounds: rounds.length,
    date: new Date().toISOString(),
  };
}

/**
 * Simula o Modo de Grupo (Battle Royale - 3 a 6 combatentes).
 */
export function simulateGroupBattle(builds, options = {}) {
  const rng = options.rng || options.random || Math.random;

  // Garante de 3 a 6 combatentes válidos
  const baseBuilds = Array.isArray(builds) ? [...builds] : [];
  while (baseBuilds.length < 5) {
    baseBuilds.push(generateAiBuild('standard', null, { rng }));
  }

  const combatants = baseBuilds.slice(0, 6).map((b, idx) =>
    createFighterState(b, b.name || `Combatente ${idx + 1}`, b.isAi ?? (idx > 0), `P${idx + 1}`)
  );

  const fightersInitial = combatants.map((f) => ({ ...f, stats: { ...f.stats } }));
  const eliminationOrder = []; // Primeiro eliminado = último lugar

  const rounds = [];
  let roundNum = 1;
  const maxRounds = options.maxRounds || 40;

  const getAliveCombatants = () => combatants.filter((f) => !f.isDefeated && f.hp > 0);

  while (getAliveCombatants().length > 1 && roundNum <= maxRounds) {
    const roundLog = {
      round: roundNum,
      actions: [],
      aliveCount: getAliveCombatants().length,
    };

    const aliveFighters = getAliveCombatants()
      .sort((a, b) => (b.stats.velocidade + rng() * 10) - (a.stats.velocidade + rng() * 10));

    for (const attacker of aliveFighters) {
      if (attacker.isDefeated || attacker.hp <= 0) continue;

      const potentialTargets = combatants.filter((f) => !f.isDefeated && f.hp > 0 && f.id !== attacker.id);
      if (potentialTargets.length === 0) break;

      // Escolhe alvo aleatório entre os combatentes vivos
      const target = potentialTargets[Math.floor(rng() * potentialTargets.length)];

      const acts = resolveAttack(attacker, target, { rng });
      roundLog.actions.push(...acts);

      if ((target.isDefeated || target.hp <= 0) && !eliminationOrder.find((e) => e.id === target.id)) {
        target.isDefeated = true;
        target.hp = 0;
        eliminationOrder.push(target);
      }
    }

    rounds.push(roundLog);
    roundNum++;
  }

  // Identifica sobreviventes finais
  const survivors = getAliveCombatants().sort((a, b) => b.hp - a.hp || b.damageDealt - a.damageDealt);

  // Colocações finais:
  // 1º lugar: Sobrevivente com mais HP (ou campeão único)
  // Seguintes: Demais sobreviventes ordenados por HP/dano
  // Por fim: Eliminados na ordem reversa de eliminação (o último a cair fica mais bem colocado)
  const rankings = [...survivors, ...[...eliminationOrder].reverse()];

  // Garante que todo combatente inicial esteja presente no ranking
  combatants.forEach((c) => {
    if (!rankings.find((r) => r.id === c.id)) {
      rankings.push(c);
    }
  });

  const winner = rankings[0];
  const playerFighter = combatants[0];
  const playerPlacement = rankings.findIndex((f) => f.id === playerFighter.id) + 1;

  return {
    mode: 'Grupo',
    winner,
    rankings,
    playerPlacement,
    isPlayerWinner: playerPlacement === 1,
    fighters: fightersInitial,
    finalState: combatants,
    rounds,
    totalRounds: rounds.length,
    date: new Date().toISOString(),
  };
}
