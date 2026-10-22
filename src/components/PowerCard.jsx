import { Link } from 'react-router-dom';
import { elementClass } from '../data/elementMeta';
import { Star, ArrowUpRight } from './Icons';

/**
 * Cartão de poder — usado na grade do catálogo e nos trilhos da home.
 * Toda a área de mídia + nome leva à página de detalhe.
 */
export default function PowerCard({ power, isFav, onFav, revealIndex }) {
  return (
    <article
      className="pcard"
      data-reveal={revealIndex !== undefined ? '' : undefined}
      style={revealIndex !== undefined ? { '--reveal-i': revealIndex } : undefined}
    >
      <Link
        to={`/poder/${power.id}`}
        className={`pcard__media ${elementClass(power.elemento)}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={power.imagem}
          alt=""
          className="pcard__img"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.visibility = 'hidden';
          }}
        />
        <span className="pcard__scrim" />
        <span className="tag">{power.elemento}</span>
        <span className="pcard__cta">
          Ver técnica
          <ArrowUpRight size={14} />
        </span>
      </Link>

      <button
        type="button"
        className="pcard__fav"
        onClick={() => onFav(power.id)}
        aria-pressed={isFav}
        aria-label={isFav ? `Remover ${power.nome} dos favoritos` : `Favoritar ${power.nome}`}
        title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
      >
        <Star filled={isFav} size={15} />
      </button>

      <div className="pcard__body">
        <h3 className="pcard__name">
          <Link to={`/poder/${power.id}`}>{power.nome}</Link>
        </h3>

        <p className="pcard__meta">
          <span className="pcard__owner">{power.personagem}</span>
          {power.anime} · {power.categoria}
        </p>

        <div className="stats">
          <span className="stat">
            <span className="stat__label">Dano</span>
            <span className="stat__value stat__value--dmg">{power.dano}</span>
          </span>
          <span className="stat">
            <span className="stat__label">Alcance</span>
            <span className="stat__value">{power.alcance}</span>
          </span>
          <span className="stat">
            <span className="stat__label">Custo</span>
            <span className="stat__value stat__value--cost">{power.custo}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
