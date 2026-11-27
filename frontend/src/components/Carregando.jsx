import { useDemora } from '../hooks.js';

/* Aviso de carregamento */
export default function Carregando() {
  const demorando = useDemora(true);

  return (
    <div className="carregando">
      Carregando...

      {demorando && <small>
        Acordando o servidor, a primeira vez pode levar até 1 minuto.
      </small>}
    </div>
  );
};