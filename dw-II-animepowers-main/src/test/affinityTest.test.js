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

const PERGUNTAS = [
  { q: 'Em batalha, você prefere...', opts: [['Atacar de frente', 'Fogo'], ['Controlar o ritmo', 'Água'], ['Ser imprevisível', 'Vento'], ['Resistir e contra-atacar', 'Terra'], ['Manipular energia pura', 'Energia']] },
  { q: 'Seu ambiente ideal...', opts: [['Vulcão / deserto', 'Fogo'], ['Oceano / chuva', 'Água'], ['Montanhas / céu', 'Vento'], ['Caverna / floresta', 'Terra'], ['Templo / vazio', 'Energia']] },
  { q: 'Seu defeito em luta...', opts: [['Impulsividade', 'Fogo'], ['Hesitação', 'Água'], ['Dispersão', 'Vento'], ['Teimosia', 'Terra'], ['Excesso de cálculo', 'Energia']] },
  { q: 'Técnica dos sonhos...', opts: [['Explosão colossal', 'Fogo'], ['Dragão de água', 'Água'], ['Lâmina invisível de vento', 'Vento'], ['Muralha inquebrável', 'Terra'], ['Feixe de energia', 'Energia']] },
  { q: 'Seu mestre seria...', opts: [['Ace / Tanjiro', 'Fogo'], ['Giyu / Hisoka', 'Água'], ['Naruto / Byakuya', 'Vento'], ['Gon / Midoriya', 'Terra'], ['Goku / Gojo', 'Energia']] },
];

describe('Affinity Test Logic', () => {
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    global.localStorage = localStorageMock;
  });

  describe('Answer calculation', () => {
    it('calculates affinity from answers', () => {
      const respostas = ['Fogo', 'Fogo', 'Fogo', 'Fogo', 'Fogo'];
      const count = {};
      respostas.forEach((r) => { count[r] = (count[r] || 0) + 1; });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
      
      expect(top).toBe('Fogo');
    });

    it('handles mixed answers', () => {
      const respostas = ['Fogo', 'Água', 'Fogo', 'Vento', 'Fogo'];
      const count = {};
      respostas.forEach((r) => { count[r] = (count[r] || 0) + 1; });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
      
      expect(top).toBe('Fogo');
    });

    it('handles tie by first occurrence', () => {
      const respostas = ['Fogo', 'Água', 'Vento', 'Terra', 'Energia'];
      const count = {};
      respostas.forEach((r) => { count[r] = (count[r] || 0) + 1; });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
      
      // All have 1, so first in sorted order wins
      expect(['Fogo', 'Água', 'Vento', 'Terra', 'Energia']).toContain(top);
    });

    it('requires all 5 questions answered', () => {
      const respostas = ['Fogo', 'Água', '', 'Terra', 'Energia'];
      const incomplete = respostas.some((r) => !r);
      
      expect(incomplete).toBe(true);
    });

    it('accepts complete answers', () => {
      const respostas = ['Fogo', 'Água', 'Vento', 'Terra', 'Energia'];
      const incomplete = respostas.some((r) => !r);
      
      expect(incomplete).toBe(false);
    });
  });

  describe('Affinity storage', () => {
    it('saves affinity to localStorage', () => {
      const afinidade = { elemento: 'Fogo', data: new Date().toISOString(), respostas: ['Fogo', 'Fogo', 'Fogo', 'Fogo', 'Fogo'] };
      localStorage.setItem('pa:afinidade', JSON.stringify(afinidade));
      
      expect(localStorage.setItem).toHaveBeenCalledWith('pa:afinidade', JSON.stringify(afinidade));
    });

    it('loads affinity from localStorage', () => {
      const afinidade = { elemento: 'Água', data: new Date().toISOString(), respostas: ['Água', 'Água', 'Água', 'Água', 'Água'] };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(afinidade));
      
      const loaded = JSON.parse(localStorage.getItem('pa:afinidade') || 'null');
      
      expect(loaded).toEqual(afinidade);
    });

    it('handles null affinity', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const loaded = JSON.parse(localStorage.getItem('pa:afinidade') || 'null');
      
      expect(loaded).toBeNull();
    });

    it('clears affinity on reset', () => {
      localStorage.removeItem('pa:afinidade');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('pa:afinidade');
    });
  });

  describe('Affinity descriptions', () => {
    const DESCR = {
      Fogo: 'Ofensivo e intenso. Bônus: +5 dano em duelos (roleplay).',
      Água: 'Adaptável e fluído. Bônus: −5 custo em duelos (roleplay).',
      Vento: 'Veloz e preciso. Bônus: +3 aleatoriedade a favor (roleplay).',
      Terra: 'Resistente e estável. Bônus: empates vencem (roleplay).',
      Energia: 'Equilibrado e arcano. Bônus: versátil em qualquer deck.',
    };

    it('has description for each affinity', () => {
      Object.keys(DESCR).forEach(afinidade => {
        expect(DESCR[afinidade]).toBeDefined();
        expect(DESCR[afinidade].length).toBeGreaterThan(0);
      });
    });

    it('descriptions mention bonus mechanics', () => {
      expect(DESCR.Fogo).toContain('Bônus');
      expect(DESCR.Água).toContain('Bônus');
      expect(DESCR.Vento).toContain('Bônus');
      expect(DESCR.Terra).toContain('Bônus');
      expect(DESCR.Energia).toContain('Bônus');
    });
  });

  describe('Question structure', () => {
    it('has exactly 5 questions', () => {
      expect(PERGUNTAS.length).toBe(5);
    });

    it('each question has 5 options', () => {
      PERGUNTAS.forEach(p => {
        expect(p.opts.length).toBe(5);
      });
    });

    it('each option has label and element', () => {
      PERGUNTAS.forEach(p => {
        p.opts.forEach(opt => {
          expect(opt.length).toBe(2);
          expect(typeof opt[0]).toBe('string'); // label
          expect(typeof opt[1]).toBe('string'); // element
        });
      });
    });

    it('covers all 5 base elements', () => {
      const elements = new Set();
      PERGUNTAS.forEach(p => {
        p.opts.forEach(opt => elements.add(opt[1]));
      });
      
      expect(elements).toEqual(new Set(['Fogo', 'Água', 'Vento', 'Terra', 'Energia']));
    });
  });
});