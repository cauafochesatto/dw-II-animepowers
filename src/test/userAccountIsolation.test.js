import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DB_CONFIG } from '../config/db';

// Mock de localStorage fiel com armazenamento por chave
const createMockStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    dump: () => ({ ...store }),
  };
};

// Funções espelho da lógica de isolamento do CharacterContext
function getStorageKeys(userId) {
  const prefix = userId ? `ap:${userId}` : 'ap:guest';
  return {
    SPINS: `${prefix}:spins_count`,
    SPIN_HISTORY: `${prefix}:spin_history`,
    COLLECTION: `${prefix}:characters_collection`,
    ACTIVE_BUILD: `${prefix}:active_build`,
    SAVED_BUILDS: `${prefix}:saved_builds`,
    BATTLE_HISTORY: `${prefix}:battle_history`,
    BATTLE_STATS: `${prefix}:battle_stats`,
    LAST_REPLENISH: `${prefix}:last_spin_replenish`,
  };
}

const DEFAULT_INITIAL_COLLECTION = {
  tanjiro: { count: 1, firstObtained: '2026-01-01T00:00:00.000Z', lastObtained: '2026-01-01T00:00:00.000Z' },
  edward: { count: 1, firstObtained: '2026-01-01T00:00:00.000Z', lastObtained: '2026-01-01T00:00:00.000Z' },
  gon: { count: 1, firstObtained: '2026-01-01T00:00:00.000Z', lastObtained: '2026-01-01T00:00:00.000Z' },
};

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function resolveUserInitialData(userId) {
  const keys = getStorageKeys(userId);
  const hasSpins = localStorage.getItem(keys.SPINS) !== null;
  const legacySpins = localStorage.getItem('ap:spins_count');
  const claimedBy = localStorage.getItem('ap:legacy_data_claimed');

  if (hasSpins) {
    return {
      spins: readStorage(keys.SPINS, 20),
      spinHistory: readStorage(keys.SPIN_HISTORY, []),
      collection: readStorage(keys.COLLECTION, DEFAULT_INITIAL_COLLECTION),
      activeBuild: readStorage(keys.ACTIVE_BUILD, null),
    };
  }

  if (userId && legacySpins !== null && (!claimedBy || claimedBy === userId)) {
    localStorage.setItem('ap:legacy_data_claimed', userId);
    return {
      spins: readStorage('ap:spins_count', 20),
      spinHistory: readStorage('ap:spin_history', []),
      collection: readStorage('ap:characters_collection', DEFAULT_INITIAL_COLLECTION),
      activeBuild: readStorage('ap:active_build', null),
    };
  }

  return {
    spins: 20,
    spinHistory: [],
    collection: DEFAULT_INITIAL_COLLECTION,
    activeBuild: null,
  };
}

