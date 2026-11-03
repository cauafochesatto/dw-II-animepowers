import powersData from '../data/powers.json';
import PowerCatalog from '../components/PowerCatalog';

export default function Catalogo() {
  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 02 — Catálogo</p>
          <h1 className="display d-xl">Todas as técnicas</h1>
          <p className="page-head__lede">
            Busca por nome, personagem ou obra. Combine filtros de categoria, elemento,
            dano e custo, ou ordene do mais destrutivo ao mais econômico.
          </p>
        </div>
        <div className="page-head__side">
          <span>{powersData.length} técnicas indexadas</span>
        </div>
      </div>

      <div className="shell">
        <PowerCatalog />
      </div>
    </>
  );
}
