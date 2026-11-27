/* Especificação OpenAPI 3 da API do SISGOM - exibida em /api/docs pelo Swagger UI */

/* Respostas de erro comuns, reaproveitadas nas rotas */
const ERROS = {
    400: { description: 'Dados inválidos (campo "detalhes" lista cada campo com erro)' },
    401: { description: 'Token ausente, inválido ou expirado' },
    403: { description: 'Perfil sem permissão para esta ação' },
    404: { description: 'Registro não encontrado' },
    409: { description: 'Conflito (valor único repetido, vínculo com outros registros ou regra de negócio)' }
};

/* Monta o bloco "responses" - o sucesso informado mais os erros pedidos */
function respostas(
    sucesso,
    ...codigos
) {
    const resultado = { ...sucesso };

    codigos.forEach((codigo) => {
        resultado[codigo] = {
            ...ERROS[codigo],
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Erro' }
                }
            }
        };
    });

    return resultado;
};

/* Resposta 200 com um schema */
const ok = (schema, descricao = 'Sucesso') => ({
    200: {
        description: descricao,
        content: {
            'application/json': { schema }
        }
    }
});

/* Resposta 201 com um schema */
const criado = (schema) => ({
    201: {
        description: 'Criado',
        content: {
            'application/json': { schema }
        }
    }
});

/* Resposta 204 sem corpo */
const semCorpo = {
    204: { description: 'Removido, sem conteúdo na resposta' }
};

