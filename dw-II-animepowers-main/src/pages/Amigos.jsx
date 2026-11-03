import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useFriends } from '../context/FriendsContext';
import { useCharacterGame } from '../context/useCharacterGame';
import { resolvePowerImage } from '../utils/imageHelper';
import { STAT_KEYS, calculateBuildClassification } from '../data/characters';
import GameSubNav from '../components/GameSubNav';
import {
  Search,
  Check,
  Close,
  Swords,
  ArrowRight,
  AlertTriangle,
  Plus,
} from '../components/Icons';
import '../styles/friends.css';
import '../styles/game.css';

/* ------------------------------------------------------------------ helpers */
function timeAgo(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function Avatar({ user, size = 36 }) {
  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const [err, setErr] = useState(false);

  if (user?.avatar && !err) {
    return (
      <img
        src={user.avatar}
        alt={user.name || user.email}
        className="fr-avatar"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <span
      className="fr-avatar fr-avatar--initials"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-label={user?.name || user?.email}
    >
      {initials}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pendente', cls: 'fr-badge--warn' },
    accepted: { label: 'Aceito', cls: 'fr-badge--pos' },
    declined: { label: 'Recusado', cls: 'fr-badge--neg' },
  };
  const { label, cls } = map[status] || { label: status, cls: '' };
  return <span className={`fr-badge ${cls}`}>{label}</span>;
}

/* ================================================================ TABS */
const TABS = [
  { id: 'amigos', label: 'Meus amigos' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'buscar', label: 'Buscar jogadores' },
  { id: 'batalhas', label: 'Batalhas' },
];

/* ================================================================ Modal Desafio */
function BattleModal({ friend, activeBuild, onClose, onSend }) {
  const [msg, setMsg] = useState('');
  const [battleFormat, setBattleFormat] = useState('1v1');
  const [sent, setSent] = useState(false);

  function handleSend() {
    const battlePayload = {
      format: battleFormat,
      build: {
        name: activeBuild.name,
        avatar: activeBuild.avatar,
        stats: activeBuild.stats,
        classification: activeBuild.classification,
        signatureMove: activeBuild.signatureMove,
      },
    };
    const result = onSend(friend.id, battlePayload, msg);
    if (result.success) setSent(true);
  }

  if (sent) {
    return (
      <div className="fr-modal-backdrop" onClick={onClose}>
        <div className="fr-modal" onClick={(e) => e.stopPropagation()}>
          <div className="fr-modal__icon fr-modal__icon--pos">
            <Check size={28} />
          </div>
          <h2 className="fr-modal__title">Desafio enviado!</h2>
          <p className="fr-modal__sub">
            {friend.name || friend.email} recebeu seu desafio de batalha no formato{' '}
            <strong>{battleFormat}</strong> com sua construção atual.
          </p>
          <button className="btn btn--lg btn--block" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fr-modal-backdrop" onClick={onClose}>
      <div className="fr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fr-modal__close" onClick={onClose} aria-label="Fechar">
          <Close size={18} />
        </button>
        <div className="fr-modal__icon">
          <Swords size={28} />
        </div>
        <h2 className="fr-modal__title">Desafiar para Batalha</h2>
        <p className="fr-modal__sub">
          Envie sua construção atual para enfrentar <strong>{friend.name || friend.email}</strong>
        </p>

        {/* Escolha do Formato de Batalha */}
        <div className="field" style={{ marginBottom: '1rem' }}>
          <label className="field__label" htmlFor="battle-format">
            Formato do Combate
          </label>
          <select
            id="battle-format"
            className="select"
            value={battleFormat}
            onChange={(e) => setBattleFormat(e.target.value)}
          >
            <option value="1v1">⚔️ Confronto 1v1 (Individual)</option>
            <option value="2v2">👥 Batalha 2v2 (Duplas)</option>
            <option value="Grupo">👑 Modo de Grupo (Battle Royale)</option>
          </select>
        </div>

        {/* Resumo da Construção Ativa Enviada */}
        <div
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-sm)',
            padding: '0.8rem 1rem',
            marginBottom: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
          }}
        >
          <img
            src={resolvePowerImage(activeBuild.avatar)}
            alt={activeBuild.name}
            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
              Sua Construção: {activeBuild.name}
            </div>
            <span
              className={`rank-badge rank-badge--${activeBuild.classification?.rank || 'S'}`}
              style={{ fontSize: '0.72rem', padding: '0.1rem 0.35rem' }}
            >
              Rank {activeBuild.classification?.rank || 'S'}
            </span>
          </div>
        </div>

        <div className="field" style={{ marginBottom: '1.5rem' }}>
          <label className="field__label" htmlFor="battle-msg">
            Mensagem / Provocação (opcional)
          </label>
          <textarea
            id="battle-msg"
            className="input"
            rows={2}
            placeholder="Minha velocidade vai te deixar para trás! ⚡"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={140}
            style={{ resize: 'vertical', minHeight: 60 }}
          />
        </div>

        <button className="btn btn--lg btn--block" onClick={handleSend}>
          <Swords size={16} />
          Enviar Desafio Oficial
          <ArrowRight className="btn__arrow" />
        </button>
      </div>
    </div>
  );
}

