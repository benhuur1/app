// Projeto Explorador de Países — consome a Countries GraphQL API
// (https://countries.trevorblades.com/) direto do navegador, sem servidor próprio.
const ENDPOINT_GRAPHQL = "https://countries.trevorblades.com/";

const QUERY_PAISES = `query ListaDePaises($lang: String!) {
  continents {
    code
    name
  }
  countries {
    code
    nome: name(lang: $lang)
    name
    emoji
    capital
    continent {
      code
    }
  }
}`;

const QUERY_DETALHE_PAIS = `query DetalhePais($code: ID!, $lang: String!) {
  country(code: $code) {
    code
    nome: name(lang: $lang)
    name
    native
    emoji
    capital
    phone
    currency
    continent {
      code
      name
    }
    languages {
      name
      native
    }
    states {
      name
    }
  }
}`;

// A API devolve nomes de continentes em inglês; tradução local dos 7 códigos.
const NOMES_CONTINENTES = {
  AF: "África",
  AN: "Antártida",
  AS: "Ásia",
  EU: "Europa",
  NA: "América do Norte",
  OC: "Oceania",
  SA: "América do Sul",
};

if (document.querySelector("#app-paises")) {
  new Vue({
    el: "#app-paises",
    data: {
      endpoint: ENDPOINT_GRAPHQL,
      carregando: true,
      erro: "",
      continentes: [],
      paises: [],
      busca: "",
      continenteSelecionado: "",
      paisSelecionado: null,
      carregandoDetalhe: false,
      erroDetalhe: "",
      ultimaConsulta: { query: QUERY_PAISES, variables: { lang: "pt" } },
    },
    computed: {
      paisesFiltrados() {
        const termo = this.normalizar(this.busca);
        return this.paises.filter((pais) => {
          const doContinente =
            !this.continenteSelecionado ||
            pais.continent.code === this.continenteSelecionado;
          const daBusca =
            !termo ||
            this.normalizar(pais.nome).includes(termo) ||
            this.normalizar(pais.name).includes(termo) ||
            this.normalizar(pais.capital).includes(termo);
          return doContinente && daBusca;
        });
      },
      variaveisFormatadas() {
        return JSON.stringify(this.ultimaConsulta.variables, null, 2);
      },
    },
    methods: {
      normalizar(texto) {
        return (texto || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      },
      nomeContinente(codigo) {
        const continente = this.continentes.find((c) => c.code === codigo);
        return (
          NOMES_CONTINENTES[codigo] || (continente ? continente.name : codigo)
        );
      },
      listaIdiomas(detalhe) {
        return (
          detalhe.languages
            .map((idioma) => idioma.native || idioma.name)
            .join(", ") || "—"
        );
      },
      listaEstados(detalhe) {
        return detalhe.states.map((estado) => estado.name).join(", ");
      },
      async consultarGraphQL(query, variables) {
        this.ultimaConsulta = { query, variables };
        const resposta = await fetch(ENDPOINT_GRAPHQL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });
        if (!resposta.ok) {
          throw new Error(`O servidor respondeu com HTTP ${resposta.status}.`);
        }
        const json = await resposta.json();
        if (json.errors && json.errors.length) {
          throw new Error(json.errors[0].message);
        }
        return json.data;
      },
      async buscarPaises() {
        this.carregando = true;
        this.erro = "";
        try {
          const dados = await this.consultarGraphQL(QUERY_PAISES, {
            lang: "pt",
          });
          this.continentes = dados.continents;
          this.paises = dados.countries
            .slice()
            .sort((a, b) =>
              (a.nome || a.name).localeCompare(b.nome || b.name, "pt-BR")
            );
        } catch (excecao) {
          this.erro = excecao.message;
        } finally {
          this.carregando = false;
        }
      },
      async verDetalhes(pais) {
        this.paisSelecionado = { ...pais, detalhe: null };
        this.carregandoDetalhe = true;
        this.erroDetalhe = "";
        try {
          const dados = await this.consultarGraphQL(QUERY_DETALHE_PAIS, {
            code: pais.code,
            lang: "pt",
          });
          this.paisSelecionado = { ...pais, detalhe: dados.country };
        } catch (excecao) {
          this.erroDetalhe = excecao.message;
        } finally {
          this.carregandoDetalhe = false;
        }
      },
      fecharDetalhes() {
        this.paisSelecionado = null;
        this.erroDetalhe = "";
      },
    },
    mounted() {
      this.buscarPaises();
    },
  });
}
