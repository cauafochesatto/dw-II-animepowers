import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Poder from './pages/Poder';
import Duelo from './pages/Duelo';
import Grimorio from './pages/Grimorio';
import Afinidade from './pages/Afinidade';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import { AuthProvider } from './context/AuthContext';
import { Link } from 'react-router-dom';

import './styles/fonts.css';
import './styles/globals.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/home.css';
import './styles/catalog.css';
import './styles/detail.css';
import './styles/duel.css';
import './styles/grimoire.css';

const FOOTER_LINKS = [
  {
    title: 'Navegar',
    links: [
      { to: '/catalogo', label: 'Catálogo' },
      { to: '/duelo', label: 'Simulador de duelo' },
      { to: '/grimorio', label: 'Grimório' },
      { to: '/afinidade', label: 'Teste de afinidade' }
    ]
  },
  {
    title: 'Conta',
    links: [
      { to: '/login', label: 'Entrar' },
      { to: '/cadastro', label: 'Criar conta' }
    ]
  }
];

function Footer() {
  return (
    <footer className="site-foot">
      <div className="shell">
        <div className="site-foot__grid">
          <div>
            <p className="site-foot__title">
              Anime
              <br />
              Powers
            </p>
            <p className="site-foot__blurb">
              Arquivo de técnicas de anime com atributos comparáveis, arena de duelo e
              grimório pessoal.
            </p>
          </div>

          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <p className="site-foot__col-title">{col.title}</p>
              <div className="site-foot__links">
                {col.links.map((l) => (
                  <Link key={l.to} to={l.to}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="site-foot__base">
          <p>Projeto de estudo front-end · dados de exemplo para fins acadêmicos</p>
          <p>Favoritos, grimório e histórico ficam salvos só neste navegador</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Header />

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/poder/:id" element={<Poder />} />
            <Route path="/duelo" element={<Duelo />} />
            <Route path="/grimorio" element={<Grimorio />} />
            <Route path="/afinidade" element={<Afinidade />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>

        <Footer />
      </HashRouter>
    </AuthProvider>
  );
}
