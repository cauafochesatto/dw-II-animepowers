import { useState, useMemo } from 'react';
import { useCharacterGame } from '../context/useCharacterGame';
import { RARITIES } from '../data/characters';
import GameSubNav from '../components/GameSubNav';
import CharacterCard from '../components/CharacterCard';
import CharacterDetailModal from '../components/CharacterDetailModal';
import { Search } from '../components/Icons';
import '../styles/game.css';

export default function Colecao() {
  const { ownedCharacters, activeBuild } = useCharacterGame();

  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rarity');
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Mapeia quais atributos da build ativa vieram de cada personagem
  const activeCharStatsMap = useMemo(() => {
    const map = {};
    if (activeBuild?.statSources) {
      Object.entries(activeBuild.statSources).forEach(([statKey, charId]) => {
        if (!map[charId]) map[charId] = [];
        map[charId].push(statKey);
      });
    }
    return map;
  }, [activeBuild]);

  // Lista de animes disponíveis
  const availableAnimes = useMemo(() => {
    return [...new Set(ownedCharacters.map((c) => c.anime))].sort();
  }, [ownedCharacters]);

  const [animeFilter, setAnimeFilter] = useState('ALL');

  // Filtragem e ordenação
  const filteredList = useMemo(() => {
    let list = ownedCharacters.filter((char) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        char.nome.toLowerCase().includes(q) ||
        char.anime.toLowerCase().includes(q);

      const matchRarity = rarityFilter === 'ALL' || char.raridade === rarityFilter;
      const matchAnime = animeFilter === 'ALL' || char.anime === animeFilter;

      return matchSearch && matchRarity && matchAnime;
    });

    const rarityOrder = {
      [RARITIES.MITICO]: 6,
      [RARITIES.LENDARIO]: 5,
      [RARITIES.EPICO]: 4,
      [RARITIES.RARO]: 3,
      [RARITIES.INCOMUM]: 2,
      [RARITIES.COMUM]: 1,
    };

    list.sort((a, b) => {
      if (sortBy === 'rarity') {
        const diff = (rarityOrder[b.raridade] || 0) - (rarityOrder[a.raridade] || 0);
        return diff !== 0 ? diff : b.forca - a.forca;
      }
      if (sortBy === 'name') return a.nome.localeCompare(b.nome);
      if (sortBy === 'forca') return b.forca - a.forca;
      if (sortBy === 'velocidade') return b.velocidade - a.velocidade;
      if (sortBy === 'defesa') return b.defesa - a.defesa;
      if (sortBy === 'resistencia') return b.resistencia - a.resistencia;
      if (sortBy === 'energia') return b.energia - a.energia;
      if (sortBy === 'poderEspecial') return b.poderEspecial - a.poderEspecial;
      if (sortBy === 'copies') return b.copies - a.copies;
      return 0;
    });

    return list;
  }, [ownedCharacters, search, rarityFilter, animeFilter, sortBy]);

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 03 — Acervo</p>
          <h1 className="display d-xl">Minha Coleção</h1>
          <p className="page-head__lede">
            Todos os seus guerreiros recrutados estão salvos neste acervo permanente.
            Examine seus atributos, cópias acumuladas e planeje a combinação ideal para a sua construção.
          </p>
        </div>
      </div>

      <div className="game-shell">
        <GameSubNav />

        {/* Barra de Controles e Filtros */}
        <div className="collection-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Buscar por nome ou anime..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--r-sm)',
                  padding: '0.6rem 0.8rem 0.6rem 2.2rem',
                  color: 'var(--text)',
                  fontSize: '0.9rem',
                }}
              />
              <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                <Search size={16} />
              </span>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {filteredList.length} de {ownedCharacters.length} personagens
            </span>
          </div>

          <div className="collection-filters">
            {/* Filtro por Raridade */}
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="select"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
            >
              <option value="ALL">Todas as Raridades</option>
              <option value={RARITIES.MITICO}>Mítico (0.8%)</option>
              <option value={RARITIES.LENDARIO}>Lendário (3.2%)</option>
              <option value={RARITIES.EPICO}>Épico (8%)</option>
              <option value={RARITIES.RARO}>Raro (18%)</option>
              <option value={RARITIES.INCOMUM}>Incomum (30%)</option>
              <option value={RARITIES.COMUM}>Comum (40%)</option>
            </select>

            {/* Filtro por Anime */}
            <select
              value={animeFilter}
              onChange={(e) => setAnimeFilter(e.target.value)}
              className="select"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
            >
              <option value="ALL">Todos os Animes</option>
              {availableAnimes.map((anime) => (
                <option key={anime} value={anime}>
                  {anime}
                </option>
              ))}
            </select>

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="select"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
            >
              <option value="rarity">Maior Raridade</option>
              <option value="forca">Maior Força ⚔️</option>
              <option value="velocidade">Maior Velocidade ⚡</option>
              <option value="defesa">Maior Defesa 🛡️</option>
              <option value="resistencia">Maior Resistência ❤️</option>
              <option value="energia">Maior Energia ✨</option>
              <option value="poderEspecial">Maior Poder Especial 🔥</option>
              <option value="copies">Mais Cópias</option>
              <option value="name">Ordem Alfabética (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grid da Coleção */}
        {filteredList.length === 0 ? (
          <div
            style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'var(--surface-1)',
              border: '1px dashed var(--line)',
              borderRadius: 'var(--r-md)',
              color: 'var(--muted)',
            }}
          >
            Nenhum guerreiro encontrado com esses filtros. Tente limpar os filtros ou realizar novos giros!
          </div>
        ) : (
          <div className="collection-grid">
            {filteredList.map((char) => {
              const equippedSlots = activeCharStatsMap[char.id] || [];
              const isEquipped = equippedSlots.length > 0;
              return (
                <CharacterCard
                  key={char.id}
                  character={char}
                  copies={char.copies}
                  isEquipped={isEquipped}
                  equippedStats={equippedSlots}
                  onClick={() => setSelectedDetail(char)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedDetail && (
        <CharacterDetailModal
          character={selectedDetail}
          copies={selectedDetail.copies}
          onClose={() => setSelectedDetail(null)}
        />
      )}
    </>
  );
}

