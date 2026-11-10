import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStorage, definirAoExpirarSessao } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(tokenStorage.obter()));

  const sair = useCallback(() => {
    tokenStorage.limpar();
    setUsuario(null);
  }, []);

  useEffect(() => {
    definirAoExpirarSessao(sair);
    if (!tokenStorage.obter()) return;
    api.me().then(setUsuario).catch(sair).finally(() => setCarregando(false));
  }, [sair]);

  const entrar = useCallback(async (email, senha) => {
    const { token } = await api.login(email, senha);
    tokenStorage.salvar(token);
    setUsuario(await api.me());
  }, []);

  const valor = useMemo(() => ({
    usuario,
    carregando,
    entrar,
    sair,
    pode: (...perfis) => Boolean(usuario) && perfis.includes(usuario.perfil),
  }), [usuario, carregando, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
