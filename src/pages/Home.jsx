import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import powersData from '../data/powers.json';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useReveal } from '../hooks/useReveal';
import { elementClass, elementColor } from '../data/elementMeta';
import PowerCard from '../components/PowerCard';
import { ArrowUpRight, ArrowRight, Swords, Book, Spark } from '../components/Icons';

const RAIL_SIZE = 12;

export default function Home() {
  const navigate = useNavigate();
  const revealRef = useReveal();
  const [favoritos, setFavoritos] = useLocalStorage('pa:favoritos', []);

  const { feature, ranking, novidades, elementos, categorias } = useMemo(() => {
    const porDano = [...powersData].sort((a, b) => b.dano - a.dano || a.nome.localeCompare(b.nome, 'pt-BR'));
    const porId = [...powersData].sort((a, b) => b.id - a.id);

    const conta = (campo) => {
      const mapa = new Map();
      powersData.forEach((p) => mapa.set(p[campo], (mapa.get(p[campo]) || 0) + 1));
      return [...mapa.entries()]
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));
    };

    return {
      feature: porDano[0],
      ranking: porDano.slice(1, RAIL_SIZE),
      novidades: porId.slice(0, RAIL_SIZE),
      elementos: conta('elemento'),
      categorias: conta('categoria')
    };
  }, []);

  const totalAnimes = useMemo(() => new Set(powersData.map((p) => p.anime)).size, []);

  function toggleFav(id) {
    setFavoritos((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

  const maxElementos = elementos[0]?.total || 1;

  return (
    <div ref={revealRef}>
      {/* ------------------------------------------------------------ hero */}
      <section className="hero shell">
        <p className="hero__kicker" data-reveal style={{ '--reveal-i': 0 }}>
          <span className="label">Arquivo de técnicas</span>
          <span className="caption">
            {powersData.length} poderes · {totalAnimes} obras · {categorias.length} categorias
          </span>
        </p>

        <h1 className="hero__title" data-reveal style={{ '--reveal-i': 1 }}>
          <span>O poder</span>
          <span>define</span>
          <em>a batalha</em>
        </h1>

        <div className="hero__intro" data-reveal style={{ '--reveal-i': 2 }}>
          <p className="lede">
            Cada técnica registrada com origem, elemento e atributos comparáveis.
            Compare, arme seu grimório e coloque duas habilidades frente a frente.
          </p>

          <div className="hero__actions">
            <Link className="btn btn--lg" to="/catalogo">
              Explorar catálogo
              <ArrowRight className="btn__arrow" />
            </Link>
            <Link className="btn btn--ghost btn--lg" to="/duelo">
              Abrir arena
              <ArrowRight className="btn__arrow" />
            </Link>
          </div>

          <dl className="hero__facts">
            <div>
              <dd className="hero__fact-value">{powersData.length}</dd>
              <dt className="hero__fact-label">Poderes</dt>
            </div>
            <div>
              <dd className="hero__fact-value">{elementos.length}</dd>
              <dt className="hero__fact-label">Elementos</dt>
            </div>
            <div>
              <dd className="hero__fact-value">{totalAnimes}</dd>
              <dt className="hero__fact-label">Obras</dt>
            </div>
          </dl>
        </div>

        <Link
          to={`/poder/${feature.id}`}
          className={`hero__feature ${elementClass(feature.elemento)}`}
          data-reveal
          style={{ '--reveal-i': 3 }}
        >
          <div className="hero__feature-media">
            <img
              className="hero__feature-img"
              src={feature.imagem}
              alt={`Arte de ${feature.nome}`}
              fetchPriority="high"
            />
            <span className="hero__feature-scrim" />
          </div>
          <div className="hero__feature-body">
            <span className="tag">Maior dano do catálogo</span>
            <h2 className="hero__feature-name">{feature.nome}</h2>
            <p className="hero__feature-meta">
              {feature.personagem} · {feature.anime} · {feature.categoria}
            </p>
            <div className="stats hero__feature-stats">
              <span className="stat">
                <span className="stat__label">Dano</span>
                <span className="stat__value stat__value--dmg">{feature.dano}</span>
              </span>
              <span className="stat">
                <span className="stat__label">Alcance</span>
                <span className="stat__value">{feature.alcance}</span>
              </span>
              <span className="stat">
                <span className="stat__label">Custo</span>
                <span className="stat__value stat__value--cost">{feature.custo}</span>
              </span>
            </div>
          </div>
        </Link>

        <div className="hero__rail">
          <div className="hero__rail-head">
            <h2 className="label">Chegou agora ao arquivo</h2>
            <Link className="section__link" to="/catalogo">
              Ver catálogo completo <ArrowUpRight size={15} />
            </Link>
          </div>
          <ul className="rail">
            {novidades.map((p, i) => (
              <li key={p.id} data-reveal style={{ '--reveal-i': i % 6 }}>
                <PowerCard power={p} isFav={favoritos.includes(p.id)} onFav={toggleFav} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- destaques */}
      <section className="section section--lined" aria-labelledby="ranking">
        <div className="shell">
          <div className="section__sticky">
            <div className="section__head">
              <div className="section__head-text">
                <p className="index-mark">/ 01</p>
                <h2 className="section__title" id="ranking">
                  Ranking de dano
                </h2>
                <p className="section__blurb">
                  As técnicas com maior poder bruto no arquivo, logo depois da líder absoluta.
                </p>
              </div>
              <Link className="section__link" to="/catalogo">
                Comparar todos <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          <ul className="rail" style={{ '--rail-item': 'clamp(200px, 24vw, 290px)' }}>
            {ranking.map((p, i) => (
              <li key={p.id} data-reveal style={{ '--reveal-i': i % 6 }}>
                <PowerCard power={p} isFav={favoritos.includes(p.id)} onFav={toggleFav} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --------------------------------------------------------- elementos */}
      <section className="section section--lined" aria-labelledby="elementos">
        <div className="shell">
          <div className="section__head">
            <div className="section__head-text">
              <p className="index-mark">/ 02</p>
              <h2 className="section__title" id="elementos">
                Por elemento
              </h2>
              <p className="section__blurb">
                Cada elemento tem um índice de jogabilidade próprio no simulador: o que
                anula, o que é anulado e o que sai mais barato.
              </p>
            </div>
            <Link className="section__link" to="/afinidade">
              Testar minha afinidade <ArrowUpRight size={15} />
            </Link>
          </div>

          <ul className="element-grid">
            {elementos.map((el, i) => (
              <li key={el.nome} data-reveal style={{ '--reveal-i': i % 4 }}>
                <Link
                  to={`/catalogo?elemento=${encodeURIComponent(el.nome)}`}
                  className={`element-tile ${elementClass(el.nome)}`}
                >
                  <span className="element-tile__name">{el.nome}</span>
                  <span className="element-tile__ratio">
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <span className="element-tile__count">
                      {el.total} técnica{el.total > 1 ? 's' : ''}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      height: 2,
                      width: `${Math.round((el.total / maxElementos) * 100)}%`,
                      background: elementColor(el.nome)
                    }}
                  />
                </Link>
              </li>
            ))}

            {/* fecha a última linha da grade de 12 células */}
            <li data-reveal style={{ '--reveal-i': 3 }}>
              <Link className="element-tile element-tile--all" to="/catalogo">
                <span className="element-tile__name">Ver tudo</span>
                <span className="element-tile__ratio">
                  <span className="element-tile__count">{powersData.length} técnicas</span>
                  <ArrowUpRight size={14} />
                </span>
                <span aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- categorias */}
      <section className="section section--lined" aria-labelledby="categorias">
        <div className="shell">
          <div className="section__head">
            <div className="section__head-text">
              <p className="index-mark">/ 03</p>
              <h2 className="section__title" id="categorias">
                Sistemas de poder
              </h2>
              <p className="section__blurb">
                Do ninjutsu ao nen: as categorias mostram como cada obra constrói suas
                técnicas.
              </p>
            </div>
            <Link className="section__link" to="/catalogo">
              Todas as categorias <ArrowUpRight size={15} />
            </Link>
          </div>

          <div className="codex__list" data-reveal>
            {categorias.map((cat, i) => (
              <Link
                key={cat.nome}
                to={`/catalogo?categoria=${encodeURIComponent(cat.nome)}`}
                className="index-row"
              >
                <span className="index-mark">{String(i + 1).padStart(2, '0')}</span>
                <span className="index-row__name">{cat.nome}</span>
                <span className="index-row__count">
                  {cat.total} · <ArrowUpRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ arena */}
      <section className="section section--lined" aria-labelledby="arena">
        <div className="shell">
          <div className="section__head">
            <div className="section__head-text">
              <p className="index-mark">/ 04</p>
              <h2 className="section__title" id="arena">
                Leve para a arena
              </h2>
            </div>
          </div>

          <div className="arena">
            <div className="arena__cell" data-reveal style={{ '--reveal-i': 0 }}>
              <p className="arena__index label">Simulador de duelo</p>
              <div>
                <h3 className="arena__title">Duelo</h3>
                <p className="arena__text">
                  Escolha duas técnicas e veja a fórmula resolver o confronto: dano, custo,
                  multiplicador elemental e sua afinidade pessoal.
                </p>
              </div>
              <div className="arena__foot">
                <Link
                  className="btn"
                  to="/duelo"
                  onClick={() => navigate('/duelo')}
                >
                  <Swords size={16} />
                  Entrar na arena
                  <ArrowRight className="btn__arrow" />
                </Link>
              </div>
            </div>

            <div className="arena__cell" data-reveal style={{ '--reveal-i': 1 }}>
              <p className="arena__index label">Coleção pessoal</p>
              <div>
                <h3 className="arena__title">Grimório</h3>
                <p className="arena__text">
                  Guarde até seis técnicas no seu navegador, veja os totais de dano e custo
                  e exporte o grimório em JSON.
                </p>
              </div>
              <div className="arena__foot">
                <Link className="btn btn--ghost" to="/grimorio">
                  <Book size={16} />
                  Abrir grimório
                  <ArrowRight className="btn__arrow" />
                </Link>
              </div>
            </div>

            <div className="arena__cell" data-reveal style={{ '--reveal-i': 2 }}>
              <p className="arena__index label">Diagnóstico</p>
              <div>
                <h3 className="arena__title">Afinidade</h3>
                <p className="arena__text">
                  Cinco perguntas definem seu elemento e liberam bônus específicos
                  dentro do simulador.
                </p>
              </div>
              <div className="arena__foot">
                <Link className="btn btn--ghost" to="/afinidade">
                  <Spark size={16} />
                  Fazer o teste
                  <ArrowRight className="btn__arrow" />
                </Link>
              </div>
            </div>

            <div className="arena__cell" data-reveal style={{ '--reveal-i': 3 }}>
              <p className="arena__index label">Arquivo completo</p>
              <div>
                <h3 className="arena__title">Catálogo</h3>
                <p className="arena__text">
                  Busca por nome, personagem ou obra, com filtros de categoria, elemento,
                  dano e custo — tudo combinável.
                </p>
              </div>
              <div className="arena__foot">
                <Link className="btn btn--ghost" to="/catalogo">
                  Procurar técnica
                  <ArrowRight className="btn__arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
