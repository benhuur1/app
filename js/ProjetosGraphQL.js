// Lista de projetos da página /projects/, servida pela minha própria API
// GraphQL (o código dela está em graphql-api/ neste repositório).
//
// Depois de publicar a API, cole a URL abaixo — algo como
// "https://SEU-PROJETO.vercel.app/api/graphql". Enquanto estiver vazia, ou
// se a API estiver fora do ar, a página usa a lista local abaixo e continua
// funcionando normalmente.
const ENDPOINT_API = "";

// Cópia local usada como plano B. Mantenha em sincronia com
// graphql-api/dados/projetos.js ao adicionar um projeto novo.
const PROJETOS_LOCAIS = [
  {
    slug: "exploradordepaises",
    titulo: "Explorador de Países com GraphQL",
    descricao:
      "Consulta uma API GraphQL pública direto do navegador e lista todos os países do mundo, com busca, filtro por continente e detalhes de cada país.",
    caminho: "projects/exploradordepaises",
    ano: 2026,
    tecnologias: ["HTML", "CSS", "Vue.js", "GraphQL"],
  },
  {
    slug: "calculadoradesalariohora",
    titulo: "Calculadora de salário hora",
    descricao:
      "Efetua o cálculo do valor ganho por hora trabalhada a partir do salário bruto, dos dias trabalhados no mês e das horas trabalhadas por dia, e a partir disso gera o valor da hora extra.",
    caminho: "projects/calculadoradesalariohora",
    ano: 2023,
    tecnologias: ["HTML", "CSS", "Vue.js"],
  },
];

const QUERY_PROJETOS = `query ListaDeProjetos($tecnologia: String) {
  projetos(tecnologia: $tecnologia) {
    slug
    titulo
    descricao
    caminho
    ano
    tecnologias
  }
  tecnologias
}`;

if (document.querySelector("#app-projetos")) {
  new Vue({
    el: "#app-projetos",
    data: {
      carregando: Boolean(ENDPOINT_API),
      projetos: ENDPOINT_API ? [] : PROJETOS_LOCAIS,
      tecnologias: [],
      tecnologiaSelecionada: "",
      viaApi: false,
      query: QUERY_PROJETOS,
    },
    computed: {
      projetosFiltrados() {
        if (!this.tecnologiaSelecionada) return this.projetos;
        return this.projetos.filter((projeto) =>
          projeto.tecnologias.includes(this.tecnologiaSelecionada)
        );
      },
      listaDeTecnologias() {
        if (this.tecnologias.length) return this.tecnologias;
        return [
          ...new Set(this.projetos.flatMap((projeto) => projeto.tecnologias)),
        ].sort((a, b) => a.localeCompare(b, "pt-BR"));
      },
    },
    methods: {
      // A API devolve o caminho a partir da raiz do site. Como esta página é
      // a própria /projects/, a raiz sai tirando esse trecho do fim da URL —
      // o que também resolve o /app do GitHub Pages sem precisar codificá-lo.
      urlDoProjeto(projeto) {
        const raizDoSite = window.location.pathname.replace(/projects\/?$/, "");
        return `${raizDoSite}${projeto.caminho}`;
      },
      async buscarProjetos() {
        if (!ENDPOINT_API) return;
        this.carregando = true;
        try {
          const resposta = await fetch(ENDPOINT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: QUERY_PROJETOS,
              variables: { tecnologia: null },
            }),
          });
          if (!resposta.ok) {
            throw new Error(`HTTP ${resposta.status}`);
          }
          const json = await resposta.json();
          if (json.errors && json.errors.length) {
            throw new Error(json.errors[0].message);
          }
          this.projetos = json.data.projetos;
          this.tecnologias = json.data.tecnologias;
          this.viaApi = true;
        } catch (excecao) {
          // A página nunca fica vazia: cai para a lista local.
          console.warn("API de projetos indisponível, usando lista local:", excecao.message);
          this.projetos = PROJETOS_LOCAIS;
          this.viaApi = false;
        } finally {
          this.carregando = false;
        }
      },
    },
    mounted() {
      this.buscarProjetos();
    },
  });
}
