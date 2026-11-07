import { describe, it, expect } from 'vitest';
import {
  createTournament,
  TOURNAMENT_DIFFICULTIES,
} from '../utils/tournamentEngine';
import {
  scaleFighterStats,
  getRewardSpins,
  simulate1v1,
} from '../../functions/src/battleEngine.js';

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
    it('concede 2 giros para vitória na Arena e 0 para derrotas', () => {
      expect(getRewardSpins('arena', null, true)).toBe(2);
      expect(getRewardSpins('arena', null, false)).toBe(0);
    });

    it('concede recompensas corretas no Torneio para cada nível de dificuldade', () => {
      expect(getRewardSpins('tournament', 'facil', true)).toBe(3);
      expect(getRewardSpins('tournament', 'medio', true)).toBe(5);
      expect(getRewardSpins('tournament', 'dificil', true)).toBe(8);
      expect(getRewardSpins('tournament', 'dificil', false)).toBe(0);
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
});