/* Referência a um schema de components */
const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` });

/* Corpo JSON de uma requisição */
const corpo = (schema) => ({
    required: true,
    content: {
        'application/json': { schema }
    }
});

/* Parâmetro de rota com o id do registro */
const idRota = (nome = 'id') => ({
    name: nome,
    in: 'path',
    required: true,
    schema: { type: 'integer' }
});

/* Parâmetros de busca e paginação das listas */
const paginacao = [
    {
        name: 'busca',
        in: 'query',
        schema: { type: 'string' }
    },
    {
        name: 'pagina',
        in: 'query',
        schema: {
            type: 'integer',
            default: 1
        }
    },
    {
        name: 'limite',
        in: 'query',
        description: 'De 1 a 200',
        schema: {
            type: 'integer',
            default: 50
        }
    }
];

/* Lista paginada de um schema */
const lista = (schema) => ({
    type: 'object',
    properties: {
        dados: {
            type: 'array',
            items: schema
        },
        total: { type: 'integer' },
        pagina: { type: 'integer' },
        limite: { type: 'integer' }
    }
});

/* Cria as 5 rotas de CRUD de um cadastro */
function crud({
    tag,
    caminho,
    nome,
    schema,
    entrada,
    filtros = [],
    descricaoExcluir
}) {
    return {
        [caminho]: {
            get: {
                tags: [tag],
                summary: `Lista ${nome}`,
                description: 'Todos os perfis.',
                parameters: [
                    ...paginacao,
                    ...filtros
                ],
                responses: respostas(
                    ok(lista(schema)),
                    401
                )
            },
            post: {
                tags: [tag],
                summary: `Cadastra ${nome}`,
                description: 'Perfis: ADMIN e ATENDENTE.',
                requestBody: corpo(entrada),
                responses: respostas(
                    criado(schema),
                    400,
                    401,
                    403,
                    409
                )
            }
        },
        [`${caminho}/{id}`]: {
            get: {
                tags: [tag],
                summary: `Busca ${nome} pelo id`,
                parameters: [idRota()],
                responses: respostas(
                    ok(schema),
                    400,
                    401,
                    404
                )
            },
            put: {
                tags: [tag],
                summary: `Atualiza ${nome}`,
                description: 'Perfis: ADMIN e ATENDENTE.',
                parameters: [idRota()],
                requestBody: corpo(entrada),
                responses: respostas(
                    ok(schema),
                    400,
                    401,
                    403,
                    404,
                    409
                )
            },
            delete: {
                tags: [tag],
                summary: `Exclui ${nome}`,
                description: descricaoExcluir || 'Perfil: ADMIN.',
                parameters: [idRota()],
                responses: respostas(
                    semCorpo,
                    400,
                    401,
                    403,
                    404,
                    409
                )
            }
        }
    };
};

/* Dados de uma OS completa devolvidos pelas rotas de OS */
const OS_DETALHE = {
    allOf: [
        ref('OSResumo'),
        {
            type: 'object',
            properties: {
                servicos: {
                    type: 'array',
                    items: ref('ItemServico')
                },
                pecas: {
                    type: 'array',
                    items: ref('ItemPeca')
                },
                pagamentos: {
                    type: 'array',
                    items: ref('Pagamento')
                },
                total_pago: { type: 'number' },
                saldo: { type: 'number' },
                situacao_pagamento: {
                    type: 'string',
                    nullable: true,
                    enum: [
                        'pendente',
                        'parcial',
                        'pago'
                    ],
                    description: 'Só existe em OS finalizada (nas demais vem null).'
                }
            }
        }
    ]
};

const especificacao = {
    openapi: '3.0.3',
    info: {
        title: 'SISGOM - API',
        version: '1.0.0',
        description: [
            'API REST do SISGOM - Sistema de Gestão para Oficinas Mecânicas (Projeto Integrador, ADS - UCEFF).',
            '',
            'Para testar: faça login em **POST /auth/login**, copie o `token` da resposta, clique em **Authorize** e cole o token (sem a palavra Bearer).',
            '',
            'Perfis: ADMIN (tudo), ATENDENTE (cadastros, OS e pagamentos) e MECANICO (consulta e andamento das OS).'
        ].join('\n')
    },
    servers: [{ url: '/api' }],
    tags: [
        { name: 'Autenticação' },
        { name: 'Painel' },
        { name: 'Clientes' },
        { name: 'Veículos' },
        { name: 'Serviços' },
        { name: 'Peças' },
        { name: 'Ordens de serviço' },
        { name: 'Usuários' },
        { name: 'Sistema' }
    ],
    components: {
        securitySchemes: {
            bearer: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            Erro: {
                type: 'object',
                properties: {
                    erro: { type: 'string' },
                    detalhes: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                campo: { type: 'string' },
                                mensagem: { type: 'string' }
                            }
                        }
                    }
                }
            },
            Usuario: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    nome: { type: 'string' },
                    email: { type: 'string' },
                    perfil: {
                        type: 'string',
                        enum: [
                            'ADMIN',
                            'ATENDENTE',
                            'MECANICO'
                        ]
                    },
                    ativo: { type: 'boolean' }
                }
            },
            UsuarioEntrada: {
                type: 'object',
                required: [
                    'nome',
                    'email',
                    'perfil'
                ],
                properties: {
                    nome: {
                        type: 'string',
                        maxLength: 100
                    },
                    email: {
                        type: 'string',
                        maxLength: 120
                    },
                    perfil: {
                        type: 'string',
                        enum: [
                            'ADMIN',
                            'ATENDENTE',
                            'MECANICO'
                        ]
                    },
                    senha: {
                        type: 'string',
                        minLength: 8,
                        maxLength: 72,
                        description: 'Obrigatória ao cadastrar. Ao editar, vazia mantém a senha atual.'
                    }
                }
            },
            Cliente: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    nome: { type: 'string' },
                    cpf_cnpj: { type: 'string' },
                    telefone: {
                        type: 'string',
                        nullable: true
                    },
                    email: {
                        type: 'string',
                        nullable: true
                    },
                    endereco: {
                        type: 'string',
                        nullable: true
                    }
                }
            },
            ClienteEntrada: {
                type: 'object',
                required: [
                    'nome',
                    'cpf_cnpj'
                ],
                properties: {
                    nome: {
                        type: 'string',
                        maxLength: 120
                    },
                    cpf_cnpj: {
                        type: 'string',
                        description: 'CPF ou CNPJ válido, com ou sem pontuação.'
                    },
                    telefone: {
                        type: 'string',
                        maxLength: 20
                    },
                    email: {
                        type: 'string',
                        maxLength: 120
                    },
                    endereco: {
                        type: 'string',
                        maxLength: 200
                    }
                }
            },
            Veiculo: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    cliente_id: { type: 'integer' },
                    cliente_nome: { type: 'string' },
                    placa: { type: 'string' },
                    marca: { type: 'string' },
                    modelo: { type: 'string' },
                    cor: {
                        type: 'string',
                        nullable: true
                    },
                    ano: {
                        type: 'integer',
                        nullable: true
                    },
                    km_atual: {
                        type: 'integer',
                        nullable: true
                    }
                }
            },
            VeiculoEntrada: {
                type: 'object',
                required: [
                    'cliente_id',
                    'placa',
                    'marca',
                    'modelo'
                ],
                properties: {
                    cliente_id: { type: 'integer' },
                    placa: {
                        type: 'string',
                        description: 'Padrão antigo ou Mercosul; letras minúsculas e hífen são aceitos.'
                    },
                    marca: {
                        type: 'string',
                        maxLength: 40
                    },
                    modelo: {
                        type: 'string',
                        maxLength: 60
                    },
                    cor: {
                        type: 'string',
                        maxLength: 30
                    },
                    ano: {
                        type: 'integer',
                        minimum: 1900
                    },
                    km_atual: {
                        type: 'integer',
                        minimum: 0
                    }
                }
            },
            Servico: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    descricao: { type: 'string' },
                    valor_padrao: { type: 'number' }
                }
            },
            ServicoEntrada: {
                type: 'object',
                required: [
                    'descricao',
                    'valor_padrao'
                ],
                properties: {
                    descricao: {
                        type: 'string',
                        maxLength: 120
                    },
                    valor_padrao: {
                        type: 'number',
                        minimum: 0
                    }
                }
            },
            Peca: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    codigo: { type: 'string' },
                    descricao: { type: 'string' },
                    preco_venda: { type: 'number' },
                    quantidade_estoque: { type: 'integer' },
                    estoque_minimo: { type: 'integer' },
                    estoque_baixo: { type: 'boolean' }
                }
            },
            PecaEntrada: {
                type: 'object',
                required: [
                    'codigo',
                    'descricao',
                    'preco_venda'
                ],
                properties: {
                    codigo: {
                        type: 'string',
                        maxLength: 30
                    },
                    descricao: {
                        type: 'string',
                        maxLength: 120
                    },
                    preco_venda: {
                        type: 'number',
                        minimum: 0
                    },
                    quantidade_estoque: {
                        type: 'integer',
                        minimum: 0
                    },
                    estoque_minimo: {
                        type: 'integer',
                        minimum: 0
                    }
                }
            },
            OSResumo: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    status: {
                        type: 'string',
                        enum: [
                            'aberta',
                            'em_andamento',
                            'finalizada',
                            'cancelada'
                        ]
                    },
                    data_abertura: {
                        type: 'string',
                        format: 'date-time'
                    },
                    data_fechamento: {
                        type: 'string',
                        format: 'date-time',
                        nullable: true
                    },
                    valor_total: { type: 'number' },
                    defeito_relatado: { type: 'string' },
                    veiculo_id: { type: 'integer' },
                    mecanico_id: {
                        type: 'integer',
                        nullable: true
                    },
                    placa: { type: 'string' },
                    marca: { type: 'string' },
                    modelo: { type: 'string' },
                    cliente_nome: { type: 'string' },
                    situacao_pagamento: {
                        type: 'string',
                        nullable: true,
                        enum: [
                            'pendente',
                            'parcial',
                            'pago'
                        ],
                        description: 'Presente na listagem; só existe em OS finalizada.'
                    }
                }
            },
            OSEntrada: {
                type: 'object',
                required: [
                    'veiculo_id',
                    'defeito_relatado'
                ],
                properties: {
                    veiculo_id: { type: 'integer' },
                    mecanico_id: {
                        type: 'integer',
                        description: 'Opcional - precisa ser um mecânico ativo.'
                    },
                    defeito_relatado: {
                        type: 'string',
                        maxLength: 500
                    }
                }
            },
            ItemServico: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    servico_id: { type: 'integer' },
                    descricao: { type: 'string' },
                    quantidade: { type: 'integer' },
                    valor_unitario: { type: 'number' },
                    subtotal: { type: 'number' }
                }
            },
            ItemPeca: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    peca_id: { type: 'integer' },
                    codigo: { type: 'string' },
                    descricao: { type: 'string' },
                    quantidade: { type: 'integer' },
                    valor_unitario: { type: 'number' },
                    subtotal: { type: 'number' },
                    quantidade_estoque: { type: 'integer' }
                }
            },
            ItemServicoEntrada: {
                type: 'object',
                required: ['servico_id'],
                properties: {
                    servico_id: { type: 'integer' },
                    quantidade: {
                        type: 'integer',
                        minimum: 1,
                        default: 1
                    },
                    valor_unitario: {
                        type: 'number',
                        description: 'Opcional - o padrão é o valor do serviço.'
                    }
                }
            },
            ItemPecaEntrada: {
                type: 'object',
                required: [
                    'peca_id',
                    'quantidade'
                ],
                properties: {
                    peca_id: { type: 'integer' },
                    quantidade: {
                        type: 'integer',
                        minimum: 1
                    },
                    valor_unitario: {
                        type: 'number',
                        description: 'Opcional - o padrão é o preço de venda da peça.'
                    }
                }
            },
            Pagamento: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    forma_pagamento: {
                        type: 'string',
                        enum: [
                            'dinheiro',
                            'pix',
                            'cartao_debito',
                            'cartao_credito'
                        ]
                    },
                    valor: { type: 'number' },
                    data_pagamento: {
                        type: 'string',
                        format: 'date-time'
                    }
                }
            },
            PagamentoEntrada: {
                type: 'object',
                required: [
                    'forma_pagamento',
                    'valor'
                ],
                properties: {
                    forma_pagamento: {
                        type: 'string',
                        enum: [
                            'dinheiro',
                            'pix',
                            'cartao_debito',
                            'cartao_credito'
                        ]
                    },
                    valor: {
                        type: 'number',
                        minimum: 0.01,
                        description: 'Não pode passar do saldo da OS.'
                    }
                }
            },
            Painel: {
                type: 'object',
                properties: {
                    os_por_status: {
                        type: 'object',
                        properties: {
                            aberta: { type: 'integer' },
                            em_andamento: { type: 'integer' },
                            finalizada: { type: 'integer' },
                            cancelada: { type: 'integer' }
                        }
                    },
                    pecas_estoque_baixo: {
                        type: 'object',
                        properties: {
                            total: { type: 'integer' },
                            itens: {
                                type: 'array',
                                items: ref('Peca')
                            }
                        }
                    },
                    ultimas_os: {
                        type: 'array',
                        items: ref('OSResumo')
                    },
                    financeiro: {
                        type: 'object',
                        nullable: true,
                        description: 'Só para ADMIN e ATENDENTE (MECANICO recebe null).',
                        properties: {
                            a_receber: { type: 'number' },
                            faturado_mes: { type: 'number' },
                            recebido_mes: { type: 'number' }
                        }
                    }
                }
            }
        }
    },
    security: [{ bearer: [] }],
    paths: {
        '/saude': {
            get: {
                tags: ['Sistema'],
                summary: 'Verifica se a API e o banco estão no ar',
                security: [],
                responses: ok(
                    {
                        type: 'object',
                        properties: {
                            status: { type: 'string' },
                            banco: { type: 'string' }
                        }
                    },
                    'API e banco no ar'
                )
            }
        },
        '/auth/login': {
            post: {
                tags: ['Autenticação'],
                summary: 'Entra no sistema e devolve o token JWT (válido por 8 horas)',
                description: 'Limitado por IP para barrar tentativas de força bruta.',
                security: [],
                requestBody: corpo({
                    type: 'object',
                    required: [
                        'email',
                        'senha'
                    ],
                    properties: {
                        email: { type: 'string' },
                        senha: { type: 'string' }
                    }
                }),
                responses: respostas(
                    ok({
                        type: 'object',
                        properties: {
                            token: { type: 'string' },
                            usuario: ref('Usuario')
                        }
                    }),
                    400,
                    401
                )
            }
        },
        '/auth/me': {
            get: {
                tags: ['Autenticação'],
                summary: 'Dados do usuário logado',
                responses: respostas(
                    ok(ref('Usuario')),
                    401
                )
            }
        },
        '/painel': {
            get: {
                tags: ['Painel'],
                summary: 'Resumo da oficina para o Dashboard',
                description: 'Todos os perfis. O bloco financeiro só vai para ADMIN e ATENDENTE.',
                responses: respostas(
                    ok(ref('Painel')),
                    401
                )
            }
        },
        ...crud({
            tag: 'Clientes',
            caminho: '/clientes',
            nome: 'clientes',
            schema: ref('Cliente'),
            entrada: ref('ClienteEntrada'),
            descricaoExcluir: 'Perfil: ADMIN. Bloqueado (409) se o cliente tiver veículos.'
        }),
        ...crud({
            tag: 'Veículos',
            caminho: '/veiculos',
            nome: 'veículos',
            schema: ref('Veiculo'),
            entrada: ref('VeiculoEntrada'),
            filtros: [{
                name: 'cliente_id',
                in: 'query',
                schema: { type: 'integer' }
            }],
            descricaoExcluir: 'Perfil: ADMIN. Bloqueado (409) se o veículo tiver OS.'
        }),
        ...crud({
            tag: 'Serviços',
            caminho: '/servicos',
            nome: 'serviços',
            schema: ref('Servico'),
            entrada: ref('ServicoEntrada'),
            descricaoExcluir: 'Perfil: ADMIN. Bloqueado (409) se o serviço já foi usado em OS.'
        }),
        ...crud({
            tag: 'Peças',
            caminho: '/pecas',
            nome: 'peças',
            schema: ref('Peca'),
            entrada: ref('PecaEntrada'),
            filtros: [{
                name: 'baixo',
                in: 'query',
                description: 'Use 1 para listar só as peças com estoque baixo.',
                schema: {
                    type: 'integer',
                    enum: [1]
                }
            }],
            descricaoExcluir: 'Perfil: ADMIN. Bloqueado (409) se a peça já foi usada em OS.'
        }),
        '/os': {
            get: {
                tags: ['Ordens de serviço'],
                summary: 'Lista as ordens de serviço',
                description: 'Todos os perfis. A busca procura por placa, nome do cliente ou número da OS.',
                parameters: [
                    ...paginacao,
                    {
                        name: 'status',
                        in: 'query',
                        schema: {
                            type: 'string',
                            enum: [
                                'aberta',
                                'em_andamento',
                                'finalizada',
                                'cancelada'
                            ]
                        }
                    },
                    {
                        name: 'veiculo_id',
                        in: 'query',
                        schema: { type: 'integer' }
                    }
                ],
                responses: respostas(
                    ok(lista(ref('OSResumo'))),
                    400,
                    401
                )
            },
            post: {
                tags: ['Ordens de serviço'],
                summary: 'Abre uma ordem de serviço',
                description: 'Perfis: ADMIN e ATENDENTE. A OS nasce com status "aberta".',
                requestBody: corpo(ref('OSEntrada')),
                responses: respostas(
                    criado(OS_DETALHE),
                    400,
                    401,
                    403
                )
            }
        },
        '/os/{id}': {
            get: {
                tags: ['Ordens de serviço'],
                summary: 'Busca a OS completa (serviços, peças, pagamentos e saldo)',
                parameters: [idRota()],
                responses: respostas(
                    ok(OS_DETALHE),
                    400,
                    401,
                    404
                )
            },
            put: {
                tags: ['Ordens de serviço'],
                summary: 'Atualiza o defeito relatado e o mecânico responsável',
                description: 'Perfis: ADMIN e ATENDENTE. Só em OS aberta ou em andamento.',
                parameters: [idRota()],
                requestBody: corpo(ref('OSEntrada')),
                responses: respostas(
                    ok(OS_DETALHE),
                    400,
                    401,
                    403,
                    404,
                    409
                )
            },
            delete: {
                tags: ['Ordens de serviço'],
                summary: 'Exclui a OS',
                description: 'Perfil: ADMIN. Só OS sem serviços nem peças.',
                parameters: [idRota()],
                responses: respostas(
                    semCorpo,
                    400,
                    401,
                    403,
                    404,
                    409
                )
            }
        },
        '/os/{id}/status': {
            patch: {
                tags: ['Ordens de serviço'],
                summary: 'Muda o status da OS',
                description: [
                    'Transições: aberta para em_andamento ou cancelada; em_andamento para finalizada ou cancelada.',
                    'Ao finalizar, as peças são baixadas do estoque. Mecânico não cancela OS.'
                ].join(' '),
                parameters: [idRota()],
                requestBody: corpo({
                    type: 'object',
                    required: ['status'],
                    properties: {
                        status: {
                            type: 'string',
                            enum: [
                                'em_andamento',
                                'finalizada',
                                'cancelada'
                            ]
                        }
                    }
                }),
                responses: respostas(
                    ok(OS_DETALHE),
                    400,
                    401,
                    403,
                    404,
                    409
                )
            }
        },
        '/os/{id}/servicos': {
            post: {
                tags: ['Ordens de serviço'],
                summary: 'Adiciona um serviço à OS',
                description: 'Só em OS aberta ou em andamento. Recalcula o valor total.',
                parameters: [idRota()],
                requestBody: corpo(ref('ItemServicoEntrada')),
                responses: respostas(
                    criado(OS_DETALHE),
                    400,
                    401,
                    404,
                    409
                )
            }
        },
        '/os/{id}/servicos/{itemId}': {
            delete: {
                tags: ['Ordens de serviço'],
                summary: 'Remove um serviço da OS',
                parameters: [idRota(), idRota('itemId')],
                responses: respostas(
                    ok(OS_DETALHE),
                    400,
                    401,
                    404,
                    409
                )
            }
        },
        '/os/{id}/pecas': {
            post: {
                tags: ['Ordens de serviço'],
                summary: 'Adiciona uma peça à OS',
                description: 'Só em OS aberta ou em andamento. O estoque só é conferido e baixado ao finalizar.',
                parameters: [idRota()],
                requestBody: corpo(ref('ItemPecaEntrada')),
                responses: respostas(
                    criado(OS_DETALHE),
                    400,
                    401,
                    404,
                    409
                )
            }
        },
        '/os/{id}/pecas/{itemId}': {
            delete: {
                tags: ['Ordens de serviço'],
                summary: 'Remove uma peça da OS',
                parameters: [idRota(), idRota('itemId')],
                responses: respostas(
                    ok(OS_DETALHE),
                    400,
                    401,
                    404,
                    409
                )
            }
        },
        '/os/{id}/pagamentos': {
            post: {
                tags: ['Ordens de serviço'],
                summary: 'Registra um pagamento',
                description: 'Perfis: ADMIN e ATENDENTE. Só em OS finalizada e até o valor do saldo.',
                parameters: [idRota()],
                requestBody: corpo(ref('PagamentoEntrada')),
                responses: respostas(
                    criado(OS_DETALHE),
                    400,
                    401,
                    403,
                    404,
                    409
                )
            }
        },
        '/os/{id}/pagamentos/{pagamentoId}': {
            delete: {
                tags: ['Ordens de serviço'],
                summary: 'Estorna (remove) um pagamento',
                description: 'Perfil: ADMIN.',
                parameters: [idRota(), idRota('pagamentoId')],
                responses: respostas(
                    ok(OS_DETALHE),
                    400,
                    401,
                    403,
                    404
                )
            }
        },
        '/usuarios/mecanicos': {
            get: {
                tags: ['Usuários'],
                summary: 'Lista os mecânicos ativos',
                description: 'Todos os perfis. Usada para escolher o responsável pela OS.',
                responses: respostas(
                    ok({
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer' },
                                nome: { type: 'string' }
                            }
                        }
                    }),
                    401
                )
            }
        },
        '/usuarios': {
            get: {
                tags: ['Usuários'],
                summary: 'Lista os usuários',
                description: 'Perfil: ADMIN.',
                parameters: paginacao,
                responses: respostas(
                    ok(lista(ref('Usuario'))),
                    401,
                    403
                )
            },
            post: {
                tags: ['Usuários'],
                summary: 'Cadastra um usuário',
                description: 'Perfil: ADMIN.',
                requestBody: corpo(ref('UsuarioEntrada')),
                responses: respostas(
                    criado(ref('Usuario')),
                    400,
                    401,
                    403,
                    409
                )
            }
        },
        '/usuarios/{id}': {
            get: {
                tags: ['Usuários'],
                summary: 'Busca um usuário pelo id',
                description: 'Perfil: ADMIN.',
                parameters: [idRota()],
                responses: respostas(
                    ok(ref('Usuario')),
                    400,
                    401,
                    403,
                    404
                )
            },
            put: {
                tags: ['Usuários'],
                summary: 'Atualiza um usuário',
                description: 'Perfil: ADMIN. O administrador não altera o próprio perfil.',
                parameters: [idRota()],
                requestBody: corpo(ref('UsuarioEntrada')),
                responses: respostas(
                    ok(ref('Usuario')),
                    400,
                    401,
                    403,
                    404,
                    409
                )
            }
        },
        '/usuarios/{id}/ativo': {
            patch: {
                tags: ['Usuários'],
                summary: 'Inativa ou reativa um usuário',
                description: 'Perfil: ADMIN. Usuário não é excluído (fica ligado às OS) e o administrador não inativa a si mesmo.',
                parameters: [idRota()],
                requestBody: corpo({
                    type: 'object',
                    required: ['ativo'],
                    properties: {
                        ativo: { type: 'boolean' }
                    }
                }),
                responses: respostas(
                    ok(ref('Usuario')),
                    400,
                    401,
                    403,
                    404
                )
            }
        }
    }
};

module.exports = especificacao;