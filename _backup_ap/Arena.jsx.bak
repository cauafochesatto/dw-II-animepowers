import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCharacterGame } from '../context/useCharacterGame';
import {
  simulate1v1,
  simulate2v2,
  simulateGroupBattle,
  generateAiBuild,
} from '../utils/battleEngine';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import { Swords } from '../components/Icons';
import '../styles/game.css';

export default function Arena() {
  const location = useLocation();
  const { activeBuild, recordBattleResult } = useCharacterGame();

  // Recebe desafio vindo de amigos via location.state se existir
  const challengeState = location.state?.challenge || null;

  const [mode, setMode] = useState(challengeState?.mode || '1v1'); // '1v1' | '2v2' | 'Grupo'
  const [battleInProgress, setBattleInProgress] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1 = normal, 2 = fast, 0 = instant

  // Adversários configurados
  const [opponent1v1, setOpponent1v1] = useState(() => challengeState?.opponentBuild || generateAiBuild());
  const [teamB2v2, setTeamB2v2] = useState(() => [generateAiBuild('standard', 'Guardião do Infinito'), generateAiBuild('standard', 'Lorde Destruidor')]);
  const [ally2v2, setAlly2v2] = useState(() => generateAiBuild('standard', 'Arauto do Trovão'));

  // Participantes do modo de grupo IA
  const [aiGroupOpponents, setAiGroupOpponents] = useState(() => [
    generateAiBuild('standard', 'Guardião do Infinito'),
    generateAiBuild('standard', 'Sombra Soberana'),
    generateAiBuild('standard', 'Titã da Vanguarda'),
    generateAiBuild('standard', 'Arauto do Trovão'),
    generateAiBuild('standard', 'Feiticeiro Malevolente'),
  ]);

  const groupParticipants = useMemo(() => [
    activeBuild,
    ...aiGroupOpponents,
  ], [activeBuild, aiGroupOpponents]);

  // Estado ao vivo dos lutadores durante a reprodução da batalha
  const [liveFighters, setLiveFighters] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);

  const animTimerRef = useRef(null);

  function startBattle() {
    setBattleResult(null);
    setLiveLogs([]);
    setCurrentRoundIdx(0);

    let result = null;

    if (mode === '1v1') {
      result = simulate1v1(activeBuild, opponent1v1);
    } else if (mode === '2v2') {
      result = simulate2v2([activeBuild, ally2v2], teamB2v2);
    } else {
      result = simulateGroupBattle(groupParticipants);
    }

    setBattleResult(result);
    setLiveFighters(result.fighters.map((f) => ({ ...f, hp: f.maxHp, energy: Math.round(f.stats.energia * 0.35) })));
    setBattleInProgress(true);

    if (speedMultiplier === 0) {
      // Modo instantâneo: pula direto para o final
      finishBattle(result);
    } else {
      playRoundStep(result, 0);
    }
  }

  function playRoundStep(result, roundIdx) {
    if (!result.rounds || roundIdx >= result.rounds.length) {
      finishBattle(result);
      return;
    }

    const round = result.rounds[roundIdx];
    setCurrentRoundIdx(roundIdx + 1);

    // Atualiza logs com as ações da rodada
    setLiveLogs((prev) => [...round.actions, ...prev]);

    // Atualiza HP e energia dos lutadores com base nas ações desta rodada
    setLiveFighters((prev) =>
      prev.map((f) => {
        let currentHp = f.hp;
        let currentEnergy = f.energy;

        round.actions.forEach((act) => {
          if (act.defenderId === f.id) {
            currentHp = act.defenderHp;
          }
          if (act.attackerId === f.id) {
            currentEnergy = act.isSpecial ? 0 : Math.min(100, currentEnergy + 25);
          }
        });

        return {
          ...f,
          hp: currentHp,
          energy: currentEnergy,
          isDefeated: currentHp <= 0,
        };
      })
    );

    const delay = speedMultiplier === 2 ? 350 : 750;
    animTimerRef.current = setTimeout(() => {
      playRoundStep(result, roundIdx + 1);
    }, delay);
  }

  function finishBattle(result) {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setBattleInProgress(false);
    recordBattleResult(result);

    // Coloca todos no estado final exato
    if (result.finalState) {
      setLiveFighters(result.finalState);
    }
    // Mostra todos os logs
    const allActions = result.rounds.flatMap((r) => r.actions).reverse();
    setLiveLogs(allActions);
  }

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  function handleRollNewOpponents() {
    if (mode === '1v1') setOpponent1v1(generateAiBuild());
    if (mode === '2v2') {
      setAlly2v2(generateAiBuild());
      setTeamB2v2([generateAiBuild(), generateAiBuild()]);
    }
    if (mode === 'Grupo') {
      setAiGroupOpponents([
        generateAiBuild(),
        generateAiBuild(),
        generateAiBuild(),
        generateAiBuild(),
        generateAiBuild(),
      ]);
    }
  }

  const fPlayer = liveFighters[0] || {
    name: activeBuild.name,
    avatar: activeBuild.avatar,
    hp: 1000,
    maxHp: 1000,
    energy: 50,
    classification: activeBuild.classification,
  };

  const fEnemy = liveFighters[1] || {
    name: opponent1v1.name,
    avatar: opponent1v1.avatar,
    hp: 1000,
    maxHp: 1000,
    energy: 50,
    classification: opponent1v1.classification,
  };

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 01 — Arena Principal</p>
          <h1 className="display d-xl">Arena de Combate</h1>
          <p className="page-head__lede">
            Coloque sua construção à prova. O combate é calculado em tempo real integrando Força, Velocidade,
            Defesa, Resistência, Energia e Poder Especial em formatos 1v1, 2v2 e Todos contra Todos.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {/* Abas dos Modos de Batalha */}
        <div className="arena-mode-tabs">
          <button
            type="button"
            className={`arena-mode-tab${mode === '1v1' ? ' is-active' : ''}`}
            onClick={() => { setMode('1v1'); setBattleResult(null); }}
            disabled={battleInProgress}
          >
            ⚔️ Confronto 1v1
          </button>
          <button
            type="button"
            className={`arena-mode-tab${mode === '2v2' ? ' is-active' : ''}`}
            onClick={() => { setMode('2v2'); setBattleResult(null); }}
            disabled={battleInProgress}
          >
            👥 Duplas 2v2
          </button>
          <button
            type="button"
            className={`arena-mode-tab${mode === 'Grupo' ? ' is-active' : ''}`}
            onClick={() => { setMode('Grupo'); setBattleResult(null); }}
            disabled={battleInProgress}
          >
            👑 Modo de Grupo (6 Jogadores)
          </button>

          <button
            type="button"
            className="btn-replenish"
            style={{ marginLeft: 'auto' }}
            onClick={handleRollNewOpponents}
            disabled={battleInProgress}
          >
            🎲 Sortear Novos Rivais [IA]
          </button>
        </div>

        {/* PALCO DE COMBATE 1v1 */}
        {mode === '1v1' && (
          <div className="arena-vs-card">
            {/* Lado do Jogador */}
            <div className="arena-fighter-box">
              <span className="rarity-pill rarity-pill--Lendário">Sua Construção</span>
              <div className={`arena-fighter-thumb${fPlayer.hp <= 0 ? ' is-defeated' : ''}`}>
                <img src={resolvePowerImage(fPlayer.avatar)} alt={fPlayer.name} />
              </div>

              <h3 className="arena-fighter-name">{fPlayer.name}</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className={`rank-badge rank-badge--${fPlayer.classification?.rank || 'S'}`}>
                  {fPlayer.classification?.rank || 'S'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {fPlayer.classification?.label}
                </span>
              </div>

              {/* Barra de HP */}
              <div className="arena-hp-bar">
                <div
                  className={`arena-hp-bar__fill${
                    (fPlayer.hp / fPlayer.maxHp) < 0.25
                      ? ' arena-hp-bar__fill--critical'
                      : (fPlayer.hp / fPlayer.maxHp) < 0.5
                      ? ' arena-hp-bar__fill--low'
                      : ''
                  }`}
                  style={{ width: `${Math.max(0, (fPlayer.hp / fPlayer.maxHp) * 100)}%` }}
                />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                {fPlayer.hp} / {fPlayer.maxHp} HP
              </span>

              {/* Barra de Energia / Ki */}
              <div className="arena-energy-bar">
                <div
                  className="arena-energy-bar__fill"
                  style={{ width: `${fPlayer.energy}%` }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Energia Especial: {fPlayer.energy}%
              </span>
            </div>

            {/* Centro: VS & Controles */}
            <div className="arena-vs-divider">
              <span className="arena-vs-text">VS</span>
              {battleInProgress && (
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--signal)' }}>
                  Rodada {currentRoundIdx}
                </span>
              )}

              <button
                type="button"
                className="btn-spin"
                disabled={battleInProgress}
                onClick={startBattle}
                style={{ marginTop: '0.8rem' }}
              >
                <Swords size={20} style={{ marginRight: '6px' }} />
                {battleInProgress ? 'Lutando...' : 'Iniciar Batalha!'}
              </button>

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-slot-change"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setSpeedMultiplier(1)}
                >
                  1x
                </button>
                <button
                  type="button"
                  className="btn-slot-change"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setSpeedMultiplier(2)}
                >
                  2x Rápido
                </button>
                <button
                  type="button"
                  className="btn-slot-change"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setSpeedMultiplier(0)}
                >
                  Pular Animação
                </button>
              </div>
            </div>

            {/* Lado do Oponente */}
            <div className="arena-fighter-box">
              <span className="rarity-pill rarity-pill--Épico">
                {opponent1v1.isAi ? 'Adversário [IA]' : 'Desafiante'}
              </span>
              <div className={`arena-fighter-thumb${fEnemy.hp <= 0 ? ' is-defeated' : ''}`}>
                <img src={resolvePowerImage(fEnemy.avatar)} alt={fEnemy.name} />
              </div>

              <h3 className="arena-fighter-name">{fEnemy.name}</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span className={`rank-badge rank-badge--${fEnemy.classification?.rank || 'S'}`}>
                  {fEnemy.classification?.rank || 'S'}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  {fEnemy.classification?.label}
                </span>
              </div>

              {/* Barra de HP */}
              <div className="arena-hp-bar">
                <div
                  className={`arena-hp-bar__fill${
                    (fEnemy.hp / fEnemy.maxHp) < 0.25
                      ? ' arena-hp-bar__fill--critical'
                      : (fEnemy.hp / fEnemy.maxHp) < 0.5
                      ? ' arena-hp-bar__fill--low'
                      : ''
                  }`}
                  style={{ width: `${Math.max(0, (fEnemy.hp / fEnemy.maxHp) * 100)}%` }}
                />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                {fEnemy.hp} / {fEnemy.maxHp} HP
              </span>

              {/* Barra de Energia */}
              <div className="arena-energy-bar">
                <div
                  className="arena-energy-bar__fill"
                  style={{ width: `${fEnemy.energy}%` }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Energia Especial: {fEnemy.energy}%
              </span>
            </div>
          </div>
        )}

        {/* PALCO DE COMBATE 2v2 */}
        {mode === '2v2' && (
          <div style={{ background: 'radial-gradient(circle at center, #181822 0%, #08080c 100%)', border: '2px solid var(--line-strong)', borderRadius: 'var(--r-lg)', padding: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span className="arena-vs-text" style={{ fontSize: '2.5rem' }}>EQUIPE ALFA vs EQUIPE BETA</span>
              <div style={{ marginTop: '0.8rem' }}>
                <button
                  type="button"
                  className="btn-spin"
                  disabled={battleInProgress}
                  onClick={startBattle}
                >
                  <Swords size={20} style={{ marginRight: '6px' }} />
                  {battleInProgress ? 'Batalha 2v2 em Andamento...' : 'Iniciar Batalha 2v2!'}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Equipe A */}
              <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid var(--pos)', borderRadius: 'var(--r-md)', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--pos)', fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Sua Equipe (Alfa)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[fPlayer, liveFighters[1] || ally2v2].map((f, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <img
                        src={resolvePowerImage(f.avatar)}
                        alt={f.name}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--pos)' }}
                      />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.4rem' }}>{f.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{f.hp} HP</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipe B */}
              <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid var(--neg)', borderRadius: 'var(--r-md)', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--neg)', fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  Equipe Rival (Beta - IA)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[liveFighters[2] || teamB2v2[0], liveFighters[3] || teamB2v2[1]].map((f, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <img
                        src={resolvePowerImage(f.avatar)}
                        alt={f.name}
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--neg)' }}
                      />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.4rem' }}>{f.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{f.hp} HP</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PALCO DE COMBATE MODO DE GRUPO (TODOS CONTRA TODOS) */}
        {mode === 'Grupo' && (
          <div style={{ background: 'radial-gradient(circle at center, #181822 0%, #08080c 100%)', border: '2px solid var(--line-strong)', borderRadius: 'var(--r-lg)', padding: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', textTransform: 'uppercase', color: 'var(--signal)' }}>
                BATTLE ROYALE — 6 COMBATENTES
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Todos contra todos simultaneamente. Sobreviva até o último golpe para garantir o 1º Lugar!
              </p>
              <button
                type="button"
                className="btn-spin"
                disabled={battleInProgress}
                onClick={startBattle}
                style={{ marginTop: '0.8rem' }}
              >
                <Swords size={20} style={{ marginRight: '6px' }} />
                {battleInProgress ? 'Combate em Andamento...' : 'Iniciar Modo de Grupo!'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {groupParticipants.map((p, idx) => {
                const live = liveFighters[idx] || p;
                const isEliminated = live.isDefeated || live.hp <= 0;
                return (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-1)',
                      border: idx === 0 ? '2px solid var(--signal)' : '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      padding: '1rem',
                      textAlign: 'center',
                      opacity: isEliminated ? 0.4 : 1,
                      filter: isEliminated ? 'grayscale(1)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: idx === 0 ? 'var(--signal)' : 'var(--muted)' }}>
                      {idx === 0 ? '★ Você' : `Combatente ${idx + 1}`}
                    </span>
                    <img
                      src={resolvePowerImage(live.avatar || live.imagem)}
                      alt={live.name}
                      style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', margin: '0.4rem auto', display: 'block' }}
                    />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {live.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: isEliminated ? 'var(--neg)' : 'var(--pos)', fontWeight: 700 }}>
                      {isEliminated ? 'Eliminado' : `${live.hp || 1000} HP`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BANNER DE RESULTADO FINAL */}
        {battleResult && !battleInProgress && (
          <div
            style={{
              background: battleResult.isPlayerWinner
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.1) 100%)',
              border: `2px solid ${battleResult.isPlayerWinner ? 'var(--pos)' : 'var(--neg)'}`,
              borderRadius: 'var(--r-lg)',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2rem',
              boxShadow: `0 0 35px ${battleResult.isPlayerWinner ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '3rem',
                textTransform: 'uppercase',
                color: battleResult.isPlayerWinner ? 'var(--pos)' : 'var(--neg)',
                margin: 0,
              }}
            >
              {battleResult.isPlayerWinner ? '🏆 VITÓRIA ESMAGADORA!' : '💀 DERROTA NA ARENA!'}
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginTop: '0.5rem' }}>
              {mode === 'Grupo'
                ? `Você terminou em ${battleResult.playerPlacement}º Lugar no Modo de Grupo!`
                : `O confronto durou ${battleResult.totalRounds} rodadas intensas.`}
            </p>
            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                type="button"
                className="btn-spin"
                onClick={startBattle}
              >
                Lutar Novamente
              </button>
            </div>
          </div>
        )}

        {/* FEED DE AÇÕES E LOG DO COMBATE */}
        <div className="battle-feed-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', textTransform: 'uppercase', margin: 0 }}>
              📜 Narração e Relatório de Combate
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {liveLogs.length} eventos registrados
            </span>
          </div>

          {liveLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Inicie a batalha para acompanhar os golpes, contra-ataques, esquivas e técnicas supremas round a round!
            </div>
          ) : (
            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {liveLogs.map((act, i) => (
                <div
                  key={i}
                  className={`battle-action-row${
                    act.type === 'special'
                      ? ' battle-action-row--special'
                      : act.type === 'crit'
                      ? ' battle-action-row--crit'
                      : act.type === 'dodge'
                      ? ' battle-action-row--dodge'
                      : ''
                  }`}
                >
                  {act.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
