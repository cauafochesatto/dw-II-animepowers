import { describe, it, expect } from 'vitest';
import {
  getElementalMultiplier,
  getElementalRelation,
  getPlayerAffinityBonus,
  ELEMENTAL_AFFINITIES,
  PLAYER_AFFINITY_BONUSES
} from '../data/elementalAffinities';

describe('Elemental Affinities', () => {
  describe('getElementalMultiplier', () => {
    it('returns 1.2 for advantage matchups', () => {
      // Fogo > Vento
      expect(getElementalMultiplier('Fogo', 'Vento')).toBe(1.2);
      // Água > Fogo
      expect(getElementalMultiplier('Água', 'Fogo')).toBe(1.2);
      // Vento > Terra
      expect(getElementalMultiplier('Vento', 'Terra')).toBe(1.2);
      // Trovão > Água
      expect(getElementalMultiplier('Trovão', 'Água')).toBe(1.2);
      // Terra > Trovão
      expect(getElementalMultiplier('Terra', 'Trovão')).toBe(1.2);
    });

    it('returns 0.8 for disadvantage matchups', () => {
      // Fogo < Água
      expect(getElementalMultiplier('Fogo', 'Água')).toBe(0.8);
      // Água < Trovão
      expect(getElementalMultiplier('Água', 'Trovão')).toBe(0.8);
      // Vento < Fogo
      expect(getElementalMultiplier('Vento', 'Fogo')).toBe(0.8);
      // Trovão < Terra
      expect(getElementalMultiplier('Trovão', 'Terra')).toBe(0.8);
      // Terra < Água
      expect(getElementalMultiplier('Terra', 'Água')).toBe(0.8);
    });

    it('returns 1.0 for neutral matchups', () => {
      // Fogo vs Fogo
      expect(getElementalMultiplier('Fogo', 'Fogo')).toBe(1.0);
      // Fogo vs Energia (neutro)
      expect(getElementalMultiplier('Fogo', 'Energia')).toBe(1.0);
      // Elemento inexistente
      expect(getElementalMultiplier('Inexistente', 'Fogo')).toBe(1.0);
    });

    it('handles all defined elements', () => {
      const elements = Object.keys(ELEMENTAL_AFFINITIES);
      elements.forEach((attacker) => {
        elements.forEach((defender) => {
          const mult = getElementalMultiplier(attacker, defender);
          expect([0.8, 1.0, 1.2]).toContain(mult);
        });
      });
    });
  });

  describe('getElementalRelation', () => {
    it('returns "vantagem" for advantage', () => {
      expect(getElementalRelation('Fogo', 'Vento')).toBe('vantagem');
      expect(getElementalRelation('Água', 'Fogo')).toBe('vantagem');
    });

    it('returns "desvantagem" for disadvantage', () => {
      expect(getElementalRelation('Fogo', 'Água')).toBe('desvantagem');
      expect(getElementalRelation('Água', 'Trovão')).toBe('desvantagem');
    });

    it('returns "neutro" for neutral', () => {
      expect(getElementalRelation('Fogo', 'Fogo')).toBe('neutro');
      expect(getElementalRelation('Fogo', 'Energia')).toBe('neutro');
    });
  });

  describe('getPlayerAffinityBonus', () => {
    it('returns bonus when affinity matches attack element', () => {
      const bonus = getPlayerAffinityBonus('Fogo', 'Fogo');
      expect(bonus.multiplicador).toBeGreaterThanOrEqual(1);
      expect(bonus.extra).toBeGreaterThanOrEqual(0);
      expect(bonus.efeitos.length).toBeGreaterThan(0);
    });

    it('returns no bonus when affinity does not match', () => {
      const bonus = getPlayerAffinityBonus('Fogo', 'Água');
      expect(bonus.multiplicador).toBe(1);
      expect(bonus.extra).toBe(0);
      expect(bonus.efeitos.length).toBe(0);
    });

    it('returns no bonus for null affinity', () => {
      const bonus = getPlayerAffinityBonus(null, 'Fogo');
      expect(bonus.multiplicador).toBe(1);
      expect(bonus.extra).toBe(0);
      expect(bonus.efeitos.length).toBe(0);
    });

    it('handles all player affinity types', () => {
      Object.keys(PLAYER_AFFINITY_BONUSES).forEach((afinidade) => {
        const bonus = getPlayerAffinityBonus(afinidade, afinidade);
        expect(bonus.efeitos.length).toBeGreaterThan(0);
      });
    });
  });
});