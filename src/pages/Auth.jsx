import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import powersData from '../data/powers.json';
import { elementClass } from '../data/elementMeta';
import { ArrowRight, ArrowUpRight, Spark, Check, AlertTriangle, Info } from '../components/Icons';
import '../styles/auth.css';

const DESTAQUES = [
  { titulo: 'Catálogo completo', texto: 'Busque por técnica, personagem ou obra e filtre por elemento, dano e custo.' },
  { titulo: 'Arena de duelo', texto: 'A fórmula aplica dano, custo, afinidade elemental e o seu elemento pessoal.' },
  { titulo: 'Grimório pessoal', texto: 'Guarde até seis técnicas no navegador e exporte a coleção em JSON.' }
];

const ALERT_ICON = { error: AlertTriangle, success: Check, info: Info };

export default function Auth({ initialMode = 'login' }) {
  const location = useLocation();
  const ehCadastro = location.pathname.includes('cadastro');
  const ehLogin = location.pathname.includes('login') ? true : !ehCadastro && initialMode === 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error' | 'info', text: '' }
  const [isLoading, setIsLoading] = useState(false);
  const [googlePronto, setGooglePronto] = useState(false);

  const {
    login,
    register,
    renderGoogleButton,
    currentUser
  } = useAuth();

  const navigate = useNavigate();
  const googleBtnContainerRef = useRef(null);

  // Se o usuário já estiver logado, redireciona para o catálogo
  useEffect(() => {
    if (currentUser) {
      const timer = setTimeout(() => navigate('/catalogo'), 600);
      return () => clearTimeout(timer);
    }
  }, [currentUser, navigate]);

  // Botão oficial do Google Identity Services. Enquanto ele não carrega,
  // mostramos um aviso honesto em vez de um botão falso.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!googleBtnContainerRef.current) return;
      const ok = renderGoogleButton(googleBtnContainerRef.current, { width: 320 });
      setGooglePronto(Boolean(ok));
    }, 500);
    return () => clearTimeout(timer);
  }, [renderGoogleButton]);

  function trocarModo(paraCadastro) {
    setAlert(null);
    navigate(paraCadastro ? '/cadastro' : '/login');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);

    if (!email.trim() || !password.trim()) {
      setAlert({
        type: 'error',
        text: ehLogin
          ? 'Informe e-mail e senha para continuar.'
          : 'Preencha e-mail e senha para criar a conta.'
      });
      return;
    }

    if (!ehLogin && password !== confirmPassword) {
      setAlert({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setIsLoading(true);
    const res = ehLogin ? login(email, password, rememberMe) : register(email, password, null);
    setIsLoading(false);

    if (res.success) {
      setAlert({ type: 'success', text: `${res.message} Levando você ao catálogo...` });
      setTimeout(() => navigate('/catalogo'), 700);
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  }

  function handleForgotPassword() {
    setAlert({
      type: 'info',
      text: email
        ? `A recuperação de senha depende de um backend e ainda não está disponível. Você pode criar uma nova conta com ${email}.`
        : 'A recuperação de senha depende de um backend e ainda não está disponível.'
    });
  }

  const AlertIcon = alert ? ALERT_ICON[alert.type] || Info : Info;

  return (
    <div className="auth">
      {/* ---------------------------------------------------- formulário */}
      <section className="auth__panel">
        <Link to="/" className="brand auth__brand">
          Anime<span className="brand__dot" aria-hidden="true" />
          Powers
        </Link>

        <header className="auth__head">
          <p className="index-mark">/ acesso</p>
          <h1 className="display d-lg">{ehLogin ? 'Entrar' : 'Criar conta'}</h1>
          <p className="auth__sub">
            {ehLogin ? 'Ainda não tem conta? ' : 'Já tem conta? '}
            <button type="button" className="auth__switch" onClick={() => trocarModo(!ehLogin)}>
              {ehLogin ? 'Criar agora' : 'Entrar'}
            </button>
          </p>
        </header>

        {alert && (
          <p className={`notice notice--${alert.type === 'error' ? 'neg' : alert.type === 'success' ? 'pos' : 'signal'}`} role="alert">
            <AlertIcon size={15} />
            {alert.text}
          </p>
        )}

        <div ref={googleBtnContainerRef} className="auth__google-native" />

        {!googlePronto && (
          <p className="auth__google-off">
            O acesso com Google não pôde ser carregado — o recurso depende de conexão com o
            Google. Use e-mail e senha abaixo.
          </p>
        )}

        <div className="auth__divider">
          <span>{googlePronto ? 'ou use e-mail' : 'acesso por e-mail'}</span>
        </div>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="auth-email">
              E-mail
            </label>
            <input
              id="auth-email"
              className="input"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <div className="auth__label-row">
              <label className="field__label" htmlFor="auth-password">
                Senha
              </label>
              {ehLogin && (
                <button type="button" className="auth__link" onClick={handleForgotPassword}>
                  Esqueci a senha
                </button>
              )}
            </div>
            <div className="auth__password">
              <input
                id="auth-password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={ehLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="auth__reveal"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {!ehLogin && (
            <div className="field">
              <label className="field__label" htmlFor="auth-confirm">
                Confirmar senha
              </label>
              <input
                id="auth-confirm"
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <label className="switch">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Permanecer conectado
          </label>

          <button type="submit" className="btn btn--lg btn--block" disabled={isLoading}>
            {isLoading ? 'Conectando...' : ehLogin ? 'Entrar' : 'Criar conta'}
            {!isLoading && <ArrowRight className="btn__arrow" />}
          </button>

          <p className="auth__note">
            A conta e a sessão ficam apenas neste navegador. Nenhum dado é enviado para um
            servidor.
          </p>
        </form>
      </section>

      {/* ------------------------------------------------------ showcase */}
      <aside className="auth__aside" aria-label="Sobre o catálogo">
        <div className="auth__aside-top">
          <Link to="/catalogo" className="auth__link">
            Explorar sem entrar <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="auth__facts">
          {[
            { v: powersData.length, l: 'técnicas' },
            { v: new Set(powersData.map((p) => p.elemento)).size, l: 'elementos' },
            { v: new Set(powersData.map((p) => p.anime)).size, l: 'obras' }
          ].map((f) => (
            <div key={f.l}>
              <p className="display d-md">{f.v}</p>
              <p className="label">{f.l}</p>
            </div>
          ))}
        </div>

        <ul className="auth__showcase">
          {[...powersData]
            .sort((a, b) => b.dano - a.dano)
            .slice(0, 4)
            .map((p) => (
              <li key={p.id} className={elementClass(p.elemento)}>
                <Link to={`/poder/${p.id}`}>
                  <img src={p.imagem} alt="" loading="lazy" />
                  <span className="auth__showcase-copy">
                    <span className="tag">{p.elemento}</span>
                    <span className="auth__showcase-name">{p.nome}</span>
                    <span className="caption">{p.personagem}</span>
                  </span>
                </Link>
              </li>
            ))}
        </ul>

        <div className="auth__list">
          <p className="label">O que dá para fazer</p>
          {DESTAQUES.map((d) => (
            <div className="auth__list-item" key={d.titulo}>
              <Spark size={14} />
              <div>
                <p className="auth__list-title">{d.titulo}</p>
                <p className="caption">{d.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
