import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useFriends } from '../context/FriendsContext';
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

/* ================================================================ Modals */
function BattleModal({ friend, onClose, onSend }) {
  const [msg, setMsg] = useState('');
  const [deckName, setDeckName] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    const result = onSend(friend.id, { deckName: deckName || 'Deck personalizado' }, msg);
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
            {friend.name || friend.email} recebeu seu desafio de batalha.
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
        <h2 className="fr-modal__title">Desafiar para batalha</h2>
        <p className="fr-modal__sub">
          Envie um desafio para <strong>{friend.name || friend.email}</strong>
        </p>

        <div className="field" style={{ marginBottom: '1rem' }}>
          <label className="field__label" htmlFor="battle-deck">
            Nome do deck / técnica principal
          </label>
          <input
            id="battle-deck"
            className="input"
            type="text"
            placeholder="Ex: Deck Fogo Supremo, Naruto Ultimate…"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            maxLength={60}
          />
        </div>

        <div className="field" style={{ marginBottom: '1.5rem' }}>
          <label className="field__label" htmlFor="battle-msg">
            Provocação / mensagem (opcional)
          </label>
          <textarea
            id="battle-msg"
            className="input"
            rows={3}
            placeholder="Vou te destruir com meu Rasengan! 😤"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            maxLength={140}
            style={{ resize: 'vertical', minHeight: 70 }}
          />
          <span className="caption" style={{ textAlign: 'right', display: 'block' }}>
            {msg.length}/140
          </span>
        </div>

        <button className="btn btn--lg btn--block" onClick={handleSend}>
          <Swords size={16} />
          Enviar desafio
          <ArrowRight className="btn__arrow" />
        </button>
      </div>
    </div>
  );
}

