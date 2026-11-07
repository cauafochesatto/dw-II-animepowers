import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CharacterContext } from './characterContextInstance';
import { useAuth } from './useAuth';
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

const STORAGE_KEYS = {
  SPINS: 'ap:spins_count',
  SPIN_HISTORY: 'ap:spin_history',
  COLLECTION: 'ap:characters_collection',
  ACTIVE_BUILD: 'ap:active_build',
  SAVED_BUILDS: 'ap:saved_builds',
  BATTLE_HISTORY: 'ap:battle_history',
  BATTLE_STATS: 'ap:battle_stats',
  LAST_REPLENISH: 'ap:last_spin_replenish',
};

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

export function CharacterProvider({ children }) {
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  // 1. Giros
  const [spins, setSpins] = useState(() => readStorage(STORAGE_KEYS.SPINS, 20));
  const [spinHistory, setSpinHistory] = useState(() => readStorage(STORAGE_KEYS.SPIN_HISTORY, []));

  // 2. Coleção
  const [collection, setCollection] = useState(() =>
    readStorage(STORAGE_KEYS.COLLECTION, DEFAULT_INITIAL_COLLECTION)
  );

  // 3. Construção Ativa & Salvas
  const [activeBuild, setActiveBuild] = useState(() =>
    readStorage(STORAGE_KEYS.ACTIVE_BUILD, DEFAULT_INITIAL_BUILD)
  );
  const [savedBuilds, setSavedBuilds] = useState(() =>
    readStorage(STORAGE_KEYS.SAVED_BUILDS, [DEFAULT_INITIAL_BUILD])
  );

  // 4. Batalhas e Ranking
  const [battleHistory, setBattleHistory] = useState(() =>
    readStorage(STORAGE_KEYS.BATTLE_HISTORY, [])
  );
  const [battleStats, setBattleStats] = useState(() =>
    readStorage(STORAGE_KEYS.BATTLE_STATS, {
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0,
      mode1v1Wins: 0,
      mode2v2Wins: 0,
      modeGroupWins: 0,
    })
  );

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

  // Sincroniza persistência sempre que o estado muda
  useEffect(() => writeStorage(STORAGE_KEYS.SPINS, spins), [spins]);
  useEffect(() => writeStorage(STORAGE_KEYS.SPIN_HISTORY, spinHistory), [spinHistory]);
  useEffect(() => writeStorage(STORAGE_KEYS.COLLECTION, collection), [collection]);
  useEffect(() => writeStorage(STORAGE_KEYS.ACTIVE_BUILD, activeBuild), [activeBuild]);
  useEffect(() => writeStorage(STORAGE_KEYS.SAVED_BUILDS, savedBuilds), [savedBuilds]);
  useEffect(() => writeStorage(STORAGE_KEYS.BATTLE_HISTORY, battleHistory), [battleHistory]);
  useEffect(() => writeStorage(STORAGE_KEYS.BATTLE_STATS, battleStats), [battleStats]);

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
   * Reposição gratuita de giros (sem moedas, sem pagamentos).
   */
  const replenishSpins = useCallback((amount = 10) => {
    setSpins((prev) => prev + amount);
    localStorage.setItem(STORAGE_KEYS.LAST_REPLENISH, new Date().toISOString());
    return {
      success: true,
      message: `Você recebeu +${amount} giros de recarga gratuita!`,
    };
  }, []);

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
   * Registra resultado de batalha no histórico e atualiza estatísticas competitivas.
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
        battleResult.loser?.name ||
        battleResult.winner?.name ||
        (mode === '2v2' ? 'Equipe Adversária' : 'Arena de Grupo'),
      opponentAvatar:
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

    // Se a batalha concedeu recompensa oficial em giros, credita ao saldo
    if (battleResult.spinsAwarded && battleResult.spinsAwarded > 0) {
      setSpins((prev) => prev + battleResult.spinsAwarded);
    }

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
    replenishSpins,
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

export default CharacterProvider;

