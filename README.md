# Site pessoal — José Ben Hur

Site estático (HTML, CSS/SCSS e Vue.js) publicado no GitHub Pages:
[benhuur1.github.io/app](https://benhuur1.github.io/app/)

Não há build nem gerenciador de pacotes: o Vue é carregado do arquivo
`js/vuejs.min.js` e cada página importa `js/App.js` como módulo ES. O
GitHub Pages serve o repositório direto da branch `master`.

## Projetos

- **Calculadora de salário hora** (`projects/calculadoradesalariohora/`) —
  calcula o valor da hora trabalhada a partir do salário bruto.
- **Explorador de Países com GraphQL** (`projects/exploradordepaises/`) —
  consulta a [Countries GraphQL API](https://countries.trevorblades.com/)
  direto do navegador, com busca, filtro por continente e detalhes de cada
  país. A página tem um painel que mostra a consulta GraphQL executada.

## API GraphQL própria

A pasta `graphql-api/` traz uma API GraphQL que serve a lista de projetos
consumida por `/projects/`. Ela não roda no GitHub Pages — é publicada
separadamente como função serverless. As instruções de deploy e o schema
estão em [`graphql-api/README.md`](graphql-api/README.md).

Enquanto a API não estiver publicada, a página de projetos usa uma lista
local embutida em `js/ProjetosGraphQL.js` e funciona normalmente.

### GraphQL sem servidor próprio

O GitHub Pages só entrega arquivos estáticos, então não é possível hospedar
um servidor GraphQL aqui. O que dá para fazer — e é o que o Explorador de
Países faz — é o navegador atuar como cliente: um `POST` com
`Content-Type: application/json` e corpo `{ "query": ..., "variables": ... }`
para uma API GraphQL pública que permita CORS. A lógica está em
`js/ExploradorPaises.js`, no método `consultarGraphQL`.

## Rodando localmente

Os módulos ES exigem HTTP (abrir o arquivo direto pelo `file://` não
funciona). Com Python instalado:

```bash
python3 -m http.server 8000
```

E acesse `http://localhost:8000`.

## Estrutura

```
index.html, about/, contato/, projects/   páginas
css/                                      CSS servido (compilado de scss/)
scss/                                     fontes SCSS
js/                                       Vue, componentes e páginas
assets/                                   imagens e ícones
graphql-api/                              API GraphQL (deploy separado)
```

Os arquivos em `css/` são o resultado da compilação de `scss/` e estão
versionados, já que não há etapa de build no deploy. Ao alterar um `.scss`,
recompile o `.css` correspondente antes de commitar.
