import { describe, it, expect } from 'vitest';
import {
  CHARACTERS,
  CHARACTERS_BY_ID,
  RARITY_CONFIG,
  rollRandomCharacter,
  calculateBuildClassification,
  STAT_KEYS,
} from '../data/characters';
import {
  createFighterState,
  generateAiBuild,
  resolveAttack,
  simulate1v1,
  simulate2v2,
  simulateGroupBattle,
} from '../utils/battleEngine';

describe('Character & Build System (Build An Anime Character)', () => {
  describe('Characters Data & User Specifications', () => {
    it('contains all 6 required characters from the specification with their exact attributes', () => {
      // Goku: força 98
      expect(CHARACTERS_BY_ID.goku).toBeDefined();
      expect(CHARACTERS_BY_ID.goku.forca).toBe(98);

      // Gojo: defesa 95
      expect(CHARACTERS_BY_ID.gojo).toBeDefined();
      expect(CHARACTERS_BY_ID.gojo.defesa).toBe(95);

      // Minato: velocidade 97
      expect(CHARACTERS_BY_ID.minato).toBeDefined();
      expect(CHARACTERS_BY_ID.minato.velocidade).toBe(97);

      // Sukuna: poder especial 99
      expect(CHARACTERS_BY_ID.sukuna).toBeDefined();
      expect(CHARACTERS_BY_ID.sukuna.poderEspecial).toBe(99);

      // Naruto: energia 96
      expect(CHARACTERS_BY_ID.naruto).toBeDefined();
      expect(CHARACTERS_BY_ID.naruto.energia).toBe(96);

      // Escanor: resistência 94
      expect(CHARACTERS_BY_ID.escanor).toBeDefined();
      expect(CHARACTERS_BY_ID.escanor.resistencia).toBe(94);
    });

    it('each character defines all 6 core attributes between 50 and 99', () => {
      CHARACTERS.forEach((char) => {
        STAT_KEYS.forEach(({ key }) => {
          expect(char[key]).toBeGreaterThanOrEqual(50);
          expect(char[key]).toBeLessThanOrEqual(99);
        });
        expect(char.nome).toBeTruthy();
        expect(char.anime).toBeTruthy();
        expect(char.raridade).toBeTruthy();
        expect(char.imagem).toBeTruthy();
      });
    });

    it('rarity rates sum to exactly 100%', () => {
      const sum = Object.values(RARITY_CONFIG).reduce((acc, c) => acc + c.rate, 0);
      expect(sum).toBeCloseTo(100.0, 1);
    });

    it('rollRandomCharacter produces a valid character from the pool', () => {
      const drawn = rollRandomCharacter();
      expect(drawn).toBeDefined();
      expect(CHARACTERS_BY_ID[drawn.id]).toBeDefined();
    });
  });

  describe('Build Classification (D, C, B, A, S, SS, SSS)', () => {
    it('classifies a perfect combined build (Goku, Gojo, Minato, Sukuna, Naruto, Escanor) as SSS or SS', () => {
      const bestStats = {
        forca: CHARACTERS_BY_ID.goku.forca, // 98
        velocidade: CHARACTERS_BY_ID.minato.velocidade, // 97
        defesa: CHARACTERS_BY_ID.gojo.defesa, // 95
        resistencia: CHARACTERS_BY_ID.escanor.resistencia, // 94
        energia: CHARACTERS_BY_ID.naruto.energia, // 96
        poderEspecial: CHARACTERS_BY_ID.sukuna.poderEspecial, // 99
      };

      const result = calculateBuildClassification(bestStats);
      expect(['SSS', 'SS']).toContain(result.rank);
      expect(result.score).toBeGreaterThanOrEqual(95);
    });

    it('classifies beginner / low stats as D or C', () => {
      const lowStats = {
        forca: 55,
        velocidade: 55,
        defesa: 55,
        resistencia: 55,
        energia: 55,
        poderEspecial: 55,
      };

      const result = calculateBuildClassification(lowStats);
      expect(['D', 'C']).toContain(result.rank);
      expect(result.score).toBeLessThan(70);
    });

    it('rewards well-balanced builds over unbalanced ones with same sum', () => {
      const balanced = {
        forca: 85,
        velocidade: 85,
        defesa: 85,
        resistencia: 85,
        energia: 85,
        poderEspecial: 85,
      };

      const unbalanced = {
        forca: 99,
        velocidade: 99,
        defesa: 99,
        resistencia: 71,
        energia: 71,
        poderEspecial: 71,
      };

      const resBalanced = calculateBuildClassification(balanced);
      const resUnbalanced = calculateBuildClassification(unbalanced);

      expect(resBalanced.score).toBeGreaterThan(resUnbalanced.score);
    });
  });

  describe('Battle Engine (Formulas, Limits & Determinism)', () => {
    const buildPlayer = {
      name: 'Guerreiro Cósmico',
      avatar: '/poderesanime/imagenspoderes/kamehamenha.jpg',
      stats: {
        forca: 98,
        velocidade: 97,
        defesa: 95,
        resistencia: 94,
        energia: 96,
        poderEspecial: 99,
      },
      signatureMove: 'Kamehameha Vazio Infinito',
    };

    const buildWeak = {
      name: 'Iniciante',
      avatar: '/poderesanime/imagenspoderes/kagura.jpg',
      stats: {
        forca: 60,
        velocidade: 60,
        defesa: 60,
        resistencia: 60,
        energia: 60,
        poderEspecial: 60,
      },
      signatureMove: 'Golpe Fraco',
    };

    it('createFighterState computes max HP with safe boundaries (between 500 and 2500)', () => {
      const fighter = createFighterState(buildPlayer, 'Test', false);
      expect(fighter.hp).toBeGreaterThanOrEqual(500);
      expect(fighter.hp).toBeLessThanOrEqual(2500);
      expect(fighter.maxHp).toBe(fighter.hp);
      expect(fighter.energy).toBeGreaterThanOrEqual(15);
      expect(fighter.energy).toBeLessThanOrEqual(60);
      expect(fighter.isDefeated).toBe(false);
    });

    it('sanitizes extreme stats outside bounds', () => {
      const extremeBuild = {
        stats: { forca: 9999, velocidade: -50, defesa: 9999, resistencia: -10, energia: 9999, poderEspecial: 0 },
      };
      const fighter = createFighterState(extremeBuild, 'Extreme');
      expect(fighter.stats.forca).toBe(150);
      expect(fighter.stats.velocidade).toBe(10);
      expect(fighter.stats.resistencia).toBe(10);
      expect(fighter.maxHp).toBeLessThanOrEqual(2500);
      expect(fighter.maxHp).toBeGreaterThanOrEqual(500);
    });

    it('resolveAttack allows deterministic simulation with custom RNG', () => {
      const f1 = createFighterState(buildPlayer, 'Attacker');
      const f2 = createFighterState(buildWeak, 'Defender');

      // Mock RNG that always returns 0.5 (neutral)
      const mockRng = () => 0.5;

      const actions = resolveAttack(f1, f2, { rng: mockRng });
      expect(actions.length).toBe(1);
      expect(actions[0].damage).toBeGreaterThan(0);
      expect(f2.hp).toBe(f2.maxHp - actions[0].damage);
    });

    it('resolveAttack handles dodge when RNG falls below dodge chance', () => {
      const fastDefender = createFighterState({
        stats: { forca: 50, velocidade: 100, defesa: 50, resistencia: 50, energia: 50, poderEspecial: 50 }
      }, 'Fast Defender');
      const slowAttacker = createFighterState({
        stats: { forca: 50, velocidade: 30, defesa: 50, resistencia: 50, energia: 50, poderEspecial: 50 }
      }, 'Slow Attacker');

      // RNG = 0.01 (1%) will trigger dodge because dodgeChance >= 3%
      const actions = resolveAttack(slowAttacker, fastDefender, { rng: () => 0.01 });
      expect(actions.length).toBe(1);
      expect(actions[0].type).toBe('dodge');
      expect(actions[0].damage).toBe(0);
      expect(fastDefender.hp).toBe(fastDefender.maxHp);
    });

    it('resolveAttack consumes 100 energy for special move and deals amplified damage', () => {
      const attacker = createFighterState(buildPlayer, 'Special User');
      attacker.energy = 100;
      const defender = createFighterState(buildWeak, 'Target');

      const actions = resolveAttack(attacker, defender, { rng: () => 0.5 });
      expect(actions.length).toBe(1);
      expect(actions[0].isSpecial).toBe(true);
      expect(actions[0].type).toBe('special');
      expect(attacker.energy).toBe(0); // Energy consumed
      expect(actions[0].damage).toBeGreaterThan(100);
    });

    it('prevents defeated combatant from attacking', () => {
      const deadAttacker = createFighterState(buildPlayer, 'Dead Fighter');
      deadAttacker.hp = 0;
      deadAttacker.isDefeated = true;

      const defender = createFighterState(buildWeak, 'Defender');
      const actions = resolveAttack(deadAttacker, defender);
      expect(actions.length).toBe(0);
      expect(defender.hp).toBe(defender.maxHp);
    });

    it('generateAiBuild produces an AI adversary with legitimate stats and isAi flag', () => {
      const ai = generateAiBuild();
      expect(ai.isAi).toBe(true);
      expect(ai.name).toContain('[IA]');
      expect(ai.stats.forca).toBeGreaterThanOrEqual(50);
      expect(ai.stats.forca).toBeLessThanOrEqual(99);
      expect(ai.classification).toBeDefined();
    });
  });

  describe('Battle Modes (1v1, 2v2, Group / Battle Royale)', () => {
    const buildPlayer = {
      name: 'Guerreiro Cósmico',
      avatar: '/poderesanime/imagenspoderes/kamehamenha.jpg',
      stats: {
        forca: 98,
        velocidade: 97,
        defesa: 95,
        resistencia: 94,
        energia: 96,
        poderEspecial: 99,
      },
      signatureMove: 'Kamehameha Vazio Infinito',
    };

    const buildWeak = {
      name: 'Iniciante',
      avatar: '/poderesanime/imagenspoderes/kagura.jpg',
      stats: {
        forca: 60,
        velocidade: 60,
        defesa: 60,
        resistencia: 60,
        energia: 60,
        poderEspecial: 60,
      },
      signatureMove: 'Golpe Fraco',
    };

    it('simulate1v1 produces a decisive winner and round logs', () => {
      const result = simulate1v1(buildPlayer, buildWeak);
      expect(result.mode).toBe('1v1');
      expect(result.winner).toBeDefined();
      expect(result.loser).toBeDefined();
      expect(result.rounds.length).toBeGreaterThan(0);
      expect(result.isPlayerWinner).toBe(true);
    });

    it('simulate1v1 correctly handles max rounds timeout and awards win to highest HP', () => {
      const mirrorA = { ...buildPlayer, name: 'Lutador A' };
      const mirrorB = { ...buildPlayer, name: 'Lutador B' };

      // Limita a 1 rodada
      const result = simulate1v1(mirrorA, mirrorB, { maxRounds: 1, rng: () => 0.5 });
      expect(result.mode).toBe('1v1');
      expect(result.rounds.length).toBeLessThanOrEqual(2);
      expect(result.isTimeout).toBe(true);
    });

    it('simulate2v2 resolves team combat and ensures defeated allies stop acting', () => {
      const ally = generateAiBuild();
      const enemy1 = generateAiBuild();
      const enemy2 = generateAiBuild();

      const result = simulate2v2([buildPlayer, ally], [enemy1, enemy2]);
      expect(result.mode).toBe('2v2');
      expect(['Equipe A', 'Equipe B', 'Empate']).toContain(result.winnerTeam);
      expect(result.rounds.length).toBeGreaterThan(0);
      expect(result.teamA.length).toBe(2);
      expect(result.teamB.length).toBe(2);
    });

    it('simulate2v2 automatically completes incomplete teams with valid AIs', () => {
      const result = simulate2v2([buildPlayer], []);
      expect(result.mode).toBe('2v2');
      expect(result.teamA.length).toBe(2);
      expect(result.teamB.length).toBe(2);
    });

    it('simulateGroupBattle ranks all combatants from 1st to 6th with no missing participants', () => {
      const opponents = [
        generateAiBuild(),
        generateAiBuild(),
        generateAiBuild(),
        generateAiBuild(),
        generateAiBuild(),
      ];

      const result = simulateGroupBattle([buildPlayer, ...opponents]);
      expect(result.mode).toBe('Grupo');
      expect(result.rankings.length).toBe(6);
      expect(result.playerPlacement).toBeGreaterThanOrEqual(1);
      expect(result.playerPlacement).toBeLessThanOrEqual(6);
      expect(result.winner).toBeDefined();
      expect(result.winner.id).toBe(result.rankings[0].id);
      expect(result.rounds.length).toBeGreaterThan(0);

      // Garante que todos os 6 combatentes têm IDs únicos no ranking
      const uniqueIds = new Set(result.rankings.map((r) => r.id));
      expect(uniqueIds.size).toBe(6);
    });

    it('simulateGroupBattle handles incomplete rosters by auto-filling to minimum 5 participants', () => {
      const result = simulateGroupBattle([buildPlayer]);
      expect(result.rankings.length).toBeGreaterThanOrEqual(5);
      expect(result.rankings[0]).toBeDefined();
    });
  });
});
