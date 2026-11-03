import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import powersData from '../data/powers.json';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';
import { useReveal } from '../hooks/useReveal';
import FilterBar, {
  CATEGORIAS, ANIMES, ELEMENTOS, MIN_DANO, MAX_DANO, MIN_CUSTO, MAX_CUSTO
} from './FilterBar';
import PowerCard from './PowerCard';
import EmptyState from './EmptyState';

const padrao = {
  q: '',
  categoria: 'Todas',
  anime: 'Todos',
  elemento: 'Todos',
  ordenarPor: 'nome',
  somenteFavs: false,
  dano: [MIN_DANO, MAX_DANO],
  custo: [MIN_CUSTO, MAX_CUSTO]
};

function fromParams(params) {
  const d = params.get('dano');
  const c = params.get('custo');
  return {
    q: params.get('q') || padrao.q,
    categoria: CATEGORIAS.includes(params.get('categoria')) ? params.get('categoria') : padrao.categoria,
    anime: ANIMES.includes(params.get('anime')) ? params.get('anime') : padrao.anime,
    elemento: ELEMENTOS.includes(params.get('elemento')) ? params.get('elemento') : padrao.elemento,
    ordenarPor: ['nome', 'dano', 'custo', 'custoBeneficio', 'recentes'].includes(params.get('ordem'))
      ? params.get('ordem')
      : padrao.ordenarPor,
    somenteFavs: params.get('favs') === '1',
    dano: d ? d.split('-').map(Number) : padrao.dano,
    custo: c ? c.split('-').map(Number) : padrao.custo
  };
}

function toParams(estado) {
  const p = new URLSearchParams();
  if (estado.q) p.set('q', estado.q);
  if (estado.categoria !== padrao.categoria) p.set('categoria', estado.categoria);
  if (estado.anime !== padrao.anime) p.set('anime', estado.anime);
  if (estado.elemento !== padrao.elemento) p.set('elemento', estado.elemento);
  if (estado.ordenarPor !== padrao.ordenarPor) p.set('ordem', estado.ordenarPor);
  if (estado.somenteFavs) p.set('favs', '1');
  if (estado.dano[0] !== MIN_DANO || estado.dano[1] !== MAX_DANO) p.set('dano', estado.dano.join('-'));
  if (estado.custo[0] !== MIN_CUSTO || estado.custo[1] !== MAX_CUSTO) p.set('custo', estado.custo.join('-'));
  return p;
}

export default function PowerCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const revealRef = useReveal({ threshold: 0.02, rootMargin: '0px 0px -4% 0px' });

  const inicial = useMemo(() => fromParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [busca, setBusca] = useState(inicial.q);
  const [categoria, setCategoria] = useState(inicial.categoria);
  const [anime, setAnime] = useState(inicial.anime);
  const [elemento, setElemento] = useState(inicial.elemento);
  const [ordenarPor, setOrdenarPor] = useState(inicial.ordenarPor);
  const [somenteFavs, setSomenteFavs] = useState(inicial.somenteFavs);
  const [danoRange, setDanoRange] = useState(inicial.dano);
  const [custoRange, setCustoRange] = useState(inicial.custo);

  const [favoritos, setFavoritos] = useLocalStorage('pa:favoritos', []);
  const termo = useDebounce(busca.trim().toLowerCase(), 200);

  // a URL guarda os filtros: o link pode ser compartilhado e o botão voltar
  // do navegador devolve exatamente a mesma busca
  useEffect(() => {
    const proximos = toParams({
      q: termo, categoria, anime, elemento, ordenarPor, somenteFavs, dano: danoRange, custo: custoRange
    });
    const atuais = new URLSearchParams(searchParams);
    if (proximos.toString() !== atuais.toString()) {
      setSearchParams(proximos, { replace: true });
    }
  }, [termo, categoria, anime, elemento, ordenarPor, somenteFavs, danoRange, custoRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = useMemo(() => {
    const lista = powersData.filter((p) => {
      const okBusca =
        !termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.personagem.toLowerCase().includes(termo) ||
        p.anime.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo);
      return (
        okBusca &&
        (categoria === 'Todas' || p.categoria === categoria) &&
        (anime === 'Todos' || p.anime === anime) &&
        (elemento === 'Todos' || p.elemento === elemento) &&
        p.dano >= danoRange[0] && p.dano <= danoRange[1] &&
        p.custo >= custoRange[0] && p.custo <= custoRange[1] &&
        (!somenteFavs || favoritos.includes(p.id))
      );
    });

    const ordenados = [...lista];
    switch (ordenarPor) {
      case 'dano':
        ordenados.sort((a, b) => b.dano - a.dano || a.nome.localeCompare(b.nome, 'pt-BR'));
        break;
      case 'custo':
        ordenados.sort((a, b) => a.custo - b.custo || a.nome.localeCompare(b.nome, 'pt-BR'));
        break;
      case 'custoBeneficio':
        ordenados.sort((a, b) => b.dano / (b.custo || 1) - a.dano / (a.custo || 1));
        break;
      case 'recentes':
        ordenados.sort((a, b) => b.id - a.id);
        break;
      default:
        ordenados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }
    return ordenados;
  }, [termo, categoria, anime, elemento, danoRange, custoRange, somenteFavs, ordenarPor, favoritos]);

  const toggleFav = useCallback((id) => {
    setFavoritos((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, [setFavoritos]);

  const limpar = useCallback(() => {
    setBusca('');
    setCategoria('Todas');
    setAnime('Todos');
    setElemento('Todos');
    setDanoRange([MIN_DANO, MAX_DANO]);
    setCustoRange([MIN_CUSTO, MAX_CUSTO]);
    setSomenteFavs(false);
    setOrdenarPor('nome');
  }, []);

  return (
    <div className="catalog">
      <FilterBar
        busca={busca} setBusca={setBusca}
        categoria={categoria} setCategoria={setCategoria}
        anime={anime} setAnime={setAnime}
        elemento={elemento} setElemento={setElemento}
        danoRange={danoRange} setDanoRange={setDanoRange}
        custoRange={custoRange} setCustoRange={setCustoRange}
        ordenarPor={ordenarPor} setOrdenarPor={setOrdenarPor}
        somenteFavs={somenteFavs} setSomenteFavs={setSomenteFavs}
        favCount={favoritos.length}
        onClear={limpar}
      />

      <div className="catalog__resultbar">
        <p role="status">
          <strong>{filtrados.length}</strong>{' '}
          {filtrados.length === 1 ? 'técnica encontrada' : 'técnicas encontradas'}
          {filtrados.length !== powersData.length && ` de ${powersData.length}`}
        </p>
        <p className="caption">
          {ordenarPor === 'nome' && 'Ordenado por nome'}
          {ordenarPor === 'dano' && 'Ordenado por dano'}
          {ordenarPor === 'custo' && 'Ordenado por custo'}
          {ordenarPor === 'custoBeneficio' && 'Ordenado por custo-benefício'}
          {ordenarPor === 'recentes' && 'Ordenado por adição recente'}
        </p>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState busca={busca} onClear={limpar} />
      ) : (
        <div className="pgrid" ref={revealRef}>
          {filtrados.map((p, i) => (
            <PowerCard
              key={p.id}
              power={p}
              isFav={favoritos.includes(p.id)}
              onFav={toggleFav}
              revealIndex={Math.min(i, 11)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
