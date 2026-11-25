import { api } from '../services/api.js';
import { useEffect, useState } from 'react';
import Campo from '../components/Campo.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import ModalAlerta from '../components/ModalAlerta.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import { ROTULOS_PERFIL, detalhesParaObjeto } from '../hooks.js';

/* Valores iniciais do formulário */
const VAZIO = {
    nome: '',
    email: '',
    perfil: '',
    senha: ''
};

/* Formulário de cadastro e edição de usuário (só administrador) */
export default function UsuarioForm() {
    const { id } = useParams();
    const navegar = useNavigate();
    const { usuario } = useAuth();
    const [dados, setDados] = useState(VAZIO);
    const [erros, setErros] = useState({});
    const [erroGeral, setErroGeral] = useState('');
    const [enviando, setEnviando] = useState(false);

    // o administrador não pode mudar o próprio perfil (a API também barra)
    const proprio = Boolean(id) && usuario.id === Number(id);

    useEffect(() => {
        if (!id) return;

        api.usuarios.buscar(id).then((item) => setDados({
            nome: item.nome,
            email: item.email,
            perfil: item.perfil,
            senha: ''
        })).catch((error) => setErroGeral(error.message));
    }, [id]);

    const aoMudar = (campo, valor) => {
        setDados((atual) => ({
            ...atual,
            [campo]: valor
        }));

        setErros((atual) => ({
            ...atual,
            [campo]: undefined
        }));
    };

    const aoEnviar = async (event) => {
        event.preventDefault();

        setErros({});
        setErroGeral('');
        setEnviando(true);

        try {
            if (id) await api.usuarios.atualizar(id, dados);
            else await api.usuarios.criar(dados);

            navegar('/usuarios');
        } catch (error) {
            setErros(detalhesParaObjeto(error.detalhes));
            setErroGeral(error.detalhes.length ? '' : error.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <>
            <h2>
                {id ? 'Editar usuário' : 'Novo usuário'}
            </h2>

            <form
                className="cartao formulario"
                onSubmit={aoEnviar}
                noValidate
            >
                <div className="grade">
                    <Campo
                        rotulo="Nome"
                        nome="nome"
                        valor={dados.nome}
                        aoMudar={aoMudar}
                        erro={erros.nome}
                        obrigatorio
                        placeholder="Nome completo"
                    />

                    <Campo
                        rotulo="E-mail"
                        nome="email"
                        valor={dados.email}
                        aoMudar={aoMudar}
                        erro={erros.email}
                        obrigatorio
                        placeholder="usuario@oficina.com"
                    />

                    <Campo
                        rotulo="Perfil"
                        erro={erros.perfil}
                        obrigatorio
                    >
                        <select
                            value={dados.perfil}
                            onChange={(event) => aoMudar(
                                'perfil',
                                event.target.value
                            )}
                            disabled={proprio}
                        >
                            <option value="">
                                Selecione
                            </option>

                            {Object.entries(ROTULOS_PERFIL).map(([valor, rotulo]) => (
                                <option
                                    key={valor}
                                    value={valor}
                                >
                                    {rotulo}
                                </option>
                            ))}
                        </select>
                    </Campo>

                    <Campo
                        rotulo={id ? 'Nova senha' : 'Senha'}
                        nome="senha"
                        type="password"
                        valor={dados.senha}
                        aoMudar={aoMudar}
                        erro={erros.senha}
                        obrigatorio={!id}
                        autoComplete="new-password"
                        placeholder={id ? 'Deixe em branco para manter a atual' : 'De 8 a 72 caracteres'}
                    />
                </div>

                {proprio && <p>
                    Você não pode alterar o seu próprio perfil.
                </p>}

                {erroGeral && <ModalAlerta
                    mensagem={erroGeral}
                    aoFechar={() => setErroGeral('')}
                />}

                <div className="botoes">
                    <button
                        className="btn primario"
                        disabled={enviando}
                    >
                        {enviando ? 'Salvando...' : 'Salvar'}
                    </button>

                    <button
                        type="button"
                        className="btn"
                        onClick={() => navegar('/usuarios')}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </>
    );
};