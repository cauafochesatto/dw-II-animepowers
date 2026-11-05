import DeckBuilder from '../components/DeckBuilder';

export default function Grimorio() {
  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 04 — Compêndio</p>
          <h1 className="display d-xl">Grimório</h1>
          <p className="page-head__lede">
            Sua coleção pessoal de até seis técnicas, com os totais de dano e custo
            calculados em tempo real. Salva neste navegador e exportável em JSON.
          </p>
        </div>
      </div>

      <div className="shell">
        <DeckBuilder />
      </div>
    </>
  );
}
