import { useMemo, useState, useCallback } from 'react';
import powersData from '../data/powers.json';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getElementalMultiplier, getElementalRelation, getPlayerAffinityBonus } from '../data/elementalAffinities';
import { elementClass } from '../data/elementMeta';
import { narrarBatalha, analisarDuelo } from '../services/geminiService';
import { Swords, Spark, Close, Star, Trash } from './Icons';

function baseScore(p) {
  return p.dano * 0.7 + (100 - p.custo) * 0.3 + Math.random() * 10;
}

/** Preserva a fórmula já usada nos testes. */
function calculateFinalScore(power, opponentElement, playerAffinity) {
  let score = baseScore(power);
  const elementalMultiplier = getElementalMultiplier(power.elemento, opponentElement);
  score *= elementalMultiplier;
  const affinityBonus = getPlayerAffinityBonus(playerAffinity, power.elemento);
  score *= affinityBonus.multiplicador;
  score += affinityBonus.extra;
  return { score, elementalMultiplier, affinityBonus };
}

const RELACAO = {
  vantagem: { label: 'vantagem +20%', classe: 'tally__rel--up' },
  desvantagem: { label: 'desvantagem −20%', classe: 'tally__rel--down' },
  neutro: { label: 'neutro', classe: 'tally__rel--flat' }
};

function FighterSide({ power, valor, seletor, aoMudar, lado }) {
  if (!power) return null;
  return (
    <div className={`duel-side${lado === 'b' ? ' duel-side--b' : ''}`}>
      <div className="duel-side__head">
        <span className="label">{lado === 'a' ? 'Lutador 1' : 'Lutador 2'}</span>
        <span className={`tag ${elementClass(power.elemento)}`}>{power.elemento}</span>
      </div>

      <div className="duel-side__thumb">
        <img src={power.imagem} alt="" loading="lazy" />
        <span className={`duel-side__badge${lado === 'b' ? ' duel-side__badge--b' : ''}`}>
          {power.alcance}
        </span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor={seletor}>
          Técnica
        </label>
        <select
          id={seletor}
          className="select"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
        >
          {powersData.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} — {p.personagem}
            </option>
          ))}
        </select>
      </div>

      <p className="duel-side__owner">
        {power.personagem} · {power.anime} · {power.categoria}
      </p>

      <div className="stats">
        <span className="stat">
          <span className="stat__label">Dano</span>
          <span className="stat__value stat__value--dmg">{power.dano}</span>
        </span>
        <span className="stat">
          <span className="stat__label">Custo</span>
          <span className="stat__value stat__value--cost">{power.custo}</span>
        </span>
      </div>
    </div>
  );
}

