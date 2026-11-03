import { useLocation } from 'react-router-dom';
import DuelSimulator from '../components/DuelSimulator';

export default function Duelo() {
  const { state } = useLocation();
  const preselectPower = state?.preselectPower ?? null;

  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 03 — Arena</p>
          <h1 className="display d-xl">Simulador de duelo</h1>
          <p className="page-head__lede">
            Duas técnicas entram no confronto. A fórmula resolve o vencedor aplicando dano,
            custo, o multiplicador elemental e a sua afinidade pessoal.
          </p>
        </div>
      </div>

      <div className="shell">
        <DuelSimulator initialPowerId={preselectPower} />
      </div>
    </>
  );
}
