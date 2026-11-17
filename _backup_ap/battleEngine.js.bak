/**
 * Motor de Combate do Anime Powers.
 * Simula confrontos baseados nos atributos selecionados na construção.
 * Suporta formatos: 1v1, 2v2 e Modo de Grupo (5 a 6 combatentes).
 */

import { CHARACTERS, CHARACTERS_BY_ID, calculateBuildClassification } from '../data/characters';

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

  const maxHp = Math.round(420 + (stats.resistencia * 6.2) + (stats.defesa * 2.8));
  const classification = calculateBuildClassification(stats);

  const avatar = build?.avatar || build?.imagem || '/poderesanime/imagenspoderes/kamehamenha.jpg';
  const customName = build?.name || fighterName;
  const signatureMove = build?.signatureMove || 'Golpe Cósmico Devastador';

  return {
    id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: customName,
    avatar,
    isAi,
    team,
    stats,
    maxHp,
    hp: maxHp,
    energy: Math.round(stats.energia * 0.35),
    maxEnergy: 100,
    classification,
    signatureMove,
    isDefeated: false,
    damageDealt: 0,
    eliminations: 0,
  };
}

/**
 * Gera um adversário IA equilibrado e válido com base em personagens reais.
 */
export function generateAiBuild(difficulty = 'standard', customTitle = null) {
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

  // Monta atributos válidos respeitando personagens existentes
  const randomChars = [...CHARACTERS].sort(() => 0.5 - Math.random());
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
 * Simula uma rodada de ataque entre dois lutadores.
 */
function resolveAttack(attacker, defender) {
  const actions = [];
  const attStats = attacker.stats;
  const defStats = defender.stats;

  // Checa esquiva: influenciada pela diferença de velocidade
  const speedDiff = defStats.velocidade - attStats.velocidade;
  const dodgeChance = Math.min(24, Math.max(4, speedDiff * 0.35 + 5));
  const isDodge = Math.random() * 100 < dodgeChance;

  if (isDodge) {
    actions.push({
      attackerId: attacker.id,
      attackerName: attacker.name,
      defenderId: defender.id,
      defenderName: defender.name,
      type: 'dodge',
      damage: 0,
      text: `${defender.name} esquivou-se com reflexos sobre-humanos do ataque de ${attacker.name}!`,
      defenderHp: defender.hp,
    });
    return actions;
  }

  // Verifica se o atacante tem energia suficiente para o Ataque Especial
  const isSpecial = attacker.energy >= 100;
  let rawDamage = 0;
  let isCrit = false;

  if (isSpecial) {
    // FÓRMULA DE ATAQUE ESPECIAL
    // Poder Especial * 2.2 + Força * 0.75 - Defesa * 0.32
    rawDamage = (attStats.poderEspecial * 2.2) + (attStats.forca * 0.75) - (defStats.defesa * 0.32);
    attacker.energy = 0; // consome energia
  } else {
    // FÓRMULA DE ATAQUE BÁSICO
    // Força * 1.45 + Energia * 0.35 - Defesa * 0.42 - Resistência * 0.12
    rawDamage = (attStats.forca * 1.45) + (attStats.energia * 0.35) - (defStats.defesa * 0.42) - (defStats.resistencia * 0.12);
    attacker.energy = Math.min(100, attacker.energy + Math.round(16 + (attStats.energia * 0.22)));
  }

  // Variação controlada (±12%)
  const variance = 0.88 + Math.random() * 0.24;
  let finalDamage = Math.max(24, Math.round(rawDamage * variance));

  // Chance de crítico
  const critChance = Math.min(26, Math.max(6, (attStats.velocidade * 0.12) + (attStats.poderEspecial * 0.11)));
  if (Math.random() * 100 < critChance) {
    isCrit = true;
    finalDamage = Math.round(finalDamage * 1.45);
  }

  defender.hp = Math.max(0, defender.hp - finalDamage);
  attacker.damageDealt += finalDamage;

  let text = '';
  if (isSpecial) {
    text = `💥 ${attacker.name} liberou seu GOLPE ESPECIAL "${attacker.signatureMove}", explodindo ${finalDamage} de dano contra ${defender.name}!`;
  } else if (isCrit) {
    text = `⚡ GOLPE CRÍTICO! ${attacker.name} acertou um golpe devastador em ${defender.name} causando ${finalDamage} de dano!`;
  } else {
    text = `⚔️ ${attacker.name} atacou ${defender.name} desferindo ${finalDamage} de dano.`;
  }

  if (defender.hp <= 0) {
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
    text,
    defenderHp: defender.hp,
    defenderMaxHp: defender.maxHp,
  });

  return actions;
}

/**
 * Simula um combate 1v1 completo.
 */
