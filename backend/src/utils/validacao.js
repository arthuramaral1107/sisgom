const { ErroHttp } = require('../middlewares/erros');

const somenteDigitos = (v) => String(v ?? '').replace(/\D/g, '');

function cpfValido(c) {
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(c[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(c[t])) return false;
  }
  return true;
}

function cnpjValido(c) {
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const digito = (base) => {
    let peso = base.length - 7;
    let soma = 0;
    for (const n of base) {
      soma += Number(n) * peso--;
      if (peso < 2) peso = 9;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = digito(c.slice(0, 12));
  const d2 = digito(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

function formatarCpfCnpj(d) {
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// Acumula os erros de validação campo a campo e responde 400 com a lista.
function criarValidador() {
  const erros = [];
  return {
    erros,
    texto(valor, campo, { obrigatorio = false, max }) {
      const v = typeof valor === 'string' ? valor.trim() : '';
      if (!v) {
        if (obrigatorio) erros.push({ campo, mensagem: 'Campo obrigatório' });
        return null;
      }
      if (v.length > max) erros.push({ campo, mensagem: `Máximo de ${max} caracteres` });
      return v;
    },
    inteiro(valor, campo, { obrigatorio = false, min, max }) {
      if (valor === undefined || valor === null || valor === '') {
        if (obrigatorio) erros.push({ campo, mensagem: 'Campo obrigatório' });
        return null;
      }
      const n = Number(valor);
      if (!Number.isInteger(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
        erros.push({ campo, mensagem: 'Número inteiro inválido' });
        return null;
      }
      return n;
    },
    concluir() {
      if (erros.length) throw new ErroHttp(400, 'Dados inválidos', erros);
    },
  };
}

function validarCliente(body = {}) {
  const v = criarValidador();
  const nome = v.texto(body.nome, 'nome', { obrigatorio: true, max: 120 });
  const telefone = v.texto(body.telefone, 'telefone', { max: 20 });
  const email = v.texto(body.email, 'email', { max: 120 });
  const endereco = v.texto(body.endereco, 'endereco', { max: 200 });

  const digitos = somenteDigitos(body.cpf_cnpj);
  let cpfCnpj = null;
  if (!digitos) {
    v.erros.push({ campo: 'cpf_cnpj', mensagem: 'Campo obrigatório' });
  } else if (!(cpfValido(digitos) || cnpjValido(digitos))) {
    v.erros.push({ campo: 'cpf_cnpj', mensagem: 'CPF ou CNPJ inválido' });
  } else {
    cpfCnpj = formatarCpfCnpj(digitos);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    v.erros.push({ campo: 'email', mensagem: 'E-mail inválido' });
  }
  v.concluir();
  return { nome, cpf_cnpj: cpfCnpj, telefone, email, endereco };
}

function validarVeiculo(body = {}) {
  const v = criarValidador();
  const clienteId = v.inteiro(body.cliente_id, 'cliente_id', { obrigatorio: true, min: 1 });
  const marca = v.texto(body.marca, 'marca', { obrigatorio: true, max: 40 });
  const modelo = v.texto(body.modelo, 'modelo', { obrigatorio: true, max: 60 });
  const cor = v.texto(body.cor, 'cor', { max: 30 });
  const ano = v.inteiro(body.ano, 'ano', { min: 1900, max: new Date().getFullYear() + 1 });
  const kmAtual = v.inteiro(body.km_atual, 'km_atual', { min: 0 });

  const placa = String(body.placa ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!placa) {
    v.erros.push({ campo: 'placa', mensagem: 'Campo obrigatório' });
  } else if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)) {
    v.erros.push({ campo: 'placa', mensagem: 'Placa inválida (use AAA0A00 ou AAA0000)' });
  }
  v.concluir();
  return { cliente_id: clienteId, placa, marca, modelo, ano, cor, km_atual: kmAtual };
}

// Converte :id da rota em número inteiro positivo.
function idDaRota(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new ErroHttp(400, 'ID inválido');
  return id;
}

module.exports = { validarCliente, validarVeiculo, idDaRota };
