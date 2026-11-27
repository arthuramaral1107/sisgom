import { useState } from 'react';
import { useDemora } from '../hooks.js';
import logo from '../assets/logo-sisgom.svg';
import { useAuth } from '../contexts/index.js';
import { Navigate, useNavigate } from 'react-router-dom';
import { Campo, ModalAlerta } from '../components/index.js';

/* Tela de login */
export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();

  const [dados, setDados] = useState({
    email: '',
    senha: ''
  });

  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const demorando = useDemora(enviando);

  if (usuario) return <Navigate
    to="/painel"
    replace
  />;

  const aoMudar = (campo, valor) => setDados((d) => ({ ...d, [campo]: valor }));

  const aoEnviar = async (e) => {
    e.preventDefault();

    setErro('');
    setEnviando(true);

    try {
      await entrar(
        dados.email,
        dados.senha
      );

      navegar('/painel');
    } catch (error) {
      setErro(
        error.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : error.message
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-fundo">
      <form
        className="login-cartao"
        onSubmit={aoEnviar}
      >
        <h1>
          <img
            className="login-logo"
            src={logo}
            alt=""
          />

          SISGOM
        </h1>

        <p>
          Sistema de Gestão para Oficinas Mecânicas
        </p>

        <Campo
          rotulo="E-mail"
          nome="email"
          type="email"
          valor={dados.email}
          aoMudar={aoMudar}
          placeholder="seu@email.com"
          autoComplete="username"
          required
        />

        <Campo
          rotulo="Senha"
          nome="senha"
          type="password"
          valor={dados.senha}
          aoMudar={aoMudar}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        {erro && <ModalAlerta
          mensagem={erro}
          aoFechar={() => setErro('')}
        />}

        <button
          className="btn primario"
          disabled={enviando}
        >
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>

        {demorando && <small className="aviso-servidor">
          Acordando o servidor, a primeira vez pode levar até 1 minuto.
        </small>}
      </form>
    </div>
  );
};