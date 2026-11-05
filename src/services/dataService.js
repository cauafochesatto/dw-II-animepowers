/**
 * Data Service & Backend Integration Layer
 * Centraliza persistência de usuários, amizades, desafios e torneios com suporte
 * a API REST / Supabase e sincronização em tempo real via BroadcastChannel.
 */

import { DB_CONFIG } from '../config/db';

const STORAGE_KEYS = {
  USERS: `${DB_CONFIG.dbName}_users_table`,
  FRIENDSHIPS: `${DB_CONFIG.dbName}_friendships_table`,
  CHALLENGES: `${DB_CONFIG.dbName}_challenges_table`,
  TOURNAMENTS: `${DB_CONFIG.dbName}_tournaments_table`,
  ACTIVE_SESSION: `${DB_CONFIG.dbName}_auth_session`,
};

// Canal de comunicação inter-abas em tempo real para sincronização instantânea
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('animepowers_realtime_sync');
  }
} catch {
  syncChannel = null;
}

function notifySync(type, payload = {}) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch {
      // ignora falha de canal
    }
  }
}

export function subscribeToSync(callback) {
  if (!syncChannel || typeof callback !== 'function') return () => {};
  const handler = (event) => {
    if (event?.data) callback(event.data);
  };
  syncChannel.addEventListener('message', handler);
  return () => syncChannel.removeEventListener('message', handler);
}

function readLocal(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[dataService] Erro ao gravar chave ${key}:`, err);
  }
}

/* ============================================================================
   USUÁRIOS (AUTH & PERFIL)
   ============================================================================ */

export async function fetchAllUsers() {
  // 1. Tenta carregar do backend remoto se URL configurada
  if (DB_CONFIG.apiUrl && DB_CONFIG.storageMode === 'cloud_only') {
    try {
      const res = await fetch(`${DB_CONFIG.apiUrl}/users`);
      if (res.ok) {
        const users = await res.json();
        writeLocal(STORAGE_KEYS.USERS, users);
        return users;
      }
    } catch {
      // fallback
    }
  }

  // 2. Carrega do banco local
  return readLocal(STORAGE_KEYS.USERS, []);
}

export async function saveUserRecord(user) {
  if (!user || !user.id) return { success: false, message: 'Dados de usuário inválidos.' };

  const users = readLocal(STORAGE_KEYS.USERS, []);
  const index = users.findIndex(
    (u) =>
      u.id === user.id ||
      (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase())
  );

  let updatedUsers;
  if (index >= 0) {
    updatedUsers = [...users];
    updatedUsers[index] = { ...updatedUsers[index], ...user, updatedAt: new Date().toISOString() };
  } else {
    updatedUsers = [...users, { ...user, createdAt: user.createdAt || new Date().toISOString() }];
  }

  writeLocal(STORAGE_KEYS.USERS, updatedUsers);
  notifySync('USERS_UPDATED', { userId: user.id });

  // Tenta sincronizar com API remota em segundo plano se configurada
  if (DB_CONFIG.apiUrl && DB_CONFIG.apiUrl !== 'http://localhost:3001/api') {
    fetch(`${DB_CONFIG.apiUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }).catch(() => {});
  }

  return { success: true, user };
}

/* ============================================================================
   AMIZADES (FRIENDSHIPS)
   ============================================================================ */

export async function fetchUserFriendships(userId) {
  if (!userId) return [];
  const allFriendships = readLocal(STORAGE_KEYS.FRIENDSHIPS, []);
  return allFriendships.filter((f) => f.userId === userId || f.friendId === userId);
}

