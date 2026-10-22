import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import powersData from '../data/powers.json';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { elementClass } from '../data/elementMeta';
import { Plus, Trash, ArrowUpRight } from './Icons';

const MAX = 6;

export default function DeckBuilder() {
  const [deck, setDeck] = useLocalStorage('pa:deck', []);
  const [msg, setMsg] = useState('');
  const [importText, setImportText] = useState('');

  const deckPowers = useMemo(
    () => deck.map((id) => powersData.find((p) => p.id === id)).filter(Boolean),
    [deck]
  );
  const totalDano = deckPowers.reduce((s, p) => s + p.dano, 0);
  const totalCusto = deckPowers.reduce((s, p) => s + p.custo, 0);
  const vazio = deckPowers.length === 0;

  function add(id) {
    setMsg('');
    const nid = Number(id);
    if (deck.includes(nid)) return setMsg('Esta técnica já está no grimório.');
    if (deck.length >= MAX) return setMsg(`Limite de ${MAX} técnicas atingido. Remova uma para adicionar.`);
    setDeck([...deck, nid]);
  }

  function remove(id) {
    setDeck(deck.filter((d) => d !== id));
    setMsg('');
  }

  function exportar() {
    const json = JSON.stringify(deck, null, 2);
    navigator.clipboard?.writeText(json).catch(() => {});
    setImportText(json);
    setMsg('Grimório copiado para a área de transferência e abaixo, pronto para salvar.');
  }

  function importar() {
    try {
      const arr = JSON.parse(importText);
      if (!Array.isArray(arr)) throw new Error('formato');
      const validos = arr.map(Number).filter((n) => powersData.some((p) => p.id === n));
      const unicos = [...new Set(validos)].slice(0, MAX);
      if (unicos.length === 0) throw new Error('vazio');
      setDeck(unicos);
      setMsg(`${unicos.length} técnica(s) importada(s).`);
    } catch {
      setMsg('JSON inválido. Cole um array no formato [1, 5, 9].');
    }
  }

  const disponiveis = powersData.filter((p) => !deck.includes(p.id));

  return (
    <div className="codex">
      {/* ----------------------------------------------------- resumo */}
      <section className="codex__status" aria-label="Resumo do grimório">
        <div className="codex__slot">
          <span className="codex__slot-label">Técnicas</span>
          <span className={`codex__slot-value${vazio ? ' codex__slot-value--empty' : ''}`}>
            {String(deckPowers.length).padStart(2, '0')}/{MAX}
          </span>
          <span className="codex__slots" aria-hidden="true">
            {Array.from({ length: MAX }, (_, i) => (
              <span key={i} className={`codex__pip${i < deckPowers.length ? ' is-filled' : ''}`} />
            ))}
          </span>
        </div>
        <div className="codex__slot">
          <span className="codex__slot-label">Dano somado</span>
          <span className={`codex__slot-value${vazio ? ' codex__slot-value--empty' : ''} codex__slot-value--dmg`}>
            {totalDano}
          </span>
        </div>
        <div className="codex__slot">
          <span className="codex__slot-label">Custo somado</span>
          <span className={`codex__slot-value${vazio ? ' codex__slot-value--empty' : ''} codex__slot-value--cost`}>
            {totalCusto}
          </span>
        </div>
        <div className="codex__slot">
          <span className="codex__slot-label">Ações</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--ghost" onClick={exportar} disabled={vazio}>
              Exportar
            </button>
            <button type="button" className="btn btn--quiet" onClick={() => setDeck([])} disabled={vazio}>
              Limpar
            </button>
          </div>
        </div>
      </section>

      {msg && (
        <p role="status" className={`notice${msg.includes('inválido') || msg.includes('Limite') || msg.includes('já está') ? ' notice--neg' : ' notice--pos'}`}>
          {msg}
        </p>
      )}

      {/* ------------------------------------------------ lista do grimório */}
      <section>
        <div className="codex__picker-head">
          <h2 className="codex__picker-title">Seu grimório</h2>
          <span className="caption">{deckPowers.length} de {MAX} vagas preenchidas</span>
        </div>

        {vazio ? (
          <div className="empty-state">
            <p className="label">Compêndio vazio</p>
            <h3 className="empty-state__title">Nenhuma técnica guardada</h3>
            <p className="empty-state__text">
              Equipe até {MAX} técnicas na lista abaixo. Elas ficam salvas neste navegador e
              podem ser exportadas em JSON.
            </p>
            <Link className="btn" to="/catalogo">
              Procurar no catálogo <ArrowUpRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            <div className="codex__listhead" aria-hidden="true">
              <span />
              <span>Técnica</span>
              <span>Elemento</span>
              <span>Dano</span>
              <span>Custo</span>
              <span />
            </div>
            <div className="codex__list">
            {deckPowers.map((p, i) => (
              <article className="codex__entry" key={p.id}>
                <span className="index-mark">{String(i + 1).padStart(2, '0')}</span>
                <img className="codex__thumb" src={p.imagem} alt="" loading="lazy" />

                <div className="codex__text">
                  <h3 className="codex__name">
                    <Link to={`/poder/${p.id}`}>{p.nome}</Link>
                  </h3>
                  <p className="codex__meta">
                    {p.personagem} · {p.anime} · {p.categoria}
                  </p>
                </div>

                <div className="codex__stats">
                  <span className={`tag ${elementClass(p.elemento)}`}>{p.elemento}</span>
                  <span className="stat__value stat__value--dmg">{p.dano}</span>
                  <span className="stat__value stat__value--cost">{p.custo}</span>
                </div>

                <div className="codex__actions">
                  <Link
                    to={`/poder/${p.id}`}
                    className="icon-btn"
                    aria-label={`Ver detalhes de ${p.nome}`}
                    title="Ver detalhes"
                  >
                    <ArrowUpRight size={15} />
                  </Link>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => remove(p.id)}
                    aria-label={`Remover ${p.nome} do grimório`}
                    title="Remover"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          </>
        )}
      </section>

      {/* --------------------------------------------------- lista de seleção */}
      <section>
        <div className="codex__picker-head">
          <h2 className="codex__picker-title">Equipar técnica</h2>
          <span className="caption">{disponiveis.length} disponíveis</span>
        </div>

        <div className="codex__list">
          {disponiveis.map((p) => (
            <article className="codex__entry" key={p.id}>
              <img className="codex__thumb" src={p.imagem} alt="" loading="lazy" />

              <div className="codex__text">
                <h3 className="codex__name">{p.nome}</h3>
                <p className="codex__meta">
                  {p.personagem} · {p.anime} · {p.categoria}
                </p>
              </div>

              <div className="codex__stats">
                <span className={`tag ${elementClass(p.elemento)}`}>{p.elemento}</span>
                <span className="stat__value stat__value--dmg">{p.dano}</span>
                <span className="stat__value stat__value--cost">{p.custo}</span>
              </div>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => add(p.id)}
                disabled={deck.length >= MAX}
              >
                <Plus size={15} />
                Equipar
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- importar */}
      <section>
        <div className="codex__picker-head">
          <h2 className="codex__picker-title">Importar grimório</h2>
          <span className="caption">Cole um array JSON de ids</span>
        </div>

        <div className="codex__import">
          <div className="field">
            <label className="field__label" htmlFor="importar">
              JSON do grimório
            </label>
            <input
              id="importar"
              className="input"
              type="text"
              placeholder="[1, 5, 9]"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
          </div>
          <button type="button" className="btn" onClick={importar}>
            Importar
          </button>
        </div>
      </section>
    </div>
  );
}
