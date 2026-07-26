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

### Linha completa (9 produtos)

Todas as réplicas compartilham o mesmo código (store/modais/3D data-driven);
o que muda por página são os dados reais e o "spec" de geometria:

| Página | Produto | Formato | Capa | Lateral |
|---|---|---|---|---|
| `pdp/` | Big Pocket | 15×20 retrato | P23/M17 | P30 |
| `pdp/classic/` | Classic Pocket | 10×15 retrato | P14/M11 | P26 |
| `pdp/large/` | Large Pocket | 20×30 retrato | P33/M22/**G17** | P42/**M29** |
| `pdp/mini/` | Mini Pocket | 5×7 retrato + aba magnética | P11 (na aba) | — |
| `pdp/table-grande/` | Table Book Grande | 30×40 **paisagem** | P46/M32/G24 | P42/M30 |
| `pdp/table-midi/` | Table Book Midi | 20×30 **paisagem** | P46/M32/G24 | P35/M24 |
| `pdp/scrap-grande/` | Scrapbook Grande | 30×40 paisagem | P46/M32/G24 | P42/M30 |
| `pdp/scrap-midi/` | Scrapbook Midi | 20×30 paisagem | P46/M32/G24 | P35/M24 |
| `pdp/scrap-short/` | Scrapbook Short | 15×20 retrato | P23/M17 | P30 |

Nota: o metafield `cover_color_previews` da loja tem as fotos da cor Piscina
TROCADAS entre TB Grande e TB Midi (A3↔A4) — reproduzido fielmente aqui;
vale corrigir na loja.

### `pdp/classic/` — Classic Pocket

Classic Pocket 10×15 cm (2:3): capa P:14/M:11 caracteres em até 3 linhas,
lateral P:26 (com gravação na lombada), variantes 20/35/50 fotos e as 32
fotos por cor `PKTBKCLASSIC-*` no toggle 2D. Fontes de gravação seguem a
proporção real `PREVIEW_FS['classic-pocket']` (coverP 2.5 / coverM 3.66 /
spineP 2.4).

### `pdp/mini/` — Mini Pocket

Mesma réplica para o Mini Pocket, exercitando o caminho data-driven do código
real: `charLimits {cover:{P:11}, spine:{}}` → título único de 11 caracteres,
sem seletor de tamanho e sem texto/gravação de lateral (`spineMode 0`);
`maxLines 1` → sem linha extra; geometria menor/mais fina e gravação a ~40%
da altura (`PREVIEW_POS.mini`). Pendências marcadas no arquivo: fotos por cor,
foto da galeria e preços reais dependem de nova consulta à Admin API.
