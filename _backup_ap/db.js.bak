/**
 * Configuração centralizada de Banco de Dados e Ambiente
 * Carrega variáveis do .env via import.meta.env (Vite)
 */

export const DB_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'Anime Powers',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.2.0',
  dbName: import.meta.env.VITE_DB_NAME || 'anime_powers_db',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  storageMode: import.meta.env.VITE_DB_STORAGE_MODE || 'local_and_cloud',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '222156138599-ttteg9ra4duqmknbtlcc7rkvq2s01rhp.apps.googleusercontent.com',
};

/**
 * O avatar do usuário é gerado no cliente a partir das iniciais do e-mail.
 * Não há galeria de imagens externas: usar fotos de banco genéricas como se
 * fossem personagens de anime seria atribuir a um retrato o nome de um
 * personagem que ele não representa.
 */
export function avatarIniciais(email = '') {
  const base = String(email).split('@')[0].replace(/[._-]+/g, ' ').trim();
  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'AP';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}
