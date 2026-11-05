import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance';
import { FriendsContext } from './friendsContextInstance';
import {
  fetchAllUsers,
  requestFriendship,
  cancelOrDeleteFriendship,
  createBattleChallenge,
  respondChallengeStatus,
  subscribeToSync,
} from '../services/dataService';

const USERS_KEY = 'animepowers_db_users_table';
const FRIENDS_KEY = 'ap:friends_data';
const USER_BUILD_PREFIX = 'ap:user_build_';

function loadLegacyData() {
  try {
    const raw = localStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLegacyData(data) {
  try {
    localStorage.setItem(FRIENDS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[FriendsContext] Erro ao salvar legado:', e);
  }
}

function getAllUsersSync() {
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
  const myId = currentUser?.id;

  const [friendsData, setFriendsData] = useState(loadLegacyData);
  const [allUsers, setAllUsers] = useState(getAllUsersSync);

  const refreshAll = useCallback(async () => {
    const users = await fetchAllUsers();
    setAllUsers(users);
    setFriendsData(loadLegacyData());
  }, []);

  // Sincronização em tempo real via BroadcastChannel e window focus
  useEffect(() => {
    const timer = setTimeout(refreshAll, 50);

    const unsubscribe = subscribeToSync((msg) => {
      if (['FRIENDSHIP_CREATED', 'FRIENDSHIP_UPDATED', 'FRIENDSHIP_DELETED', 'CHALLENGE_CREATED', 'CHALLENGE_UPDATED', 'USERS_UPDATED'].includes(msg.type)) {
        refreshAll();
      }
    });

    const handleFocus = () => refreshAll();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleFocus);

    return () => {
      clearTimeout(timer);
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleFocus);
    };
  }, [refreshAll]);

  const myData = myId ? (friendsData[myId] || getOrInit({ ...friendsData }, myId)) : null;

  const getSearchableUsers = useCallback(
    (query = '') => {
      const q = query.trim().toLowerCase();
      const currentList = allUsers.length > 0 ? allUsers : getAllUsersSync();
      return currentList
        .filter((u) => u.id !== myId)
        .filter((u) => {
          if (!q) return true;
          const matchUsername = u.username && u.username.toLowerCase().includes(q);
          const matchName = u.name && u.name.toLowerCase().includes(q);
          const matchEmail = u.email && u.email.toLowerCase().includes(q);
          return matchUsername || matchName || matchEmail;
        });
    },
    [allUsers, myId]
  );

  const sendFriendRequest = useCallback(
    async (targetId) => {
      if (!myId) return { success: false, message: 'Você precisa estar conectado em uma conta.' };
      if (myId === targetId) return { success: false, message: 'Você não pode adicionar seu próprio perfil.' };

      // Executa lógica no dataService
      const serviceRes = await requestFriendship(myId, targetId);

      // Atualiza estrutura de compatibilidade local
      const data = loadLegacyData();
      const me = getOrInit(data, myId);
      const target = getOrInit(data, targetId);

      if (serviceRes.success) {
        if (serviceRes.message.includes('confirmada')) {
          me.receivedRequests = me.receivedRequests.filter((id) => id !== targetId);
          target.sentRequests = target.sentRequests.filter((id) => id !== myId);
          me.friends = [...new Set([...me.friends, targetId])];
          target.friends = [...new Set([...target.friends, myId])];
        } else {
          me.sentRequests = [...new Set([...me.sentRequests, targetId])];
          target.receivedRequests = [...new Set([...target.receivedRequests, myId])];
        }
        saveLegacyData(data);
        setFriendsData({ ...data });
      }

      return serviceRes;
    },
    [myId]
  );

  const cancelFriendRequest = useCallback(
    async (targetId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      await cancelOrDeleteFriendship(myId, targetId);

      const data = loadLegacyData();
      const me = getOrInit(data, myId);
      const target = getOrInit(data, targetId);

      me.sentRequests = me.sentRequests.filter((id) => id !== targetId);
      target.receivedRequests = target.receivedRequests.filter((id) => id !== myId);

      saveLegacyData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Pedido de amizade cancelado.' };
    },
    [myId]
  );

  const acceptFriendRequest = useCallback(
    async (senderId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      const data = loadLegacyData();
      const me = getOrInit(data, myId);
      const sender = getOrInit(data, senderId);

      if (!me.receivedRequests.includes(senderId)) {
        return { success: false, message: 'Pedido de amizade não encontrado.' };
      }

      me.receivedRequests = me.receivedRequests.filter((id) => id !== senderId);
      sender.sentRequests = sender.sentRequests.filter((id) => id !== myId);
      me.friends = [...new Set([...me.friends, senderId])];
      sender.friends = [...new Set([...sender.friends, myId])];

      saveLegacyData(data);
      setFriendsData({ ...data });

      // Atualiza também nas amizades relacionais
      await requestFriendship(myId, senderId);

      return { success: true, message: 'Pedido aceito! Amizade estabelecida.' };
    },
    [myId]
  );

  const declineFriendRequest = useCallback(
    async (targetId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      await cancelOrDeleteFriendship(myId, targetId);

      const data = loadLegacyData();
      const me = getOrInit(data, myId);
      const target = getOrInit(data, targetId);

      me.receivedRequests = me.receivedRequests.filter((id) => id !== targetId);
      me.sentRequests = me.sentRequests.filter((id) => id !== targetId);
      target.receivedRequests = target.receivedRequests.filter((id) => id !== myId);
      target.sentRequests = target.sentRequests.filter((id) => id !== myId);

      saveLegacyData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Pedido recusado.' };
    },
    [myId]
  );

  const removeFriend = useCallback(
    async (friendId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      await cancelOrDeleteFriendship(myId, friendId);

      const data = loadLegacyData();
      const me = getOrInit(data, myId);
      const friend = getOrInit(data, friendId);

      me.friends = me.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== myId);

      saveLegacyData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Amigo removido com sucesso.' };
    },
    [myId]
  );

  const saveUserBuild = useCallback((userId, build) => {
    if (!userId || !build) return;
    try {
      localStorage.setItem(`${USER_BUILD_PREFIX}${userId}`, JSON.stringify(build));
    } catch (e) {
      console.warn('[FriendsContext] Erro ao salvar build do usuário:', e);
    }
  }, []);

  const getUserBuild = useCallback(
    (userId) => {
      if (!userId) return null;

      try {
        const raw = localStorage.getItem(`${USER_BUILD_PREFIX}${userId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.stats) return parsed;
        }
      } catch {
        // ignora erro
      }

      if (userId === myId) {
        try {
          const rawActive = localStorage.getItem('ap:active_build');
          if (rawActive) {
            const parsed = JSON.parse(rawActive);
            if (parsed && parsed.stats) return parsed;
          }
        } catch {
          // ignora
        }
      }

      const data = loadLegacyData();
      const allBattles = [
        ...(data[myId]?.receivedBattles || []),
        ...(data[myId]?.sentBattles || []),
      ];

      for (const battle of allBattles) {
        if (battle.senderId === userId && battle.deck?.build?.stats) {
          return battle.deck.build;
        }
      }

      return null;
    },
    [myId]
  );

  const sendBattleRequest = useCallback(
    async (targetId, deckInfo, message = '') => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      if (deckInfo?.build) {
        saveUserBuild(myId, deckInfo.build);
      }

      const senderMeta = {
        name: currentUser?.username || currentUser?.name || currentUser?.email?.split('@')[0] || 'Guerreiro',
        avatar: currentUser?.avatar || null,
      };

      const res = await createBattleChallenge(myId, targetId, deckInfo, message, senderMeta);

      const data = loadLegacyData();
      const me = getOrInit(data, myId);
      const target = getOrInit(data, targetId);

      const battleRecord = {
        id: res.challenge.id,
        createdAt: res.challenge.createdAt,
        message: res.challenge.message,
        status: 'pending',
        deck: deckInfo,
        senderName: senderMeta.name,
        senderAvatar: senderMeta.avatar,
        senderId: myId,
        targetId,
      };

      me.sentBattles = [{ ...battleRecord }, ...(me.sentBattles || [])].slice(0, 30);
      target.receivedBattles = [{ ...battleRecord }, ...(target.receivedBattles || [])].slice(0, 30);

      saveLegacyData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Desafio de batalha enviado com sucesso!', battleId: res.challenge.id };
    },
    [myId, currentUser, saveUserBuild]
  );

  const cancelBattleRequest = useCallback(
    async (battleId) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      await respondChallengeStatus(battleId, 'canceled');

      const data = loadLegacyData();
      const me = getOrInit(data, myId);

      const battle = (me.sentBattles || []).find((b) => b.id === battleId);
      if (!battle) return { success: false, message: 'Desafio não encontrado.' };

      me.sentBattles = (me.sentBattles || []).filter((b) => b.id !== battleId);

      const target = getOrInit(data, battle.targetId);
      target.receivedBattles = (target.receivedBattles || []).filter((b) => b.id !== battleId);

      saveLegacyData(data);
      setFriendsData({ ...data });
      return { success: true, message: 'Desafio cancelado.' };
    },
    [myId]
  );

  const respondBattleRequest = useCallback(
    async (battleId, accept) => {
      if (!myId) return { success: false, message: 'Você precisa estar logado.' };

      const status = accept ? 'accepted' : 'declined';
      await respondChallengeStatus(battleId, status);

      const data = loadLegacyData();
      const me = getOrInit(data, myId);

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

      saveLegacyData(data);
      setFriendsData({ ...data });
      return {
        success: true,
        message: accept ? 'Desafio aceito! Redirecionando para a Arena...' : 'Desafio recusado.',
        status,
        battle: targetBattle,
      };
    },
    [myId]
  );

  const getUserById = useCallback(
    (id) => {
      const users = allUsers.length > 0 ? allUsers : getAllUsersSync();
      return users.find((u) => u.id === id) || null;
    },
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
        refreshUsersList: refreshAll,
        getSearchableUsers,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        sendBattleRequest,
        cancelBattleRequest,
        respondBattleRequest,
        getUserById,
        getUserBuild,
        saveUserBuild,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export default FriendsProvider;
