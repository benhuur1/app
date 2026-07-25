// Servidor de desenvolvimento: expõe a mesma função serverless em
// http://localhost:4000/api/graphql, sem precisar da CLI da Vercel.
import http from "node:http";
import handler from "./api/graphql.js";

const PORTA = process.env.PORT || 4000;

const servidor = http.createServer(async (req, res) => {
  const caminho = req.url.split("?")[0];
  if (caminho !== "/api/graphql" && caminho !== "/") {
    res.writeHead(404, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ errors: [{ message: "Rota inexistente." }] }));
  }
  try {
    await handler(req, res);
  } catch (excecao) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ errors: [{ message: excecao.message }] }));
  }
});

servidor.listen(PORTA, () => {
  console.log(`API GraphQL em http://localhost:${PORTA}/api/graphql`);
  console.log("Teste com:");
  console.log(
    `  curl -X POST http://localhost:${PORTA}/api/graphql \\\n` +
      `    -H 'Content-Type: application/json' \\\n` +
      `    -d '{"query":"{ projetos { titulo ano tecnologias } }"}'`
  );
});
