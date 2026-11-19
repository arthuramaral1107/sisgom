# SISGOM – Front-end (React + Vite)

Interface web do **SISGOM – Sistema de Gestão para Oficinas Mecânicas**. Consome a API do diretório `backend`.

## Como rodar
```bash
cd frontend
npm install
copy .env.example .env     # (Windows) – ajuste VITE_API_URL se necessário
npm run dev                # http://localhost:5173
```
A API precisa estar rodando (`npm run dev` na pasta `backend`, porta 3333).

## Telas
- Login (JWT)
- Clientes: lista com busca e paginação, cadastro, edição e exclusão
- Veículos: lista com busca e paginação, cadastro, edição e exclusão (vinculado a um cliente)
- Serviços: catálogo com busca, cadastro, edição e exclusão
- Peças: lista com busca e filtro de estoque baixo, cadastro, edição (inclui ajuste de estoque) e exclusão
- Ordens de Serviço: lista com busca e filtro por status, abertura, detalhe com serviços e peças, total e andamento (iniciar, finalizar e cancelar)

## Permissões na interface
| Ação | ADMIN | ATENDENTE | MECANICO |
|---|---|---|---|
| Visualizar | ✔ | ✔ | ✔ |
| Cadastrar / editar | ✔ | ✔ | – |
| Excluir | ✔ | – | – |
| Abrir e editar OS | ✔ | ✔ | – |
| Adicionar itens, iniciar e finalizar OS | ✔ | ✔ | ✔ |
| Cancelar OS | ✔ | ✔ | – |
| Excluir OS (aberta ou cancelada) | ✔ | – | – |

## Estrutura
```
src/
  main.jsx, App.jsx, styles.css, hooks.js
  services/api.js          (chamadas à API e tratamento de erros)
  contexts/AuthContext.jsx (login, token, perfil)
  components/              Layout, RotaProtegida, Campo, Paginacao, StatusOS (index.js reúne as exportações)
  pages/                   Login, Clientes, Veículos, Serviços, Peças e OS (lista, formulário e detalhe) (index.js reúne as exportações)
```

## Publicação (Netlify)
- Build command: `npm run build` · Publish directory: `dist`
- Variável de ambiente: `VITE_API_URL` apontando para a URL pública da API
- O arquivo `public/_redirects` já trata as rotas do React Router.
