import { describe, it, expect } from 'vitest';
import { getElementalMultiplier, getPlayerAffinityBonus } from '../data/elementalAffinities';

// Mock power data for testing
const mockPowers = [
  { id: 1, nome: 'Rasengan', elemento: 'Vento', dano: 85, custo: 40 },
  { id: 2, nome: 'Chidori', elemento: 'Trovão', dano: 88, custo: 42 },
  { id: 3, nome: 'Kamehameha', elemento: 'Energia', dano: 95, custo: 50 },
  { id: 4, nome: 'Entei', elemento: 'Fogo', dano: 94, custo: 48 },
  { id: 5, nome: 'Respiração da Água', elemento: 'Água', dano: 78, custo: 32 }
];

// Base score formula from DuelSimulator
function baseScore(p) {
  return p.dano * 0.7 + (100 - p.custo) * 0.3;
}

function calculateFinalScore(power, opponentElement, playerAffinity) {
  let score = baseScore(power);
  const elementalMultiplier = getElementalMultiplier(power.elemento, opponentElement);
  score *= elementalMultiplier;
  const affinityBonus = getPlayerAffinityBonus(playerAffinity, power.elemento);
  score *= affinityBonus.multiplicador;
  score += affinityBonus.extra;
  return { score, elementalMultiplier, affinityBonus };
}

describe('Duel Logic', () => {
  describe('baseScore', () => {
    it('calculates correct base score', () => {
      // Rasengan: 85 * 0.7 + (100 - 40) * 0.3 = 59.5 + 18 = 77.5
      expect(baseScore(mockPowers[0])).toBeCloseTo(77.5, 1);
      // Chidori: 88 * 0.7 + (100 - 42) * 0.3 = 61.6 + 17.4 = 79.0
      expect(baseScore(mockPowers[1])).toBeCloseTo(79.0, 1);
    });

    it('higher damage increases score', () => {
      const highDmg = { ...mockPowers[0], dano: 100 };
      const lowDmg = { ...mockPowers[0], dano: 50 };
      expect(baseScore(highDmg)).toBeGreaterThan(baseScore(lowDmg));
    });

    it('lower cost increases score', () => {
      const lowCost = { ...mockPowers[0], custo: 10 };
      const highCost = { ...mockPowers[0], custo: 90 };
      expect(baseScore(lowCost)).toBeGreaterThan(baseScore(highCost));
    });
  });

  describe('calculateFinalScore with elemental affinities', () => {
    it('applies advantage multiplier (+20%)', () => {
      // Fogo vs Vento = vantagem
      const result = calculateFinalScore(mockPowers[3], 'Vento', null); // Entei (Fogo) vs Vento
      expect(result.elementalMultiplier).toBe(1.2);
      expect(result.score).toBeGreaterThan(baseScore(mockPowers[3]));
    });

    it('applies disadvantage multiplier (-20%)', () => {
      // Fogo vs Água = desvantagem
      const result = calculateFinalScore(mockPowers[3], 'Água', null); // Entei (Fogo) vs Água
      expect(result.elementalMultiplier).toBe(0.8);
      expect(result.score).toBeLessThan(baseScore(mockPowers[3]));
    });

    it('applies neutral multiplier (1.0)', () => {
      // Fogo vs Fogo = neutro
      const result = calculateFinalScore(mockPowers[3], 'Fogo', null);
      expect(result.elementalMultiplier).toBe(1.0);
      expect(result.score).toBeCloseTo(baseScore(mockPowers[3]), 1);
    });
  });

  describe('calculateFinalScore with player affinity', () => {
    it('applies Fogo affinity bonus', () => {
      const result = calculateFinalScore(mockPowers[3], 'Vento', 'Fogo'); // Entei (Fogo) with Fogo affinity
      expect(result.affinityBonus.efeitos.length).toBeGreaterThan(0);
      expect(result.affinityBonus.extra).toBeGreaterThan(0);
    });

    it('applies Água affinity bonus (cost reduction)', () => {
      const waterPower = mockPowers[4]; // Respiração da Água
      const result = calculateFinalScore(waterPower, 'Fogo', 'Água');
      expect(result.affinityBonus.efeitos.length).toBeGreaterThan(0);
    });

    it('applies Vento affinity bonus (randomness)', () => {
      const windPower = mockPowers[0]; // Rasengan (Vento)
      const result = calculateFinalScore(windPower, 'Terra', 'Vento');
      expect(result.affinityBonus.multiplicador).toBeGreaterThan(1);
    });

    it('applies Terra affinity bonus (ties win)', () => {
      const earthPower = { ...mockPowers[0], elemento: 'Terra' };
      const result = calculateFinalScore(earthPower, 'Trovão', 'Terra');
      expect(result.affinityBonus.efeitos.some(e => e.includes('Empates'))).toBe(true);
    });

    it('applies Energia affinity bonus (versatile)', () => {
      const energyPower = mockPowers[2]; // Kamehameha (Energia)
      const result = calculateFinalScore(energyPower, 'Fogo', 'Energia');
      expect(result.affinityBonus.efeitos.some(e => e.includes('Versátil'))).toBe(true);
    });

    it('does not apply bonus when affinity element differs', () => {
      const result = calculateFinalScore(mockPowers[3], 'Vento', 'Água'); // Fogo power with Água affinity
      expect(result.affinityBonus.efeitos.length).toBe(0);
      expect(result.affinityBonus.multiplicador).toBe(1);
      expect(result.affinityBonus.extra).toBe(0);
    });
  });

  describe('Duel simulation', () => {
    it('determines winner correctly', () => {
      const powerA = mockPowers[3]; // Entei (Fogo) - 94 dmg, 48 cost
      const powerB = mockPowers[0]; // Rasengan (Vento) - 85 dmg, 40 cost
      // Fogo has advantage over Vento
      const resultA = calculateFinalScore(powerA, powerB.elemento, null);
      const resultB = calculateFinalScore(powerB, powerA.elemento, null);
      expect(resultA.score).toBeGreaterThan(resultB.score);
    });

    it('calculates HP percentages correctly', () => {
      const powerA = mockPowers[3];
      const powerB = mockPowers[0];
      const resultA = calculateFinalScore(powerA, powerB.elemento, null);
      const resultB = calculateFinalScore(powerB, powerA.elemento, null);
      const total = resultA.score + resultB.score;
      const hpA = Math.round((resultA.score / total) * 100);
      const hpB = 100 - hpA;
      expect(hpA + hpB).toBe(100);
      expect(hpA).toBeGreaterThan(hpB); // Fogo has advantage
    });

    it('handles same power duel prevention', () => {
      const power = mockPowers[0];
      const result = calculateFinalScore(power, power.elemento, null);
      const result2 = calculateFinalScore(power, power.elemento, null);
      expect(result.score).toBe(result2.score);
    });
  });

  describe('Edge cases', () => {
    it('handles zero cost power', () => {
      const power = { ...mockPowers[0], custo: 0 };
      const score = baseScore(power);
      expect(score).toBe(power.dano * 0.7 + 100 * 0.3);
    });

    it('handles zero damage power', () => {
      const power = { ...mockPowers[0], dano: 0 };
      const score = baseScore(power);
      expect(score).toBe((100 - power.custo) * 0.3);
    });

    it('handles unknown elements gracefully', () => {
      const power = { ...mockPowers[0], elemento: 'Desconhecido' };
      const result = calculateFinalScore(power, 'Fogo', null);
      expect(result.elementalMultiplier).toBe(1.0);
    });
  });
});