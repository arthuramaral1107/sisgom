# SISGOM – Backend (API REST)

API em Node.js + Express + PostgreSQL do **SISGOM – Sistema de Gestão para Oficinas Mecânicas** (Projeto Integrador – UCEFF).

## Requisitos
- Node.js 20+
- PostgreSQL (local ou remoto, ex.: Neon)

## Como rodar3
```bash
cd backend
npm install
cp .env.example .env        # no Windows: copy .env.example .env
# edite o .env: DATABASE_URL e JWT_SECRET
npm run db:setup            # cria as tabelas (schema.sql) e popula (seed.sql)
npm run dev                 # http://localhost:3333/api/saude
```

### Variáveis de ambiente (.env)
| Variável | Descrição |
|---|---|
| PORT | Porta da API (padrão 3333) |
| DATABASE_URL | String de conexão PostgreSQL (ex.: `postgresql://usuario:senha@host/banco?sslmode=require`) |
| JWT_SECRET | Segredo para assinar tokens (use um valor longo e aleatório) |
| JWT_EXPIRA | Validade do token (padrão 8h) |
| CORS_ORIGIN | Origens permitidas, separadas por vírgula (ex.: `http://localhost:5173`) |
| DB_POOL_MAX | Opcional: máximo de conexões do pool (padrão 10) |
| LOGIN_LIMITE | Opcional: tentativas de login por IP a cada 15 minutos (padrão 20) |

> O arquivo `.env` **nunca** deve ir para o GitHub (já está no `.gitignore`).

## Banco de dados
- `database/schema.sql` – DDL (9 tabelas, chaves, CHECKs e índices)
- `database/seed.sql` – DML (usuários, clientes, veículos, serviços, peças e OS de exemplo)
- `npm run db:schema` / `npm run db:seed` / `npm run db:setup`

## Usuários de teste (senha `sisgom123`)
| E-mail | Perfil |
|---|---|
| admin@sisgom.com | ADMIN |
| atendente@sisgom.com | ATENDENTE |
| mecanico@sisgom.com | MECANICO |

## Endpoints
| Método | Rota | Perfis | Descrição |
|---|---|---|---|
| GET | /api/saude | público | Status da API e do banco |
| POST | /api/auth/login | público | Login → `{ token, usuario }` |
| GET | /api/auth/me | todos | Dados do usuário logado |
| GET | /api/clientes | todos | Lista (`busca`, `pagina`, `limite`) |
| GET | /api/clientes/:id | todos | Detalhe |
| POST | /api/clientes | ADMIN, ATENDENTE | Cria |
| PUT | /api/clientes/:id | ADMIN, ATENDENTE | Atualiza |
| DELETE | /api/clientes/:id | ADMIN | Exclui (409 se houver veículos) |
| GET/POST/PUT/DELETE | /api/veiculos | idem | Mesmas regras; filtro `cliente_id` |
| GET/POST/PUT/DELETE | /api/servicos | idem | Catálogo de serviços (409 ao excluir serviço usado em OS) |
| GET/POST/PUT/DELETE | /api/pecas | idem | Peças e estoque; filtro `baixo=1` (estoque ≤ mínimo) |
| GET | /api/os | todos | Lista (`busca`, `status`, `pagina`, `limite`) |
| GET | /api/os/:id | todos | OS completa com serviços e peças |
| POST | /api/os | ADMIN, ATENDENTE | Abre a OS (o atendente é o usuário logado) |
| PUT | /api/os/:id | ADMIN, ATENDENTE | Altera defeito e mecânico (OS aberta ou em andamento) |
| DELETE | /api/os/:id | ADMIN | Exclui OS aberta ou cancelada |
| POST | /api/os/:id/servicos | todos | Adiciona serviço à OS |
| DELETE | /api/os/:id/servicos/:itemId | todos | Remove serviço da OS |
| POST | /api/os/:id/pecas | todos | Adiciona peça à OS |
| DELETE | /api/os/:id/pecas/:itemId | todos | Remove peça da OS |
| PATCH | /api/os/:id/status | todos | Muda o status (cancelar: ADMIN e ATENDENTE) |
| GET | /api/usuarios/mecanicos | todos | Mecânicos ativos |

Envie o token em `Authorization: Bearer <token>`.

### Códigos de resposta
`200/201/204` sucesso · `400` dados inválidos (`{erro, detalhes:[{campo,mensagem}]}`) · `401` não autenticado · `403` sem permissão · `404` não encontrado · `409` conflito (duplicidade ou vínculo) · `429` muitas tentativas de login

### Regras da ordem de serviço
- Fluxo de status: `aberta → em_andamento → finalizada`. Cancelar vale a partir de aberta ou em andamento.
- Serviços e peças só mudam com a OS aberta ou em andamento, e o `valor_total` é recalculado a cada alteração.
- Ao finalizar, as peças são baixadas do estoque em uma transação. Se faltar estoque, responde `409` e nada é alterado.

### Exemplo
```bash
curl -X POST http://localhost:3333/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sisgom.com","senha":"sisgom123"}'
```

## Estrutura
```
src/
  app.js, server.js
  config/db.js
  middlewares/  auth.js, erros.js
  controllers/  auth, clientes, veiculos, servicos, pecas, os
  routes/       index, auth, clientes, veiculos, servicos, pecas, os, usuarios
  utils/validacao.js   (CPF/CNPJ, placa, e-mail, serviços, peças e OS)
database/  schema.sql, seed.sql
scripts/   setup-db.js
```