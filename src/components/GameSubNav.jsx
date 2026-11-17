import { NavLink } from 'react-router-dom';
import { useCharacterGame } from '../context/useCharacterGame';

const GAME_TABS = [
  { to: '/arena', label: '⚔️ Arena', key: 'arena' },
  { to: '/torneio', label: '🏆 Torneio', key: 'torneio' },
  { to: '/giros', label: '🎲 Giros', key: 'giros', badge: true },
  { to: '/colecao', label: '📖 Minha Coleção', key: 'colecao' },
  { to: '/construir', label: '🛠️ Construir Personagem', key: 'construir' },
  { to: '/minha-construcao', label: '👤 Minha Construção', key: 'minha-construcao' },
  { to: '/ranking', label: '🏆 Ranking', key: 'ranking' },
  { to: '/historico', label: '📜 Histórico', key: 'historico' },
  { to: '/amigos', label: '👥 Amigos', key: 'amigos' },
];

export default function GameSubNav() {
  const { spins } = useCharacterGame();

  return (
    <nav className="game-subnav" aria-label="Navegação do Jogo">
      {GAME_TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          className={({ isActive }) =>
            `game-subnav__link${isActive ? ' is-active' : ''}`
          }
        >
          <span>{tab.label}</span>
          {tab.badge && spins > 0 && (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.1rem 0.4rem',
                borderRadius: '999px',
                background: 'var(--signal)',
                color: 'var(--signal-ink)',
                fontWeight: 800,
              }}
            >
              {spins}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

