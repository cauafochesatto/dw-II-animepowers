import { resolvePowerImage } from '../utils/imageHelper';
import { STAT_KEYS } from '../data/characters';
import { Close } from './Icons';

export default function CharacterDetailModal({ character, copies = 1, onClose }) {
  if (!character) return null;

  return (
    <div className="reveal-modal" onClick={onClose}>
      <div className="reveal-modal__content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
          aria-label="Fechar"
        >
          <Close size={24} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 280px) 1fr', gap: '2rem' }}>
          <div>
            <div
              style={{
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
                border: '2px solid var(--line-strong)',
                height: '320px',
                background: '#000',
              }}
            >
              <img
                src={resolvePowerImage(character.imagem)}
                alt={character.nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
              <span className={`rarity-pill rarity-pill--${character.raridade}`}>
                {character.raridade}
              </span>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
                Cópias na coleção: <strong>{copies}</strong>
              </p>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--signal)', textTransform: 'uppercase', fontWeight: 700 }}>
              {character.anime}
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', textTransform: 'uppercase', margin: '0.2rem 0 0.8rem' }}>
              {character.nome}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              {character.descricao}
            </p>

            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                padding: '0.8rem 1rem',
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                Habilidade Especial
              </span>
              <p style={{ color: 'var(--signal)', fontWeight: 700, margin: '0.2rem 0 0' }}>
                {character.habilidadeEspecial}
              </p>
            </div>

            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Atributos Base de Combate
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem 1.2rem' }}>
              {STAT_KEYS.map(({ key, label, icon, desc }) => {
                const val = character[key] || 50;
                return (
                  <div key={key} style={{ background: 'var(--surface-0)', padding: '0.6rem 0.8rem', borderRadius: 'var(--r-xs)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                        {icon} {label}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--signal)' }}>
                        {val}
                      </span>
                    </div>
                    <div className="stat-meter">
                      <div className="stat-meter__fill" style={{ width: `${(val / 99) * 100}%` }} />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginTop: '0.2rem' }}>
                      {desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
