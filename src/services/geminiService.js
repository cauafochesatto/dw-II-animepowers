import { GoogleGenerativeAI } from '@google/generative-ai';
import { getElementalRelation } from '../data/elementalAffinities';

function getApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

let genAI = null;

function getGenAI() {
  const key = getApiKey();
  if (!key) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI;
}

const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

async function generateWithFallback(prompt) {
  const ai = getGenAI();
  if (!ai) return null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text) return text;
    } catch (err) {
      console.warn(`[Gemini ${modelName} falhou, tentando próximo modelo]`, err?.message || err);
    }
  }
  return null;
}

function gerarNarrativaLocal(powerA, powerB, resultado) {
  const vencedor = resultado.vencedor;
  const perdedor = vencedor.id === powerA.id ? powerB : powerA;
  const relVencedor = vencedor.id === powerA.id ? resultado.elementalRelationA : resultado.elementalRelationB;
  const scoreVencedor = resultado.sA >= resultado.sB ? resultado.sA.toFixed(1) : resultado.sB.toFixed(1);

  const intro = `⚡ O céu escurece e o ar vibra com a tensão pré-combate! De um lado, **${powerA.personagem}** conjura **${powerA.nome}** (${powerA.elemento}), liberando ondas de energia devastadoras. Do outro, **${powerB.personagem}** ergue **${powerB.nome}** (${powerB.elemento}), criando uma pressão atmosférica avassaladora.`;

  let choque = '';
  if (relVencedor === 'vantagem') {
    choque = `💥 Quando as duas técnicas se chocam, a afinidade elemental de **${vencedor.nome}** entra em ressonância perfeita! A vantagem de ${vencedor.elemento} corta o fluxo de ${perdedor.elemento} de **${perdedor.nome}**, rachando o solo em fissuras ardentes.`;
  } else if (relVencedor === 'desvantagem') {
    choque = `💥 Contra todas as probabilidades e desvantagem de elemento, **${vencedor.personagem}** compensa com ímpeto brutal e timing cirúrgico, pressionando **${perdedor.nome}** a cada milésimo de segundo!`;
  } else {
    choque = `💥 As duas técnicas colidem num estrondo titânico! Luz e choque elemental se espalham em ondas concêntricas, num teste extremo de tenacidade e poder destrutivo.`;
  }

  const climax = `🔥 Em um último surto de chakra e determinação, **${vencedor.personagem}** canaliza toda a sua energia restante (${vencedor.custo} de custo) e rompe a barreira inimiga com um golpe decisivo marcado em ${scoreVencedor} pontos!`;

  const fim = `🏆 **Vitória de ${vencedor.nome}!** O portador **${vencedor.personagem}** (${vencedor.anime}) firma seus pés vitorioso na arena, enquanto os ecos do combate silenciam a plateia!`;

  return `${intro}\n\n${choque}\n\n${climax}\n\n${fim}`;
}

function gerarAnaliseLocal(powerA, powerB) {
  const relA = getElementalRelation(powerA.elemento, powerB.elemento);
  const relB = getElementalRelation(powerB.elemento, powerA.elemento);

  let resumoRel = 'Equilíbrio elemental neutro.';
  if (relA === 'vantagem') resumoRel = `Vantagem tática para **${powerA.nome}** (${powerA.elemento} supera ${powerB.elemento} com +20%).`;
  else if (relB === 'vantagem') resumoRel = `Vantagem tática para **${powerB.nome}** (${powerB.elemento} supera ${powerA.elemento} com +20%).`;

  const custoA = powerA.custo <= powerB.custo ? `Mais econômico (${powerA.custo} vs ${powerB.custo})` : `Consumo mais elevado (${powerA.custo})`;
  const danoMaior = powerA.dano >= powerB.dano ? powerA : powerB;

  return `⚔️ **Análise Tática do Confronto:**\n\n` +
    `• **${powerA.nome}** (${powerA.personagem} · ${powerA.anime}): Dano ${powerA.dano}, Custo ${powerA.custo}, Alcance ${powerA.alcance}. ${custoA}.\n` +
    `• **${powerB.nome}** (${powerB.personagem} · ${powerB.anime}): Dano ${powerB.dano}, Custo ${powerB.custo}, Alcance ${powerB.alcance}.\n\n` +
    `⚡ **Interação Elemental:** ${resumoRel}\n` +
    `🎯 **Projeção:** A técnica com maior potencial (${danoMaior.nome}) possui vantagem inicial, mas a gestão do custo de energia e os modificadores de arena definirão o desfecho!`;
}

