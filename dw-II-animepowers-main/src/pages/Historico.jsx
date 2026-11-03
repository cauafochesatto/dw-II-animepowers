import { useState } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import { Close } from '../components/Icons';
import '../styles/game.css';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Historico() {
  const { battleHistory } = useCharacterGame();
  const [selectedMatch, setSelectedMatch] = useState(null);

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 07 — Registro de Confrontos</p>
          <h1 className="display d-xl">Histórico de Batalhas</h1>
          <p className="page-head__lede">
            Consulte o registro cronológico de todas as partidas disputadas na Arena, incluindo o adversário,
            a construção utilizada, os atributos envolvidos e o resultado final.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {battleHistory.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--surface-1)',
              border: '1px dashed var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--muted)',
            }}
          >
            Nenhuma batalha registrada no histórico ainda. Vá até a <strong>Arena</strong> e dispute seu primeiro confronto!
          </div>
        ) : (
          <div>
            {battleHistory.map((match) => {
              const isWin = match.isWin;
              return (
                <div
                  key={match.id}
                  className={`history-card ${isWin ? 'history-card--win' : 'history-card--loss'}`}
                  onClick={() => setSelectedMatch(match)}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.4rem',
                        color: isWin ? 'var(--pos)' : 'var(--neg)',
                        minWidth: '90px',
                      }}
                    >
                      {isWin ? 'VITÓRIA' : 'DERROTA'}
                    </span>

                    <span className="rarity-pill rarity-pill--Incomum">
                      Modo {match.mode}
                    </span>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                        vs {match.opponentName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {formatDate(match.date)} · {match.totalRounds || 5} rodadas
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {match.playerBuildSnapshot && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <img
                          src={resolvePowerImage(match.playerBuildSnapshot.avatar)}
                          alt={match.playerBuildSnapshot.name}
                          style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                            {match.playerBuildSnapshot.name}
                          </div>
                          <span
                            className={`rank-badge rank-badge--${match.playerBuildSnapshot.classification?.rank || 'S'}`}
                            style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem' }}
                          >
                            {match.playerBuildSnapshot.classification?.rank || 'S'}
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-slot-change"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMatch(match);
                      }}
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Partida */}
      {selectedMatch && (
        <div className="reveal-modal" onClick={() => setSelectedMatch(null)}>
          <div className="reveal-modal__content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedMatch(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              <Close size={24} />
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Relatório da Partida #{selectedMatch.id.slice(-6)}
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Disputada em {formatDate(selectedMatch.date)} · Modo {selectedMatch.mode}
            </p>

            <div
              style={{
                background: selectedMatch.isWin ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${selectedMatch.isWin ? 'var(--pos)' : 'var(--neg)'}`,
                borderRadius: 'var(--r-md)',
                padding: '1.2rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  color: selectedMatch.isWin ? 'var(--pos)' : 'var(--neg)',
                }}
              >
                {selectedMatch.isWin ? 'VITÓRIA' : 'DERROTA'}
              </span>
              <p style={{ margin: '0.3rem 0 0', color: 'var(--text-2)' }}>
                {selectedMatch.mode === 'Grupo'
                  ? `Colocação final: ${selectedMatch.playerPlacement}º Lugar`
                  : `Adversário enfrentado: ${selectedMatch.opponentName}`}
              </p>
            </div>

            {selectedMatch.playerBuildSnapshot && (
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
                  Atributos da sua Construção nesta Partida
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                  {Object.entries(selectedMatch.playerBuildSnapshot.stats || {}).map(([k, val]) => (
                    <div
                      key={k}
                      style={{
                        background: 'var(--surface-2)',
                        padding: '0.6rem',
                        borderRadius: 'var(--r-xs)',
                        border: '1px solid var(--line)',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--muted)', display: 'block' }}>
                        {k}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--signal)' }}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
