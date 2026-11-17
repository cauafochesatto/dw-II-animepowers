import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { CharacterContext } from './characterContextInstance';
import { AuthContext } from './authContextInstance';
import {
  fetchSpinsBalance,
  consumeSpinsServer,
  migrateLocalDataToServer,
} from '../services/dataService';
import {
  CHARACTERS,
  CHARACTERS_BY_ID,
  rollRandomCharacter,
  calculateBuildClassification,
  STAT_KEYS,
} from '../data/characters';

// Gera chaves de localStorage isoladas por usuário
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

// Coleção inicial amigável para novos jogadores
const DEFAULT_INITIAL_COLLECTION = {
  tanjiro: { count: 1, firstObtained: new Date().toISOString(), lastObtained: new Date().toISOString() },
  edward: { count: 1, firstObtained: new Date().toISOString(), lastObtained: new Date().toISOString() },
  gon: { count: 1, firstObtained: new Date().toISOString(), lastObtained: new Date().toISOString() },
};

const DEFAULT_INITIAL_BUILD = {
  id: 'build_default',
  name: 'Guerreiro Estelar',
  avatarId: 'tanjiro',
  signatureMove: 'Corte Solar Incandescente',
  statSources: {
    forca: 'tanjiro',
    velocidade: 'tanjiro',
    defesa: 'edward',
    resistencia: 'gon',
    energia: 'edward',
    poderEspecial: 'edward',
  },
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
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[CharacterContext] Erro ao salvar chave ${key}:`, e);
  }
}

function CharacterProviderInner({ currentUser, children }) {
  const userId = currentUser?.id || null;

  // Chaves de localStorage isoladas por usuário (dinâmicas, geradas a partir do userId)
  const STORAGE_KEYS = React.useMemo(() => getStorageKeys(userId), [userId]);

  // Resgata dados isolados do usuário com migração transparente de dados legados apenas para a primeira conta
  const initialData = React.useMemo(() => {
    const keys = STORAGE_KEYS;
    const hasSpins = localStorage.getItem(keys.SPINS) !== null;
    const legacySpins = localStorage.getItem('ap:spins_count');
    const claimedBy = localStorage.getItem('ap:legacy_data_claimed');

    // Se o usuário já possui dados gravados na chave isolada, usa exclusivamente ela
    if (hasSpins) {
      return {
        spins: readStorage(keys.SPINS, 20),
        spinHistory: readStorage(keys.SPIN_HISTORY, []),
        collection: readStorage(keys.COLLECTION, DEFAULT_INITIAL_COLLECTION),
        activeBuild: readStorage(keys.ACTIVE_BUILD, DEFAULT_INITIAL_BUILD),
        savedBuilds: readStorage(keys.SAVED_BUILDS, [DEFAULT_INITIAL_BUILD]),
        battleHistory: readStorage(keys.BATTLE_HISTORY, []),
        battleStats: readStorage(keys.BATTLE_STATS, {
          wins: 0,
          losses: 0,
          total: 0,
          winRate: 0,
          mode1v1Wins: 0,
          mode2v2Wins: 0,
          modeGroupWins: 0,
        }),
      };
    }

    // Se é a primeira conta logada e existem dados legados globais, adota para essa conta sem apagar o original
    if (userId && legacySpins !== null && (!claimedBy || claimedBy === userId)) {
      localStorage.setItem('ap:legacy_data_claimed', userId);
      return {
        spins: readStorage('ap:spins_count', 20),
        spinHistory: readStorage('ap:spin_history', []),
        collection: readStorage('ap:characters_collection', DEFAULT_INITIAL_COLLECTION),
        activeBuild: readStorage('ap:active_build', DEFAULT_INITIAL_BUILD),
        savedBuilds: readStorage('ap:saved_builds', [DEFAULT_INITIAL_BUILD]),
        battleHistory: readStorage('ap:battle_history', []),
        battleStats: readStorage('ap:battle_stats', {
          wins: 0,
          losses: 0,
          total: 0,
          winRate: 0,
          mode1v1Wins: 0,
          mode2v2Wins: 0,
          modeGroupWins: 0,
        }),
      };
    }

    // Conta nova ou usuário convidado: estado limpo e independente
    return {
      spins: 20,
      spinHistory: [],
      collection: DEFAULT_INITIAL_COLLECTION,
      activeBuild: DEFAULT_INITIAL_BUILD,
      savedBuilds: [DEFAULT_INITIAL_BUILD],
      battleHistory: [],
      battleStats: {
        wins: 0,
        losses: 0,
        total: 0,
        winRate: 0,
        mode1v1Wins: 0,
        mode2v2Wins: 0,
        modeGroupWins: 0,
      },
    };
  }, [STORAGE_KEYS, userId]);

  // 1. Giros
  const [spins, setSpins] = useState(initialData.spins);
  const [spinHistory, setSpinHistory] = useState(initialData.spinHistory);

  // 2. Coleção
  const [collection, setCollection] = useState(initialData.collection);

  // 3. Construção Ativa & Salvas
  const [activeBuild, setActiveBuild] = useState(initialData.activeBuild);
  const [savedBuilds, setSavedBuilds] = useState(initialData.savedBuilds);

  // 4. Batalhas e Ranking
  const [battleHistory, setBattleHistory] = useState(initialData.battleHistory);
  const [battleStats, setBattleStats] = useState(initialData.battleStats);

  const migrationPayloadRef = React.useRef({
    activeBuild,
    savedBuilds,
    collection,
    spins,
    battleStats,
    battleHistory,
  });

  useEffect(() => {
    migrationPayloadRef.current = {
      activeBuild,
      savedBuilds,
      collection,
      spins,
      battleStats,
      battleHistory,
    };
  }, [activeBuild, savedBuilds, collection, spins, battleStats, battleHistory]);

  // Sincroniza saldo de giros com o Neon PostgreSQL quando o usuário estiver autenticado
  useEffect(() => {
    if (!currentUser?.id) return;

    fetchSpinsBalance(currentUser.id).then((serverSpins) => {
      if (typeof serverSpins === 'number') {
        setSpins(serverSpins);
      }
    });

    // Migração transparente dos dados locais existentes para o Neon (executada uma única vez)
    const migrationKey = `ap:neon_migrated_${currentUser.id}`;
    if (!localStorage.getItem(migrationKey)) {
      const payload = migrationPayloadRef.current;
      migrateLocalDataToServer({
        userId: currentUser.id,
        ...payload,
      }).then((res) => {
        if (res?.success) {
          localStorage.setItem(migrationKey, new Date().toISOString());
          if (typeof res.finalSpins === 'number') {
            setSpins(res.finalSpins);
          }
        }
      });
    }
  }, [currentUser?.id]);

  // Sincroniza persistência sempre que o estado muda (usando chaves isoladas por usuário)
  useEffect(() => writeStorage(STORAGE_KEYS.SPINS, spins), [STORAGE_KEYS.SPINS, spins]);
  useEffect(() => writeStorage(STORAGE_KEYS.SPIN_HISTORY, spinHistory), [STORAGE_KEYS.SPIN_HISTORY, spinHistory]);
  useEffect(() => writeStorage(STORAGE_KEYS.COLLECTION, collection), [STORAGE_KEYS.COLLECTION, collection]);
  useEffect(() => writeStorage(STORAGE_KEYS.ACTIVE_BUILD, activeBuild), [STORAGE_KEYS.ACTIVE_BUILD, activeBuild]);
  useEffect(() => writeStorage(STORAGE_KEYS.SAVED_BUILDS, savedBuilds), [STORAGE_KEYS.SAVED_BUILDS, savedBuilds]);
  useEffect(() => writeStorage(STORAGE_KEYS.BATTLE_HISTORY, battleHistory), [STORAGE_KEYS.BATTLE_HISTORY, battleHistory]);
  useEffect(() => writeStorage(STORAGE_KEYS.BATTLE_STATS, battleStats), [STORAGE_KEYS.BATTLE_STATS, battleStats]);

  // Lista expandida de personagens da coleção do jogador com detalhes
  const ownedCharacters = useMemo(() => {
    return Object.entries(collection)
      .map(([charId, data]) => {
        const char = CHARACTERS_BY_ID[charId];
        if (!char) return null;
        return {
          ...char,
          copies: data.count,
          firstObtained: data.firstObtained,
          lastObtained: data.lastObtained,
        };
      })
      .filter(Boolean);
  }, [collection]);

  // Calcula os valores concretos da construção ativa atual
  const resolvedActiveBuild = useMemo(() => {
    const statSources = activeBuild?.statSources || {};
    const stats = {};
    const sources = {};

    STAT_KEYS.forEach(({ key }) => {
      const charId = statSources[key];
      const char = CHARACTERS_BY_ID[charId] || ownedCharacters[0] || CHARACTERS[0];
      stats[key] = char[key];
      sources[key] = char;
    });

    const avatarChar = CHARACTERS_BY_ID[activeBuild.avatarId] || sources.forca || CHARACTERS[0];
    const classification = calculateBuildClassification(stats);

    return {
      ...activeBuild,
      stats,
      sources,
      avatar: avatarChar.imagem,
      avatarChar,
      classification,
    };
  }, [activeBuild, ownedCharacters]);

  /**
   * Realiza 1 ou múltiplos giros.
   */
  const executeSpin = useCallback((count = 1) => {
    if (spins < count) {
      return {
        success: false,
        message: `Giros insuficientes. Você tem ${spins} giros disponíveis.`,
        pulled: [],
      };
    }

    const pulled = [];
    const newCollection = { ...collection };
    const newHistoryEntries = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < count; i++) {
      const char = rollRandomCharacter();
      pulled.push(char);

      // Adiciona na coleção preservando contagem de cópias
      if (newCollection[char.id]) {
        newCollection[char.id] = {
          ...newCollection[char.id],
          count: newCollection[char.id].count + 1,
          lastObtained: nowIso,
        };
      } else {
        newCollection[char.id] = {
          count: 1,
          firstObtained: nowIso,
          lastObtained: nowIso,
        };
      }

      newHistoryEntries.unshift({
        id: `spin_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
        characterId: char.id,
        characterName: char.nome,
        anime: char.anime,
        raridade: char.raridade,
        imagem: char.imagem,
        date: nowIso,
      });
    }

    setSpins((prev) => Math.max(0, prev - count));
    setCollection(newCollection);
    setSpinHistory((prev) => [...newHistoryEntries, ...prev].slice(0, 50));

    // Consome saldo no servidor Neon se autenticado
    if (currentUser?.id) {
      consumeSpinsServer(currentUser.id, count).catch(() => {});
    }

    return {
      success: true,
      message: `Você realizou ${count} giro(s) com sucesso!`,
      pulled,
    };
  }, [spins, collection, currentUser]);

  /**
   * Atualiza e valida a construção do jogador.
   * Regras:
   * - Não permite personagens que não estejam na coleção.
   * - Atributos sempre vêm diretamente do personagem original.
   */
  const updateActiveBuild = useCallback(
    (newBuildData) => {
      const statSources = { ...(activeBuild.statSources || {}), ...(newBuildData.statSources || {}) };

      // Validação estrita: cada charId precisa estar na coleção do jogador
      for (const { key } of STAT_KEYS) {
        const charId = statSources[key];
        if (!collection[charId]) {
          return {
            success: false,
            message: `O personagem selecionado para ${key} não está na sua coleção!`,
          };
        }
      }

      const updated = {
        ...activeBuild,
        ...newBuildData,
        statSources,
        updatedAt: new Date().toISOString(),
      };

      setActiveBuild(updated);

      // Atualiza também na lista de salvos se coincidir o ID
      setSavedBuilds((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b))
      );

      return {
        success: true,
        message: 'Construção atualizada com sucesso!',
        build: updated,
      };
    },
    [activeBuild, collection]
  );

  /**
   * Salva a construção atual como uma predefinição nomeada.
   */
  const saveBuildPreset = useCallback(
    (customName) => {
      const presetId = `preset_${Date.now()}`;
      const newPreset = {
        ...activeBuild,
        id: presetId,
        name: customName || activeBuild.name || 'Nova Construção',
        savedAt: new Date().toISOString(),
      };

      setSavedBuilds((prev) => [newPreset, ...prev].slice(0, 10));
      setActiveBuild(newPreset);
      return { success: true, message: 'Predefinição de construção salva com sucesso!' };
    },
    [activeBuild]
  );

  /**
   * Carrega uma predefinição de construção salva.
   */
  const loadBuildPreset = useCallback(
    (presetId) => {
      const found = savedBuilds.find((b) => b.id === presetId);
      if (!found) return { success: false, message: 'Construção não encontrada.' };
      setActiveBuild(found);
      return { success: true, message: `Construção "${found.name}" carregada!` };
    },
    [savedBuilds]
  );

  /**
   * Sincroniza o saldo local de giros com o valor confirmado pelo servidor Neon.
   * Deve ser chamado APENAS com o `newBalance` real retornado pela API.
   * NÃO soma nem subtrai: substitui pelo valor autoritativo do servidor.
   */
  const syncSpinsFromServer = useCallback((serverBalance) => {
    const qty = parseInt(serverBalance, 10);
    if (isNaN(qty) || qty < 0) return;
    setSpins(qty);
  }, []);

  /**
   * Registra resultado de batalha no histórico e atualiza estatísticas competitivas.
   * IMPORTANTE: NÃO credita giros automaticamente via spinsAwarded para evitar
   * dupla concessão. O crédito de giros de torneio é feito via syncSpinsFromServer
   * diretamente após confirmação da API. Arena não concede giros (regra da economia).
   */
  const recordBattleResult = useCallback((battleResult) => {
    const isWin = battleResult.isPlayerWinner;
    const mode = battleResult.mode;

    const historyRecord = {
      id: `bat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mode,
      date: battleResult.date || new Date().toISOString(),
      result: isWin ? 'Vitória' : 'Derrota',
      isWin,
      playerPlacement: battleResult.playerPlacement ?? (isWin ? 1 : 2),
      totalRounds: battleResult.totalRounds,
      opponentName:
        battleResult.opponentName ||
        battleResult.loser?.name ||
        battleResult.winner?.name ||
        (mode === '2v2' ? 'Equipe Adversária' : 'Arena de Grupo'),
      opponentAvatar:
        battleResult.opponentAvatar ||
        battleResult.loser?.avatar ||
        battleResult.winner?.avatar ||
        '/poderesanime/imagenspoderes/kamehamenha.jpg',
      playerBuildSnapshot: {
        name: resolvedActiveBuild.name,
        avatar: resolvedActiveBuild.avatar,
        classification: resolvedActiveBuild.classification,
        stats: resolvedActiveBuild.stats,
      },
    };

    setBattleHistory((prev) => [historyRecord, ...prev].slice(0, 50));

    // Giros NÃO são creditados via recordBattleResult.
    // Recompensas de torneio usam syncSpinsFromServer (saldo confirmado pelo Neon).
    // Arena não concede giros (Regra da Economia).

    setBattleStats((prev) => {
      const wins = prev.wins + (isWin ? 1 : 0);
      const losses = prev.losses + (isWin ? 0 : 1);
      const total = wins + losses;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

      return {
        wins,
        losses,
        total,
        winRate,
        mode1v1Wins: prev.mode1v1Wins + (isWin && mode === '1v1' ? 1 : 0),
        mode2v2Wins: prev.mode2v2Wins + (isWin && mode === '2v2' ? 1 : 0),
        modeGroupWins: prev.modeGroupWins + (isWin && mode === 'Grupo' ? 1 : 0),
      };
    });
  }, [resolvedActiveBuild]);

  const value = {
    spins,
    spinHistory,
    collection,
    ownedCharacters,
    activeBuild: resolvedActiveBuild,
    savedBuilds,
    battleHistory,
    battleStats,
    executeSpin,
    syncSpinsFromServer,
    updateActiveBuild,
    saveBuildPreset,
    loadBuildPreset,
    recordBattleResult,
  };

  return (
    <CharacterContext.Provider value={value}>
      {children}
    </CharacterContext.Provider>
  );
}

export function CharacterProvider({ children }) {
  const auth = useContext(AuthContext);
  const currentUser = auth?.currentUser || null;
  const userKey = currentUser?.id ? `user_${currentUser.id}` : 'guest';

  return (
    <CharacterProviderInner key={userKey} currentUser={currentUser}>
      {children}
    </CharacterProviderInner>
  );
}

export default CharacterProvider;

