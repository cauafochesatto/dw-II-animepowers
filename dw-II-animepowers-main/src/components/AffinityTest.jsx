import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { elementClass } from '../data/elementMeta';
import { Spark, ArrowUpRight } from './Icons';

const PERGUNTAS = [
  {
    q: 'Em batalha, você prefere…',
    opts: [['Atacar de frente', 'Fogo'], ['Controlar o ritmo', 'Água'], ['Ser imprevisível', 'Vento'], ['Resistir e contra-atacar', 'Terra'], ['Manipular energia pura', 'Energia']]
  },
  {
    q: 'Seu ambiente ideal…',
    opts: [['Vulcão / deserto', 'Fogo'], ['Oceano / chuva', 'Água'], ['Montanhas / céu', 'Vento'], ['Caverna / floresta', 'Terra'], ['Templo / vazio', 'Energia']]
  },
  {
    q: 'Seu defeito em luta…',
    opts: [['Impulsividade', 'Fogo'], ['Hesitação', 'Água'], ['Dispersão', 'Vento'], ['Teimosia', 'Terra'], ['Excesso de cálculo', 'Energia']]
  },
  {
    q: 'Técnica dos sonhos…',
    opts: [['Explosão colossal', 'Fogo'], ['Dragão de água', 'Água'], ['Lâmina invisível de vento', 'Vento'], ['Muralha inquebrável', 'Terra'], ['Feixe de energia', 'Energia']]
  },
  {
    q: 'Seu mestre seria…',
    opts: [['Ace / Tanjiro', 'Fogo'], ['Giyu / Hisoka', 'Água'], ['Naruto / Byakuya', 'Vento'], ['Gon / Midoriya', 'Terra'], ['Goku / Gojo', 'Energia']]
  }
];

const DESCR = {
  Fogo: 'Ofensivo e intenso. Bônus: +5 de dano em ataques de Fogo.',
  Água: 'Adaptável e fluído. Bônus: −5 de custo em ataques de Água.',
  Vento: 'Veloz e preciso. Bônus: +3 de aleatoriedade a favor.',
  Terra: 'Resistente e estável. Bônus: empates contam como vitória.',
  Energia: 'Equilibrado e arcano. Bônus: versátil em qualquer grimório.'
};

export default function AffinityTest() {
  const [respostas, setRespostas] = useState(Array(PERGUNTAS.length).fill(''));
  const [afinidade, setAfinidade] = useLocalStorage('pa:afinidade', null);
  const [erro, setErro] = useState('');

  function escolher(i, el) {
    setRespostas((r) => r.map((v, idx) => (idx === i ? el : v)));
    setErro('');
  }

  function calcular(e) {
    e.preventDefault();
    if (respostas.some((r) => !r)) {
      setErro('Responda as cinco perguntas para revelar a afinidade.');
      return;
    }
    const count = {};
    respostas.forEach((r) => { count[r] = (count[r] || 0) + 1; });
    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
    setAfinidade({ elemento: top, data: new Date().toISOString(), respostas });
  }

  function refazer() {
    setAfinidade(null);
    setRespostas(Array(PERGUNTAS.length).fill(''));
    setErro('');
  }

  const respondidas = respostas.filter(Boolean).length;

  return (
    <div className="codex">
      {afinidade && (
        <section className={`codex__status ${elementClass(afinidade.elemento)}`} role="status">
          <div className="codex__slot" style={{ gridColumn: 'span 12' }}>
            <span className="codex__slot-label">Sua afinidade</span>
            <span
              className="display d-lg"
              style={{ color: 'var(--element)', marginBlock: '0.25rem' }}
            >
              {afinidade.elemento}
            </span>
            <p className="muted" style={{ maxWidth: '48ch' }}>
              {DESCR[afinidade.elemento]}
            </p>
          </div>
          <div className="codex__slot">
            <span className="codex__slot-label">Próximo passo</span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link className="btn btn--ghost" to="/duelo">
                Testar na arena <ArrowUpRight size={15} />
              </Link>
              <button type="button" className="btn btn--quiet" onClick={refazer}>
                Refazer teste
              </button>
            </div>
          </div>
        </section>
      )}

      <form className="quiz" onSubmit={calcular}>
        {PERGUNTAS.map((p, i) => (
          <fieldset key={i} className="quiz__q">
            <legend className="quiz__legend">
              <span className="index-mark">{String(i + 1).padStart(2, '0')}</span>
              {p.q}
            </legend>
            <div className="quiz__opts">
              {p.opts.map(([label, el]) => (
                <label key={el} className={`quiz__opt ${elementClass(el)}`}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={respostas[i] === el}
                    onChange={() => escolher(i, el)}
                  />
                  <span>{label}</span>
                  <span className="tag">{el}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {erro && (
          <p role="alert" className="notice notice--neg">
            {erro}
          </p>
        )}

        <div className="duel-actions">
          <button type="submit" className="btn btn--lg">
            <Spark size={16} />
            Revelar afinidade
          </button>
          <span className="caption">
            {respondidas} de {PERGUNTAS.length} respondidas
          </span>
        </div>
      </form>
    </div>
  );
}