/* ================================================================ Modal Visualizar Construção do Amigo */
function FriendBuildModal({ friend, onClose }) {
  // Se o amigo tem uma build salva, recupera ou deriva uma build válida
  const dummyStats = {
    forca: 88,
    velocidade: 89,
    defesa: 87,
    resistencia: 88,
    energia: 90,
    poderEspecial: 91,
  };
  const classification = calculateBuildClassification(dummyStats);

  return (
    <div className="reveal-modal" onClick={onClose}>
      <div className="reveal-modal__content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            cursor: 'pointer',
          }}
        >
          <Close size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="index-mark" style={{ color: 'var(--signal)' }}>
            Construção de Combatente
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', textTransform: 'uppercase', margin: '0.3rem 0' }}>
            {friend.name || friend.email}
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
            <span className={`rank-badge rank-badge--${classification.rank}`} style={{ fontSize: '1rem', padding: '0.2rem 0.5rem' }}>
              {classification.rank}
            </span>
            <span style={{ fontWeight: 700, color: classification.color }}>
              {classification.label} (Pontuação {classification.score})
            </span>
          </div>
        </div>

        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
          Atributos da Construção
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
          {STAT_KEYS.map(({ key, label, icon }) => (
            <div
              key={key}
              style={{
                background: 'var(--surface-2)',
                padding: '0.6rem 0.8rem',
                borderRadius: 'var(--r-xs)',
                border: '1px solid var(--line)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                {icon} {label}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--signal)' }}>
                {dummyStats[key]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================ Tab: Amigos */
function TabAmigos({ friendIds, getUserById, onChallenge, onViewBuild, removeFriend }) {
  const [confirmRemove, setConfirmRemove] = useState(null);

  if (friendIds.length === 0) {
    return (
      <div className="fr-empty">
        <span className="fr-empty__icon">👥</span>
        <p className="fr-empty__title">Nenhum amigo ainda</p>
        <p className="fr-empty__sub">
          Use a aba <strong>Buscar jogadores</strong> para encontrar e adicionar amigos.
        </p>
      </div>
    );
  }

  return (
    <ul className="fr-list">
      {friendIds.map((id) => {
        const user = getUserById(id);
        if (!user) return null;
        return (
          <li key={id} className="fr-item">
            <Avatar user={user} size={42} />
            <div className="fr-item__info">
              <span className="fr-item__name">{user.name || user.email.split('@')[0]}</span>
              <span className="fr-item__email caption">{user.email}</span>
            </div>
            <div className="fr-item__actions">
              <button
                className="btn btn--ghost"
                onClick={() => onViewBuild(user)}
                title="Consultar atributos da construção"
              >
                Ver Construção
              </button>

              <button
                className="btn"
                onClick={() => onChallenge(user)}
                title="Desafiar para batalha na arena"
                id={`challenge-${id}`}
              >
                <Swords size={15} />
                Desafiar
              </button>

              {confirmRemove === id ? (
                <>
                  <button
                    className="btn btn--neg"
                    onClick={() => {
                      removeFriend(id);
                      setConfirmRemove(null);
                    }}
                  >
                    Confirmar
                  </button>
                  <button className="btn btn--ghost" onClick={() => setConfirmRemove(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  className="btn btn--ghost"
                  onClick={() => setConfirmRemove(id)}
                  title="Remover amigo"
                >
                  Remover
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ================================================================ Tab: Pedidos */
function TabPedidos({
  pendingReceived,
  pendingSent,
  getUserById,
  acceptFriendRequest,
  declineFriendRequest,
}) {
  const [feedback, setFeedback] = useState({});

  function act(id, fn) {
    const res = fn(id);
    setFeedback((p) => ({ ...p, [id]: res.message }));
  }

  return (
    <div className="fr-requests">
      <section>
        <h2 className="fr-section-title">
          Pedidos recebidos
          {pendingReceived.length > 0 && (
            <span className="fr-notif-dot">{pendingReceived.length}</span>
          )}
        </h2>
        {pendingReceived.length === 0 ? (
          <p className="caption fr-empty-inline">Nenhum pedido pendente.</p>
        ) : (
          <ul className="fr-list">
            {pendingReceived.map((id) => {
              const user = getUserById(id);
              return (
                <li key={id} className="fr-item">
                  <Avatar user={user || { id }} size={42} />
                  <div className="fr-item__info">
                    <span className="fr-item__name">
                      {user?.name || user?.email?.split('@')[0] || id}
                    </span>
                    {user?.email && <span className="caption">{user.email}</span>}
                    {feedback[id] && (
                      <span className="caption" style={{ color: 'var(--pos)' }}>
                        {feedback[id]}
                      </span>
                    )}
                  </div>
                  {!feedback[id] && (
                    <div className="fr-item__actions">
                      <button
                        className="btn"
                        onClick={() => act(id, acceptFriendRequest)}
                        id={`accept-${id}`}
                      >
                        <Check size={15} />
                        Aceitar
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => act(id, declineFriendRequest)}
                        id={`decline-${id}`}
                      >
                        <Close size={15} />
                        Recusar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 className="fr-section-title">Pedidos enviados</h2>
        {pendingSent.length === 0 ? (
          <p className="caption fr-empty-inline">Você não enviou nenhum pedido ainda.</p>
        ) : (
          <ul className="fr-list">
            {pendingSent.map((id) => {
              const user = getUserById(id);
              return (
                <li key={id} className="fr-item">
                  <Avatar user={user || { id }} size={42} />
                  <div className="fr-item__info">
                    <span className="fr-item__name">
                      {user?.name || user?.email?.split('@')[0] || id}
                    </span>
                    <span className="caption">{user?.email || 'Aguardando resposta'}</span>
                  </div>
                  <span className="fr-badge fr-badge--warn">Pendente</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ================================================================ Tab: Buscar */
function TabBuscar({ getSearchableUsers, friendIds, pendingSent, sendFriendRequest }) {
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState({});

  const results = useMemo(() => getSearchableUsers(query), [getSearchableUsers, query]);

  function handleAdd(id) {
    const res = sendFriendRequest(id);
    setFeedback((p) => ({ ...p, [id]: { success: res.success, msg: res.message } }));
  }

  function getStatus(id) {
    if (friendIds.includes(id)) return 'friend';
    if (pendingSent.includes(id)) return 'sent';
    return 'none';
  }

  return (
    <div className="fr-search-tab">
      <div className="fr-search-bar">
        <Search size={16} className="fr-search-bar__icon" />
        <input
          id="friends-search"
          className="input fr-search-bar__input"
          type="search"
          placeholder="Buscar jogadores cadastrados por nome ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length === 0 ? (
        <div className="fr-empty" style={{ paddingTop: '2rem' }}>
          <span className="fr-empty__icon">🔍</span>
          <p className="fr-empty__title">
            {query ? 'Nenhum jogador encontrado' : 'Nenhum outro jogador cadastrado'}
          </p>
        </div>
      ) : (
        <ul className="fr-list">
          {results.map((user) => {
            const status = feedback[user.id]
              ? feedback[user.id].success
                ? 'sent'
                : 'error'
              : getStatus(user.id);

            return (
              <li key={user.id} className="fr-item">
                <Avatar user={user} size={42} />
                <div className="fr-item__info">
                  <span className="fr-item__name">{user.name || user.email.split('@')[0]}</span>
                  <span className="caption">{user.email}</span>
                </div>
                <div className="fr-item__actions">
                  {status === 'friend' && (
                    <span className="fr-badge fr-badge--pos">
                      <Check size={12} /> Amigo
                    </span>
                  )}
                  {status === 'sent' && (
                    <span className="fr-badge fr-badge--warn">Pedido enviado</span>
                  )}
                  {status === 'error' && (
                    <span className="fr-badge fr-badge--neg">{feedback[user.id]?.msg}</span>
                  )}
                  {status === 'none' && (
                    <button
                      className="btn"
                      onClick={() => handleAdd(user.id)}
                      id={`add-friend-${user.id}`}
                    >
                      <Plus size={15} />
                      Adicionar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ================================================================ Tab: Batalhas */
function TabBatalhas({ receivedBattles, sentBattles, respondBattleRequest, getUserById }) {
  const [feedback, setFeedback] = useState({});
  const navigate = useNavigate();

  function handleRespond(battle, accept) {
    const res = respondBattleRequest(battle.id, accept);
    setFeedback((p) => ({ ...p, [battle.id]: { success: res.success, msg: res.message, accept } }));
    if (accept && res.success) {
      setTimeout(() => {
        navigate('/arena', {
          state: {
            challenge: {
              mode: battle.deck?.format || '1v1',
              opponentBuild: battle.deck?.build || null,
            },
          },
        });
      }, 1000);
    }
  }

  return (
    <div className="fr-battles">
      <section>
        <h2 className="fr-section-title">
          Desafios de Batalha Recebidos
          {receivedBattles.filter((b) => b.status === 'pending').length > 0 && (
            <span className="fr-notif-dot">
              {receivedBattles.filter((b) => b.status === 'pending').length}
            </span>
          )}
        </h2>
        {receivedBattles.length === 0 ? (
          <p className="caption fr-empty-inline">Nenhum desafio recebido ainda.</p>
        ) : (
          <ul className="fr-list fr-list--battles">
            {receivedBattles.map((battle) => (
              <li key={battle.id} className="fr-item fr-item--battle">
                <div className="fr-battle__meta">
                  <span className="fr-battle__from">
                    ⚔️ <strong>{battle.senderName}</strong> te desafiou para{' '}
                    <span className="rarity-pill rarity-pill--Raro">
                      Modo {battle.deck?.format || '1v1'}
                    </span>
                  </span>
                  {battle.deck?.build?.name && (
                    <span className="fr-battle__deck caption">
                      Construção: {battle.deck.build.name} (Rank {battle.deck.build.classification?.rank || 'S'})
                    </span>
                  )}
                  {battle.message && (
                    <span className="fr-battle__msg">"{battle.message}"</span>
                  )}
                  <span className="caption">{timeAgo(battle.createdAt)}</span>
                </div>
                <div className="fr-item__actions fr-item__actions--col">
                  <StatusBadge status={battle.status} />
                  {feedback[battle.id] && (
                    <span
                      className="caption"
                      style={{
                        color: feedback[battle.id].accept ? 'var(--pos)' : 'var(--muted)',
                      }}
                    >
                      {feedback[battle.id].msg}
                    </span>
                  )}
                  {battle.status === 'pending' && !feedback[battle.id] && (
                    <>
                      <button
                        className="btn"
                        onClick={() => handleRespond(battle, true)}
                        id={`accept-battle-${battle.id}`}
                      >
                        <Swords size={14} />
                        Aceitar & Ir para a Arena
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => handleRespond(battle, false)}
                        id={`decline-battle-${battle.id}`}
                      >
                        Recusar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 className="fr-section-title">Desafios Enviados</h2>
        {sentBattles.length === 0 ? (
          <p className="caption fr-empty-inline">
            Você ainda não desafiou ninguém. Vá na aba <strong>Meus amigos</strong> e clique em Desafiar.
          </p>
        ) : (
          <ul className="fr-list fr-list--battles">
            {sentBattles.map((battle) => {
              const target = getUserById(battle.targetId);
              return (
                <li key={battle.id} className="fr-item fr-item--battle">
                  <div className="fr-battle__meta">
                    <span className="fr-battle__from">
                      ⚔️ Desafio para{' '}
                      <strong>{target?.name || target?.email || battle.targetId}</strong>{' '}
                      ({battle.deck?.format || '1v1'})
                    </span>
                    {battle.deck?.build?.name && (
                      <span className="caption">Sua construção: {battle.deck.build.name}</span>
                    )}
                    {battle.message && <span className="fr-battle__msg">"{battle.message}"</span>}
                    <span className="caption">{timeAgo(battle.createdAt)}</span>
                  </div>
                  <StatusBadge status={battle.status} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ================================================================ PÁGINA PRINCIPAL */
export default function Amigos() {
  const { currentUser } = useAuth();
  const { activeBuild } = useCharacterGame();
  const {
    friendIds,
    pendingReceived,
    pendingSent,
    sentBattles,
    receivedBattles,
    getSearchableUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    sendBattleRequest,
    respondBattleRequest,
    getUserById,
  } = useFriends();

  const [activeTab, setActiveTab] = useState('amigos');
  const [challengeTarget, setChallengeTarget] = useState(null);
  const [viewBuildTarget, setViewBuildTarget] = useState(null);

  if (!currentUser) {
    return (
      <>
        <div className="shell page-head">
          <div className="page-head__title">
            <p className="index-mark">/ 08 — Comunidade</p>
            <h1 className="display d-xl">Amigos & Desafios</h1>
          </div>
        </div>
        <div className="game-shell">
          <GameSubNav />
          <div className="fr-login-wall">
            <div className="fr-login-wall__card">
              <span className="fr-login-wall__icon">👥</span>
              <h2 className="fr-login-wall__title">Faça login para acessar o sistema de amigos</h2>
              <p className="fr-login-wall__sub">
                Conecte-se para adicionar outros jogadores, comparar suas construções de personagens e
                enviar desafios para a Arena.
              </p>
              <div className="fr-login-wall__actions">
                <Link to="/login" className="btn btn--lg">
                  Entrar na minha conta
                </Link>
                <Link to="/cadastro" className="btn btn--lg btn--ghost">
                  Criar conta gratuita
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 08 — Comunidade & Confrontos</p>
          <h1 className="display d-xl">Amigos & Batalhas</h1>
          <p className="page-head__lede">
            Desafie amigos para a Arena em formatos 1v1, 2v2 e Todos contra Todos utilizando sua
            construção personalizada de atributos.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {/* Nota arquitetural e multiplayer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.8rem',
            padding: '1rem 1.2rem',
            background: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: 'var(--text-2)',
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--signal)' }} />
          <div>
            <strong>Arquitetura de Dados:</strong> O sistema de amigos e desafios opera atualmente via LocalStorage
            neste navegador (permitindo alternar contas e desafiar perfis criados no mesmo ambiente). A arquitetura
            está estruturada para envio de payloads de combate e compatível com migração futura para WebSocket/backend.
          </div>
        </div>

        <nav className="fr-nav" aria-label="Abas da comunidade">
          {TABS.map((tab) => {
            const count =
              tab.id === 'pedidos'
                ? pendingReceived.length
                : tab.id === 'batalhas'
                ? receivedBattles.filter((b) => b.status === 'pending').length
                : 0;

            return (
              <button
                key={tab.id}
                type="button"
                className={`fr-nav__tab${activeTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {count > 0 && <span className="fr-notif-dot">{count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="fr-content">
          {activeTab === 'amigos' && (
            <TabAmigos
              friendIds={friendIds}
              getUserById={getUserById}
              onChallenge={(u) => setChallengeTarget(u)}
              onViewBuild={(u) => setViewBuildTarget(u)}
              removeFriend={removeFriend}
            />
          )}

          {activeTab === 'pedidos' && (
            <TabPedidos
              pendingReceived={pendingReceived}
              pendingSent={pendingSent}
              getUserById={getUserById}
              acceptFriendRequest={acceptFriendRequest}
              declineFriendRequest={declineFriendRequest}
            />
          )}

          {activeTab === 'buscar' && (
            <TabBuscar
              getSearchableUsers={getSearchableUsers}
              friendIds={friendIds}
              pendingSent={pendingSent}
              sendFriendRequest={sendFriendRequest}
            />
          )}

          {activeTab === 'batalhas' && (
            <TabBatalhas
              receivedBattles={receivedBattles}
              sentBattles={sentBattles}
              respondBattleRequest={respondBattleRequest}
              getUserById={getUserById}
            />
          )}
        </div>
      </div>

      {challengeTarget && (
        <BattleModal
          friend={challengeTarget}
          activeBuild={activeBuild}
          onClose={() => setChallengeTarget(null)}
          onSend={sendBattleRequest}
        />
      )}

      {viewBuildTarget && (
        <FriendBuildModal
          friend={viewBuildTarget}
          onClose={() => setViewBuildTarget(null)}
        />
      )}
    </>
  );
}
