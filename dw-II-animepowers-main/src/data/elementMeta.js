// Sistema visual dos elementos.
//
// As cores ficam numa faixa controlada: luminosidade e croma constantes,
// só o matiz muda. Assim o catálogo tem variação sem virar arco-íris.
// A cor aparece em três lugares apenas — marcador, rótulo e número.

export const ELEMENT_COLORS = {
  Fogo: 'oklch(66% 0.185 34)',
  Água: 'oklch(68% 0.135 232)',
  Vento: 'oklch(72% 0.135 168)',
  Trovão: 'oklch(76% 0.155 88)',
  Luz: 'oklch(84% 0.135 96)',
  Sombra: 'oklch(62% 0.16 300)',
  Espaço: 'oklch(62% 0.155 268)',
  Tempo: 'oklch(63% 0.175 322)',
  Físico: 'oklch(66% 0.185 8)',
  Terra: 'oklch(64% 0.105 62)',
  Energia: 'oklch(72% 0.125 202)'
};

const FALLBACK = 'oklch(72% 0.02 0)';

/** Classe CSS que publica --element para os descendentes. */
export function elementClass(elemento) {
  return `el-${slug(elemento)}`;
}

/** Aplica a cor do elemento num elemento do DOM (para gradientes/estilos). */
export function elementColor(elemento) {
  return ELEMENT_COLORS[elemento] || FALLBACK;
}

export function slug(elemento) {
  return (
    String(elemento || 'neutro')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
  );
}

/** Lista de elementos na ordem em que aparecem no catálogo. */
export const ELEMENT_ORDER = Object.keys(ELEMENT_COLORS);
