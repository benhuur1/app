# API GraphQL do portfólio

API que serve os projetos exibidos em `/projects/`. É a contraparte do site
estático: como o GitHub Pages só entrega arquivos, esta parte roda em outro
lugar — uma função serverless.

## Estrutura

```
api/graphql.js       o endpoint (schema + resolvers + CORS)
dados/projetos.js    a fonte de dados
servidor-local.mjs   servidor de desenvolvimento
```

Só há uma dependência, a biblioteca `graphql`. Não há framework: o endpoint
é uma função `(req, res)` comum, o que o mantém portável entre Vercel,
Netlify, Cloudflare e um servidor Node qualquer.

## Rodando localmente

```bash
cd graphql-api
npm install
npm run dev
```

A API sobe em `http://localhost:4000/api/graphql`. Para testar:

```bash
curl -X POST http://localhost:4000/api/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ projetos { titulo ano tecnologias } }"}'
```

## O schema

```graphql
type Projeto {
  slug: ID!
  titulo: String!
  descricao: String!
  caminho: String!
  ano: Int!
  destaque: Boolean!
  tecnologias: [String!]!
}

type Query {
  projetos(tecnologia: String, destaque: Boolean): [Projeto!]!
  projeto(slug: ID!): Projeto
  tecnologias: [String!]!
}
```

Exemplos de consulta:

```graphql
# só os projetos que usam GraphQL
{ projetos(tecnologia: "GraphQL") { titulo caminho } }

# um projeto específico
{ projeto(slug: "exploradordepaises") { titulo descricao tecnologias } }
```

## Publicando na Vercel

O deploy é feito pela interface, sem CLI:

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `benhuur1/app`.
2. Em **Root Directory**, escolha `graphql-api`. Esse passo é essencial —
   sem ele a Vercel tenta publicar o site estático da raiz e não encontra a
   função.
3. O framework preset pode ficar em "Other". Não há build: a Vercel detecta
   a pasta `api/` e transforma `api/graphql.js` em função automaticamente.
4. Após o deploy, a URL será algo como
   `https://app-graphql-api.vercel.app/api/graphql`.

Feito isso, cole essa URL na constante `ENDPOINT_API`, no topo de
`js/ProjetosGraphQL.js`, e faça o commit. A página de projetos passa a ler
os dados daqui.

Enquanto a constante estiver vazia — ou se a API sair do ar — a página cai
automaticamente para a lista embutida em `js/ProjetosGraphQL.js` e continua
funcionando. Ao acrescentar um projeto novo, atualize os dois lugares:
`graphql-api/dados/projetos.js` e a lista local de `js/ProjetosGraphQL.js`.

## Adicionando um projeto

Edite `dados/projetos.js` e acrescente um objeto ao array. O campo `caminho`
é relativo à raiz do site, sem barra inicial (ex: `projects/meuprojeto`).
Não é preciso mexer no schema nem nos resolvers.
