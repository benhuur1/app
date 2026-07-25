// Endpoint GraphQL do portfólio.
// Escrito no formato de função serverless da Vercel: recebe (req, res) do
// Node e responde. Não há estado entre requisições.
import { buildSchema, graphql } from "graphql";
import { PROJETOS } from "../dados/projetos.js";

// O contrato da API. É daqui que saem a validação das consultas e a
// documentação exibida por qualquer explorador GraphQL.
const schema = buildSchema(`
  "Um projeto do portfólio."
  type Projeto {
    "Identificador usado na URL, ex: exploradordepaises"
    slug: ID!
    titulo: String!
    descricao: String!
    "Caminho relativo à raiz do site, sem barra inicial."
    caminho: String!
    ano: Int!
    destaque: Boolean!
    tecnologias: [String!]!
  }

  type Query {
    "Lista os projetos, do mais recente para o mais antigo."
    projetos(tecnologia: String, destaque: Boolean): [Projeto!]!
    "Busca um projeto pelo slug. Devolve null se não existir."
    projeto(slug: ID!): Projeto
    "Todas as tecnologias usadas, sem repetição e em ordem alfabética."
    tecnologias: [String!]!
  }
`);

const resolvers = {
  projetos: ({ tecnologia, destaque }) =>
    PROJETOS.filter((projeto) => {
      const temTecnologia =
        !tecnologia ||
        projeto.tecnologias.some(
          (item) => item.toLowerCase() === tecnologia.toLowerCase()
        );
      const temDestaque = destaque === undefined || projeto.destaque === destaque;
      return temTecnologia && temDestaque;
    }).sort((a, b) => b.ano - a.ano),

  projeto: ({ slug }) => PROJETOS.find((projeto) => projeto.slug === slug) || null,

  tecnologias: () =>
    [...new Set(PROJETOS.flatMap((projeto) => projeto.tecnologias))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    ),
};

// A API é pública e só de leitura, então qualquer origem pode consumi-la.
// Se um dia houver dados privados, troque "*" pelo domínio do site.
function aplicarCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function responder(res, status, corpo) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(corpo));
}

export default async function handler(req, res) {
  aplicarCors(res);

  // O navegador manda um OPTIONS antes do POST para checar o CORS.
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "POST") {
    return responder(res, 405, {
      errors: [
        {
          message:
            "Use POST com corpo JSON no formato { query, variables }.",
        },
      ],
    });
  }

  let corpo = req.body;
  // Na Vercel o corpo já vem parseado; rodando local, lemos o stream.
  if (typeof corpo === "string" || corpo === undefined) {
    corpo = await lerCorpo(req, corpo);
  }

  if (!corpo || !corpo.query) {
    return responder(res, 400, {
      errors: [{ message: "O corpo precisa conter o campo 'query'." }],
    });
  }

  const resultado = await graphql({
    schema,
    source: corpo.query,
    rootValue: resolvers,
    variableValues: corpo.variables,
    operationName: corpo.operationName,
  });

  return responder(res, 200, resultado);
}

async function lerCorpo(req, textoJaLido) {
  if (typeof textoJaLido === "string") {
    return textoJaLido ? JSON.parse(textoJaLido) : null;
  }
  const partes = [];
  for await (const parte of req) partes.push(parte);
  const texto = Buffer.concat(partes).toString("utf8");
  return texto ? JSON.parse(texto) : null;
}
