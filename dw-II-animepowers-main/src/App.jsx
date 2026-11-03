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
import Amigos from './pages/Amigos';

// Novas Páginas — Sistema Build An Anime Character
import Arena from './pages/Arena';
import Giros from './pages/Giros';
import Colecao from './pages/Colecao';
import Construir from './pages/Construir';
import MinhaConstrucao from './pages/MinhaConstrucao';
import Ranking from './pages/Ranking';
import Historico from './pages/Historico';

import { AuthProvider } from './context/AuthContext';
import { FriendsProvider } from './context/FriendsContext';
import { CharacterProvider } from './context/CharacterContext';
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
import './styles/friends.css';
import './styles/game.css';

const FOOTER_LINKS = [
  {
    title: 'Combate & Construção',
    links: [
      { to: '/arena', label: '⚔️ Arena de Batalhas' },
      { to: '/giros', label: '🎲 Giros de Personagens' },
      { to: '/colecao', label: '📖 Minha Coleção' },
      { to: '/construir', label: '🛠️ Construir Personagem' },
      { to: '/minha-construcao', label: '👤 Minha Construção' },
      { to: '/ranking', label: '🏆 Ranking Competitivo' },
      { to: '/historico', label: '📜 Histórico de Batalhas' },
      { to: '/amigos', label: '👥 Amigos & Desafios' },
    ],
  },
  {
    title: 'Acervo de Técnicas',
    links: [
      { to: '/catalogo', label: 'Catálogo de Poderes' },
      { to: '/grimorio', label: 'Grimório Pessoal' },
      { to: '/afinidade', label: 'Teste de Afinidade' },
      { to: '/duelo', label: 'Simulador Clássico' },
    ],
  },
  {
    title: 'Conta & Acesso',
    links: [
      { to: '/login', label: 'Entrar na Conta' },
      { to: '/cadastro', label: 'Criar Conta' },
    ],
  },
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
              Jogo de construção de personagens e arena de batalhas de anime com sorteio de guerreiros,
              síntese de atributos, duelos 1v1, 2v2 e battle royale.
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
          <p>Anime Powers · Inspirado no ciclo de Build An Anime Character · Dados acadêmicos</p>
          <p>Coleção, giros, construção de atributos e histórico persistidos localmente</p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FriendsProvider>
        <CharacterProvider>
          <HashRouter>
            <Header />

            <main>
              <Routes>
                {/* Rotas Principais do Jogo */}
                <Route path="/arena" element={<Arena />} />
                <Route path="/giros" element={<Giros />} />
                <Route path="/colecao" element={<Colecao />} />
                <Route path="/construir" element={<Construir />} />
                <Route path="/minha-construcao" element={<MinhaConstrucao />} />
                <Route path="/ranking" element={<Ranking />} />
                <Route path="/historico" element={<Historico />} />

                {/* Compatibilidade de Duelo / Simulador */}
                <Route path="/duelo" element={<Arena />} />
                <Route path="/duelo-classico" element={<Duelo />} />

                {/* Rotas Pré-Existentes Preservadas */}
                <Route path="/" element={<Home />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/poder/:id" element={<Poder />} />
                <Route path="/grimorio" element={<Grimorio />} />
                <Route path="/afinidade" element={<Afinidade />} />
                <Route path="/amigos" element={<Amigos />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>

            <Footer />
          </HashRouter>
        </CharacterProvider>
      </FriendsProvider>
    </AuthProvider>
  );
}
