/**
 * Resolve caminhos de imagens locais de forma robusta e independente do `base`
 * do Vite ou do subcaminho do repositório (ex.: /poderesanime/ ou /dw-II-animepowers/).
 * Fornece fallback seguro para evitar imagens quebradas.
 */
export function resolvePowerImage(src) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const defaultFallback = `${cleanBase}imagenspoderes/kamehamenha.jpg`;

  if (!src) return defaultFallback;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  // Extrai o nome do arquivo da imagem (ex: 'rasengan.jpg')
  const filename = src.split('/').pop();
  if (!filename) return defaultFallback;
  return `${cleanBase}imagenspoderes/${filename}`;
}
