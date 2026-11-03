import { resolvePowerImage } from '../utils/imageHelper';
import { STAT_KEYS } from '../data/characters';

export default function CharacterCard({
  character,
  copies,
  isEquipped = false,
  equippedStats = [],
  onClick,
  actionLabel,
  onAction,
  highlightStat = null,
}) {
  if (!character) return null;

  return (
    <div
      className={`char-card${isEquipped ? ' char-card--equipped' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {isEquipped && (
        <span className="char-card__badge-equipped">
          {equippedStats.length > 0 ? equippedStats.join(' · ') : 'Equipado'}
        </span>
      )}

      {copies > 1 && (
        <span className="char-card__copies-tag">
          x{copies}
        </span>
      )}

      <div className="char-card__thumb">
        <img
          src={resolvePowerImage(character.imagem)}
          alt={character.nome}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.opacity = '0.3';
          }}
        />
      </div>

      <div className="char-card__body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span className={`rarity-pill rarity-pill--${character.raridade}`}>
            {character.raridade}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {character.anime}
          </span>
        </div>

        <h3 className="char-card__name">{character.nome}</h3>

        <div className="stat-bars-mini">
          {STAT_KEYS.map(({ key, label, icon }) => {
            const val = character[key] || 50;
            const isHighlighted = highlightStat === key;
            return (
              <div
                key={key}
                className="stat-bar-row"
                style={isHighlighted ? { fontWeight: '700', color: 'var(--signal)' } : {}}
              >
                <div className="stat-bar-row__label">
                  <span>
                    {icon} {label}
                  </span>
                  <span style={{ fontWeight: 800 }}>{val}</span>
                </div>
                <div className="stat-meter">
                  <div
                    className="stat-meter__fill"
                    style={{
                      width: `${Math.min(100, (val / 99) * 100)}%`,
                      background: isHighlighted ? 'var(--signal)' : undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {actionLabel && onAction && (
          <button
            type="button"
            className="btn-slot-change"
            style={{ width: '100%', marginTop: '0.6rem' }}
            onClick={(e) => {
              e.stopPropagation();
              onAction(character);
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
