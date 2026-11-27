import { useEffect, useState } from 'react';

/* Atrasa a atualização de um valor (evita uma requisição a cada tecla digitada) */
export function useDebounce(valor, ms = 350) {
  const [atual, setAtual] = useState(valor);

  useEffect(() => {
    const t = setTimeout(() => setAtual(valor), ms);

    return () => clearTimeout(t);
  }, [valor, ms]);

  return atual;
};

/* Diz se uma espera passou do tempo normal */
export function useDemora(ativo, ms = 4000) {
  const [demorando, setDemorando] = useState(false);

  useEffect(() => {
    if (!ativo) {
      setDemorando(false);

      return;
    }

    const t = setTimeout(() => setDemorando(true), ms);

    return () => clearTimeout(t);
  }, [
    ativo,
    ms
  ]);

  return demorando;
};

/* Texto exibido para cada perfil de usuário */
export const ROTULOS_PERFIL = {
  ADMIN: 'Administrador',
  ATENDENTE: 'Atendente',
  MECANICO: 'Mecânico'
};

/* Converte o array "detalhes" da API em { campo: mensagem } */
export function detalhesParaObjeto(detalhes = []) {
  return Object.fromEntries(detalhes.map((d) => [d.campo, d.mensagem]));
};

/* Formata um número como moeda brasileira (ex.: 1234.5 vira R$ 1.234,50) */
export function formatarMoeda(valor) {
  return Number(valor ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

/* Formata uma data ISO como data e hora - vazio se não houver data */
export function formatarDataHora(valor) {
  if (!valor) return '';

  return new Date(valor).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};