export async function requestFriendship(userId, friendId) {
  if (!userId || !friendId) return { success: false, message: 'Identificadores inválidos.' };
  if (userId === friendId) return { success: false, message: 'Você não pode adicionar seu próprio perfil.' };

  const all = readLocal(STORAGE_KEYS.FRIENDSHIPS, []);

  // Verifica se já existe relação
  const existing = all.find(
    (f) =>
      (f.userId === userId && f.friendId === friendId) ||
      (f.userId === friendId && f.friendId === userId)
  );

  if (existing) {
    if (existing.status === 'accepted') {
      return { success: false, message: 'Vocês já são amigos!' };
    }
    if (existing.userId === userId && existing.status === 'pending') {
      return { success: false, message: 'Pedido já enviado. Aguardando resposta.' };
    }
    if (existing.userId === friendId && existing.status === 'pending') {
      // Reciprocidade: o outro já havia pedido, então confirma a amizade
      existing.status = 'accepted';
      existing.updatedAt = new Date().toISOString();
      writeLocal(STORAGE_KEYS.FRIENDSHIPS, all);
      notifySync('FRIENDSHIP_UPDATED', { id: existing.id, status: 'accepted' });
      return { success: true, message: 'Amizade confirmada! Vocês agora são amigos.' };
    }
  }

  // Cria novo pedido
  const newFriendship = {
    id: `fr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    friendId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newFriendship, ...all];
  writeLocal(STORAGE_KEYS.FRIENDSHIPS, updated);
  notifySync('FRIENDSHIP_CREATED', newFriendship);

  return { success: true, message: 'Pedido de amizade enviado com sucesso!', friendship: newFriendship };
}

export async function updateFriendshipStatus(friendshipId, status) {
  const all = readLocal(STORAGE_KEYS.FRIENDSHIPS, []);
  const index = all.findIndex((f) => f.id === friendshipId);
  if (index < 0) return { success: false, message: 'Solicitação não encontrada.' };

  all[index] = { ...all[index], status, updatedAt: new Date().toISOString() };
  writeLocal(STORAGE_KEYS.FRIENDSHIPS, all);
  notifySync('FRIENDSHIP_UPDATED', { id: friendshipId, status });

  return { success: true, message: status === 'accepted' ? 'Pedido aceito!' : 'Pedido recusado.' };
}

export async function cancelOrDeleteFriendship(userId, friendId) {
  const all = readLocal(STORAGE_KEYS.FRIENDSHIPS, []);
  const filtered = all.filter(
    (f) =>
      !(
        (f.userId === userId && f.friendId === friendId) ||
        (f.userId === friendId && f.friendId === userId)
      )
  );

  writeLocal(STORAGE_KEYS.FRIENDSHIPS, filtered);
  notifySync('FRIENDSHIP_DELETED', { userId, friendId });

  return { success: true, message: 'Relação de amizade cancelada/removida com sucesso.' };
}

/* ============================================================================
   DESAFIOS DE BATALHA (CHALLENGES)
   ============================================================================ */

export async function fetchUserChallenges(userId) {
  if (!userId) return [];
  const all = readLocal(STORAGE_KEYS.CHALLENGES, []);
  return all.filter((c) => c.senderId === userId || c.targetId === userId);
}

export async function createBattleChallenge(senderId, targetId, deckPayload, message = '', senderMeta = {}) {
  if (!senderId || !targetId) return { success: false, message: 'Dados de combate inválidos.' };
  if (senderId === targetId) return { success: false, message: 'Você não pode desafiar seu próprio perfil.' };

  const all = readLocal(STORAGE_KEYS.CHALLENGES, []);
  const newChallenge = {
    id: `chal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    senderId,
    targetId,
    senderName: senderMeta.name || 'Guerreiro',
    senderAvatar: senderMeta.avatar || null,
    format: deckPayload?.format || '1v1',
    deck: deckPayload,
    message: String(message || '').trim().slice(0, 140),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updated = [newChallenge, ...all].slice(0, 50);
  writeLocal(STORAGE_KEYS.CHALLENGES, updated);
  notifySync('CHALLENGE_CREATED', newChallenge);

  return { success: true, message: 'Desafio enviado com sucesso!', challenge: newChallenge };
}

export async function respondChallengeStatus(challengeId, status) {
  const all = readLocal(STORAGE_KEYS.CHALLENGES, []);
  const index = all.findIndex((c) => c.id === challengeId);
  if (index < 0) return { success: false, message: 'Desafio não encontrado.' };

  all[index] = { ...all[index], status, respondedAt: new Date().toISOString() };
  writeLocal(STORAGE_KEYS.CHALLENGES, all);
  notifySync('CHALLENGE_UPDATED', { id: challengeId, status });

  return {
    success: true,
    message: status === 'accepted' ? 'Desafio aceito!' : 'Desafio recusado/cancelado.',
    challenge: all[index],
  };
}

/* ============================================================================
   TORNEIOS (TOURNAMENTS PERSISTENCE)
   ============================================================================ */

export async function fetchUserTournaments(userId) {
  const all = readLocal(STORAGE_KEYS.TOURNAMENTS, []);
  if (!userId) return all;
  return all.filter((t) => t.userId === userId || !t.userId);
}

export async function saveTournamentRecord(tournament) {
  if (!tournament || !tournament.id) return { success: false };
  const all = readLocal(STORAGE_KEYS.TOURNAMENTS, []);
  const index = all.findIndex((t) => t.id === tournament.id);

  let updated;
  if (index >= 0) {
    updated = [...all];
    updated[index] = { ...updated[index], ...tournament, updatedAt: new Date().toISOString() };
  } else {
    updated = [{ ...tournament, createdAt: new Date().toISOString() }, ...all].slice(0, 30);
  }

  writeLocal(STORAGE_KEYS.TOURNAMENTS, updated);
  notifySync('TOURNAMENT_UPDATED', { id: tournament.id });
  return { success: true, tournament };
}

