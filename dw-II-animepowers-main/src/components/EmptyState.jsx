import { Search } from './Icons';

export default function EmptyState({ busca, onClear }) {
  return (
    <div className="empty-state" role="status">
      <p className="label">Busca sem resultado</p>
      <h2 className="empty-state__title">Nada encontrado</h2>
      <p className="empty-state__text">
        {busca
          ? `Nenhuma técnica corresponde a “${busca}” com os filtros atuais. `
          : 'Nenhuma técnica corresponde aos filtros atuais. '}
        Tente outra palavra ou volte ao catálogo completo.
      </p>
      <button type="button" className="btn" onClick={onClear}>
        <Search size={15} />
        Limpar filtros
      </button>
    </div>
  );
}