/**
 * Narra uma batalha épica de anime usando o Gemini com fallback narrativo.
 */
export async function narrarBatalha(powerA, powerB, resultado) {
  const prompt = `Você é um narrador épico de batalhas de anime, no estilo dramático e emocionante dos melhores shounen.

Narre uma batalha ÉPICA e CINEMATOGRÁFICA entre:

🔥 LUTADOR 1: ${powerA.nome}
   - Personagem: ${powerA.personagem} (${powerA.anime})
   - Habilidade: ${powerA.nome} | Elemento: ${powerA.elemento}
   - Dano: ${powerA.dano} | Custo de energia: ${powerA.custo}
   - Descrição: ${powerA.descricao}

⚡ LUTADOR 2: ${powerB.nome}
   - Personagem: ${powerB.personagem} (${powerB.anime})
   - Habilidade: ${powerB.nome} | Elemento: ${powerB.elemento}
   - Dano: ${powerB.dano} | Custo de energia: ${powerB.custo}
   - Descrição: ${powerB.descricao}

📊 RESULTADO DO CONFRONTO:
   - Placar: ${resultado.sA.toFixed(1)} x ${resultado.sB.toFixed(1)}
   - Vencedor: ${resultado.vencedor.nome} (${resultado.vencedor.personagem})
   - Vantagem elemental de ${powerA.nome}: ${resultado.elementalRelationA}
   - Vantagem elemental de ${powerB.nome}: ${resultado.elementalRelationB}

INSTRUÇÕES:
- Escreva em PORTUGUÊS BRASILEIRO, estilo dramático de anime
- Narre o confronto em 3-4 parágrafos curtos e intensos
- Descreva os golpes, as explosões, o ambiente da batalha
- Mencione vantagens elementais se houver
- Conclua com um desfecho épico revelando o vencedor
- Use emojis estrategicamente para maior impacto visual
- Máximo de 250 palavras`;

  try {
    const text = await generateWithFallback(prompt);
    if (text) return text;
  } catch (err) {
    console.warn('[Gemini narrarBatalha]', err);
  }

  return gerarNarrativaLocal(powerA, powerB, resultado);
}

/**
 * Gera uma análise estratégica do duelo com dicas táticas.
 */
export async function analisarDuelo(powerA, powerB) {
  const prompt = `Você é um especialista em análise tática de batalhas de anime.

Analise estrategicamente o confronto entre:
- ${powerA.nome} de ${powerA.personagem} (${powerA.anime}) — Elemento: ${powerA.elemento}, Dano: ${powerA.dano}, Custo: ${powerA.custo}
- ${powerB.nome} de ${powerB.personagem} (${powerB.anime}) — Elemento: ${powerB.elemento}, Dano: ${powerB.dano}, Custo: ${powerB.custo}

Forneça:
1. Vantagens e desvantagens de cada habilidade
2. Compatibilidade elemental
3. Previsão de quem tende a vencer e por quê

Responda em PORTUGUÊS BRASILEIRO, de forma concisa, com no máximo 150 palavras. Use emojis.`;

  try {
    const text = await generateWithFallback(prompt);
    if (text) return text;
  } catch (err) {
    console.warn('[Gemini analisarDuelo]', err);
  }

  return gerarAnaliseLocal(powerA, powerB);
}
