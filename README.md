# SISGOM · Sistema de Gestão para Oficinas Mecânicas

Projeto Integrador do curso de Tecnologia em Análise e Desenvolvimento de Sistemas (UCEFF).

- **Aluno:** Arthur Anderson do Amaral
- **Professor:** Caio Vinicio Koch dos Santos
- **Semestre:** 2026/2

## Sobre o projeto

O SISGOM é uma aplicação web que reúne, em um único lugar, o cadastro de clientes e veículos, as ordens de serviço (OS) com serviços e peças, o controle de estoque e o registro financeiro básico de pequenas oficinas mecânicas.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Front-end | React (Vite) |
| Back-end | Node.js com Express (API REST, autenticação JWT) |
| Banco de dados | PostgreSQL (Neon, na nuvem) |
| Wireframes | Imagens em `docs/wireframes` |
| Diagramas | Mermaid (casos de uso, sequência, classes, atividades, MER) |

## Estrutura do repositório

```
sisgom/
├── backend/    API em Node.js (scripts do banco em backend/database)
├── frontend/   Interface em React
└── docs/
    ├── diagramas/   Casos de uso, sequência, MER, atividades e cronograma
    ├── wireframes/  Wireframes das telas
    └── documento/   Documento do projeto (PDF por entrega)
```

## Status

| Entrega | Prazo | Situação |
| --- | --- | --- |
| 1 · Planejamento | 06/11/2026 | Concluída |
| 2 · Funcionalidades básicas | 13/11/2026 | Concluída |
| 3 · Funcionalidades complementares | 20/11/2026 | Pendente |
| 4 · Entrega final | 27/11/2026 | Pendente |

## Como executar

- **Backend:** veja [`backend/README.md`](backend/README.md) (`npm install`, configurar `.env`, `npm run db:setup`, `npm run dev`). A API sobe em `http://localhost:3333`.
- **Frontend:** veja [`frontend/README.md`](frontend/README.md) (`npm install`, `npm run dev`). A interface sobe em `http://localhost:5173`.
- Requer Node.js 20 ou superior.

## Entrega 2 – Banco de dados

- DDL: `backend/database/schema.sql`
- DML (dados iniciais): `backend/database/seed.sql`
- Parâmetros de conexão: `backend/.env.example` (o `.env` real não é versionado)

## Entrega 2 – Wireframes e telas implementadas

| Wireframe (`docs/wireframes`) | Tela implementada (`frontend/src/pages`) | Endpoints da API |
|---|---|---|
| wireframe_01_login.png | Login.jsx | POST /api/auth/login, GET /api/auth/me |
| wireframe_02_clientes_lista.png | ClientesLista.jsx | GET /api/clientes, DELETE /api/clientes/:id |
| wireframe_03_cliente_formulario.png | ClienteForm.jsx | POST /api/clientes, PUT /api/clientes/:id |
| wireframe_04_veiculos_lista.png | VeiculosLista.jsx | GET /api/veiculos, DELETE /api/veiculos/:id |
| wireframe_05_veiculo_formulario.png | VeiculoForm.jsx | POST /api/veiculos, PUT /api/veiculos/:id |