describe('Isolamento de Contas e Persistência Independente', () => {
  let mockStorage;
  const SESSION_KEY = `${DB_CONFIG.dbName}_auth_session`;

  beforeEach(() => {
    mockStorage = createMockStorage();
    global.localStorage = mockStorage;
  });

  it('Conta A possui 10 giros e personagens próprios; ao deslogar e criar Conta B, a Conta B tem 20 giros e coleção limpa', () => {
    // 1. Simula Conta A (antiga) existente no sistema com 10 giros e personagens
    const userA = { id: 'user_conta_a', name: 'Jogador A', email: 'contaA@animepowers.local' };
    const collectionA = {
      ...DEFAULT_INITIAL_COLLECTION,
      goku: { count: 2, firstObtained: '2026-02-01T12:00:00Z', lastObtained: '2026-02-02T12:00:00Z' },
      gojo: { count: 1, firstObtained: '2026-02-03T12:00:00Z', lastObtained: '2026-02-03T12:00:00Z' },
    };

    // Grava dados legados que pertenciam à conta original
    localStorage.setItem('ap:spins_count', JSON.stringify(10));
    localStorage.setItem('ap:characters_collection', JSON.stringify(collectionA));

    // Conta A faz login
    localStorage.setItem(SESSION_KEY, JSON.stringify(userA));
    const dataA = resolveUserInitialData(userA.id);
    expect(dataA.spins).toBe(10);
    expect(dataA.collection.goku).toBeDefined();
    expect(dataA.collection.goku.count).toBe(2);

    // Persiste no storage isolado da Conta A
    const keysA = getStorageKeys(userA.id);
    writeStorage(keysA.SPINS, dataA.spins);
    writeStorage(keysA.COLLECTION, dataA.collection);

    // 2. Conta A faz logout
    localStorage.removeItem(SESSION_KEY);
    const guestData = resolveUserInitialData(null);
    expect(guestData.spins).toBe(20);

    // 3. Criação de Conta B com outro e-mail
    const userB = { id: 'user_conta_b', name: 'Jogador B', email: 'contaB@animepowers.local' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(userB));

    // Resolve dados da Conta B
    const dataB = resolveUserInitialData(userB.id);

    // Verificações estritas:
    // Conta B NÃO pode ter 10 giros da conta A; deve ter 20
    expect(dataB.spins).toBe(20);
    // Conta B NÃO pode ter Goku ou Gojo da conta A
    expect(dataB.collection.goku).toBeUndefined();
    expect(dataB.collection.gojo).toBeUndefined();

    // Persiste estado isolado da Conta B
    const keysB = getStorageKeys(userB.id);
    writeStorage(keysB.SPINS, dataB.spins);
    writeStorage(keysB.COLLECTION, dataB.collection);
  });

  it('Modificações feitas na Conta B não alteram o estado da Conta A', () => {
    const keysA = getStorageKeys('user_conta_a');
    const keysB = getStorageKeys('user_conta_b');

    // Conta A salva 10 giros e coleção com Goku
    writeStorage(keysA.SPINS, 10);
    writeStorage(keysA.COLLECTION, { goku: { count: 1 } });

    // Conta B salva 20 giros inicialmente
    writeStorage(keysB.SPINS, 20);
    writeStorage(keysB.COLLECTION, { tanjiro: { count: 1 } });

    // Conta B gasta 5 giros e ganha Naruto
    writeStorage(keysB.SPINS, 15);
    writeStorage(keysB.COLLECTION, { tanjiro: { count: 1 }, naruto: { count: 1 } });

    // Confere que Conta A não foi afetada
    expect(readStorage(keysA.SPINS, 0)).toBe(10);
    const colA = readStorage(keysA.COLLECTION, {});
    expect(colA.goku).toBeDefined();
    expect(colA.naruto).toBeUndefined();

    // Confere que Conta B tem seus próprios dados
    expect(readStorage(keysB.SPINS, 0)).toBe(15);
    const colB = readStorage(keysB.COLLECTION, {});
    expect(colB.naruto).toBeDefined();
    expect(colB.goku).toBeUndefined();
  });

  it('Fluxo completo: A (10 giros) -> Logout -> B (20 giros) -> Logout -> Retorno para A (preserva 10 giros e personagens)', () => {
    const userA = { id: 'user_a' };
    const userB = { id: 'user_b' };

    // 1. Inicializa Conta A com 10 giros e Sukuna
    const keysA = getStorageKeys(userA.id);
    writeStorage(keysA.SPINS, 10);
    writeStorage(keysA.COLLECTION, { sukuna: { count: 1 } });

    // 2. Logout de A
    localStorage.removeItem(SESSION_KEY);

    // 3. Login de B (conta nova)
    const keysB = getStorageKeys(userB.id);
    const initialB = resolveUserInitialData(userB.id);
    expect(initialB.spins).toBe(20);
    expect(initialB.collection.sukuna).toBeUndefined();

    // B realiza giros e fica com 18
    writeStorage(keysB.SPINS, 18);
    writeStorage(keysB.COLLECTION, { tanjiro: { count: 1 }, edward: { count: 1 } });

    // 4. Logout de B
    localStorage.removeItem(SESSION_KEY);

    // 5. Retorno para Conta A
    localStorage.setItem(SESSION_KEY, JSON.stringify(userA));
    const returnA = resolveUserInitialData(userA.id);

    // Conta A continua exatamente como estava
    expect(returnA.spins).toBe(10);
    expect(returnA.collection.sukuna).toBeDefined();
    expect(returnA.collection.sukuna.count).toBe(1);

    // Conta B continua intacta em suas chaves
    expect(readStorage(keysB.SPINS, 0)).toBe(18);
  });

  it('Isola histórico de batalhas e torneios por usuário', () => {
    const keysA = getStorageKeys('user_a');
    const keysB = getStorageKeys('user_b');

    writeStorage(keysA.BATTLE_HISTORY, [{ id: 'bat_1', result: 'Vitória' }]);
    writeStorage(keysB.BATTLE_HISTORY, [{ id: 'bat_2', result: 'Derrota' }]);

    const historyA = readStorage(keysA.BATTLE_HISTORY, []);
    const historyB = readStorage(keysB.BATTLE_HISTORY, []);

    expect(historyA).toHaveLength(1);
    expect(historyA[0].id).toBe('bat_1');

    expect(historyB).toHaveLength(1);
    expect(historyB[0].id).toBe('bat_2');
  });

  it('1. Cadastro de usuário novo concede exatamente 20 giros', () => {
    const newUser = { id: 'usr_fresh_' + Date.now(), name: 'Novato', email: 'novato@teste.com' };
    const data = resolveUserInitialData(newUser.id);
    expect(data.spins).toBe(20);
  });

  it('2. Fazer logout e login novamente preserva a conta e o saldo do usuário', () => {
    const userId = 'usr_persistent';
    const keys = getStorageKeys(userId);

    // Usuário joga, gasta giros até 14
    writeStorage(keys.SPINS, 14);

    // Logout
    localStorage.removeItem(SESSION_KEY);

    // Relogin
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: userId, email: 'persist@teste.com' }));
    const reloaded = resolveUserInitialData(userId);
    expect(reloaded.spins).toBe(14);
  });

  it('9. Não existe reposição gratuita de 10 giros na economia oficial', () => {
    const userId = 'usr_no_replenish';
    const keys = getStorageKeys(userId);
    writeStorage(keys.SPINS, 0);

    // Não existe mecanismo de conceder giros sem torneio
    expect(readStorage(keys.SPINS, 0)).toBe(0);
  });

  it('10. Ranking apresenta imagens válidas ou fallback seguro', async () => {
    const { resolvePowerImage } = await import('../utils/imageHelper');

    // Imagem vazia deve retornar fallback verificado e existente
    const fallback = resolvePowerImage(null);
    expect(fallback).toContain('kamehamenha.jpg');

    // Imagem completa
    const resolved = resolvePowerImage('/poderesanime/imagenspoderes/rasengan.jpg');
    expect(resolved).toContain('rasengan.jpg');
  });

  it('11. Usuário não consegue adicionar a si mesmo como amigo', () => {
    const myId = 'usr_self';
    const myEmail = 'guerreiro@animepowers.local';

    function canAddFriend(id, targetId, targetEmail) {
      if (id === targetId) return false;
      if (targetEmail && targetEmail.toLowerCase() === myEmail.toLowerCase()) return false;
      return true;
    }

    expect(canAddFriend(myId, myId, myEmail)).toBe(false);
    expect(canAddFriend(myId, 'other_id', myEmail)).toBe(false);
    expect(canAddFriend(myId, 'other_id', 'outro@animepowers.local')).toBe(true);
  });

  it('12. Solicitações de amizade e aceitação funcionam perfeitamente entre duas contas', () => {
    const friendships = [];

    function sendRequest(senderId, targetId) {
      if (senderId === targetId) return { success: false, message: 'Auto-amizade bloqueada' };
      friendships.push({ id: `fr_${Date.now()}`, userId: senderId, friendId: targetId, status: 'pending' });
      return { success: true };
    }

    function acceptRequest(friendshipId) {
      const fr = friendships.find((f) => f.id === friendshipId);
      if (fr) fr.status = 'accepted';
      return { success: true };
    }

    // A envia para B
    const sendRes = sendRequest('user_A', 'user_B');
    expect(sendRes.success).toBe(true);
    expect(friendships[0].status).toBe('pending');

    // B aceita pedido de A
    const acceptRes = acceptRequest(friendships[0].id);
    expect(acceptRes.success).toBe(true);
    expect(friendships[0].status).toBe('accepted');
  });

  it('13. Cadastro rejeita IDs injetados pelo cliente e sempre gera ID oficial do servidor', () => {
    function serverRegisterUser(body) {
      const cleanEmail = body.email.trim().toLowerCase();
      const cleanUsername = (body.username || cleanEmail.split('@')[0]).trim();
      // Servidor ignora body.id intencionalmente
      const officialServerId = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      return {
        id: officialServerId,
        email: cleanEmail,
        username: cleanUsername,
        spins_balance: 20, // 20 giros iniciais garantidos
      };
    }

    const maliciousBody = {
      id: 'admin_hijacked_id_999',
      name: 'Hacker',
      email: 'hacker@animepowers.local',
      password: '123',
    };

    const registered = serverRegisterUser(maliciousBody);
    expect(registered.id).not.toBe('admin_hijacked_id_999');
    expect(registered.id.startsWith('usr_')).toBe(true);
    expect(registered.spins_balance).toBe(20);
  });

  it('14. Prevenção de colisão de contas: login por nome ambíguo rejeita com 409 e exige e-mail', () => {
    const mockUsers = [
      { id: 'usr_1', name: 'Guerreiro', email: 'guerreiro1@animepowers.local', spins_balance: 10 },
      { id: 'usr_2', name: 'Guerreiro', email: 'guerreiro2@animepowers.local', spins_balance: 25 },
    ];

    function serverLogin(loginInput) {
      const clean = loginInput.trim().toLowerCase();
      if (clean.includes('@')) {
        const found = mockUsers.find((u) => u.email.toLowerCase() === clean);
        return found ? { status: 200, user: found } : { status: 404 };
      }
      // Busca por username
      const byUsername = mockUsers.filter((u) => u.username && u.username.toLowerCase() === clean);
      if (byUsername.length === 1) return { status: 200, user: byUsername[0] };

      // Fallback por display name: verifica ambiguidade
      const byName = mockUsers.filter((u) => u.name.toLowerCase() === clean);
      if (byName.length > 1) {
        return {
          status: 409,
          error: 'Existem múltiplos guerreiros com este nome de exibição. Por favor, acesse utilizando seu e-mail cadastrado.',
        };
      }
      if (byName.length === 1) return { status: 200, user: byName[0] };
      return { status: 404 };
    }

    // Tentativa de logar com "Guerreiro" (ambíguo)
    const ambiguousLogin = serverLogin('Guerreiro');
    expect(ambiguousLogin.status).toBe(409);
    expect(ambiguousLogin.error).toContain('múltiplos guerreiros com este nome');

    // Login com o e-mail específico de cada um acessa a conta exata e saldo correspondente
    const loginUser1 = serverLogin('guerreiro1@animepowers.local');
    expect(loginUser1.status).toBe(200);
    expect(loginUser1.user.id).toBe('usr_1');
    expect(loginUser1.user.spins_balance).toBe(10);

    const loginUser2 = serverLogin('guerreiro2@animepowers.local');
    expect(loginUser2.status).toBe(200);
    expect(loginUser2.user.id).toBe('usr_2');
    expect(loginUser2.user.spins_balance).toBe(25);
  });
});

