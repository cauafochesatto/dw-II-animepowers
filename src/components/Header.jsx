import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', label: 'Início', index: '01' },
  { to: '/catalogo', label: 'Catálogo', index: '02' },
  { to: '/duelo', label: 'Duelo', index: '03' },
  { to: '/grimorio', label: 'Grimório', index: '04' },
  { to: '/afinidade', label: 'Afinidade', index: '05' }
];

export default function Header() {
  const { currentUser, logout } = useAuth();
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
          <Link to="/" className="brand">
            Anime<span className="brand__dot" aria-hidden="true" />
            Powers
          </Link>

          <nav className="site-nav" aria-label="Navegação principal">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `site-nav__link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
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
                  <NavLink to="/login" className="site-nav__link">
                    Entrar
                  </NavLink>
                  <NavLink to="/cadastro" className="btn">
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
            aria-label={open ? 'Fechar navegação' : 'Abrir navegação'}
          >
            <span className="nav-toggle__lines" />
          </button>
        </div>
      </header>

      {open && (
        <>
          <div className="nav-scrim" onClick={fechar} />
          <nav className="nav-panel" aria-label="Navegação">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-panel__link${isActive ? ' is-active' : ''}`}
                onClick={fechar}
              >
                {item.label}
                <span>{item.index}</span>
              </NavLink>
            ))}

            <div className="nav-panel__foot">
              {currentUser ? (
                <>
                  <p className="caption">
                    Conectado como <strong>{currentUser.email}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn--ghost btn--block"
                    onClick={() => {
                      logout();
                      fechar();
                    }}
                  >
                    Sair da conta
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="btn btn--ghost btn--block">
                    Entrar
                  </NavLink>
                  <NavLink to="/cadastro" className="btn btn--block">
                    Criar conta
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
