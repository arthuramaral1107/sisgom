-- ============================================================
-- SISGOM - Sistema de Gestão para Oficinas Mecânicas
-- Script DML (PostgreSQL) - dados de teste
-- Rode depois do schema.sql:  psql "<string de conexão>" -f seed.sql
-- Senha de todos os usuários de teste: sisgom123
-- ============================================================

INSERT INTO usuario (nome, email, senha_hash, perfil) VALUES
('Administrador SISGOM', 'admin@sisgom.com',     '$2b$10$Wy9KM8h/J0Z2ebsX2g8myOLvJcfgjnYlQ0vYst30JX0g5/9h9JF4a', 'ADMIN'),
('Marina Atendente',     'atendente@sisgom.com', '$2b$10$Wy9KM8h/J0Z2ebsX2g8myOLvJcfgjnYlQ0vYst30JX0g5/9h9JF4a', 'ATENDENTE'),
('Carlos Mecânico',      'mecanico@sisgom.com',  '$2b$10$Wy9KM8h/J0Z2ebsX2g8myOLvJcfgjnYlQ0vYst30JX0g5/9h9JF4a', 'MECANICO');

INSERT INTO cliente (nome, cpf_cnpj, telefone, email, endereco) VALUES
('João da Silva',        '111.444.777-35',     '(49) 99111-1111', 'joao.silva@email.com',  'Rua das Flores, 120 - Centro'),
('Maria Oliveira',       '222.555.888-46',     '(49) 99222-2222', 'maria.oliveira@email.com', 'Av. Brasil, 845 - Bairro Alto'),
('Transportes Rota Sul', '12.345.678/0001-95', '(49) 3322-3333',  'contato@rotasul.com.br', 'Rod. SC-283, km 12'),
('Pedro Santos',         '333.666.999-57',     '(49) 99444-4444', NULL,                    'Rua XV de Novembro, 56'),
('Ana Souza',            '444.777.000-83',     '(49) 99555-5555', 'ana.souza@email.com',   'Rua Sete de Setembro, 300');

INSERT INTO veiculo (cliente_id, placa, marca, modelo, ano, cor, km_atual) VALUES
(1, 'ABC1D23', 'Volkswagen', 'Gol 1.0',     2018, 'Prata',  72500),
(1, 'DEF4G56', 'Fiat',       'Strada',      2021, 'Branca', 38100),
(2, 'GHI7J89', 'Chevrolet',  'Onix',        2020, 'Preto',  51200),
(3, 'JKL0M12', 'Mercedes',   'Accelo 1016', 2017, 'Branco', 210400),
(3, 'MNO3P45', 'Volvo',      'FH 460',      2019, 'Azul',   487900),
(4, 'PQR6S78', 'Honda',      'Civic',       2015, 'Cinza',  118300),
(5, 'STU9V01', 'Toyota',     'Corolla',     2022, 'Prata',  24800);

INSERT INTO servico (descricao, valor_padrao) VALUES
('Troca de óleo e filtro',       120.00),
('Alinhamento e balanceamento',  150.00),
('Revisão de freios',            220.00),
('Troca de correia dentada',     380.00),
('Diagnóstico com scanner',       90.00),
('Troca de pastilhas de freio',  160.00);

INSERT INTO peca (codigo, descricao, preco_venda, quantidade_estoque, estoque_minimo) VALUES
('OL-5W30',  'Óleo 5W30 sintético (litro)',  42.00, 40, 10),
('FI-OL-01', 'Filtro de óleo',               28.00, 25,  8),
('FI-AR-01', 'Filtro de ar',                 35.00, 15,  5),
('PA-FR-01', 'Jogo de pastilhas de freio',  145.00, 10,  4),
('DI-FR-01', 'Disco de freio (par)',        260.00,  6,  2),
('CO-DE-01', 'Kit correia dentada',         310.00,  5,  2),
('VE-IG-01', 'Vela de ignição',              32.00, 30, 12),
('BA-60-01', 'Bateria 60Ah',                540.00,  3,  2);

-- OS 1: finalizada e paga (Gol do João)
INSERT INTO ordem_servico (veiculo_id, atendente_id, mecanico_id, data_abertura, data_fechamento, defeito_relatado, status, valor_total) VALUES
(1, 2, 3, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 'Revisão dos 70 mil km e troca de óleo', 'finalizada', 316.00);
INSERT INTO os_servico (os_id, servico_id, quantidade, valor_unitario) VALUES (1, 1, 1, 120.00);
INSERT INTO os_peca (os_id, peca_id, quantidade, valor_unitario) VALUES (1, 1, 4, 42.00), (1, 2, 1, 28.00);
INSERT INTO pagamento (os_id, forma_pagamento, valor, data_pagamento) VALUES (1, 'pix', 316.00, NOW() - INTERVAL '5 days');

-- OS 2: em andamento (Onix da Maria)
INSERT INTO ordem_servico (veiculo_id, atendente_id, mecanico_id, data_abertura, defeito_relatado, status, valor_total) VALUES
(3, 2, 3, NOW() - INTERVAL '1 day', 'Barulho ao frear e pedal baixo', 'em_andamento', 305.00);
INSERT INTO os_servico (os_id, servico_id, quantidade, valor_unitario) VALUES (2, 6, 1, 160.00);
INSERT INTO os_peca (os_id, peca_id, quantidade, valor_unitario) VALUES (2, 4, 1, 145.00);

-- OS 3: aberta, sem itens ainda (Accelo da Rota Sul)
INSERT INTO ordem_servico (veiculo_id, atendente_id, defeito_relatado, status) VALUES
(4, 2, 'Luz de injeção acesa no painel', 'aberta');
