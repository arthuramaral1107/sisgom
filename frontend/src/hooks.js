import { useEffect, useState } from 'react';

// Atrasa a atualização de um valor (evita uma requisição a cada tecla digitada).
export function useDebounce(valor, ms = 350) {
  const [atual, setAtual] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtual(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return atual;
}

// Converte o array "detalhes" da API em { campo: mensagem }.
export function detalhesParaObjeto(detalhes = []) {
  return Object.fromEntries(detalhes.map((d) => [d.campo, d.mensagem]));
}
