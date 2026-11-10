import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Campo from '../components/Campo.jsx';

export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [dados, setDados] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/clientes" replace />;

  const aoMudar = (campo, valor) => setDados((d) => ({ ...d, [campo]: valor }));

  const aoEnviar = async (e) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(dados.email, dados.senha);
      navegar('/clientes');
    } catch (err) {
      setErro(err.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos.' : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-fundo">
      <form className="login-cartao" onSubmit={aoEnviar}>
        <h1>SISGOM</h1>
        <p>Sistema de Gestão para Oficinas Mecânicas</p>
        <Campo rotulo="E-mail" nome="email" type="email" valor={dados.email} aoMudar={aoMudar}
               placeholder="seu@email.com" autoComplete="username" required />
        <Campo rotulo="Senha" nome="senha" type="password" valor={dados.senha} aoMudar={aoMudar}
               placeholder="••••••••" autoComplete="current-password" required />
        {erro && <div className="alerta erro">{erro}</div>}
        <button className="btn primario" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  );
}
