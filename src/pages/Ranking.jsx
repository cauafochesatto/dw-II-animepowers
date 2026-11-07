import { useState, useEffect, useMemo } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { useAuth } from '../context/useAuth';
import { resolvePowerImage } from '../utils/imageHelper';
import { CHARACTERS } from '../data/characters';
import GameSubNav from '../components/GameSubNav';
import { AlertTriangle } from '../components/Icons';
import { fetchRankingOnline } from '../services/dataService';
import '../styles/game.css';

function resolveRankingAvatar(entry) {
  if (entry?.avatar && typeof entry.avatar === 'string' && entry.avatar.trim()) {
    return resolvePowerImage(entry.avatar);
  }
  // Se o nome do combatente incluir o nome de algum personagem oficial
  const nameLower = (entry?.name || '').toLowerCase();
  const matched = CHARACTERS.find((c) =>
    nameLower.includes(c.nome.toLowerCase()) || nameLower.includes(c.id.toLowerCase())
  );
  if (matched?.imagem) {
    return resolvePowerImage(matched.imagem);
  }
  return resolvePowerImage('/imagenspoderes/kamehamenha.jpg');
}

export default function Ranking() {
  const { activeBuild, battleStats, battleHistory } = useCharacterGame();
  const { currentUser } = useAuth();

  const [onlineData, setOnlineData] = useState(null);

  // Consulta o ranking global em tempo real no Neon PostgreSQL
  useEffect(() => {
    let isMounted = true;
    fetchRankingOnline()
      .then((res) => {
        if (isMounted) {
          if (res?.isOnline && Array.isArray(res.ranking) && res.ranking.length > 0) {
            setOnlineData(res.ranking);
          } else {
            setOnlineData(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setOnlineData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Constrói a tabela local como fallback se o servidor ainda não estiver respondendo
  const localRankingList = useMemo(() => {
    const list = [];

    const playerName = currentUser?.name || activeBuild.name || 'Jogador Local';
    const total = battleStats.total || 0;
    const wins = battleStats.wins || 0;
    const losses = battleStats.losses || 0;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    list.push({
      id: 'current_player',
      name: playerName,
      avatar: activeBuild.avatar,
      classification: activeBuild.classification,
      wins,
      losses,
      total,
      winRate,
      isCurrentUser: true,
    });

    const opponentMap = {};
    battleHistory.forEach((h) => {
      const opp = h.opponentName;
      if (!opp) return;
      if (!opponentMap[opp]) {
        opponentMap[opp] = {
          name: opp,
          avatar: h.opponentAvatar || '/poderesanime/imagenspoderes/kamehamenha.jpg',
          classification: { rank: 'A', color: '#a855f7' },
          wins: 0,
          losses: 0,
          total: 0,
        };
      }
      opponentMap[opp].total += 1;
      if (h.isWin) {
        opponentMap[opp].losses += 1;
      } else {
        opponentMap[opp].wins += 1;
      }
    });

    Object.values(opponentMap).forEach((opp) => {
      const oppWinRate = opp.total > 0 ? Math.round((opp.wins / opp.total) * 100) : 0;
      list.push({
        id: `opp_${opp.name}`,
        name: opp.name,
        avatar: opp.avatar,
        classification: opp.classification,
        wins: opp.wins,
        losses: opp.losses,
        total: opp.total,
        winRate: oppWinRate,
        isCurrentUser: false,
      });
    });

    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.total - a.total;
    });

    return list;
  }, [activeBuild, battleStats, battleHistory, currentUser]);

  const isServerSynced = Boolean(onlineData && onlineData.length > 0);
  const rankingList = isServerSynced ? onlineData : localRankingList;

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 06 — Tabela de Líderes</p>
          <h1 className="display d-xl">Ranking Competitivo</h1>
          <p className="page-head__lede">
            Classificação baseada estritamente no desempenho dos combatentes e histórico de confrontos disputados.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {/* Status de Infraestrutura: Online Sincronizado vs Aviso Local */}
        {isServerSynced ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.8rem',
              padding: '1rem 1.2rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--r-md)',
              marginBottom: '2rem',
              fontSize: '0.88rem',
              color: '#6ee7b7',
              lineHeight: 1.5,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px #10b981',
                flexShrink: 0,
              }}
            />
            <div>
              <strong>Ranking Global Sincronizado (Neon PostgreSQL):</strong> Exibindo {rankingList.length} combatentes
              reais salvos no servidor e compartilhados entre todos os jogadores e dispositivos.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.8rem',
              padding: '1rem 1.2rem',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: 'var(--r-md)',
              marginBottom: '2rem',
              fontSize: '0.88rem',
              color: '#fef08a',
              lineHeight: 1.5,
            }}
          >
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#facc15' }} />
            <div>
              <strong>Aviso de Infraestrutura Local:</strong> Este ranking reflete os dados armazenados localmente
              neste navegador ({localRankingList.length} combatentes com registros reais). Não são gerados dados falsos de
              outros jogadores. Para sincronização entre múltiplos dispositivos, conecte a API Neon Functions.
            </div>
          </div>
        )}

        {/* Tabela do Ranking */}
        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Pos.</th>
                <th>Combatente & Construção</th>
                <th>Rank</th>
                <th>Vitórias</th>
                <th>Derrotas</th>
                <th>Total</th>
                <th>Taxa de Vitória</th>
              </tr>
            </thead>
            <tbody>
              {rankingList.map((entry, index) => {
                const pos = index + 1;
                const isFirst = pos === 1;
                const isSecond = pos === 2;
                const isThird = pos === 3;
                const isMe = entry.id === currentUser?.id || entry.isCurrentUser;

                return (
                  <tr key={entry.id} className={isMe ? 'is-current-user' : ''}>
                    <td className="pos-col">
                      <span
                        className={`pos-badge ${
                          isFirst ? 'pos-1' : isSecond ? 'pos-2' : isThird ? 'pos-3' : ''
                        }`}
                      >
                        {isFirst ? '🥇 ' : isSecond ? '🥈 ' : isThird ? '🥉 ' : ''}#{pos}
                      </span>
                    </td>
                    <td>
                      <div className="fighter-cell">
                        <img
                          src={resolveRankingAvatar(entry)}
                          alt={entry.name}
                          className="fighter-cell__avatar"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = resolvePowerImage('/imagenspoderes/kamehamenha.jpg');
                          }}
                        />
                        <div>
                          <div className="fighter-cell__name">
                            {entry.name}
                            {isMe && <span className="you-pill">Você</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`rarity-pill rarity-pill--${entry.classification?.rank || 'A'}`}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      >
                        Rank {entry.classification?.rank || 'A'}
                      </span>
                    </td>
                    <td className="stat-highlight stat-win">{entry.wins}</td>
                    <td className="stat-highlight stat-loss">{entry.losses}</td>
                    <td>{entry.total}</td>
                    <td>
                      <div className="winrate-bar-shell">
                        <div className="winrate-track">
                          <div
                            className="winrate-fill"
                            style={{ width: `${Math.min(100, Math.max(0, entry.winRate))}%` }}
                          />
                        </div>
                        <span className="winrate-text">{entry.winRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