export function simulate1v1(playerBuild, opponentBuild) {
  const f1 = createFighterState(playerBuild, playerBuild.name || 'Jogador 1', false, 'A');
  const f2 = createFighterState(opponentBuild, opponentBuild.name || 'Adversário', opponentBuild.isAi ?? true, 'B');

  const rounds = [];
  let roundNum = 1;
  const maxRounds = 30;

  // Registro de snapshots dos combatentes
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

    // Determina ordem de ataque pela velocidade
    const f1Speed = f1.stats.velocidade + (Math.random() * 6 - 3);
    const f2Speed = f2.stats.velocidade + (Math.random() * 6 - 3);

    const first = f1Speed >= f2Speed ? f1 : f2;
    const second = first === f1 ? f2 : f1;

    // Primeiro ataca
    const acts1 = resolveAttack(first, second);
    roundLog.actions.push(...acts1);

    // Se o segundo sobreviveu, contra-ataca
    if (!second.isDefeated) {
      const acts2 = resolveAttack(second, first);
      roundLog.actions.push(...acts2);
    }

    roundLog.f1HpAfter = f1.hp;
    roundLog.f2HpAfter = f2.hp;
    rounds.push(roundLog);
    roundNum++;
  }

  const winner = f1.isDefeated ? f2 : f1;
  const loser = f1.isDefeated ? f1 : f2;

  return {
    mode: '1v1',
    winner,
    loser,
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
export function simulate2v2(teamABuilds, teamBBuilds) {
  const teamA = teamABuilds.map((b, idx) =>
    createFighterState(b, b.name || `Aliado ${idx + 1}`, b.isAi ?? (idx > 0), 'A')
  );
  const teamB = teamBBuilds.map((b, idx) =>
    createFighterState(b, b.name || `Inimigo ${idx + 1}`, b.isAi ?? true, 'B')
  );

  const allFighters = [...teamA, ...teamB];
  const fightersInitial = allFighters.map((f) => ({ ...f, stats: { ...f.stats } }));

  const rounds = [];
  let roundNum = 1;
  const maxRounds = 35;

  const isTeamDefeated = (team) => team.every((f) => f.isDefeated);

  while (!isTeamDefeated(teamA) && !isTeamDefeated(teamB) && roundNum <= maxRounds) {
    const roundLog = {
      round: roundNum,
      actions: [],
      states: allFighters.map((f) => ({ id: f.id, name: f.name, hp: f.hp, energy: f.energy })),
    };

    // Ordena todos os combatentes vivos por iniciativa
    const activeFighters = allFighters
      .filter((f) => !f.isDefeated)
      .sort((a, b) => (b.stats.velocidade + Math.random() * 8) - (a.stats.velocidade + Math.random() * 8));

    for (const attacker of activeFighters) {
      if (attacker.isDefeated) continue;

      const opposingTeam = attacker.team === 'A' ? teamB : teamA;
      const aliveTargets = opposingTeam.filter((f) => !f.isDefeated);
      if (aliveTargets.length === 0) break;

      // Escolhe alvo: o de menor vida para foco tático ou aleatório
      const target = aliveTargets.reduce((lowest, curr) => (curr.hp < lowest.hp ? curr : lowest), aliveTargets[0]);

      const acts = resolveAttack(attacker, target);
      roundLog.actions.push(...acts);
    }

    rounds.push(roundLog);
    roundNum++;
  }

  const teamAWon = !isTeamDefeated(teamA);

  return {
    mode: '2v2',
    winnerTeam: teamAWon ? 'Equipe A' : 'Equipe B',
    isPlayerWinner: teamAWon,
    teamA,
    teamB,
    fighters: fightersInitial,
    rounds,
    totalRounds: rounds.length,
    date: new Date().toISOString(),
  };
}

/**
 * Simula o Modo de Grupo (Battle Royale - 5 a 6 combatentes).
 */
export function simulateGroupBattle(builds) {
  // Assegura de 5 a 6 combatentes
  const combatants = builds.slice(0, 6).map((b, idx) =>
    createFighterState(b, b.name || `Combatente ${idx + 1}`, b.isAi ?? (idx > 0), `P${idx + 1}`)
  );

  const fightersInitial = combatants.map((f) => ({ ...f, stats: { ...f.stats } }));
  const eliminationOrder = []; // Ordem em que caem (primeiro eliminado = 6º lugar, etc.)

  const rounds = [];
  let roundNum = 1;
  const maxRounds = 40;

  while (combatants.filter((f) => !f.isDefeated).length > 1 && roundNum <= maxRounds) {
    const roundLog = {
      round: roundNum,
      actions: [],
      aliveCount: combatants.filter((f) => !f.isDefeated).length,
    };

    const aliveFighters = combatants
      .filter((f) => !f.isDefeated)
      .sort((a, b) => (b.stats.velocidade + Math.random() * 10) - (a.stats.velocidade + Math.random() * 10));

    for (const attacker of aliveFighters) {
      if (attacker.isDefeated) continue;

      const potentialTargets = combatants.filter((f) => !f.isDefeated && f.id !== attacker.id);
      if (potentialTargets.length === 0) break;

      // Escolhe alvo aleatório entre os vivos
      const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];

      const acts = resolveAttack(attacker, target);
      roundLog.actions.push(...acts);

      if (target.isDefeated && !eliminationOrder.find((e) => e.id === target.id)) {
        eliminationOrder.push(target);
      }
    }

    rounds.push(roundLog);
    roundNum++;
  }

  // O último vivo é o campeão (1º lugar)
  const winner = combatants.find((f) => !f.isDefeated) || combatants[0];
  const rankings = [winner, ...[...eliminationOrder].reverse()];

  // Achar colocação do jogador principal (f0)
  const playerFighter = combatants[0];
  const playerPlacement = rankings.findIndex((f) => f.id === playerFighter.id) + 1;

  return {
    mode: 'Grupo',
    winner,
    rankings,
    playerPlacement,
    isPlayerWinner: playerPlacement === 1,
    fighters: fightersInitial,
    rounds,
    totalRounds: rounds.length,
    date: new Date().toISOString(),
  };
}
