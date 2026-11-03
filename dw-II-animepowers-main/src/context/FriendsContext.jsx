import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance';

const FriendsContext = createContext(null);

const USERS_KEY = 'animepowers_db_users_table';
const FRIENDS_KEY = 'ap:friends_data';

/**
 * Estrutura de dados no localStorage (ap:friends_data):
 * {
 *   [userId]: {
 *     friends: [friendId, ...],
 *     sentRequests: [targetId, ...],
 *     receivedRequests: [senderId, ...],
 *     sentBattles: [{ id, targetId, ... }],
 *     receivedBattles: [{ id, senderId, ... }],
 *   }
 * }
 */

function loadData() {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveData(data) {
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[FriendsContext] Erro ao salvar:', e);
  }
}

function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

export function FriendsProvider({ children }) {
  const authCtx = useContext(AuthContext);
  const currentUser = authCtx?.currentUser;
  const [friendsData, setFriendsData] = useState(loadData);
  const [allUsers, setAllUsers] = useState(getAllUsers);

  useEffect(() => {
    setAllUsers(getAllUsers());
  }, [currentUser]);

  useEffect(() => {
    const handleFocus = () => {
      setFriendsData(loadData());
      setAllUsers(getAllUsers());
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const myId = currentUser?.id;
  const myData = myId ? (friendsData[myId] || getOrInit({ ...friendsData }, myId)) : null;

  const getSearchableUsers = useCallback(
    (query = '') => {
      const q = query.trim().toLowerCase();
      return allUsers
        .filter((u) => u.id !== myId)
        .filter(
          (u) =>
            !q ||
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.email && u.email.toLowerCase().includes(q))
        );
    },
    [allUsers, myId]
  );

  const sendFriendRequest = useCallback(
    (targetId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };
      if (myId === targetId) return { success: false, message: 'Você não pode se adicionar.' };

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
        // O outro já pediu amizade — aceita automaticamente
        me.receivedRequests = me.receivedRequests.filter((id) => id !== targetId);
        target.sentRequests = target.sentRequests.filter((id) => id !== myId);
        me.friends = [...new Set([...me.friends, targetId])];
        target.friends = [...new Set([...target.friends, myId])];
        saveData(data);
        setFriendsData({ ...data });
        return { success: true, message: 'Amizade aceita! Vocês agora são amigos.' };
      }

      me.sentRequests = [...new Set([...me.sentRequests, targetId])];
      target.receivedRequests = [...new Set([...target.receivedRequests, myId])];
      saveData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Pedido de amizade enviado!' };
    },
    [myId]
  );

  const acceptFriendRequest = useCallback(
    (senderId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

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
      setFriendsData({ ...data });
      return { success: true, message: 'Amizade aceita!' };
    },
    [myId]
  );

  const declineFriendRequest = useCallback(
    (targetId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      const data = loadData();
      const me = getOrInit(data, myId);
      const target = getOrInit(data, targetId);

      me.receivedRequests = me.receivedRequests.filter((id) => id !== targetId);
      me.sentRequests = me.sentRequests.filter((id) => id !== targetId);
      target.receivedRequests = target.receivedRequests.filter((id) => id !== myId);
      target.sentRequests = target.sentRequests.filter((id) => id !== myId);

      saveData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Pedido recusado.' };
    },
    [myId]
  );

  const removeFriend = useCallback(
    (friendId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      const data = loadData();
      const me = getOrInit(data, myId);
      const friend = getOrInit(data, friendId);

      me.friends = me.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== myId);

      saveData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Amigo removido.' };
    },
    [myId]
  );

  const sendBattleRequest = useCallback(
    (targetId, deckInfo, message = '') => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      const data = loadData();
      const me = getOrInit(data, myId);
      const target = getOrInit(data, targetId);

      const battleId = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      const battleRecord = {
        id: battleId,
        createdAt: new Date().toISOString(),
        message: (message || '').trim().slice(0, 140),
        status: 'pending',
        deck: deckInfo,
        senderName: currentUser?.name || currentUser?.email?.split('@')[0] || 'Anônimo',
        senderAvatar: currentUser?.avatar || null,
        senderId: myId,
        targetId,
      };

      me.sentBattles = [{ ...battleRecord }, ...(me.sentBattles || [])].slice(0, 30);
      target.receivedBattles = [{ ...battleRecord }, ...(target.receivedBattles || [])].slice(0, 30);

      saveData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Desafio de batalha enviado!', battleId };
    },
    [myId, currentUser]
  );

  const respondBattleRequest = useCallback(
    (battleId, accept) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      const data = loadData();
      const me = getOrInit(data, myId);
      const status = accept ? 'accepted' : 'declined';

      me.receivedBattles = (me.receivedBattles || []).map((b) =>
        b.id === battleId ? { ...b, status } : b
      );

      const battle = (me.receivedBattles || []).find((b) => b.id === battleId);
      if (battle) {
        const sender = getOrInit(data, battle.senderId);
        sender.sentBattles = (sender.sentBattles || []).map((b) =>
          b.id === battleId ? { ...b, status } : b
        );
      }

      saveData(data);
      setFriendsData({ ...data });
      return {
        success: true,
        message: accept ? 'Batalha aceita! Prepare seu deck.' : 'Desafio recusado.',
        status,
        battle,
      };
    },
    [myId]
  );

  const getUserById = useCallback(
    (id) => allUsers.find((u) => u.id === id) || null,
    [allUsers]
  );

  const friendIds = myData?.friends || [];
  const pendingReceived = myData?.receivedRequests || [];
  const pendingSent = myData?.sentRequests || [];
  const pendingBattles = (myData?.receivedBattles || []).filter((b) => b.status === 'pending');
  const totalNotifications = pendingReceived.length + pendingBattles.length;

  return (
    <FriendsContext.Provider
      value={{
        friendIds,
        pendingReceived,
        pendingSent,
        sentBattles: myData?.sentBattles || [],
        receivedBattles: myData?.receivedBattles || [],
        pendingBattles,
        totalNotifications,
        allUsers,
        getSearchableUsers,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        sendBattleRequest,
        respondBattleRequest,
        getUserById,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends deve ser usado dentro de FriendsProvider');
  return ctx;
}
