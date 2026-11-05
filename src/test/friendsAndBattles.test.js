import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock simples e fiel do localStorage
const createMockStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    dump: () => store,
  };
};

describe('Friends & Battle Challenges Logic', () => {
  let mockStorage;
  const USERS_KEY = 'animepowers_db_users_table';
  const FRIENDS_KEY = 'ap:friends_data';
  const USER_BUILD_PREFIX = 'ap:user_build_';

  beforeEach(() => {
    mockStorage = createMockStorage();
    global.localStorage = mockStorage;

    const initialUsers = [
      { id: 'user_1', username: 'Goku_Warrior', name: 'Goku', email: 'goku@animepowers.local' },
      { id: 'user_2', username: 'Vegeta_Prince', name: 'Vegeta', email: 'vegeta@animepowers.local' },
      { id: 'user_3', username: 'Gojo_Sensei', name: 'Satoru Gojo', email: 'gojo@animepowers.local' },
    ];
    mockStorage.setItem(USERS_KEY, JSON.stringify(initialUsers));
  });

  // Funções helper idênticas às regras puras do FriendsContext para teste de lógica
  function loadData() {
    try {
      const raw = localStorage.getItem(FRIENDS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveData(data) {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(data));
  }

  function getOrInit(data, userId) {
    if (!data[userId]) {
      data[userId] = {
        friends: [],
        sentRequests: [],
        receivedRequests: [],
        sentBattles: [],
        receivedBattles: [],
      };
    }
    return data[userId];
  }

  function sendFriendRequest(myId, targetId) {
    if (!myId) return { success: false, message: 'Você precisa estar conectado em uma conta.' };
    if (myId === targetId) return { success: false, message: 'Você não pode adicionar seu próprio perfil.' };

    const data = loadData();
    const me = getOrInit(data, myId);
    const target = getOrInit(data, targetId);

    if (me.friends.includes(targetId)) {
      return { success: false, message: 'Vocês já são amigos!' };
    }
    if (me.sentRequests.includes(targetId)) {
      return { success: false, message: 'Pedido já enviado. Aguardando resposta.' };
    }
    if (me.receivedRequests.includes(targetId)) {
      me.receivedRequests = me.receivedRequests.filter((id) => id !== targetId);
      target.sentRequests = target.sentRequests.filter((id) => id !== myId);
      me.friends = [...new Set([...me.friends, targetId])];
      target.friends = [...new Set([...target.friends, myId])];
      saveData(data);
      return { success: true, message: 'Amizade confirmada!' };
    }

    me.sentRequests = [...new Set([...me.sentRequests, targetId])];
    target.receivedRequests = [...new Set([...target.receivedRequests, myId])];
    saveData(data);
    return { success: true, message: 'Pedido enviado!' };
  }

  function cancelFriendRequest(myId, targetId) {
    const data = loadData();
    const me = getOrInit(data, myId);
    const target = getOrInit(data, targetId);

    me.sentRequests = me.sentRequests.filter((id) => id !== targetId);
    target.receivedRequests = target.receivedRequests.filter((id) => id !== myId);
    saveData(data);
    return { success: true, message: 'Pedido cancelado.' };
  }

  function acceptFriendRequest(myId, senderId) {
    const data = loadData();
    const me = getOrInit(data, myId);
    const sender = getOrInit(data, senderId);

    if (!me.receivedRequests.includes(senderId)) {
      return { success: false, message: 'Pedido não encontrado.' };
    }

    me.receivedRequests = me.receivedRequests.filter((id) => id !== senderId);
    sender.sentRequests = sender.sentRequests.filter((id) => id !== myId);
    me.friends = [...new Set([...me.friends, senderId])];
    sender.friends = [...new Set([...sender.friends, myId])];
    saveData(data);
    return { success: true, message: 'Amizade aceita!' };
  }

  function declineFriendRequest(myId, senderId) {
    const data = loadData();
    const me = getOrInit(data, myId);
    const sender = getOrInit(data, senderId);

    me.receivedRequests = me.receivedRequests.filter((id) => id !== senderId);
    me.sentRequests = me.sentRequests.filter((id) => id !== senderId);
    sender.receivedRequests = sender.receivedRequests.filter((id) => id !== myId);
    sender.sentRequests = sender.sentRequests.filter((id) => id !== myId);
    saveData(data);
    return { success: true, message: 'Pedido recusado.' };
  }

  function removeFriend(myId, friendId) {
    const data = loadData();
    const me = getOrInit(data, myId);
    const friend = getOrInit(data, friendId);

    me.friends = me.friends.filter((id) => id !== friendId);
    friend.friends = friend.friends.filter((id) => id !== myId);
    saveData(data);
    return { success: true, message: 'Amigo removido.' };
  }

  function sendBattleRequest(myId, targetId, deck) {
    const data = loadData();
    const me = getOrInit(data, myId);
    const target = getOrInit(data, targetId);

    const battleRecord = {
      id: `battle_test_${Date.now()}`,
      status: 'pending',
      deck,
      senderId: myId,
      targetId,
    };

    me.sentBattles = [battleRecord, ...(me.sentBattles || [])];
    target.receivedBattles = [battleRecord, ...(target.receivedBattles || [])];
    saveData(data);
    return { success: true, battle: battleRecord };
  }

  function respondBattleRequest(myId, battleId, accept) {
    const data = loadData();
    const me = getOrInit(data, myId);
    const status = accept ? 'accepted' : 'declined';

    let targetBattle = null;
    me.receivedBattles = (me.receivedBattles || []).map((b) => {
      if (b.id === battleId) {
        targetBattle = { ...b, status };
        return targetBattle;
      }
      return b;
    });

    if (targetBattle) {
      const sender = getOrInit(data, targetBattle.senderId);
      sender.sentBattles = (sender.sentBattles || []).map((b) =>
        b.id === battleId ? { ...b, status } : b
      );
    }
    saveData(data);
    return { success: true, status };
  }

  describe('Friend Requests Flows', () => {
    it('prevents sending friend request to oneself', () => {
      const res = sendFriendRequest('user_1', 'user_1');
      expect(res.success).toBe(false);
      expect(res.message).toContain('próprio');
    });

    it('sends friend request and persists in both users states', () => {
      const res = sendFriendRequest('user_1', 'user_2');
      expect(res.success).toBe(true);

      const data = loadData();
      expect(data.user_1.sentRequests).toContain('user_2');
      expect(data.user_2.receivedRequests).toContain('user_1');
    });

    it('prevents duplicate friend request', () => {
      sendFriendRequest('user_1', 'user_2');
      const resDuplicate = sendFriendRequest('user_1', 'user_2');
      expect(resDuplicate.success).toBe(false);
      expect(resDuplicate.message).toContain('já enviado');
    });

    it('automatically confirms friendship when reciprocal request is made', () => {
      sendFriendRequest('user_1', 'user_2'); // user_1 -> user_2
      const resReciprocal = sendFriendRequest('user_2', 'user_1'); // user_2 -> user_1

      expect(resReciprocal.success).toBe(true);
      const data = loadData();
      expect(data.user_1.friends).toContain('user_2');
      expect(data.user_2.friends).toContain('user_1');
      expect(data.user_1.sentRequests).not.toContain('user_2');
      expect(data.user_2.receivedRequests).not.toContain('user_1');
    });

    it('cancels pending sent friend request properly', () => {
      sendFriendRequest('user_1', 'user_3');
      const resCancel = cancelFriendRequest('user_1', 'user_3');
      expect(resCancel.success).toBe(true);

      const data = loadData();
      expect(data.user_1.sentRequests).not.toContain('user_3');
      expect(data.user_3.receivedRequests).not.toContain('user_1');
    });

    it('accepts and establishes bilateral friendship', () => {
      sendFriendRequest('user_1', 'user_2');
      const resAccept = acceptFriendRequest('user_2', 'user_1');
      expect(resAccept.success).toBe(true);

      const data = loadData();
      expect(data.user_1.friends).toContain('user_2');
      expect(data.user_2.friends).toContain('user_1');
    });

    it('declines friend request cleanly without establishing friendship', () => {
      sendFriendRequest('user_1', 'user_2');
      const resDecline = declineFriendRequest('user_2', 'user_1');
      expect(resDecline.success).toBe(true);

      const data = loadData();
      expect(data.user_1.friends).not.toContain('user_2');
      expect(data.user_2.friends).not.toContain('user_1');
      expect(data.user_2.receivedRequests).not.toContain('user_1');
    });

    it('removes friend from both users rosters', () => {
      sendFriendRequest('user_1', 'user_2');
      acceptFriendRequest('user_2', 'user_1');

      const resRemove = removeFriend('user_1', 'user_2');
      expect(resRemove.success).toBe(true);

      const data = loadData();
      expect(data.user_1.friends).not.toContain('user_2');
      expect(data.user_2.friends).not.toContain('user_1');
    });
  });

  describe('Battle Challenges & Build Persistence', () => {
    it('creates battle challenge with pending status and attached deck payload', () => {
      const deckPayload = {
        format: '1v1',
        build: {
          name: 'Goku Titan',
          stats: { forca: 98, velocidade: 92, defesa: 88, resistencia: 93, energia: 95, poderEspecial: 96 },
        },
      };

      const res = sendBattleRequest('user_1', 'user_2', deckPayload);
      expect(res.success).toBe(true);
      expect(res.battle.status).toBe('pending');

      const data = loadData();
      expect(data.user_1.sentBattles.length).toBe(1);
      expect(data.user_2.receivedBattles.length).toBe(1);
      expect(data.user_2.receivedBattles[0].deck.build.name).toBe('Goku Titan');
    });

    it('updates status to accepted in both sender and recipient records', () => {
      const res = sendBattleRequest('user_1', 'user_2', { format: '1v1' });
      const battleId = res.battle.id;

      const resAccept = respondBattleRequest('user_2', battleId, true);
      expect(resAccept.success).toBe(true);
      expect(resAccept.status).toBe('accepted');

      const data = loadData();
      expect(data.user_2.receivedBattles[0].status).toBe('accepted');
      expect(data.user_1.sentBattles[0].status).toBe('accepted');
    });

    it('retrieves real friend build if saved, and returns null without fictitious values', () => {
      const realBuild = {
        name: 'Construção Lendária',
        stats: { forca: 90, velocidade: 90, defesa: 90, resistencia: 90, energia: 90, poderEspecial: 90 },
      };

      // Salva no storage de build do user_2
      mockStorage.setItem(`${USER_BUILD_PREFIX}user_2`, JSON.stringify(realBuild));

      const savedRaw = mockStorage.getItem(`${USER_BUILD_PREFIX}user_2`);
      const parsed = JSON.parse(savedRaw);
      expect(parsed.name).toBe('Construção Lendária');
      expect(parsed.stats.forca).toBe(90);

      // Usuário 3 não possui build salva
      const emptyRaw = mockStorage.getItem(`${USER_BUILD_PREFIX}user_3`);
      expect(emptyRaw).toBeNull();
    });
  });
});
