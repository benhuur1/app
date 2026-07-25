const linkIcon = document.createElement("link");
linkIcon.rel = "stylesheet";
linkIcon.href =
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
document.head.appendChild(linkIcon);

import "./vuejs.min.js";
// Component Header
import "./HeaderSite.js";

//Component Calculadora
import "./Calculadora.js";

//Component Explorador de Países (GraphQL)
import "./ExploradorPaises.js";

//Component Lista de projetos (API GraphQL própria)
import "./ProjetosGraphQL.js";


new Vue({
  el: "#app",

  data: {
    mensagem: "Hello, World!",
  },
});
