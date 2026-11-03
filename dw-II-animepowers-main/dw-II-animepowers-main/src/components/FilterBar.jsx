import powersData from '../data/powers.json';
import { elementClass, ELEMENT_ORDER } from '../data/elementMeta';
import { Search, Close } from './Icons';

const CATEGORIAS = [
  'Todas',
  ...[...new Set(powersData.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
];
const ANIMES = ['Todos', ...[...new Set(powersData.map((p) => p.anime))].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
const ELEMENTOS = ['Todos', ...ELEMENT_ORDER.filter((e) => powersData.some((p) => p.elemento === e))];

const danoValores = powersData.map((p) => p.dano);
const custoValores = powersData.map((p) => p.custo);
const MIN_DANO = Math.min(...danoValores);
const MAX_DANO = Math.max(...danoValores);
const MIN_CUSTO = Math.min(...custoValores);
const MAX_CUSTO = Math.max(...custoValores);

export { CATEGORIAS, ANIMES, ELEMENTOS, MIN_DANO, MAX_DANO, MIN_CUSTO, MAX_CUSTO };

function DualRange({ id, label, min, max, value, onChange }) {
  return (
    <div className="field">
      <span className="field__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="range__track">
        <div className="range__slider">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            value={value[0]}
            aria-labelledby={`${id}-label`}
            aria-valuetext={`mínimo ${value[0]}`}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange([Math.min(v, value[1]), value[1]]);
            }}
          />
          <span className="range__value">mín {value[0]}</span>
        </div>
        <div className="range__slider">
          <input
            type="range"
            min={min}
            max={max}
            value={value[1]}
            aria-labelledby={`${id}-label`}
            aria-valuetext={`máximo ${value[1]}`}
            onChange={(e) => {
              const v = Number(e.target.value);
              onChange([value[0], Math.max(v, value[0])]);
            }}
          />
          <span className="range__value">máx {value[1]}</span>
        </div>
      </div>
    </div>
  );
}

export default function FilterBar({
  busca, setBusca,
  categoria, setCategoria,
  anime, setAnime,
  elemento, setElemento,
  danoRange, setDanoRange,
  custoRange, setCustoRange,
  ordenarPor, setOrdenarPor,
  somenteFavs, setSomenteFavs,
  favCount, onClear
}) {
  const ativos = [
    busca && { key: 'q', label: `“${busca}”`, reset: () => setBusca('') },
    categoria !== 'Todas' && { key: 'categoria', label: categoria, reset: () => setCategoria('Todas') },
    anime !== 'Todos' && { key: 'anime', label: anime, reset: () => setAnime('Todos') },
    elemento !== 'Todos' && { key: 'elemento', label: elemento, reset: () => setElemento('Todos') },
    somenteFavs && { key: 'favs', label: 'Favoritos', reset: () => setSomenteFavs(false) },
    (danoRange[0] !== MIN_DANO || danoRange[1] !== MAX_DANO) && {
      key: 'dano',
      label: `Dano ${danoRange[0]}–${danoRange[1]}`,
      reset: () => setDanoRange([MIN_DANO, MAX_DANO])
    },
    (custoRange[0] !== MIN_CUSTO || custoRange[1] !== MAX_CUSTO) && {
      key: 'custo',
      label: `Custo ${custoRange[0]}–${custoRange[1]}`,
      reset: () => setCustoRange([MIN_CUSTO, MAX_CUSTO])
    }
  ].filter(Boolean);

  return (
    <div className="catalog__toolbar">
      <div className="catalog__search-row">
        <div className="field">
          <label className="field__label" htmlFor="busca">
            Buscar
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.7rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-2)',
                pointerEvents: 'none'
              }}
            />
            <input
              id="busca"
              className="input"
              style={{ paddingLeft: '2.1rem' }}
              type="search"
              placeholder="Poder, personagem ou obra..."
              value={busca}
              autoComplete="off"
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="field" style={{ minWidth: 170 }}>
          <label className="field__label" htmlFor="ordenar">
            Ordenar
          </label>
          <select
            id="ordenar"
            className="select"
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
          >
            <option value="nome">A–Z</option>
            <option value="dano">Maior dano</option>
            <option value="custo">Menor custo</option>
            <option value="custoBeneficio">Melhor custo-benefício</option>
            <option value="recentes">Adicionados recentemente</option>
          </select>
        </div>
      </div>

      <div className="catalog__selects">
        <div className="field">
          <label className="field__label" htmlFor="f-categoria">
            Categoria
          </label>
          <select
            id="f-categoria"
            className="select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="f-anime">
            Obra
          </label>
          <select id="f-anime" className="select" value={anime} onChange={(e) => setAnime(e.target.value)}>
            {ANIMES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="f-elemento">
            Elemento
          </label>
          <select
            id="f-elemento"
            className={`select ${elemento !== 'Todos' ? elementClass(elemento) : ''}`}
            value={elemento}
            onChange={(e) => setElemento(e.target.value)}
          >
            {ELEMENTOS.map((el) => (
              <option key={el} value={el}>{el}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="catalog__ranges">
        <DualRange
          id="f-dano"
          label="Dano"
          min={MIN_DANO}
          max={MAX_DANO}
          value={danoRange}
          onChange={setDanoRange}
        />
        <DualRange
          id="f-custo"
          label="Custo de energia"
          min={MIN_CUSTO}
          max={MAX_CUSTO}
          value={custoRange}
          onChange={setCustoRange}
        />
      </div>

      <div className="catalog__toggles">
        <div className="catalog__active-filters">
          {ativos.map((f) => (
            <span key={f.key} className={`filter-pill ${f.key === 'elemento' ? elementClass(f.label) : ''}`}>
              {f.label}
              <button type="button" onClick={f.reset} aria-label={`Remover filtro ${f.label}`}>
                <Close size={12} />
              </button>
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: 'auto' }}>
          <label className="switch">
            <input
              type="checkbox"
              checked={somenteFavs}
              onChange={(e) => setSomenteFavs(e.target.checked)}
            />
            Favoritos ({favCount})
          </label>
          <button type="button" className="btn btn--ghost" onClick={onClear} disabled={ativos.length === 0}>
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
