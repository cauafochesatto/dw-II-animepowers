import { useState } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { RARITY_CONFIG } from '../data/characters';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import CharacterCard from '../components/CharacterCard';
import CharacterDetailModal from '../components/CharacterDetailModal';
import { Spark, Close } from '../components/Icons';
import '../styles/game.css';

export default function Giros() {
  const {
    spins,
    spinHistory,
    executeSpin,
    replenishSpins,
  } = useCharacterGame();

  const [isSpinning, setIsSpinning] = useState(false);
  const [revealedPulled, setRevealedPulled] = useState([]);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [selectedCharDetail, setSelectedCharDetail] = useState(null);
  const [bannerNotice, setBannerNotice] = useState(null);

  function handleSpin(count) {
    if (spins < count || isSpinning) return;
    setIsSpinning(true);
    setRevealedPulled([]);

    setTimeout(() => {
      const res = executeSpin(count);
      setIsSpinning(false);
      if (res.success) {
        setRevealedPulled(res.pulled);
        setShowRevealModal(true);
      }
    }, count > 1 ? 900 : 700);
  }

  function handleReplenish() {
    const res = replenishSpins(10);
    setBannerNotice(res.message);
    setTimeout(() => setBannerNotice(null), 4000);
  }

  const lastPulled = revealedPulled[revealedPulled.length - 1];

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 02 — Recrutamento</p>
          <h1 className="display d-xl">Giros de Personagens</h1>
          <p className="page-head__lede">
            Invoque heróis e vilões lendários através do portal interdimensional. Colete diferentes raridades
            e utilize seus melhores atributos para construir um lutador invencível.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {bannerNotice && (
          <div
            style={{
              padding: '0.8rem 1.2rem',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid var(--pos)',
              borderRadius: 'var(--r-sm)',
              marginBottom: '1.5rem',
              color: 'var(--pos)',
              fontWeight: 700,
            }}
          >
            {bannerNotice}
          </div>
        )}

        <div className="spin-hero">
          {/* Palco Principal de Giros */}
          <div className="spin-stage">
            <div className="spin-stage__energy-beam" />

            <div className="spin-counter">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', textTransform: 'uppercase' }}>
                Giros Disponíveis:
              </span>
              <span className="spin-counter__number">{spins}</span>
              <button
                type="button"
                className="btn-replenish"
                onClick={handleReplenish}
                title="Recarregar giros gratuitamente"
              >
                + Repor Grátis (+10)
              </button>
            </div>

            <div className={`spin-portal${isSpinning ? ' is-spinning' : ''}`}>
              {isSpinning ? (
                <span className="spin-portal__glyph">⚡</span>
              ) : lastPulled ? (
                <img
                  src={resolvePowerImage(lastPulled.imagem)}
                  alt={lastPulled.nome}
                  className="spin-portal__img"
                />
              ) : (
                <span className="spin-portal__glyph">🌀</span>
              )}
            </div>

            <div style={{ marginBottom: '1.8rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  textTransform: 'uppercase',
                  color: isSpinning ? 'var(--signal)' : 'var(--text)',
                }}
              >
                {isSpinning ? 'Sorteando o Destino...' : lastPulled ? lastPulled.nome : 'Invoque seu Guerreiro'}
              </h2>
              {lastPulled && !isSpinning && (
                <span className={`rarity-pill rarity-pill--${lastPulled.raridade}`}>
                  {lastPulled.raridade} · {lastPulled.anime}
                </span>
              )}
            </div>

            <div className="spin-actions">
              <button
                type="button"
                className="btn-spin"
                disabled={spins < 1 || isSpinning}
                onClick={() => handleSpin(1)}
              >
                <Spark size={18} style={{ marginRight: '6px' }} /> Girar x1
              </button>

              <button
                type="button"
                className="btn-spin btn-spin--multi"
                disabled={spins < 5 || isSpinning}
                onClick={() => handleSpin(5)}
              >
                Girar x5
              </button>

              <button
                type="button"
                className="btn-spin btn-spin--multi"
                style={{ background: '#8b5cf6' }}
                disabled={spins < 10 || isSpinning}
                onClick={() => handleSpin(10)}
              >
                Girar x10
              </button>
            </div>
          </div>

          {/* Painel de Probabilidades */}
          <div className="spin-rates-panel">
            <h3 className="spin-rates-panel__title">Probabilidades por Raridade</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              Sorteio balanceado e transparente conforme o padrão oficial.
            </p>

            {Object.entries(RARITY_CONFIG).map(([rarity, conf]) => (
              <div key={rarity} className="spin-rate-row">
                <span className={`rarity-pill rarity-pill--${rarity}`}>
                  {rarity}
                </span>
                <span className="spin-rate-row__percent" style={{ color: conf.color }}>
                  {conf.rate.toFixed(1)}%
                </span>
              </div>
            ))}

            <div
              style={{
                marginTop: '1.5rem',
                padding: '0.8rem',
                background: 'var(--surface-2)',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--line)',
                fontSize: '0.78rem',
                color: 'var(--text-2)',
                lineHeight: 1.4,
              }}
            >
              💡 <strong>Dica tática:</strong> Personagens Míticos e Lendários possuem atributos superiores
              a 94. Use a tela de <strong>Construir Personagem</strong> para equipar esses atributos na sua construção.
            </div>
          </div>
        </div>

        {/* Histórico dos Giros */}
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Histórico de Invocação Recente
          </h3>

          {spinHistory.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'var(--surface-1)',
                border: '1px dashed var(--line)',
                borderRadius: 'var(--r-md)',
                color: 'var(--muted)',
              }}
            >
              Nenhum giro realizado ainda. Clique no botão de giro acima para invocar!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.8rem',
              }}
            >
              {spinHistory.slice(0, 12).map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-sm)',
                    padding: '0.6rem 0.8rem',
                  }}
                >
                  <img
                    src={resolvePowerImage(item.imagem)}
                    alt={item.characterName}
                    style={{ width: '42px', height: '42px', borderRadius: 'var(--r-xs)', objectFit: 'cover' }}
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {item.characterName}
                    </div>
                    <span className={`rarity-pill rarity-pill--${item.raridade}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                      {item.raridade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Revelação do Sorteio */}
      {showRevealModal && (
        <div className="reveal-modal" onClick={() => setShowRevealModal(false)}>
          <div className="reveal-modal__content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowRevealModal(false)}
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

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <p className="index-mark" style={{ color: 'var(--signal)' }}>Invocação Realizada</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase' }}>
                {revealedPulled.length > 1 ? `Você obteve ${revealedPulled.length} Personagens!` : 'Novo Personagem Obtido!'}
              </h2>
            </div>

            <div className="reveal-grid">
              {revealedPulled.map((char, idx) => (
                <CharacterCard
                  key={`${char.id}_${idx}`}
                  character={char}
                  copies={1}
                  onClick={() => setSelectedCharDetail(char)}
                />
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn-spin"
                style={{ fontSize: '1rem', padding: '0.7rem 1.8rem' }}
                onClick={() => setShowRevealModal(false)}
              >
                Coletar e Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Personagem */}
      {selectedCharDetail && (
        <CharacterDetailModal
          character={selectedCharDetail}
          copies={1}
          onClose={() => setSelectedCharDetail(null)}
        />
      )}
    </>
  );
}

