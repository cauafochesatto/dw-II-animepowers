import { useMemo } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { useAuth } from '../context/useAuth';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import { AlertTriangle } from '../components/Icons';
import '../styles/game.css';

export default function Ranking() {
  const { activeBuild, battleStats, battleHistory } = useCharacterGame();
  const { currentUser } = useAuth();

  // Constrói a tabela de classificação baseada exclusivamente no desempenho real registrado localmente
  const rankingList = useMemo(() => {
    const list = [];

    // Combatente do jogador atual
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

    // Se houver histórico de batalhas contra outros perfis/desafios salvos no dispositivo, agrega seus registros reais
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
        opponentMap[opp].losses += 1; // se o jogador venceu, o oponente perdeu
      } else {
        opponentMap[opp].wins += 1; // se o jogador perdeu, o oponente venceu
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

    // Ordenação competitiva: maior número de vitórias, depois taxa de vitória, depois total
    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.total - a.total;
    });

    return list;
  }, [activeBuild, battleStats, battleHistory, currentUser]);

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

        {/* Aviso de Transparência sobre Armazenamento Local vs Global */}
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
            neste navegador ({rankingList.length} combatentes com registros reais). Não são gerados dados falsos de
            outros jogadores. Para sincronização entre múltiplos dispositivos, será necessária uma futura integração
            com banco de dados e servidor online.
          </div>
        </div>

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
                const posBadge =
                  pos === 1 ? '🥇 1º' : pos === 2 ? '🥈 2º' : pos === 3 ? '🥉 3º' : `#${pos}`;

                return (
                  <tr
                    key={entry.id}
                    className="leaderboard-row"
                    style={
                      entry.isCurrentUser
                        ? {
                            background: 'rgba(251, 191, 36, 0.08)',
                            borderColor: 'var(--signal)',
                          }
                        : {}
                    }
                  >
                    <td className="leaderboard-rank-col">{posBadge}</td>

                    <td>
                      <div className="leaderboard-fighter-col">
                        <img
                          src={resolvePowerImage(entry.avatar)}
                          alt={entry.name}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                            {entry.name} {entry.isCurrentUser && <span style={{ color: 'var(--signal)', fontSize: '0.75rem', fontWeight: 800 }}>(VOCÊ)</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`rank-badge rank-badge--${entry.classification?.rank || 'S'}`} style={{ fontSize: '1rem', padding: '0.2rem 0.5rem' }}>
                        {entry.classification?.rank || 'S'}
                      </span>
                    </td>

                    <td style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--pos)' }}>
                      {entry.wins}
                    </td>

                    <td style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--neg)' }}>
                      {entry.losses}
                    </td>

                    <td style={{ color: 'var(--text-2)', fontWeight: 600 }}>
                      {entry.total}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--signal)' }}>
                          {entry.winRate}%
                        </span>
                        <div className="stat-meter" style={{ width: '80px' }}>
                          <div
                            className="stat-meter__fill"
                            style={{
                              width: `${entry.winRate}%`,
                              background: entry.winRate >= 50 ? 'var(--pos)' : 'var(--neg)',
                            }}
                          />
                        </div>
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

