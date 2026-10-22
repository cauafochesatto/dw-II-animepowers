import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import powersData from '../data/powers.json';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useReveal } from '../hooks/useReveal';
import { elementClass } from '../data/elementMeta';
import { Star, Plus, Swords, ArrowLeft, Check, Close } from '../components/Icons';

const MAX_DECK = 6;

/** percentuais usados nas barras de comparação (mesmos limites dos filtros) */
const norm = (valor, min, max) => Math.max(4, Math.round(((valor - min) / (max - min || 1)) * 100));
const MIN_DANO = Math.min(...powersData.map((p) => p.dano));
const MAX_DANO = Math.max(...powersData.map((p) => p.dano));
const MIN_CUSTO = Math.min(...powersData.map((p) => p.custo));
const MAX_CUSTO = Math.max(...powersData.map((p) => p.custo));

export default function Poder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const revealRef = useReveal({ threshold: 0.05 });

  const [favoritos, setFavoritos] = useLocalStorage('pa:favoritos', []);
  const [deck, setDeck] = useLocalStorage('pa:deck', []);

  const indice = powersData.findIndex((p) => String(p.id) === String(id));
  const power = powersData[indice];

  if (!power) return <Navigate to="/catalogo" replace />;

  const anterior = powersData[indice - 1] || null;
  const proximo = powersData[indice + 1] || null;
  const isFav = favoritos.includes(power.id);
  const noGrimorio = deck.includes(power.id);
  const grimorioCheio = deck.length >= MAX_DECK;

  function toggleFav() {
    setFavoritos((prev) =>
      prev.includes(power.id) ? prev.filter((f) => f !== power.id) : [...prev, power.id]
    );
  }

  function adicionarAoGrimorio() {
    if (noGrimorio || grimorioCheio) return;
    setDeck([...deck, power.id]);
  }

  return (
    <article className="pdetail" ref={revealRef}>
      <div className="shell">
        <p className="caption" style={{ paddingBlock: '1.25rem' }}>
          <Link to="/catalogo" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={14} /> Voltar ao catálogo
          </Link>
        </p>
      </div>

      {/* ---------------------------------------------------------- topo */}
      <header className={`pdetail__hero ${elementClass(power.elemento)}`} data-reveal>
        <div className="shell">
          <div className="pdetail__hero-media">
            <img
              className="pdetail__hero-img"
              src={power.imagem}
              alt={`Arte de ${power.nome}`}
              fetchPriority="high"
            />
            <span className="pdetail__hero-scrim" />

            <div className="pdetail__hero-top">
              <span className="tag">{power.elemento}</span>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={toggleFav}
                aria-pressed={isFav}
              >
                <Star filled={isFav} size={15} />
                {isFav ? 'Favorito' : 'Favoritar'}
              </button>
            </div>

            <div className="pdetail__hero-bottom">
              <div className="pdetail__kicker">
                <span className="label">{power.categoria}</span>
                <span className="caption">{power.alcance} alcance</span>
              </div>
              <h1 className="pdetail__title">{power.nome}</h1>
              <p className="pdetail__origin">
                <b>{power.personagem}</b>
                <span aria-hidden="true">/</span>
                <span>{power.anime}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- corpo */}
      <div className="shell pdetail__body">
        <div className="pdetail__main">
          <section>
            <h2 className="pdetail__section-title">A técnica</h2>
            <p className="pdetail__desc" style={{ marginTop: '1.25rem' }}>
              {power.descricao}
            </p>
          </section>

          <section>
            <h2 className="pdetail__section-title">Leitura rápida dos atributos</h2>
            <div className="meter" style={{ marginTop: '1.25rem' }}>
              <div className="meter__head">
                <span>Dano</span>
                <span>
                  {power.dano} · {norm(power.dano, MIN_DANO, MAX_DANO)}% do teto
                </span>
              </div>
              <div className="meter__bar">
                <span
                  className="meter__fill"
                  style={{ width: `${norm(power.dano, MIN_DANO, MAX_DANO)}%` }}
                />
              </div>
            </div>

            <div className="meter" style={{ marginTop: '1rem' }}>
              <div className="meter__head">
                <span>Custo de energia</span>
                <span>{power.custo}</span>
              </div>
              <div className="meter__bar">
                <span
                  className="meter__fill meter__fill--alt"
                  style={{ width: `${norm(power.custo, MIN_CUSTO, MAX_CUSTO)}%` }}
                />
              </div>
            </div>

            <p className="caption" style={{ marginTop: '1rem' }}>
              No simulador, custo alto reduz o score final. A fórmula é
              dano × 0.7 + (100 − custo) × 0.3, ajustada pelo elemento.
            </p>
          </section>

          <nav className="pdetail__nav" aria-label="Navegação entre poderes">
            <Link
              to={anterior ? `/poder/${anterior.id}` : '#'}
              className="pdetail__nav-link pdetail__nav-link--prev"
              aria-disabled={!anterior}
              onClick={(e) => !anterior && e.preventDefault()}
            >
              <span className="label">Anterior</span>
              <span className="pdetail__nav-name">{anterior?.nome || '—'}</span>
            </Link>
            <Link
              to={proximo ? `/poder/${proximo.id}` : '#'}
              className="pdetail__nav-link pdetail__nav-link--next"
              aria-disabled={!proximo}
              onClick={(e) => !proximo && e.preventDefault()}
            >
              <span className="label">Próxima</span>
              <span className="pdetail__nav-name">{proximo?.nome || '—'}</span>
            </Link>
          </nav>
        </div>

        <aside className="pdetail__aside">
          <section>
            <h2 className="pdetail__section-title">Ficha técnica</h2>
            <div className="spec">
              <div className="spec__row">
                <span className="spec__label">Elemento</span>
                <span className={`spec__value ${elementClass(power.elemento)}`}>
                  {power.elemento}
                </span>
              </div>
              <div className="spec__row">
                <span className="spec__label">Categoria</span>
                <span className="spec__value">{power.categoria}</span>
              </div>
              <div className="spec__row">
                <span className="spec__label">Poder de dano</span>
                <span className="spec__value spec__value--dmg">{power.dano}</span>
              </div>
              <div className="spec__row">
                <span className="spec__label">Alcance</span>
                <span className="spec__value">{power.alcance}</span>
              </div>
              <div className="spec__row">
                <span className="spec__label">Custo</span>
                <span className="spec__value spec__value--cost">{power.custo}</span>
              </div>
              <div className="spec__row">
                <span className="spec__label">Portador</span>
                <span className="spec__value">{power.personagem}</span>
              </div>
              <div className="spec__row">
                <span className="spec__label">Obra</span>
                <span className="spec__value">{power.anime}</span>
              </div>
            </div>
          </section>

          <div className="pdetail__actions">
            <button
              type="button"
              className="btn btn--block"
              onClick={adicionarAoGrimorio}
              disabled={noGrimorio || grimorioCheio}
            >
              {noGrimorio ? <Check size={15} /> : <Plus size={15} />}
              {noGrimorio ? 'Já está no grimório' : grimorioCheio ? 'Grimório cheio' : 'Adicionar ao grimório'}
            </button>

            <div className="pdetail__actions-row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => navigate('/duelo', { state: { preselectPower: power.id } })}
              >
                <Swords size={15} />
                Testar
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setFavoritos((prev) =>
                    prev.includes(power.id) ? prev.filter((f) => f !== power.id) : [...prev, power.id]
                  );
                }}
                aria-pressed={isFav}
              >
                {isFav ? <Close size={15} /> : <Star size={15} />}
                {isFav ? 'Remover' : 'Favoritar'}
              </button>
            </div>

            {grimorioCheio && !noGrimorio && (
              <p className="caption">O grimório já tem {MAX_DECK} técnicas.</p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
