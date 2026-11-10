-- ============================================================
-- SISGOM - Sistema de Gestão para Oficinas Mecânicas
-- Script DDL (PostgreSQL) - criação das tabelas
-- Uso: psql "<string de conexão>" -f schema.sql
-- ============================================================

DROP TABLE IF EXISTS pagamento      CASCADE;
DROP TABLE IF EXISTS os_peca        CASCADE;
DROP TABLE IF EXISTS os_servico     CASCADE;
DROP TABLE IF EXISTS ordem_servico  CASCADE;
DROP TABLE IF EXISTS peca           CASCADE;
DROP TABLE IF EXISTS servico        CASCADE;
DROP TABLE IF EXISTS veiculo        CASCADE;
DROP TABLE IF EXISTS cliente        CASCADE;
DROP TABLE IF EXISTS usuario        CASCADE;

-- Usuários do sistema (administrador, atendente e mecânico)
CREATE TABLE usuario (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    email       VARCHAR(120) NOT NULL UNIQUE,
    senha_hash  VARCHAR(100) NOT NULL,
    perfil      VARCHAR(15)  NOT NULL
                CHECK (perfil IN ('ADMIN', 'ATENDENTE', 'MECANICO')),
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Clientes da oficina
CREATE TABLE cliente (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    cpf_cnpj    VARCHAR(18)  NOT NULL UNIQUE,
    telefone    VARCHAR(20),
    email       VARCHAR(120),
    endereco    VARCHAR(200),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Veículos, sempre vinculados a um cliente
CREATE TABLE veiculo (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id  INTEGER      NOT NULL REFERENCES cliente (id) ON DELETE RESTRICT,
    placa       VARCHAR(8)   NOT NULL UNIQUE,
    marca       VARCHAR(40)  NOT NULL,
    modelo      VARCHAR(60)  NOT NULL,
    ano         SMALLINT     CHECK (ano BETWEEN 1900 AND 2100),
    cor         VARCHAR(30),
    km_atual    INTEGER      CHECK (km_atual >= 0),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_veiculo_cliente ON veiculo (cliente_id);

-- Catálogo de serviços oferecidos pela oficina
CREATE TABLE servico (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao     VARCHAR(120)  NOT NULL UNIQUE,
    valor_padrao  NUMERIC(10,2) NOT NULL CHECK (valor_padrao >= 0)
);

-- Peças em estoque
CREATE TABLE peca (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo              VARCHAR(30)   NOT NULL UNIQUE,
    descricao           VARCHAR(120)  NOT NULL,
    preco_venda         NUMERIC(10,2) NOT NULL CHECK (preco_venda >= 0),
    quantidade_estoque  INTEGER       NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
    estoque_minimo      INTEGER       NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0)
);

-- Ordens de serviço (OS)
CREATE TABLE ordem_servico (
    id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    veiculo_id        INTEGER       NOT NULL REFERENCES veiculo (id) ON DELETE RESTRICT,
    atendente_id      INTEGER       NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
    mecanico_id       INTEGER       REFERENCES usuario (id) ON DELETE RESTRICT,
    data_abertura     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    data_fechamento   TIMESTAMPTZ,
    defeito_relatado  VARCHAR(500)  NOT NULL,
    status            VARCHAR(15)   NOT NULL DEFAULT 'aberta'
                      CHECK (status IN ('aberta', 'em_andamento', 'finalizada', 'cancelada')),
    valor_total       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
    CHECK (data_fechamento IS NULL OR data_fechamento >= data_abertura)
);
CREATE INDEX idx_os_veiculo ON ordem_servico (veiculo_id);
CREATE INDEX idx_os_status  ON ordem_servico (status);

-- Serviços executados em uma OS
CREATE TABLE os_servico (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    os_id           INTEGER       NOT NULL REFERENCES ordem_servico (id) ON DELETE CASCADE,
    servico_id      INTEGER       NOT NULL REFERENCES servico (id) ON DELETE RESTRICT,
    quantidade      INTEGER       NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    valor_unitario  NUMERIC(10,2) NOT NULL CHECK (valor_unitario >= 0)
);
CREATE INDEX idx_os_servico_os ON os_servico (os_id);

-- Peças utilizadas em uma OS
CREATE TABLE os_peca (
    id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    os_id           INTEGER       NOT NULL REFERENCES ordem_servico (id) ON DELETE CASCADE,
    peca_id         INTEGER       NOT NULL REFERENCES peca (id) ON DELETE RESTRICT,
    quantidade      INTEGER       NOT NULL CHECK (quantidade > 0),
    valor_unitario  NUMERIC(10,2) NOT NULL CHECK (valor_unitario >= 0)
);
CREATE INDEX idx_os_peca_os ON os_peca (os_id);

-- Pagamentos de uma OS
CREATE TABLE pagamento (
    id               INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    os_id            INTEGER       NOT NULL REFERENCES ordem_servico (id) ON DELETE RESTRICT,
    forma_pagamento  VARCHAR(20)   NOT NULL
                     CHECK (forma_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito')),
    valor            NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    data_pagamento   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pagamento_os ON pagamento (os_id);
