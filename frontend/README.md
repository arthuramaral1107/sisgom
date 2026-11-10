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

## Telas da Entrega 2
- Login (JWT)
- Clientes: lista com busca e paginação, cadastro, edição e exclusão
- Veículos: lista com busca e paginação, cadastro, edição e exclusão (vinculado a um cliente)

## Permissões na interface
| Ação | ADMIN | ATENDENTE | MECANICO |
|---|---|---|---|
| Visualizar | ✔ | ✔ | ✔ |
| Cadastrar / editar | ✔ | ✔ | – |
| Excluir | ✔ | – | – |

## Estrutura
```
src/
  main.jsx, App.jsx, styles.css, hooks.js
  services/api.js          (chamadas à API e tratamento de erros)
  contexts/AuthContext.jsx (login, token, perfil)
  components/              Layout, RotaProtegida, Campo, Paginacao
  pages/                   Login, ClientesLista, ClienteForm, VeiculosLista, VeiculoForm
```

## Publicação (Netlify)
- Build command: `npm run build` · Publish directory: `dist`
- Variável de ambiente: `VITE_API_URL` apontando para a URL pública da API
- O arquivo `public/_redirects` já trata as rotas do React Router.
