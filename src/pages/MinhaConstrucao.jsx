import { Link } from 'react-router-dom';
import { useCharacterGame } from '../context/useCharacterGame';
import { STAT_KEYS } from '../data/characters';
import { resolvePowerImage } from '../utils/imageHelper';
import GameSubNav from '../components/GameSubNav';
import { Swords } from '../components/Icons';
import '../styles/game.css';

export default function MinhaConstrucao() {
  const { activeBuild, battleStats } = useCharacterGame();
  const { stats, sources, classification, avatar, name, signatureMove } = activeBuild;

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 05 — Ficha Ativa</p>
          <h1 className="display d-xl">Minha Construção</h1>
          <p className="page-head__lede">
            Ficha técnica consolidada do seu personagem personalizado. Esta é a combinação que representará
            você em todos os duelos, partidas 2v2 e arenas de grupo.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 460px) 1fr',
            gap: '2.5rem',
            alignItems: 'start',
          }}
        >
          {/* Card Visual Heroico */}
          <div
            style={{
              background: 'radial-gradient(circle at top, #20202e 0%, #0c0c10 100%)',
              border: '2px solid var(--line-strong)',
              borderRadius: 'var(--r-lg)',
              padding: '2.5rem',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div
              style={{
                width: '240px',
                height: '240px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                border: '4px solid var(--signal)',
                overflow: 'hidden',
                boxShadow: '0 0 35px var(--signal-line)',
              }}
            >
              <img
                src={resolvePowerImage(avatar)}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.2rem',
                textTransform: 'uppercase',
                margin: '0 0 0.5rem',
                color: 'var(--text)',
              }}
            >
              {name}
            </h2>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <span className={`rank-badge rank-badge--${classification.rank}`}>
                {classification.rank}
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: classification.color }}>
                {classification.label} · Pontuação {classification.score}
              </span>
            </div>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)',
                padding: '0.8rem 1rem',
                marginBottom: '1.8rem',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>
                Técnica Especial Ativa
              </span>
              <p style={{ color: 'var(--signal)', fontWeight: 700, margin: '0.2rem 0 0', fontSize: '1rem' }}>
                💥 {signatureMove}
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.6rem',
                marginBottom: '1.8rem',
                padding: '0.8rem',
                background: 'var(--surface-1)',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--line)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>
                  Vitórias
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--pos)' }}>
                  {battleStats.wins}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>
                  Derrotas
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--neg)' }}>
                  {battleStats.losses}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>
                  Taxa
                </span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--signal)' }}>
                  {battleStats.winRate}%
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <Link
                to="/arena"
                className="btn-spin"
                style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Swords size={18} style={{ marginRight: '6px' }} /> Entrar na Arena
              </Link>
              <Link
                to="/construir"
                className="btn-replenish"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Modificar Atributos
              </Link>
            </div>
          </div>

          {/* Origem e Tabela Detalhada de Cada Atributo */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Genealogia dos Atributos
            </h3>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Esta tabela rastreia exatamente qual guerreiro da sua coleção forneceu cada atributo para a sua construção atual.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {STAT_KEYS.map(({ key, label, icon, desc }) => {
                const source = sources[key];
                const value = stats[key] || 50;

                return (
                  <div
                    key={key}
                    style={{
                      background: 'var(--surface-1)',
                      border: '1px solid var(--line)',
                      borderRadius: 'var(--r-md)',
                      padding: '1.2rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '150px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{icon}</span>
                      <div>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', color: 'var(--text)' }}>
                          {label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block' }}>
                          {desc}
                        </span>
                      </div>
                    </div>

                    {source && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1 }}>
                        <img
                          src={resolvePowerImage(source.imagem)}
                          alt={source.nome}
                          style={{ width: '42px', height: '42px', borderRadius: 'var(--r-sm)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
                            {source.nome}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            {source.anime} · <span className={`rarity-pill rarity-pill--${source.raridade}`} style={{ fontSize: '0.62rem', padding: '0.05rem 0.35rem' }}>{source.raridade}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--signal)' }}>
                        {value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
