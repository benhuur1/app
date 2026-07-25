// Fonte de dados dos projetos do portfólio.
// Num sistema maior isto viria de um banco; aqui um módulo basta e mantém
// a API sem dependência de infraestrutura.
export const PROJETOS = [
  {
    slug: "calculadoradesalariohora",
    titulo: "Calculadora de salário hora",
    descricao:
      "Efetua o cálculo do valor ganho por hora trabalhada a partir do salário bruto, dos dias trabalhados no mês e das horas trabalhadas por dia, e a partir disso gera o valor da hora extra.",
    caminho: "projects/calculadoradesalariohora",
    ano: 2023,
    destaque: false,
    tecnologias: ["HTML", "CSS", "Vue.js"],
  },
  {
    slug: "exploradordepaises",
    titulo: "Explorador de Países com GraphQL",
    descricao:
      "Consulta uma API GraphQL pública direto do navegador e lista todos os países do mundo, com busca, filtro por continente e detalhes de cada país.",
    caminho: "projects/exploradordepaises",
    ano: 2026,
    destaque: true,
    tecnologias: ["HTML", "CSS", "Vue.js", "GraphQL"],
  },
];
