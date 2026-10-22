import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    if (!API_KEY) throw new Error('Chave da API Gemini não configurada.');
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  }
  return model;
}

/**
 * Narra uma batalha épica de anime usando o Gemini.
 */
export async function narrarBatalha(powerA, powerB, resultado) {
  const m = getModel();

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

  const result = await m.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Gera uma análise estratégica do duelo com dicas táticas.
 */
export async function analisarDuelo(powerA, powerB) {
  const m = getModel();

  const prompt = `Você é um especialista em análise tática de batalhas de anime.

Analise estrategicamente o confronto entre:
- ${powerA.nome} de ${powerA.personagem} (${powerA.anime}) — Elemento: ${powerA.elemento}, Dano: ${powerA.dano}, Custo: ${powerA.custo}
- ${powerB.nome} de ${powerB.personagem} (${powerB.anime}) — Elemento: ${powerB.elemento}, Dano: ${powerB.dano}, Custo: ${powerB.custo}

Forneça:
1. Vantagens e desvantagens de cada habilidade
2. Compatibilidade elemental
3. Previsão de quem tende a vencer e por quê

Responda em PORTUGUÊS BRASILEIRO, de forma concisa, com no máximo 150 palavras. Use emojis.`;

  const result = await m.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
