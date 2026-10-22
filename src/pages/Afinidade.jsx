import AffinityTest from '../components/AffinityTest';

export default function Afinidade() {
  return (
    <>
      <div className="shell page-head">
        <div className="page-head__title">
          <p className="index-mark">/ 05 — Diagnóstico</p>
          <h1 className="display d-xl">Teste de afinidade</h1>
          <p className="page-head__lede">
            Cinco perguntas definem o seu elemento. O resultado libera um bônus específico
            dentro do simulador de duelo.
          </p>
        </div>
      </div>

      <div className="shell">
        <AffinityTest />
      </div>
    </>
  );
}
