// Tabela de Afinidades Elementais - Vantagens e Desvantagens
// Baseado em lógicas comuns de anime (Pokémon, Naruto, etc.)

export const ELEMENTAL_AFFINITIES = {
  // Fogo
  Fogo: {
    forteContra: ['Vento', 'Terra', 'Gelo', 'Planta', 'Madeira'],  // +20% dano
    fracoContra: ['Água', 'Terra', 'Pedra'], // -20% dano
    neutro: ['Fogo', 'Trovão', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  },
  // Água
  Água: {
    forteContra: ['Fogo', 'Terra', 'Pedra', 'Fogo'], // +20% dano
    fracoContra: ['Trovão', 'Planta', 'Madeira', 'Vento'], // -20% dano
    neutro: ['Água', 'Gelo', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  },
  // Vento
  Vento: {
    forteContra: ['Terra', 'Planta', 'Madeira', 'Veneno'], // +20% dano
    fracoContra: ['Fogo', 'Trovão', 'Gelo'], // -20% dano (Fogo alimenta vento, Trovão conduz)
    neutro: ['Vento', 'Água', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  },
  // Trovão
  Trovão: {
    forteContra: ['Água', 'Vento', 'Metal', 'Voador'], // +20% dano
    fracoContra: ['Terra', 'Planta', 'Madeira'], // -20% dano
    neutro: ['Trovão', 'Fogo', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  },
  // Terra
  Terra: {
    forteContra: ['Fogo', 'Trovão', 'Veneno', 'Pedra', 'Metal'], // +20% dano
    fracoContra: ['Água', 'Planta', 'Madeira', 'Gelo', 'Vento'], // -20% dano
    neutro: ['Terra', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  },
  // Luz
  Luz: {
    forteContra: ['Sombra', 'Trevas', 'Mal', 'Fantasma'], // +20% dano
    fracoContra: ['Espaço', 'Tempo'], // -20% dano
    neutro: ['Luz', 'Fogo', 'Água', 'Vento', 'Trovão', 'Terra', 'Físico', 'Energia']
  },
  // Sombra
  Sombra: {
    forteContra: ['Luz', 'Psíquico', 'Fantasma', 'Mente'], // +20% dano
    fracoContra: ['Luz', 'Fogo', 'Energia'], // -20% dano
    neutro: ['Sombra', 'Água', 'Vento', 'Trovão', 'Terra', 'Espaço', 'Tempo', 'Físico']
  },
  // Espaço
  Espaço: {
    forteContra: ['Tempo', 'Luz', 'Sombra', 'Teleporte'], // +20% dano
    fracoContra: ['Tempo', 'Energia'], // -20% dano
    neutro: ['Espaço', 'Fogo', 'Água', 'Vento', 'Trovão', 'Terra', 'Físico']
  },
  // Tempo
  Tempo: {
    forteContra: ['Espaço', 'Velocidade', 'Envelhecimento'], // +20% dano
    fracoContra: ['Espaço', 'Energia'], // -20% dano
    neutro: ['Tempo', 'Fogo', 'Água', 'Vento', 'Trovão', 'Terra', 'Luz', 'Sombra', 'Físico']
  },
  // Físico
  Físico: {
    forteContra: ['Normal', 'Gelo', 'Pedra', 'Aço', 'Sombra'], // +10% dano
    fracoContra: ['Fantasma', 'Voador', 'Psíquico'], // -10% dano
    neutro: ['Físico', 'Fogo', 'Água', 'Vento', 'Trovão', 'Terra', 'Luz', 'Espaço', 'Tempo', 'Energia']
  },
  // Energia
  Energia: {
    forteContra: ['Tudo'], // +15% dano (versátil)
    fracoContra: ['Espaço', 'Tempo', 'Vazio'], // -15% dano
    neutro: ['Energia', 'Fogo', 'Água', 'Vento', 'Trovão', 'Terra', 'Luz', 'Sombra', 'Físico']
  },
  // Gelo (para completude)
  Gelo: {
    forteContra: ['Vento', 'Terra', 'Voador', 'Planta', 'Dragão'], // +20% dano
    fracoContra: ['Fogo', 'Pedra', 'Aço', 'Luta'], // -20% dano
    neutro: ['Gelo', 'Água', 'Trovão', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  },
  // Veneno (para completude)
  Veneno: {
    forteContra: ['Planta', 'Fada', 'Grama'], // +20% dano
    fracoContra: ['Terra', 'Psíquico', 'Aço'], // -20% dano
    neutro: ['Veneno', 'Fogo', 'Água', 'Vento', 'Trovão', 'Luz', 'Sombra', 'Espaço', 'Tempo', 'Físico', 'Energia']
  }
};

// Função para calcular multiplicador de afinidade
export function getElementalMultiplier(atacanteElemento, defensorElemento) {
  const afinidade = ELEMENTAL_AFFINITIES[atacanteElemento];
  if (!afinidade) return 1.0;

  if (afinidade.forteContra.includes(defensorElemento)) {
    return 1.2; // +20% dano
  }
  if (afinidade.fracoContra.includes(defensorElemento)) {
    return 0.8; // -20% dano
  }
  return 1.0; // Neutro
}

// Função para obter descrição textual da relação
export function getElementalRelation(atacanteElemento, defensorElemento) {
  const afinidade = ELEMENTAL_AFFINITIES[atacanteElemento];
  if (!afinidade) return 'neutro';

  if (afinidade.forteContra.includes(defensorElemento)) {
    return 'vantagem';
  }
  if (afinidade.fracoContra.includes(defensorElemento)) {
    return 'desvantagem';
  }
  return 'neutro';
}

// Bônus de afinidade do jogador
export const PLAYER_AFFINITY_BONUSES = {
  Fogo: { danoBonus: 5, desc: '+5 de dano em ataques de Fogo' },
  Água: { custoReducao: 5, desc: '−5 de custo em ataques de Água' },
  Vento: { sorteBonus: 3, desc: '+3 de aleatoriedade a favor' },
  Terra: { empatesVencem: true, desc: 'Empates contam como vitória' },
  Energia: { versatil: true, desc: 'Versátil em qualquer deck' },
  Trovão: { critChance: 0.1, desc: '+10% chance de crítico' },
  Luz: { curaBonus: 0.1, desc: 'Cura 10% do dano causado' },
  Sombra: { rouboVida: 0.15, desc: 'Rouba 15% do dano como vida' },
  Espaço: { esquivaBonus: 0.1, desc: '+10% chance de esquiva' },
  Tempo: { turnoExtra: 0.05, desc: '5% chance de turno extra' },
  Físico: { armaduraPenetracao: 10, desc: 'Ignora 10 de armadura' },
  Gelo: { congelamento: 0.15, desc: '15% chance de congelar (pula turno)' }
};

export function getPlayerAffinityBonus(afinidade, elementoAtaque) {
  const bonus = PLAYER_AFFINITY_BONUSES[afinidade];
  if (!bonus) return { multiplicador: 1, extra: 0, efeitos: [] };

  if (afinidade === elementoAtaque) {
    const efeitos = [];
    let multiplicador = 1;
    let extra = 0;

    if (bonus.danoBonus) {
      extra += bonus.danoBonus;
      efeitos.push(bonus.desc);
    }
    if (bonus.custoReducao) {
      efeitos.push(bonus.desc);
    }
    if (bonus.sorteBonus) {
      multiplicador += bonus.sorteBonus / 100;
      efeitos.push(bonus.desc);
    }
    if (bonus.critChance) {
      efeitos.push(bonus.desc);
    }
    if (bonus.curaBonus) {
      efeitos.push(bonus.desc);
    }
    if (bonus.rouboVida) {
      efeitos.push(bonus.desc);
    }
    if (bonus.esquivaBonus) {
      efeitos.push(bonus.desc);
    }
    if (bonus.turnoExtra) {
      efeitos.push(bonus.desc);
    }
    if (bonus.armaduraPenetracao) {
      efeitos.push(bonus.desc);
    }
    if (bonus.congelamento) {
      efeitos.push(bonus.desc);
    }
    if (bonus.empatesVencem) {
      efeitos.push(bonus.desc);
    }
    if (bonus.versatil) {
      efeitos.push(bonus.desc);
    }

    return { multiplicador, extra, efeitos };
  }

  return { multiplicador: 1, extra: 0, efeitos: [] };
}