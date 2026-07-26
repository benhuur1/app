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

## `pdp/` — réplica da PDP variante B com preview 3D

Segunda PoC: reproduz o **código real** da `sections/product-b.liquid` do tema
(`[AB] pdp-personalizacao-v1`) substituindo apenas o componente `Preview` 2D por
um álbum 3D. O que é idêntico ao da loja:

- `store` pub/sub, `useStore`, `sanitizeText`, limites por tamanho (`charLimits`),
  `isLightHex`, âncoras `PREVIEW_POS`/`PREVIEW_FS` — blocos verbatim, com as linhas
  de origem citadas em comentários
- O `Preview` 2D atual (verbatim), disponível no toggle "2D atual" para comparação
- Config com **dados reais da loja** (Admin API): 32 cores de linho, `charLimits`
  do Big Pocket, variantes/preços, fotos por cor no CDN, símbolos SVG do tema
- Preact 10.22.0 + htm 3.1.1 (mesmas versões; vendorizados em `pdp/vendor/` em vez
  do esm.sh usado pela section)

A UI da coluna direita é resumida (sem carrinho/frete/Spotify), mas alimenta os
mesmos campos de estado que o `App` real espelha no store. No tema, o `Preview3D`
viraria `assets/album-3d.js` carregado com `import()` quando `mode !== 'main'`.
