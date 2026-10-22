/**
 * Resolve caminhos de imagens locais de forma robusta e independente do `base`
 * do Vite ou do subcaminho do repositório (ex.: /poderesanime/ ou /dw-II-animepowers/).
 */
export function resolvePowerImage(src) {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  // Extrai o nome do arquivo da imagem (ex: 'rasengan.jpg')
  const filename = src.split('/').pop();
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}imagenspoderes/${filename}`;
}
