import { useState } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { STAT_KEYS } from '../data/characters';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import { Check, Close } from '../components/Icons';
import '../styles/game.css';

export default function Construir() {
  const {
    activeBuild,
    ownedCharacters,
    updateActiveBuild,
    saveBuildPreset,
  } = useCharacterGame();

  const [activeSlotModal, setActiveSlotModal] = useState(null); // 'forca' | 'velocidade' | ...
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customName, setCustomName] = useState(activeBuild.name || 'Guerreiro Supremo');
  const [signatureMove, setSignatureMove] = useState(activeBuild.signatureMove || 'Impacto Celestial');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  function handleSaveName() {
    updateActiveBuild({ name: customName, signatureMove });
    setFeedbackMsg('Nome e golpe especial salvos com sucesso!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  }

  function handleSelectCharForSlot(statKey, character) {
    const res = updateActiveBuild({
      statSources: {
        ...(activeBuild.statSources || {}),
        [statKey]: character.id,
      },
    });

    if (res.success) {
      setFeedbackMsg(`Atributo ${statKey.toUpperCase()} atualizado para ${character[statKey]} (${character.nome})!`);
      setActiveSlotModal(null);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  }

  function handleSelectAvatar(charId) {
    updateActiveBuild({ avatarId: charId });
    setShowAvatarModal(false);
    setFeedbackMsg('Visual do personagem atualizado!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  }

  function handleSaveNewPreset() {
    saveBuildPreset(customName);
    setFeedbackMsg(`Construção salva nas predefinições!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  }

  const { stats, sources, classification, avatar } = activeBuild;

  // Personagens ordenados pelo atributo atualmente em seleção no modal
  const charactersForSlot = activeSlotModal
    ? [...ownedCharacters].sort((a, b) => (b[activeSlotModal] || 0) - (a[activeSlotModal] || 0))
    : [];

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 04 — Criação & Síntese</p>
          <h1 className="display d-xl">Construir Personagem</h1>
          <p className="page-head__lede">
            Forje seu guerreiro supremo combinando os melhores atributos dos personagens da sua coleção.
            Selecione a força, velocidade, defesa, resistência, energia e poder especial de forma independente.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {feedbackMsg && (
          <div
            style={{
              padding: '0.8rem 1.2rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid var(--pos)',
              borderRadius: 'var(--r-sm)',
              marginBottom: '1.5rem',
              color: 'var(--pos)',
              fontWeight: 700,
            }}
          >
            {feedbackMsg}
          </div>
        )}

        <div className="builder-layout">
          {/* Coluna Esquerda: Cartão da Construção Ativa */}
          <div className="builder-preview-card">
            <div className="builder-avatar-wrap">
              <img src={resolvePowerImage(avatar)} alt={customName} />
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'var(--text)',
                  border: 'none',
                  padding: '0.4rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Mudar Visual
              </button>
            </div>

            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onBlur={handleSaveName}
              placeholder="Nome da Construção"
              className="builder-name-input"
              maxLength={28}
            />

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>
                Golpe Supremo Personalizado:
              </label>
              <input
                type="text"
                value={signatureMove}
                onChange={(e) => setSignatureMove(e.target.value)}
                onBlur={handleSaveName}
                placeholder="Ex: Kamehameha com Vazio Infinito"
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--r-sm)',
                  padding: '0.5rem 0.8rem',
                  color: 'var(--signal)',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                }}
                maxLength={40}
              />
            </div>

            {/* Destaque de Classificação (D .. SSS) */}
            <div className="builder-rank-display">
              <span className={`rank-badge rank-badge--${classification.rank}`}>
                {classification.rank}
              </span>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', display: 'block' }}>
                  Poder Geral da Construção
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: classification.color }}>
                  {classification.label} · Pontuação {classification.score}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                className="btn-spin"
                style={{ flex: 1, fontSize: '0.95rem', padding: '0.7rem 1rem' }}
                onClick={handleSaveName}
              >
                <Check size={16} style={{ marginRight: '6px' }} /> Salvar Construção
              </button>
              <button
                type="button"
                className="btn-replenish"
                onClick={handleSaveNewPreset}
                title="Salvar como predefinição no histórico"
              >
                Nova Predefinição
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>
              * <em>A classificação avalia tanto a média dos atributos selecionados quanto a sinergia e equilíbrio entre eles.</em>
            </div>
          </div>

          {/* Coluna Direita: Seletor dos 6 Atributos Individuais */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', margin: 0 }}>
                Composição dos Atributos
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Selecione cada atributo individualmente da sua coleção
              </span>
            </div>

            <div className="builder-slots">
              {STAT_KEYS.map(({ key, label, icon, desc }) => {
                const sourceChar = sources[key];
                const statVal = stats[key] || 50;
                return (
                  <div key={key} className="stat-slot-item">
                    <div className="stat-slot-item__header">
                      <span className="stat-slot-item__icon">{icon}</span>
                      <div className="stat-slot-item__info">
                        <span className="stat-slot-item__name">{label}</span>
                        <span className="stat-slot-item__desc">{desc}</span>
                      </div>
                    </div>

                    <div className="stat-slot-item__source">
                      {sourceChar && (
                        <>
                          <img
                            src={resolvePowerImage(sourceChar.imagem)}
                            alt={sourceChar.nome}
                            className="stat-slot-item__thumb"
                          />
                          <div>
                            <div className="stat-slot-item__char-name">
                              {sourceChar.nome}
                            </div>
                            <div className="stat-slot-item__char-anime">
                              Origem: {sourceChar.anime} · {sourceChar.raridade}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="stat-slot-item__value">
                      {statVal}
                    </div>

                    <button
                      type="button"
                      className="btn-slot-change"
                      onClick={() => setActiveSlotModal(key)}
                    >
                      Alterar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Gaveta de Seleção e Comparação de Atributo */}
      {activeSlotModal && (
        <div className="reveal-modal" onClick={() => setActiveSlotModal(null)}>
          <div
            className="reveal-modal__content"
            style={{ maxWidth: '820px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveSlotModal(null)}
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

            <div style={{ marginBottom: '1.5rem' }}>
              <span className="index-mark" style={{ color: 'var(--signal)' }}>
                Substituição de Atributo
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase', margin: '0.3rem 0' }}>
                Escolha a melhor fonte para {activeSlotModal.toUpperCase()}
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Atualmente equipado: <strong>{sources[activeSlotModal]?.nome}</strong> com valor <strong>{stats[activeSlotModal]}</strong>.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {charactersForSlot.map((char) => {
                const currentVal = stats[activeSlotModal];
                const charVal = char[activeSlotModal];
                const diff = charVal - currentVal;
                const isCurrent = sources[activeSlotModal]?.id === char.id;

                return (
                  <div
                    key={char.id}
                    style={{
                      background: isCurrent ? 'rgba(251, 191, 36, 0.12)' : 'var(--surface-2)',
                      border: isCurrent ? '2px solid var(--signal)' : '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <img
                        src={resolvePowerImage(char.imagem)}
                        alt={char.nome}
                        style={{ width: '48px', height: '48px', borderRadius: 'var(--r-sm)', objectFit: 'cover' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {char.nome}
                        </div>
                        <span className={`rarity-pill rarity-pill--${char.raridade}`} style={{ fontSize: '0.65rem' }}>
                          {char.raridade}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-2)', textTransform: 'uppercase' }}>
                        {activeSlotModal}:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--signal)' }}>
                          {charVal}
                        </span>
                        {diff !== 0 && (
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: diff > 0 ? 'var(--pos)' : 'var(--neg)' }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isCurrent}
                      className="btn-slot-change"
                      style={{
                        width: '100%',
                        background: isCurrent ? 'var(--signal)' : undefined,
                        color: isCurrent ? 'var(--signal-ink)' : undefined,
                      }}
                      onClick={() => handleSelectCharForSlot(activeSlotModal, char)}
                    >
                      {isCurrent ? '✓ Equipado' : 'Equipar Este Atributo'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Escolha do Avatar Visual */}
      {showAvatarModal && (
        <div className="reveal-modal" onClick={() => setShowAvatarModal(false)}>
          <div className="reveal-modal__content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowAvatarModal(false)}
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

            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase' }}>
                Escolha a Imagem de Apresentação
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                Qual guerreiro da sua coleção representará visualmente esta construção na arena?
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {ownedCharacters.map((char) => (
                <div
                  key={char.id}
                  onClick={() => handleSelectAvatar(char.id)}
                  style={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '0.6rem',
                    borderRadius: 'var(--r-sm)',
                    border: activeBuild.avatarId === char.id ? '2px solid var(--signal)' : '1px solid var(--line)',
                    background: 'var(--surface-2)',
                  }}
                >
                  <img
                    src={resolvePowerImage(char.imagem)}
                    alt={char.nome}
                    style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--r-xs)', marginBottom: '0.4rem' }}
                  />
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {char.nome}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
