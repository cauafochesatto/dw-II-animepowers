-- ==============================================================================
-- Migração 001: Segurança, Integridade e Idempotência no Neon PostgreSQL
-- Anime Powers - Proteção atômica de recompensas e prevenção de colisão de contas
-- ==============================================================================

-- 1. Ampliação do tamanho do campo battle_id na tabela rewards_log
-- Permite identificadores compostos namespaced por usuário (ex: tourn_<userId>_<tournamentId>)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'rewards_log' AND column_name = 'battle_id'
    ) THEN
        ALTER TABLE rewards_log ALTER COLUMN battle_id TYPE VARCHAR(200);
    END IF;
END $$;

-- 2. Índice Único Composto (user_id, battle_id) em rewards_log
-- Garante idempotência atômica: um usuário nunca recebe giros duplicados pela mesma vitória,
-- mas o tournamentId de um usuário JAMAIS bloqueia ou colide com a premiação de outro usuário.
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_user_battle_unique
ON rewards_log (user_id, battle_id);

-- 3. Índice Único para Username em users (case-insensitive)
-- Impede que novos usuários se cadastrem com usernames duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique
ON users (LOWER(username))
WHERE username IS NOT NULL;

-- 4. Índice para agilizar buscas seguras por display name durante autenticação
CREATE INDEX IF NOT EXISTS idx_users_name_lower
ON users (LOWER(name));

-- Confirmação da migração
COMMENT ON INDEX idx_rewards_user_battle_unique IS 'Garante idempotência estrita por usuário para recompensas de batalhas e torneios';

