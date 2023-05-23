const Header = {
  template: `
    <header>
      <div class="container-header">
        <h1><a :href="url">José Ben Hur</a></h1>
        <button @click="toggleMenu" class="buttonHamburguer" :class="{menuOpen: isMenuOpen}" :aria-expanded="isMenuOpen" :aria-label="getMenuButtonLabel()">
          <span class="headerHamburguer" :class="{activeMenu: isMenuOpen}"></span>
        </button>
        <nav class="nav-menu-desktop">
          <ul>
            <li v-for="link in links" :key="link.url">
              <a :href="link.url" :class="{ activelink: isActiveLink(link.url) }">{{ link.value }}</a>
              <ul v-if="link.submenu" class="submenu">
                <li v-for="submenuLink in link.submenu" :key="submenuLink.url">
                  <a :href="submenuLink.url" :class="{ activelink: isActiveLink(submenuLink)}">{{ submenuLink.value }}</a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
      <!-- Menu Mobile -->
      <nav class="navMenuMobile" :class="{active: isMenuOpen}">
        <ul>
          <li v-for="link in links" :key="link.url" :class="{ hasSubmenu: link.submenu}">
          <a :href="link.url" :class="{ activelink: isActiveLink(link.url), hasArrow: link.submenu }" >{{ link.value }}</a>
          <span v-if="link.submenu" class="submenu-icon" @click="toggleSubmenu(link)">
          <i class="fas" :class="{'fa-chevron-down': !link.showSubmenu, 'fa-chevron-up': link.showSubmenu}"></i>
        </span>
            <ul v-if="link.submenu" class="submenu" :class="{ showSubmenu: link.showSubmenu, 'submenu-transition': link.submenuTransitionClass }">
              <li v-for="submenuLink in link.submenu" :key="submenuLink.url">
                <a :href="submenuLink.url" :class="{ activelink: isActiveLink(submenuLink)}">{{ submenuLink.value }}</a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  `,
  data() {
    return {
      domain: "",
      isMenuOpen: false,
      links: [],
      url: "",
    };
  },
  methods: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
      console.log(this.domain);
    },
    getMenuButtonLabel() {
      return this.isMenuOpen ? "Fechar menu" : "Abrir menu";
    },
    isActiveLink(url) {
      const currentPath = window.location.pathname.replace(/\/$/, "");
      return currentPath === url;
    },
    toggleSubmenu(link) {
      link.showSubmenu = !link.showSubmenu; // Alterna o estado do submenu
      // Adicione uma classe CSS ao submenu quando estiver aberto
      if (link.showSubmenu) {
        link.submenuTransitionClass = "submenu-transition";
      } else {
        link.submenuTransitionClass = "";
      }
      // Percorre todos os links para fechar outros submenus abertos
      this.links.forEach((otherLink) => {
        if (otherLink !== link) {
          otherLink.showSubmenu = false;
        }
      });
    },
  },
  mounted() {
    this.domain = window.location.hostname;
    this.url = `https://${this.domain}${
      this.domain === "benhuur1.github.io" ? "/app" : ""
    }`;
    this.links = [
      {
        url: `https://${this.domain}${
          this.domain === "benhuur1.github.io" ? "/app" : ""
        }`,
        value: "Home",
        active: false,
        submenu: null,
      },
      {
        url: `https://${this.domain}${
          this.domain === "benhuur1.github.io" ? "/app" : ""
        }/sobre`,
        value: "Sobre",
        active: false,
        submenu: null,
      },
      {
        url: `https://${this.domain}${
          this.domain === "benhuur1.github.io" ? "/app" : ""
        }/contato`,
        value: "Contato",
        active: false,
        submenu: null,
      },
      {
        url: `https://${this.domain}${
          this.domain === "benhuur1.github.io" ? "/app" : ""
        }/projects`,
        value: "Projetos",
        active: false,
        submenu: [
          {
            url: `https://${this.domain}${
              this.domain === "benhuur1.github.io" ? "/app" : ""
            }/projects/calculadoradesalariohora`,
            value: "Cálculadora de salário hora",
            active: false,
          },
        ],
      },
    ];
    const currentPath = window.location.pathname;
    this.links = this.links.map((link) => {
      return {
        ...link,
        active: link.url === currentPath,
        showSubmenu: false,
      };
    });
  },
};

Vue.component("HeaderSite", Header);
