import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useFriends } from '../context/FriendsContext';
import { useCharacterGame } from '../context/useCharacterGame';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/arena', label: 'Arena', index: '01' },
  { to: '/giros', label: 'Giros', index: '02', spinBadge: true },
  { to: '/colecao', label: 'Coleção', index: '03' },
  { to: '/construir', label: 'Construir', index: '04' },
  { to: '/minha-construcao', label: 'Minha Ficha', index: '05' },
  { to: '/ranking', label: 'Ranking', index: '06' },
  { to: '/historico', label: 'Histórico', index: '07' },
  { to: '/amigos', label: 'Amigos', index: '08', notif: true },
  { to: '/catalogo', label: 'Catálogo', index: '09' },
  { to: '/grimorio', label: 'Grimório', index: '10' },
  { to: '/afinidade', label: 'Afinidade', index: '11' },
];

export default function Header() {
  const { currentUser, logout } = useAuth();
  const { totalNotifications } = useFriends();
  const { spins } = useCharacterGame();
  const [open, setOpen] = useState(false);

  const fechar = () => setOpen(false);

  useEffect(() => {
    document.body.dataset.locked = open ? 'true' : 'false';
    return () => {
      document.body.dataset.locked = 'false';
    };
  }, [open]);

  return (
    <>
      <header className={`site-head${open ? ' is-open' : ''}`}>
        <div className="shell site-head__bar">
          <Link to="/" className="brand" onClick={fechar}>
            Anime<span className="brand__dot" aria-hidden="true" />
            Powers
          </Link>

          <nav className="site-nav" aria-label="Navegação principal">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `site-nav__link${isActive ? ' is-active' : ''}${item.notif ? ' header-notif' : ''}`
                }
                onClick={fechar}
              >
                {item.label}
                {item.notif && totalNotifications > 0 && (
                  <span className="header-notif__badge">{totalNotifications}</span>
                )}
                {item.spinBadge && spins > 0 && (
                  <span
                    style={{
                      marginLeft: '4px',
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.35rem',
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

            <div className="site-nav__actions">
              {currentUser ? (
                <>
                  <span className="user-chip" title={`${currentUser.email} — ${currentUser.role || 'usuário'}`}>
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt=""
                        className="user-chip__avatar"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    ) : (
                      <span className="user-chip__avatar" aria-hidden="true" />
                    )}
                    <span className="user-chip__name">
                      {currentUser.name || currentUser.email.split('@')[0]}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn--quiet"
                    onClick={() => {
                      logout();
                      fechar();
                    }}
                  >
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="site-nav__link" onClick={fechar}>
                    Entrar
                  </NavLink>
                  <NavLink to="/cadastro" className="btn" onClick={fechar}>
                    Criar conta
                  </NavLink>
                </>
              )}
            </div>
          </nav>

          <button
            type="button"
            className="nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Overlay mobile */}
      <div
        className={`site-nav-overlay${open ? ' is-open' : ''}`}
        aria-hidden="true"
        onClick={fechar}
      >
        <div className="site-nav-overlay__panel" onClick={(e) => e.stopPropagation()}>
          <div className="site-nav-overlay__head">
            <span className="brand">
              Anime<span className="brand__dot" aria-hidden="true" />
              Powers
            </span>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={fechar}
              aria-label="Fechar menu"
            >
              ✕
            </button>
          </div>

          <div className="site-nav-overlay__list">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `site-nav-overlay__link${isActive ? ' is-active' : ''}`
                }
                onClick={fechar}
              >
                <span className="site-nav-overlay__index">{item.index}</span>
                <span>{item.label}</span>
                {item.notif && totalNotifications > 0 && (
                  <span className="fr-notif-dot" style={{ marginLeft: 'auto' }}>
                    {totalNotifications}
                  </span>
                )}
                {item.spinBadge && spins > 0 && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.72rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '999px',
                      background: 'var(--signal)',
                      color: 'var(--signal-ink)',
                      fontWeight: 800,
                    }}
                  >
                    {spins} giros
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="site-nav-overlay__foot">
            {currentUser ? (
              <button
                type="button"
                className="btn btn--block"
                onClick={() => {
                  logout();
                  fechar();
                }}
              >
                Sair ({currentUser.name || currentUser.email})
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <NavLink to="/login" className="btn btn--ghost" style={{ flex: 1 }} onClick={fechar}>
                  Entrar
                </NavLink>
                <NavLink to="/cadastro" className="btn" style={{ flex: 1 }} onClick={fechar}>
                  Criar conta
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
