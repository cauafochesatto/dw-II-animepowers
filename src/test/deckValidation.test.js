import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
};

// Deck constants
const MAX_DECK = 6;

// Mock powers for testing
const mockPowers = [
  { id: 1, nome: 'Rasengan', dano: 85, custo: 40, elemento: 'Vento' },
  { id: 2, nome: 'Chidori', dano: 88, custo: 42, elemento: 'Trovão' },
  { id: 3, nome: 'Kamehameha', dano: 95, custo: 50, elemento: 'Energia' },
  { id: 4, nome: 'Entei', dano: 94, custo: 48, elemento: 'Fogo' },
  { id: 5, nome: 'Respiração da Água', dano: 78, custo: 32, elemento: 'Água' },
  { id: 6, nome: 'Final Flash', dano: 97, custo: 60, elemento: 'Energia' },
  { id: 7, nome: 'Jajanken: Rock', dano: 80, custo: 30, elemento: 'Terra' }
];

describe('Deck Validation', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    global.localStorage = localStorageMock;
  });

  describe('Deck limits', () => {
    it('allows adding up to 6 powers', () => {
      let deck = [];
      
      // Add 6 powers
      for (let i = 1; i <= 6; i++) {
        if (deck.length < MAX_DECK && !deck.includes(i)) {
          deck = [...deck, i];
        }
      }
      
      expect(deck.length).toBe(MAX_DECK);
    });

    it('prevents adding 7th power', () => {
      let deck = [1, 2, 3, 4, 5, 6];
      
      // Try to add 7th
      if (deck.length >= MAX_DECK) {
        // Should not add
      } else {
        deck = [...deck, 7];
      }
      
      expect(deck.length).toBe(MAX_DECK);
      expect(deck).not.toContain(7);
    });

    it('prevents duplicate powers', () => {
      let deck = [1, 2, 3];
      
      // Try to add duplicate
      if (!deck.includes(2)) {
        deck = [...deck, 2];
      }
      
      expect(deck.filter(id => id === 2).length).toBe(1);
    });
  });

  describe('Deck stats calculation', () => {
    it('calculates total damage correctly', () => {
      const deck = [1, 2, 3]; // Rasengan, Chidori, Kamehameha
      const totalDano = deck.reduce((sum, id) => {
        const power = mockPowers.find(p => p.id === id);
        return sum + (power?.dano || 0);
      }, 0);
      
      expect(totalDano).toBe(85 + 88 + 95); // 268
    });

    it('calculates total cost correctly', () => {
      const deck = [1, 2, 3];
      const totalCusto = deck.reduce((sum, id) => {
        const power = mockPowers.find(p => p.id === id);
        return sum + (power?.custo || 0);
      }, 0);
      
      expect(totalCusto).toBe(40 + 42 + 50); // 132
    });

    it('calculates average damage per cost ratio', () => {
      const deck = [1, 2, 3];
      const avgRatio = deck.reduce((sum, id) => {
        const power = mockPowers.find(p => p.id === id);
        return sum + (power?.dano / power?.custo || 0);
      }, 0) / deck.length;
      
      expect(avgRatio).toBeCloseTo((85/40 + 88/42 + 95/50) / 3, 2);
    });
  });

  describe('Deck export/import', () => {
    it('exports deck as JSON array', () => {
      const deck = [1, 2, 3];
      const json = JSON.stringify(deck);
      const parsed = JSON.parse(json);
      
      expect(parsed).toEqual(deck);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('imports valid deck JSON', () => {
      const json = '[1, 2, 3]';
      const imported = JSON.parse(json);
      
      expect(Array.isArray(imported)).toBe(true);
      expect(imported.length).toBe(3);
    });

    it('filters invalid power IDs on import', () => {
      const json = '[1, 999, 2, -1, 3]';
      const imported = JSON.parse(json);
      const valid = imported
        .map(Number)
        .filter(id => mockPowers.some(p => p.id === id));
      
      expect(valid).toEqual([1, 2, 3]);
    });

    it('limits imported deck to MAX_DECK', () => {
      const json = '[1, 2, 3, 4, 5, 6, 7]';
      const imported = JSON.parse(json);
      const limited = [...new Set(imported)].slice(0, MAX_DECK);
      
      expect(limited.length).toBe(MAX_DECK);
    });

    it('removes duplicates on import', () => {
      const json = '[1, 2, 2, 3, 3, 3]';
      const imported = JSON.parse(json);
      const unique = [...new Set(imported)];
      
      expect(unique).toEqual([1, 2, 3]);
    });

    it('handles empty import', () => {
      const json = '[]';
      const imported = JSON.parse(json);
      
      expect(imported.length).toBe(0);
    });

    it('handles invalid JSON gracefully', () => {
      const invalidJson = 'not valid json';
      
      expect(() => JSON.parse(invalidJson)).toThrow();
    });
  });

  describe('Deck persistence', () => {
    it('saves deck to localStorage', () => {
      const deck = [1, 2, 3];
      localStorage.setItem('pa:deck', JSON.stringify(deck));
      
      expect(localStorage.setItem).toHaveBeenCalledWith('pa:deck', JSON.stringify(deck));
    });

    it('loads deck from localStorage', () => {
      const deck = [1, 2, 3];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(deck));
      
      const loaded = JSON.parse(localStorage.getItem('pa:deck') || '[]');
      
      expect(loaded).toEqual(deck);
    });

    it('handles corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('corrupted data');
      
      let loaded = [];
      try {
        loaded = JSON.parse(localStorage.getItem('pa:deck') || '[]');
      } catch {
        loaded = [];
      }
      
      expect(loaded).toEqual([]);
    });

    it('handles missing localStorage key', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const loaded = JSON.parse(localStorage.getItem('pa:deck') || '[]');
      
      expect(loaded).toEqual([]);
    });
  });

  describe('Deck element distribution', () => {
    it('tracks element distribution in deck', () => {
      const deck = [1, 2, 3, 4]; // Vento, Trovão, Energia, Fogo
      const elements = deck.map(id => mockPowers.find(p => p.id === id)?.elemento);
      const distribution = elements.reduce((acc, el) => {
        acc[el] = (acc[el] || 0) + 1;
        return acc;
      }, {});
      
      expect(distribution).toEqual({ Vento: 1, Trovão: 1, Energia: 1, Fogo: 1 });
    });

    it('calculates element balance score', () => {
      const deck = [1, 2, 3, 4, 5]; // 5 different elements
      const elements = deck.map(id => mockPowers.find(p => p.id === id)?.elemento);
      const uniqueElements = [...new Set(elements)];
      
      expect(uniqueElements.length).toBe(5); // Balanced deck
    });
  });
});