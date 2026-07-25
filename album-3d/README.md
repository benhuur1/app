# Álbum 3D — preview de personalização (PoC comparativa)

Demo de referência para a **FN-788** (flavianasser · cycle 13): substituir as fotos
estáticas da PDP (variante B do teste A/B) por um álbum 3D interativo com preview
de personalização.

Duas implementações do mesmo álbum, lado a lado, para embasar a decisão técnica do TDD:

| | WebGL · Three.js | CSS 3D puro |
|---|---|---|
| Peso | 633 KB min / 154 KB gzip (`three.min.js` r152) | ≈ 6 KB, sem bibliotecas |
| Realismo | luz, sombra, textura de tecido, foil em relevo | gradientes estáticos por face |
| Caminho no tema | import dinâmico fora do LCP | inline na section Liquid |

Personalização demonstrada (atualiza os dois previews em tempo real):

- **Cor da capa** — Piscina, Terracota, Verde Oliva, Areia, Grafite
- **Nome em hot-stamping** — foil dourado ou prateado

## Rodar

Servir a pasta por HTTP (a textura em canvas exige mesma origem):

```sh
npx serve album-3d
# ou
python3 -m http.server -d album-3d 8080
```

Arquivos:

- `index.html` — demo completo (autocontido, sem recursos externos)
- `three.min.js` — Three.js r152.2 vendorizado (UMD)
