import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { detalhesParaObjeto } from '../hooks.js';
import Campo from '../components/Campo.jsx';

const VAZIO = { cliente_id: '', placa: '', marca: '', modelo: '', ano: '', cor: '', km_atual: '' };

export default function VeiculoForm() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [dados, setDados] = useState(VAZIO);
  const [clientes, setClientes] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api.clientes.listar({ limite: 200 }).then((r) => setClientes(r.dados)).catch((e) => setErroGeral(e.message));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.veiculos.buscar(id)
      .then((v) => setDados(Object.fromEntries(Object.keys(VAZIO).map((k) => [k, v[k] ?? '']))))
      .catch((e) => setErroGeral(e.message));
  }, [id]);

  const aoMudar = (campo, valor) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const aoEnviar = async (e) => {
    e.preventDefault();
    setErros({}); setErroGeral(''); setEnviando(true);
    const numero = (v) => (v === '' ? null : Number(v));
    const corpo = {
      cliente_id: numero(dados.cliente_id),
      placa: dados.placa, marca: dados.marca, modelo: dados.modelo, cor: dados.cor,
      ano: numero(dados.ano), km_atual: numero(dados.km_atual),
    };
    try {
      if (id) await api.veiculos.atualizar(id, corpo); else await api.veiculos.criar(corpo);
      navegar('/veiculos');
    } catch (err) {
      setErros(detalhesParaObjeto(err.detalhes));
      setErroGeral(err.detalhes.length ? '' : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <h2>{id ? 'Editar veículo' : 'Novo veículo'}</h2>
      <form className="cartao formulario" onSubmit={aoEnviar} noValidate>
        <div className="grade">
          <div className="larga">
            <Campo rotulo="Proprietário (cliente)" obrigatorio erro={erros.cliente_id}>
              <select value={dados.cliente_id} onChange={(e) => aoMudar('cliente_id', e.target.value)}>
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome} – {c.cpf_cnpj}</option>)}
              </select>
            </Campo>
          </div>
          <Campo rotulo="Placa" nome="placa" valor={dados.placa} aoMudar={aoMudar} erro={erros.placa}
                 obrigatorio placeholder="AAA0A00" maxLength={8} />
          <Campo rotulo="Marca" nome="marca" valor={dados.marca} aoMudar={aoMudar} erro={erros.marca}
                 obrigatorio placeholder="Ex.: Fiat" />
          <Campo rotulo="Modelo" nome="modelo" valor={dados.modelo} aoMudar={aoMudar} erro={erros.modelo}
                 obrigatorio placeholder="Ex.: Uno" />
          <Campo rotulo="Ano" nome="ano" type="number" valor={dados.ano} aoMudar={aoMudar} erro={erros.ano} />
          <Campo rotulo="Cor" nome="cor" valor={dados.cor} aoMudar={aoMudar} erro={erros.cor} />
          <Campo rotulo="Km atual" nome="km_atual" type="number" valor={dados.km_atual} aoMudar={aoMudar}
                 erro={erros.km_atual} />
        </div>
        <p className="dica">Placa aceita padrão antigo (AAA0000) e Mercosul (AAA0A00).</p>
        {erroGeral && <div className="alerta erro">{erroGeral}</div>}
        <div className="botoes">
          <button className="btn primario" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar'}</button>
          <button type="button" className="btn" onClick={() => navegar('/veiculos')}>Cancelar</button>
        </div>
      </form>
    </>
  );
}
