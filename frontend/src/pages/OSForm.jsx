import { api } from '../services/api.js';
import Campo from '../components/Campo.jsx';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detalhesParaObjeto } from '../hooks.js';

const VAZIO = {
    veiculo_id: '',
    mecanico_id: '',
    defeito_relatado: ''
};

/* Formulário de abertura de ordem de serviço */
export default function OSForm() {
    const navegar = useNavigate();
    const [dados, setDados] = useState(VAZIO);
    const [veiculos, setVeiculos] = useState([]);
    const [mecanicos, setMecanicos] = useState([]);
    const [erros, setErros] = useState({});
    const [erroGeral, setErroGeral] = useState('');
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        Promise.all([
            api.veiculos.listar({ limite: 200 }),
            api.usuarios.mecanicos()
        ]).then(([resp, listaMecanicos]) => {
            setVeiculos(resp.dados);
            setMecanicos(listaMecanicos);
        }).catch((error) => setErroGeral(error.message));
    }, []);

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

        const numero = (valor) => (valor === '' ? null : Number(valor));

        try {
            const nova = await api.os.criar({
                veiculo_id: numero(dados.veiculo_id),
                mecanico_id: numero(dados.mecanico_id),
                defeito_relatado: dados.defeito_relatado
            });

            navegar(`/os/${nova.id}`);
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
                Nova ordem de serviço
            </h2>

            <form
                className="cartao formulario"
                onSubmit={aoEnviar}
                noValidate
            >
                <div className="grade">
                    <div className="larga">
                        <Campo
                            rotulo="Veículo"
                            obrigatorio
                            erro={erros.veiculo_id}
                        >
                            <select
                                value={dados.veiculo_id}
                                onChange={(event) => aoMudar(
                                    'veiculo_id',
                                    event.target.value
                                )}
                            >
                                <option value="">
                                    Selecione um veículo
                                </option>

                                {veiculos.map((veiculo) => (
                                    <option
                                        key={veiculo.id}
                                        value={veiculo.id}
                                    >
                                        {veiculo.placa} - {veiculo.marca} {veiculo.modelo} ({veiculo.cliente_nome})
                                    </option>
                                ))}
                            </select>
                        </Campo>
                    </div>

                    <div className="larga">
                        <Campo
                            rotulo="Mecânico responsável (opcional)"
                            erro={erros.mecanico_id}
                        >
                            <select
                                value={dados.mecanico_id}
                                onChange={(event) => aoMudar(
                                    'mecanico_id',
                                    event.target.value
                                )}
                            >
                                <option value="">
                                    Definir depois
                                </option>

                                {mecanicos.map((mecanico) => (
                                    <option
                                        key={mecanico.id}
                                        value={mecanico.id}
                                    >
                                        {mecanico.nome}
                                    </option>
                                ))}
                            </select>
                        </Campo>
                    </div>

                    <div className="larga">
                        <Campo
                            rotulo="Defeito relatado"
                            obrigatorio erro={erros.defeito_relatado}
                        >
                            <textarea
                                value={dados.defeito_relatado}
                                onChange={(event) => aoMudar(
                                    'defeito_relatado',
                                    event.target.value
                                )}
                                placeholder="Descreva o problema informado pelo cliente"
                                maxLength={500}
                            />
                        </Campo>
                    </div>
                </div>

                {erroGeral && <div className="alerta erro">
                    {erroGeral}
                </div>}

                <div className="botoes">
                    <button
                        className="btn primario"
                        disabled={enviando}
                    >
                        {enviando ? 'Abrindo...' : 'Abrir OS'}
                    </button>

                    <button
                        type="button"
                        className="btn"
                        onClick={() => navegar('/os')}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </>
    );
};