import {
    EditOutlined,
    PersonAddAltOutlined
} from '../icones.js';
import {
    BotaoIcone,
    Carregando,
    ModalAlerta,
    Paginacao,
    SituacaoPonto
} from '../components/index.js';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCallback, useEffect, useState } from 'react';
import { ROTULOS_PERFIL, useDebounce } from '../hooks.js';
import { useConfirmar } from '../contexts/ConfirmacaoContext.jsx';

/* Quantidade de registros por página */
const LIMITE = 10;

/* Lista de usuários do sistema - com busca e paginação (só administrador) */
export default function UsuariosLista() {
    const { usuario } = useAuth();
    const confirmar = useConfirmar();
    const [busca, setBusca] = useState('');
    const termo = useDebounce(busca);
    const [pagina, setPagina] = useState(1);

    const [resp, setResp] = useState({
        dados: [],
        total: 0
    });

    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(true);

    const carregar = useCallback(async () => {
        setCarregando(true);

        try {
            setResp(await api.usuarios.listar({
                busca: termo,
                pagina,
                limite: LIMITE
            }));

            setErro('');
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }, [
        termo,
        pagina
    ]);

    useEffect(() => { carregar(); }, [carregar]);
    useEffect(() => { setPagina(1); }, [termo]);

    /* Inativa ou reativa o usuário - ele nunca é excluído, pois fica ligado às OS */
    const alternarAtivo = async (item) => {
        const acao = item.ativo ? 'Inativar' : 'Reativar';

        const confirmado = await confirmar(
            `${acao} o usuário "${item.nome}"?`,
            { perigo: item.ativo }
        );

        if (!confirmado) return;

        try {
            await api.usuarios.alterarAtivo(
                item.id,
                !item.ativo
            );

            carregar();
        } catch (error) {
            setErro(error.message);
        }
    };

    return (
        <>
            <div className="titulo-linha">
                <h2>
                    Usuários
                </h2>

                <Link
                    className="btn primario"
                    to="/usuarios/novo"
                >
                    <PersonAddAltOutlined
                        fontSize="small"
                    />

                    Novo usuário
                </Link>
            </div>

            <input
                className="busca"
                placeholder="Buscar por nome ou e-mail"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
            />

            {erro && <ModalAlerta
                mensagem={erro}
                aoFechar={() => setErro('')}
            />}

            <table className="tabela">
                <thead>
                    <tr>
                        <th>
                            Nome
                        </th>

                        <th>
                            E-mail
                        </th>

                        <th>
                            Perfil
                        </th>

                        <th>
                            Situação
                        </th>

                        <th className="acoes">
                            Ações
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {resp.dados.map((item) => (
                        <tr key={item.id}>
                            <td>
                                {item.nome}
                            </td>

                            <td>
                                {item.email}
                            </td>

                            <td>
                                {ROTULOS_PERFIL[item.perfil]}
                            </td>

                            <td>
                                <SituacaoPonto
                                    texto={item.ativo ? 'Ativo' : 'Inativo'}
                                    cor={item.ativo ? 'verde' : 'vermelho'}
                                />
                            </td>

                            <td className="acoes">
                                <BotaoIcone
                                    to={`/usuarios/${item.id}`}
                                    icone={EditOutlined}
                                    rotulo="Editar"
                                />
                            </td>
                        </tr>
                    ))}

                    {carregando && resp.dados.length === 0 && (
                        <tr>
                            <td
                                colSpan="5"
                                className="vazio"
                            >
                                <Carregando />
                            </td>
                        </tr>
                    )}

                    {!carregando && resp.dados.length === 0 && (
                        <tr>
                            <td
                                colSpan="5"
                                className="vazio"
                            >
                                Nenhum usuário encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Paginacao
                pagina={pagina}
                limite={LIMITE}
                total={resp.total}
                aoMudar={setPagina}
            />
        </>
    );
};