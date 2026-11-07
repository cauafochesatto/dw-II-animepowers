import pg from 'pg';
import { attachDatabasePool } from '@neon/functions';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:raga2010@localhost:5432/anime_powers_db';

// Neon exige SSL para conexões em nuvem
const isCloudOrNeon =
  connectionString.includes('neon.tech') ||
  connectionString.includes('render.com') ||
  connectionString.includes('supabase.co') ||
  process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString,
  ssl: isCloudOrNeon ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Anexa o pool ao ciclo de vida de funções da Neon para tratar desconexões ociosas de forma resiliente
attachDatabasePool(pool);

export async function query(text, params = []) {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error('[DB Query Error]', { text, error: err.message });
    throw err;
  }
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Migrações seguras e idempotentes para inicializar o esquema no Neon PostgreSQL
 */
export async function initSchema() {
  const schemaSql = `
    -- 1. Tabela de Usuários
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(80) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        username VARCHAR(80),
        email VARCHAR(180) UNIQUE NOT NULL,
        password VARCHAR(255),
        avatar TEXT,
        role VARCHAR(50) DEFAULT 'Guerreiro',
        spins_balance INTEGER NOT NULL DEFAULT 20,
        provider VARCHAR(30) DEFAULT 'local',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(80);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS spins_balance INTEGER NOT NULL DEFAULT 20;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(30) DEFAULT 'local';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

    -- 2. Coleção de Personagens
    CREATE TABLE IF NOT EXISTS characters_collection (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        character_id VARCHAR(80) NOT NULL,
        count INTEGER NOT NULL DEFAULT 1,
        first_obtained TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_obtained TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_character UNIQUE (user_id, character_id)
    );
    CREATE INDEX IF NOT EXISTS idx_collection_user ON characters_collection(user_id);

    -- 3. Construções de Personagem (Builds)
    CREATE TABLE IF NOT EXISTS character_builds (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        avatar_id VARCHAR(80) NOT NULL,
        signature_move VARCHAR(120),
        stat_sources JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_builds_user ON character_builds(user_id);

    -- 4. Amizades
    CREATE TABLE IF NOT EXISTS friendships (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_friendship_pair UNIQUE (user_id, friend_id),
        CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
    );
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

    -- 5. Desafios de Batalha
    CREATE TABLE IF NOT EXISTS battle_challenges (
        id VARCHAR(80) PRIMARY KEY,
        sender_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        format VARCHAR(20) NOT NULL DEFAULT '1v1',
        deck_payload JSONB,
        message VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT no_self_challenge CHECK (sender_id != target_id)
    );
    CREATE INDEX IF NOT EXISTS idx_challenges_sender ON battle_challenges(sender_id);
    CREATE INDEX IF NOT EXISTS idx_challenges_target ON battle_challenges(target_id);

    -- 6. Torneios
    CREATE TABLE IF NOT EXISTS tournaments (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        size INTEGER NOT NULL DEFAULT 8,
        difficulty VARCHAR(20) NOT NULL DEFAULT 'medio',
        status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
        champion JSONB,
        bracket_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'medio';
    CREATE INDEX IF NOT EXISTS idx_tournaments_user ON tournaments(user_id);

    -- 7. Histórico de Batalhas
    CREATE TABLE IF NOT EXISTS battles_history (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mode VARCHAR(30) NOT NULL,
        is_win BOOLEAN NOT NULL,
        player_placement INTEGER DEFAULT 1,
        opponent_name VARCHAR(120),
        opponent_avatar TEXT,
        player_build_snapshot JSONB,
        total_rounds INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_battles_user ON battles_history(user_id);

    -- 8. Tabela de Classificação Global do Ranking
    CREATE TABLE IF NOT EXISTS ranking_stats (
        user_id VARCHAR(80) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        player_name VARCHAR(120) NOT NULL,
        avatar TEXT,
        rank VARCHAR(10) DEFAULT 'D',
        wins INTEGER NOT NULL DEFAULT 0,
        losses INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL DEFAULT 0,
        win_rate INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ranking_wins ON ranking_stats(wins DESC, win_rate DESC, total DESC);

    -- 9. Tabela Idempotente de Recompensas de Giros
    CREATE TABLE IF NOT EXISTS rewards_log (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(80) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        battle_id VARCHAR(140) UNIQUE NOT NULL,
        source VARCHAR(40) NOT NULL,
        difficulty VARCHAR(20),
        spins_awarded INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_rewards_battle ON rewards_log(battle_id);
  `;

  try {
    await query(schemaSql);
    console.log('[Neon Functions] Esquema do banco de dados verificado com sucesso.');
  } catch (err) {
    console.error('[Neon Functions] Erro ao verificar esquema do banco:', err.message);
  }
}
