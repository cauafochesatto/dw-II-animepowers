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
      // Balanced: 85 across all stats
      const balanced = {
        forca: 85,
        velocidade: 85,
        defesa: 85,
        resistencia: 85,
        energia: 85,
        poderEspecial: 85,
      };

      // Unbalanced: same total (510), but extreme variance
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

  describe('Battle Engine (1v1, 2v2, Group Mode)', () => {
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

    it('createFighterState computes max HP based on resistencia and defesa', () => {
      const fighter = createFighterState(buildPlayer, 'Test', false);
      expect(fighter.hp).toBeGreaterThan(1000);
      expect(fighter.maxHp).toBe(fighter.hp);
      expect(fighter.energy).toBeGreaterThan(0);
      expect(fighter.isDefeated).toBe(false);
    });

    it('generateAiBuild produces an AI adversary with legitimate stats and isAi flag', () => {
      const ai = generateAiBuild();
      expect(ai.isAi).toBe(true);
      expect(ai.name).toContain('[IA]');
      expect(ai.stats.forca).toBeGreaterThanOrEqual(50);
      expect(ai.stats.forca).toBeLessThanOrEqual(99);
      expect(ai.classification).toBeDefined();
    });

    it('simulate1v1 produces a decisive winner and round logs', () => {
      const result = simulate1v1(buildPlayer, buildWeak);
      expect(result.mode).toBe('1v1');
      expect(result.winner).toBeDefined();
      expect(result.loser).toBeDefined();
      expect(result.rounds.length).toBeGreaterThan(0);
      expect(result.isPlayerWinner).toBe(true); // Super build vs weak build should win
    });

    it('simulate2v2 resolves team combat', () => {
      const ally = generateAiBuild();
      const enemy1 = generateAiBuild();
      const enemy2 = generateAiBuild();

      const result = simulate2v2([buildPlayer, ally], [enemy1, enemy2]);
      expect(result.mode).toBe('2v2');
      expect(['Equipe A', 'Equipe B']).toContain(result.winnerTeam);
      expect(result.rounds.length).toBeGreaterThan(0);
    });

    it('simulateGroupBattle resolves a 6-combatant Battle Royale and ranks 1st to 6th', () => {
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
      expect(result.rounds.length).toBeGreaterThan(0);
    });
  });
});