export default function DuelSimulator({ initialPowerId = null }) {
  const preselect = powersData.some((p) => p.id === Number(initialPowerId))
    ? Number(initialPowerId)
    : null;

  const [idA, setIdA] = useState(preselect ?? powersData[4].id);
  const [idB, setIdB] = useState(
    preselect !== null && preselect === powersData[0].id ? powersData[5].id : powersData[0].id
  );
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useLocalStorage('pa:duelos', []);
  const [playerAffinity] = useLocalStorage('pa:afinidade', null);
  const [narracao, setNarracao] = useState(null);
  const [analise, setAnalise] = useState(null);
  const [loadingNarracao, setLoadingNarracao] = useState(false);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [erroIA, setErroIA] = useState(null);

  const powerA = useMemo(() => powersData.find((p) => p.id === Number(idA)), [idA]);
  const powerB = useMemo(() => powersData.find((p) => p.id === Number(idB)), [idB]);
  const userAffinity = playerAffinity?.elemento || null;

  async function lutar() {
    if (!powerA || !powerB) return;
    if (powerA.id === powerB.id) {
      setResultado({ erro: 'Escolha duas técnicas diferentes.' });
      return;
    }

    const resultA = calculateFinalScore(powerA, powerB.elemento, userAffinity);
    const resultB = calculateFinalScore(powerB, powerA.elemento, userAffinity);

    const vencedor = resultA.score >= resultB.score ? powerA : powerB;
    const total = resultA.score + resultB.score;
    const hpA = Math.round((resultA.score / total) * 100);
    const hpB = 100 - hpA;

    const relA = getElementalRelation(powerA.elemento, powerB.elemento);
    const relB = getElementalRelation(powerB.elemento, powerA.elemento);

    setResultado({
      sA: resultA.score,
      sB: resultB.score,
      vencedor,
      hpA,
      hpB,
      relA,
      relB,
      efeitosA: resultA.affinityBonus.efeitos,
      efeitosB: resultB.affinityBonus.efeitos,
      afinidade: userAffinity
    });
    setNarracao(null);
    setAnalise(null);
    setErroIA(null);

    setHistorico((h) =>
      [
        {
          data: new Date().toISOString(),
          a: powerA.nome,
          b: powerB.nome,
          vencedor: vencedor.nome,
          placar: `${resultA.score.toFixed(1)} x ${resultB.score.toFixed(1)}`
        },
        ...h
      ].slice(0, 20)
    );

    // o serviço de narração espera este formato de resumo
    const resumo = {
      sA: resultA.score,
      sB: resultB.score,
      vencedor,
      elementalRelationA: relA,
      elementalRelationB: relB
    };

    setLoadingNarracao(true);
    try {
      setNarracao(await narrarBatalha(powerA, powerB, resumo));
    } catch (err) {
      console.error('[Gemini narrarBatalha]', err);
      setErroIA(err?.message || 'Falha ao narrar a batalha.');
    } finally {
      setLoadingNarracao(false);
    }
  }

  const handleAnalisarDuelo = useCallback(async () => {
    if (!powerA || !powerB) return;
    setLoadingAnalise(true);
    setAnalise(null);
    setErroIA(null);
    try {
      setAnalise(await analisarDuelo(powerA, powerB));
    } catch (err) {
      console.error('[Gemini analisarDuelo]', err);
      setErroIA(err?.message || 'Falha ao analisar.');
    } finally {
      setLoadingAnalise(false);
    }
  }, [powerA, powerB]);

  function limpar() {
    setResultado(null);
    setNarracao(null);
    setAnalise(null);
    setErroIA(null);
  }

  return (
    <div className="arena-page">
      <div className="duel-pickers">
        <FighterSide power={powerA} valor={idA} seletor="duelo-a" aoMudar={setIdA} lado="a" />

        <div className="duel-vs" aria-hidden="true">
          <span className="duel-vs__mark">vs</span>
          <span className="duel-vs__hint">Confronto</span>
        </div>

        <FighterSide power={powerB} valor={idB} seletor="duelo-b" aoMudar={setIdB} lado="b" />
      </div>

      <div className="duel-actions">
        <button type="button" className="btn btn--lg" onClick={lutar}>
          <Swords size={17} />
          Iniciar duelo
          <span className="btn__arrow" aria-hidden="true">→</span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleAnalisarDuelo} disabled={loadingAnalise}>
          <Spark size={15} />
          {loadingAnalise ? 'Analisando...' : 'Análise pré-duelo'}
        </button>
        <button type="button" className="btn btn--quiet" onClick={limpar}>
          <Close size={15} />
          Limpar
        </button>
      </div>

      {erroIA && (
        <p role="alert" className="notice notice--neg">
          <Spark size={15} />
          {erroIA}
        </p>
      )}

      {resultado?.erro && (
        <p role="alert" className="notice notice--neg">
          {resultado.erro}
        </p>
      )}

      {analise && (
        <div className="narrative">
          <p className="narrative__title">Análise da IA</p>
          <p className="narrative__body">{analise}</p>
        </div>
      )}

      {resultado && !resultado.erro && (
        <section className="duel-result" aria-live="polite">
          <div className="duel-result__head">
            <span className="label">Resultado</span>
            <p className="caption">
              dano × 0.7 + (100 − custo) × 0.3 + sorte, ajustado por elemento
              {resultado.afinidade ? ` e pela afinidade ${resultado.afinidade}` : ''}
            </p>
          </div>

          <h2 className="duel-result__winner-name">{resultado.vencedor.nome}</h2>
          <p className="duel-result__winner-meta">
            Vence por {resultado.sA >= resultado.sB ? resultado.sA.toFixed(1) : resultado.sB.toFixed(1)} pontos
            <br />
            {resultado.vencedor.personagem} · {resultado.vencedor.anime}
          </p>

          <div className="duel-result__scores">
            <div className="tally">
              <div className="tally__head">
                <span>
                  {powerA.nome}{' '}
                  <span className={`tally__rel ${RELACAO[resultado.relA].classe}`}>
                    {RELACAO[resultado.relA].label}
                  </span>
                </span>
                <span>{resultado.hpA}%</span>
              </div>
              <div className="meter__bar">
                <span className="meter__fill" style={{ width: `${resultado.hpA}%` }} />
              </div>
            </div>

            <div className="tally">
              <div className="tally__head">
                <span>
                  {powerB.nome}{' '}
                  <span className={`tally__rel ${RELACAO[resultado.relB].classe}`}>
                    {RELACAO[resultado.relB].label}
                  </span>
                </span>
                <span>{resultado.hpB}%</span>
              </div>
              <div className="meter__bar">
                <span className="meter__fill meter__fill--alt" style={{ width: `${resultado.hpB}%` }} />
              </div>
            </div>
          </div>

          {(resultado.efeitosA.length > 0 || resultado.efeitosB.length > 0) && (
            <div className="duel-result__effects">
              <p className="narrative__title">Afinidade em campo</p>
              <ul className="history">
                {resultado.efeitosA.map((e, i) => (
                  <li className="history__row" key={`a-${i}`}>
                    <span>{powerA.nome}</span>
                    <span className="caption">{e}</span>
                  </li>
                ))}
                {resultado.efeitosB.map((e, i) => (
                  <li className="history__row" key={`b-${i}`}>
                    <span>{powerB.nome}</span>
                    <span className="caption">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {loadingNarracao && (
        <div className="narrative narrative--loading">
          <p className="narrative__title">Narrando o confronto...</p>
        </div>
      )}

      {narracao && !loadingNarracao && (
        <div className="narrative">
          <p className="narrative__title">Narrativa do confronto</p>
          <p className="narrative__body">{narracao}</p>
        </div>
      )}

      {userAffinity && (
        <p className="notice notice--signal">
          <Star filled size={15} />
          Afinidade <strong>{userAffinity}</strong> ativa: poderes desse elemento recebem bônus.
        </p>
      )}

      <section>
        <div className="codex__picker-head">
          <h2 className="codex__picker-title">Histórico</h2>
          <span className="caption">{historico.length} duelo(s) registrado(s)</span>
        </div>

        {historico.length === 0 ? (
          <p className="muted">Nenhum duelo ainda. O histórico fica salvo neste navegador.</p>
        ) : (
          <div className="history">
            {historico.map((h, i) => (
              <div className="history__row" key={i}>
                <span>
                  {h.a} <span className="muted">×</span> {h.b}
                </span>
                <span className="history__winner">→ {h.vencedor}</span>
                <span className="history__score">{h.placar}</span>
              </div>
            ))}
          </div>
        )}

        {historico.length > 0 && (
          <div className="duel-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn--quiet" onClick={() => setHistorico([])}>
              <Trash size={15} />
              Apagar histórico
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