/* ================================================================ Tab: Amigos */
function TabAmigos({ friendIds, getUserById, onChallenge, removeFriend }) {
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
              {user.role && <span className="fr-item__role label">{user.role}</span>}
            </div>
            <div className="fr-item__actions">
              <button
                className="btn"
                onClick={() => onChallenge(user)}
                title="Desafiar para batalha"
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

  function act(id, fn, label) {
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
                        onClick={() => act(id, acceptFriendRequest, 'Aceito')}
                        id={`accept-${id}`}
                      >
                        <Check size={15} />
                        Aceitar
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => act(id, declineFriendRequest, 'Recusado')}
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
                    {user?.email && <span className="caption">{user.email}</span>}
                  </div>
                  <span className="fr-badge fr-badge--warn">Aguardando</span>
                  <button
                    className="btn btn--ghost btn--sm"
                    onClick={() => declineFriendRequest(id)}
                    title="Cancelar pedido"
                  >
                    Cancelar
                  </button>
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
  const results = getSearchableUsers(query);

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
          placeholder="Buscar por nome ou e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {results.length === 0 ? (
        <div className="fr-empty" style={{ paddingTop: '2rem' }}>
          <span className="fr-empty__icon">🔍</span>
          <p className="fr-empty__title">
            {query ? 'Nenhum jogador encontrado' : 'Nenhum jogador cadastrado ainda'}
          </p>
          <p className="fr-empty__sub">
            {query
              ? 'Tente outro nome ou e-mail.'
              : 'Convide seus amigos para criarem uma conta e aparecerem aqui.'}
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
                  {user.role && <span className="label">{user.role}</span>}
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

  function handleRespond(battleId, accept) {
    const res = respondBattleRequest(battleId, accept);
    setFeedback((p) => ({ ...p, [battleId]: { success: res.success, msg: res.message, accept } }));
    if (accept && res.success) {
      setTimeout(() => navigate('/duelo'), 1200);
    }
  }

  return (
    <div className="fr-battles">
      <section>
        <h2 className="fr-section-title">
          Desafios recebidos
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
                    ⚔️ <strong>{battle.senderName}</strong> te desafiou
                  </span>
                  {battle.deck?.deckName && (
                    <span className="fr-battle__deck caption">Deck: {battle.deck.deckName}</span>
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
                        onClick={() => handleRespond(battle.id, true)}
                        id={`accept-battle-${battle.id}`}
                      >
                        <Swords size={14} />
                        Aceitar batalha
                      </button>
                      <button
                        className="btn btn--ghost"
                        onClick={() => handleRespond(battle.id, false)}
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
        <h2 className="fr-section-title">Desafios enviados</h2>
        {sentBattles.length === 0 ? (
          <p className="caption fr-empty-inline">
            Você ainda não desafiou ninguém. Vá em <strong>Meus amigos</strong> e clique em
            Desafiar.
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
                      <strong>{target?.name || target?.email || battle.targetId}</strong>
                    </span>
                    {battle.deck?.deckName && (
                      <span className="fr-battle__deck caption">
                        Deck: {battle.deck.deckName}
                      </span>
                    )}
                    {battle.message && (
                      <span className="fr-battle__msg">"{battle.message}"</span>
                    )}
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

/* ================================================================ PAGE */
export default function Amigos() {
  const { currentUser } = useAuth();
  const {
    friendIds,
    pendingReceived,
    pendingSent,
    sentBattles,
    receivedBattles,
    totalNotifications,
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
  const [challengeFriend, setChallengeFriend] = useState(null);

  if (!currentUser) {
    return (
      <div className="fr-gate shell">
        <div className="fr-gate__icon">
          <AlertTriangle size={48} />
        </div>
        <h1 className="fr-gate__title">Você precisa estar logado</h1>
        <p className="fr-gate__sub">
          Para acessar amigos e batalhas, faça login ou crie uma conta.
        </p>
        <div className="fr-gate__actions">
          <Link className="btn btn--lg" to="/login">
            Entrar <ArrowRight className="btn__arrow" />
          </Link>
          <Link className="btn btn--ghost btn--lg" to="/cadastro">
            Criar conta
          </Link>
        </div>
      </div>
    );
  }

  const pendingBattlesCount = receivedBattles.filter((b) => b.status === 'pending').length;

  return (
    <div className="fr-page">
      <header className="fr-hero shell">
        <div className="fr-hero__text">
          <p className="index-mark">/ social</p>
          <h1 className="fr-hero__title">Amigos &amp; Batalhas</h1>
          <p className="lede">
            Adicione jogadores, aceite pedidos de amizade e envie desafios de batalha épicos.
          </p>
        </div>
        <div className="fr-hero__stats">
          <div className="fr-stat">
            <span className="fr-stat__value">{friendIds.length}</span>
            <span className="fr-stat__label label">Amigos</span>
          </div>
          <div className="fr-stat">
            <span className="fr-stat__value">{pendingReceived.length}</span>
            <span className="fr-stat__label label">Pedidos</span>
          </div>
          <div className="fr-stat">
            <span className="fr-stat__value">{pendingBattlesCount}</span>
            <span className="fr-stat__label label">Desafios</span>
          </div>
        </div>
      </header>

      <div className="shell fr-body">
        {/* Tabs */}
        <div className="fr-tabs" role="tablist">
          {TABS.map((tab) => {
            const hasNotif =
              (tab.id === 'pedidos' && pendingReceived.length > 0) ||
              (tab.id === 'batalhas' && pendingBattlesCount > 0);
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                className={`fr-tab${activeTab === tab.id ? ' is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
                {hasNotif && (
                  <span className="fr-notif-dot">
                    {tab.id === 'pedidos' ? pendingReceived.length : pendingBattlesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="fr-panel">
          {activeTab === 'amigos' && (
            <TabAmigos
              friendIds={friendIds}
              getUserById={getUserById}
              onChallenge={setChallengeFriend}
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

      {/* Battle challenge modal */}
      {challengeFriend && (
        <BattleModal
          friend={challengeFriend}
          onClose={() => setChallengeFriend(null)}
          onSend={sendBattleRequest}
        />
      )}
    </div>
  );
}
