import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { useFriends } from '../context/useFriends';
import { useAuth } from '../context/useAuth';
import {
  createTournament,
  resolveTournamentMatch,
  autoSimulateTournament,
  TOURNAMENT_SIZES,
  TOURNAMENT_DIFFICULTIES,
  getRandomTournamentName,
} from '../utils/tournamentEngine';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import { Swords, Check, Close } from '../components/Icons';
import { saveTournamentRecord, resolveTournamentMatchServer } from '../services/dataService';
import '../styles/tournament.css';
import '../styles/game.css';

const STORAGE_KEY = 'ap:active_tournament';

export default function Torneio() {
  const { activeBuild, recordBattleResult } = useCharacterGame();
  const { friendIds, getUserById, getUserBuild } = useFriends();
  const { currentUser } = useAuth();

  // Torneio em andamento carregado do storage
  const [tournament, setTournament] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Configurações para criação de novo torneio
  const [size, setSize] = useState(8);
  const [difficulty, setDifficulty] = useState('medio');
  const [customName, setCustomName] = useState(() => getRandomTournamentName());
  const [includeUser, setIncludeUser] = useState(true);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null); // Confronto aberto em modal
  const [simulatingAll, setSimulatingAll] = useState(false);
  const [tournamentNotice, setTournamentNotice] = useState(null);

  // Sincroniza persistência do torneio
  useEffect(() => {
    if (tournament) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
      saveTournamentRecord(tournament).catch(() => {});
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [tournament]);

  // Lista de amigos válidos com suas construções reais (ou representação)
  const availableFriends = useMemo(() => {
    return friendIds
      .map((id) => {
        const user = getUserById(id);
        if (!user) return null;
        const build = getUserBuild(id);
        return {
          id: user.id,
          name: user.username || user.name || user.email?.split('@')[0],
          avatar: build?.avatar || user.avatar || '/poderesanime/imagenspoderes/kamehamenha.jpg',
          stats: build?.stats || { forca: 80, velocidade: 80, defesa: 80, resistencia: 80, energia: 80, poderEspecial: 80 },
          classification: build?.classification || { rank: 'S', label: 'Combatente Amigo' },
          signatureMove: build?.signatureMove || 'Golpe da Amizade Suprema',
          isFriend: true,
        };
      })
      .filter(Boolean);
  }, [friendIds, getUserById, getUserBuild]);

  function handleToggleFriend(friendId) {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  }

  function handleStartNewTournament() {
    const friendsToInclude = availableFriends.filter((f) => selectedFriendIds.includes(f.id));
    const newTourn = createTournament(
      customName,
      size,
      friendsToInclude,
      includeUser ? activeBuild : null,
      difficulty
    );
    setTournament(newTourn);
  }

  function handleResetTournament() {
    if (window.confirm('Deseja realmente encerrar este torneio e iniciar uma nova chave?')) {
      setTournament(null);
      setCustomName(getRandomTournamentName());
    }
  }

  function handlePlayMatch(match) {
    if (match.status !== 'ready' && match.status !== 'completed') return;
    setActiveMatch(match);
  }

  const handleResolveMatch = useCallback((matchId) => {
    if (!tournament) return;
    const match = tournament.rounds.flatMap((r) => r.matches).find((m) => m.id === matchId);
    const updated = resolveTournamentMatch(tournament, matchId);
    setTournament({ ...updated });
    setActiveMatch(null);

    // Validação online no Neon e concessão de giros proporcionais à dificuldade
    if (match && currentUser?.id) {
      const isUser1 = match.fighter1?.name === activeBuild?.name || !match.fighter1?.isAi;
      const isUser2 = match.fighter2?.name === activeBuild?.name || !match.fighter2?.isAi;
      if (isUser1 || isUser2) {
        const userFighter = isUser1 ? match.fighter1 : match.fighter2;
        const opponentFighter = isUser1 ? match.fighter2 : match.fighter1;

        resolveTournamentMatchServer({
          userId: currentUser.id,
          matchId: `${tournament.id}_${matchId}`,
          tournamentId: tournament.id,
          playerBuild: userFighter,
          opponentBuild: opponentFighter,
          difficulty: tournament.difficulty || difficulty,
        }).then((res) => {
          if (res?.spinsAwarded > 0) {
            setTournamentNotice(res.message || `🏆 Vitória no Torneio! +${res.spinsAwarded} Giros creditados!`);
            recordBattleResult({
              mode: 'Torneio',
              isPlayerWinner: res.isPlayerWinner,
              rewardSpins: res.spinsAwarded,
              spinsAwarded: res.spinsAwarded,
              opponentName: opponentFighter.name,
              opponentAvatar: opponentFighter.avatar,
            });
          }
        }).catch(() => {});
      }
    }
  }, [tournament, currentUser, activeBuild, difficulty, recordBattleResult]);

  function handleSimulateAll() {
    if (!tournament) return;
    setSimulatingAll(true);
    setTimeout(() => {
      const updated = autoSimulateTournament(tournament);
      setTournament({ ...updated });
      setSimulatingAll(false);
    }, 400);
  }

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 09 — Chave Eliminatória</p>
          <h1 className="display d-xl">Modo Torneio</h1>
          <p className="page-head__lede">
            Participe do torneio eliminatório supremo em chaves de 4, 8 ou 16 lutadores.
            Enfrente guerreiros lendários, amigos convidados e avance até a Grande Final para conquistar o troféu.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {tournamentNotice && (
          <div
            style={{
              padding: '1rem 1.2rem',
              background: 'rgba(16, 185, 129, 0.18)',
              border: '1px solid #10b981',
              borderRadius: 'var(--r-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.8rem',
              color: '#6ee7b7',
              fontWeight: 700,
            }}
          >
            <div>{tournamentNotice}</div>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => setTournamentNotice(null)}
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            >
              Fechar
            </button>
          </div>
        )}

        {!tournament ? (
          /* ==================================== TELA DE CONFIGURAÇÃO DO TORNEIO */
          <div className="tournament-shell">
            <div className="tourn-config-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="rarity-pill rarity-pill--Lendário">Novo Campeonato</span>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', margin: '0.4rem 0 0' }}>
                    Configurar Torneio
                  </h2>
                </div>
                <button
                  type="button"
                  className="btn-slot-change"
                  onClick={() => setCustomName(getRandomTournamentName())}
                  title="Sortear outro nome épico"
                >
                  🎲 Sortear Nome
                </button>
              </div>

              <div className="tourn-config-grid">
                {/* Nome do Torneio */}
                <div className="field">
                  <label className="field__label" htmlFor="tourn-name">
                    Nome da Competição
                  </label>
                  <input
                    id="tourn-name"
                    className="input"
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Torneio das Trevas"
                    maxLength={60}
                  />
                </div>

                {/* Tamanho da Chave */}
                <div>
                  <label className="field__label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Formato da Chave
                  </label>
                  <div className="tourn-size-selector">
                    {TOURNAMENT_SIZES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`tourn-size-btn${size === s ? ' is-active' : ''}`}
                        onClick={() => setSize(s)}
                      >
                        {s} Lutadores
                        <span className="tourn-size-sub">
                          {s === 4 ? 'Semis e Final' : s === 8 ? 'Quartas, Semis, Final' : 'Oitavas até Final'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dificuldade e Recompensas (Fácil, Médio, Difícil) */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="field__label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                    Nível de Dificuldade & Recompensas em Giros
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
                    {Object.values(TOURNAMENT_DIFFICULTIES).map((diff) => (
                      <button
                        key={diff.key}
                        type="button"
                        className={`tourn-size-btn${difficulty === diff.key ? ' is-active' : ''}`}
                        onClick={() => setDifficulty(diff.key)}
                        style={{ textAlign: 'left', padding: '0.9rem 1rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <strong style={{ fontSize: '1.05rem' }}>{diff.label}</strong>
                          <span className="rarity-pill rarity-pill--Épico" style={{ fontSize: '0.7rem' }}>
                            +{diff.rewardSpins} Giros / vitória
                          </span>
                        </div>
                        <span className="tourn-size-sub" style={{ lineHeight: 1.4 }}>
                          {diff.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Opções de Participação */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={includeUser}
                    onChange={(e) => setIncludeUser(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--signal)' }}
                  />
                  <span>
                    <strong>Participar com minha Construção Atual</strong> ({activeBuild?.name || 'Guerreiro'})
                  </span>
                </label>

                {availableFriends.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p className="caption" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                      Incluir amigos adicionados na chave ({selectedFriendIds.length} selecionados):
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {availableFriends.map((friend) => {
                        const isSelected = selectedFriendIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            className={`btn btn--sm${isSelected ? '' : ' btn--ghost'}`}
                            onClick={() => handleToggleFriend(friend.id)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            {isSelected && <Check size={12} />}
                            {friend.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn--lg"
                  onClick={handleStartNewTournament}
                  style={{ minWidth: '220px' }}
                >
                  <Swords size={18} />
                  Criar Chave e Iniciar Torneio
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ==================================== TELA DA CHAVE DO TORNEIO ATIVO */
          <div className="tournament-shell">
            {/* Header do Torneio Ativo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '1.2rem 1.5rem' }}>
              <div>
                <span className="index-mark" style={{ color: 'var(--signal)' }}>
                  {tournament.size} Lutadores · Eliminação Simples
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', margin: '0.2rem 0' }}>
                  {tournament.name}
                </h2>
                <span style={{ fontSize: '0.85rem', color: tournament.status === 'completed' ? 'var(--pos)' : 'var(--muted)', fontWeight: 700 }}>
                  {tournament.status === 'completed'
                    ? '🏆 Torneio Finalizado · Campeão Consagrado!'
                    : `Fase Atual: Rodada ${tournament.currentRound} de ${tournament.totalRounds}`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {tournament.status !== 'completed' && (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={handleSimulateAll}
                    disabled={simulatingAll}
                  >
                    ⚡ {simulatingAll ? 'Simulando...' : 'Simular Lutas Prontas'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--quiet"
                  onClick={handleResetTournament}
                >
                  Novo Torneio
                </button>
              </div>
            </div>

            {/* Banner de Campeão se finalizado */}
            {tournament.status === 'completed' && tournament.champion && (
              <div className="tourn-champion-banner">
                <span className="rarity-pill rarity-pill--Lendário" style={{ fontSize: '0.85rem' }}>
                  ★ VENCEDOR DO CAMPEONATO ★
                </span>
                <h2 className="tourn-champion-title">
                  {tournament.champion.name}
                </h2>
                <img
                  src={resolvePowerImage(tournament.champion.avatar)}
                  alt={tournament.champion.name}
                  className="tourn-champion-avatar"
                />
                <p style={{ color: 'var(--text-2)', maxWidth: '50ch', margin: '0 auto 1.5rem', fontSize: '1rem' }}>
                  Conquistou a vitória invicta em todas as fases da chave com a técnica{' '}
                  <strong style={{ color: 'var(--signal)' }}>"{tournament.champion.signatureMove}"</strong>!
                </p>
                <button
                  type="button"
                  className="btn btn--lg"
                  onClick={handleResetTournament}
                >
                  🏆 Iniciar Nova Temporada
                </button>
              </div>
            )}

            {/* Chave Eliminatória Visual (Bracket) */}
            <div className="tourn-bracket-wrap">
              <div className="tourn-bracket">
                {tournament.rounds.map((round) => (
                  <div key={round.roundNumber} className="tourn-round-col">
                    <div className="tourn-round-head">
                      <h3 className="tourn-round-title">{round.name}</h3>
                      <span className="caption">{round.matches.length} confronto(s)</span>
                    </div>

                    <div className="tourn-matches-list">
                      {round.matches.map((match) => {
                        const isReady = match.status === 'ready';
                        const isCompleted = match.status === 'completed';
                        const isBye = match.status === 'bye';

                        return (
                          <div
                            key={match.id}
                            className={`tourn-match${isReady ? ' is-ready' : ''}${isCompleted ? ' is-completed' : ''}`}
                          >
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                              Confronto #{match.matchNumber}
                            </span>

                            {/* Lutador 1 */}
                            <div
                              className={`tourn-fighter-row${
                                match.winner?.id === match.fighter1?.id
                                  ? ' is-winner'
                                  : match.loser?.id === match.fighter1?.id
                                  ? ' is-loser'
                                  : ''
                              }`}
                            >
                              <div className="tourn-fighter-row__info">
                                {match.fighter1 ? (
                                  <>
                                    <img
                                      src={resolvePowerImage(match.fighter1.avatar)}
                                      alt={match.fighter1.name}
                                      className="tourn-fighter-row__avatar"
                                    />
                                    <span className="tourn-fighter-row__name" title={match.fighter1.name}>
                                      {match.fighter1.name}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-2)' }}>
                                    Aguardando lutador...
                                  </span>
                                )}
                              </div>
                              {match.winner?.id === match.fighter1?.id && (
                                <span className="fr-badge fr-badge--pos" style={{ fontSize: '0.65rem' }}>
                                  Vitória
                                </span>
                              )}
                            </div>

                            {/* Lutador 2 */}
                            <div
                              className={`tourn-fighter-row${
                                match.winner?.id === match.fighter2?.id
                                  ? ' is-winner'
                                  : match.loser?.id === match.fighter2?.id
                                  ? ' is-loser'
                                  : ''
                              }`}
                            >
                              <div className="tourn-fighter-row__info">
                                {match.fighter2 ? (
                                  <>
                                    <img
                                      src={resolvePowerImage(match.fighter2.avatar)}
                                      alt={match.fighter2.name}
                                      className="tourn-fighter-row__avatar"
                                    />
                                    <span className="tourn-fighter-row__name" title={match.fighter2.name}>
                                      {match.fighter2.name}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-2)' }}>
                                    {isBye ? 'Bye (Avanço direto)' : 'Aguardando lutador...'}
                                  </span>
                                )}
                              </div>
                              {match.winner?.id === match.fighter2?.id && (
                                <span className="fr-badge fr-badge--pos" style={{ fontSize: '0.65rem' }}>
                                  Vitória
                                </span>
                              )}
                            </div>

                            {/* Ações da Partida */}
                            <div style={{ marginTop: '0.3rem', display: 'flex', justifyContent: 'flex-end' }}>
                              {isReady && (
                                <button
                                  type="button"
                                  className="btn btn--sm"
                                  onClick={() => handlePlayMatch(match)}
                                  style={{ width: '100%' }}
                                >
                                  <Swords size={13} />
                                  Lutar Confronto
                                </button>
                              )}
                              {isCompleted && match.battleResult && (
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => handlePlayMatch(match)}
                                  style={{ width: '100%', fontSize: '0.72rem' }}
                                >
                                  Ver Relatório ({match.battleResult.totalRounds} rounds)
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal do Confronto */}
        {activeMatch && (
          <div className="fr-modal-backdrop" onClick={() => setActiveMatch(null)}>
            <div className="fr-modal tourn-modal-arena" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="fr-modal__close"
                onClick={() => setActiveMatch(null)}
                aria-label="Fechar confronto"
              >
                <Close size={20} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
                <span className="index-mark" style={{ color: 'var(--signal)' }}>
                  {activeMatch.roundName} · Confronto #{activeMatch.matchNumber}
                </span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', margin: '0.3rem 0' }}>
                  {activeMatch.fighter1?.name} vs {activeMatch.fighter2?.name}
                </h2>
              </div>

              {/* Box comparativo dos dois lutadores */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', background: 'var(--surface-3)', padding: '1rem', borderRadius: 'var(--r-md)', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={resolvePowerImage(activeMatch.fighter1?.avatar)}
                    alt={activeMatch.fighter1?.name}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.4rem', border: '2px solid var(--pos)' }}
                  />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{activeMatch.fighter1?.name}</div>
                  <span className={`rank-badge rank-badge--${activeMatch.fighter1?.classification?.rank || 'S'}`}>
                    {activeMatch.fighter1?.classification?.rank || 'S'}
                  </span>
                </div>

                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--signal)' }}>
                  VS
                </span>

                <div style={{ textAlign: 'center' }}>
                  <img
                    src={resolvePowerImage(activeMatch.fighter2?.avatar)}
                    alt={activeMatch.fighter2?.name}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 0.4rem', border: '2px solid var(--neg)' }}
                  />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{activeMatch.fighter2?.name}</div>
                  <span className={`rank-badge rank-badge--${activeMatch.fighter2?.classification?.rank || 'S'}`}>
                    {activeMatch.fighter2?.classification?.rank || 'S'}
                  </span>
                </div>
              </div>

              {/* Se a partida já estiver concluída, exibe o resultado e logs */}
              {activeMatch.status === 'completed' && activeMatch.battleResult ? (
                <div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--pos)', borderRadius: 'var(--r-sm)', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--pos)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                      🏆 Vencedor: {activeMatch.winner?.name}
                    </h3>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>
                      Confronto decidido em {activeMatch.battleResult.totalRounds} rodadas intensas.
                    </p>
                  </div>

                  <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                    Eventos da Batalha:
                  </h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.8rem' }}>
                    {(activeMatch.battleResult.rounds || []).flatMap((r) => r.actions).slice(0, 10).map((act, i) => (
                      <div key={i} className="battle-action-row" style={{ padding: '0.4rem 0.6rem' }}>
                        {act.text}
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1.2rem' }}>
                    <button type="button" className="btn btn--block btn--ghost" onClick={() => setActiveMatch(null)}>
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    O vencedor avançará automaticamente para a próxima fase do torneio.
                  </p>
                  <button
                    type="button"
                    className="btn btn--lg btn--block"
                    onClick={() => handleResolveMatch(activeMatch.id)}
                  >
                    <Swords size={16} />
                    Executar Confronto Agora
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
