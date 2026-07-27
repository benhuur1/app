# Integração do preview 3D na `sections/product-b.liquid` (FN-788)

Pacote para aplicar no repo real (`~/flavianasser/shopify-theme`), levando o
preview 3D com realismo para a PDP variante B (tema `[AB] pdp-personalizacao-v1`
do Rollouts). Referências de linha abaixo são da revisão de 225.585 bytes
(23/07 16:18) da section no tema [AB].

## 1. Copiar o asset

```sh
cp assets/album-3d.js ~/flavianasser/shopify-theme/assets/album-3d.js
```

O módulo resolve o Three.js nesta ordem: `opts.THREE` → `window.THREE` →
`import('https://esm.sh/three@0.152.2')` (mesmo CDN sancionado que a section
já usa para o Preact). Para self-host, suba também um `assets/three.min.js`
(r152 UMD — há uma cópia em `album-3d/three.min.js` deste repo) e carregue-o
antes; o módulo encontra o `window.THREE` sozinho.

## 2. Aplicar o patch da section

Há um patch pronto (`product-b.liquid.patch`), gerado contra a revisão de
225.585 bytes (23/07 16:18) da section no tema [AB] — 2 hunks, 24 linhas:

```sh
cd ~/flavianasser/shopify-theme
git apply --3way /caminho/para/product-b.liquid.patch
# ou, se preferir sem git:  patch -p1 < product-b.liquid.patch
```

Se sua cópia local divergiu da revisão do tema, o `--3way` resolve a maioria
dos casos; senão, aplique o diff à mão pelo passo 2b abaixo.

Rodar em dev:

```sh
shopify theme dev --store flavianasser        # PDP real, fotos reais, carrinho real
```

Verificado antes de publicar o patch: o módulo resultante passa em
`node --check` (com as tags Liquid neutralizadas) e não introduz nenhuma
ocorrência de `${{` — a sequência que quebra o upload do Liquid (FN-922).

## 2b. O diff, para aplicar à mão

**a) URL do asset** — junto dos outros asset consts (perto da l.694,
`ddbGiftIconUrl`):

```js
const ALBUM3D_URL = {{ 'album-3d.js' | asset_url | json }};
```

**b) Mount do preview** — substituir o bloco final (l.2230–2234):

```js
root.removeAttribute('data-loading');
render(html`<${App} />`, root);

const previewEl = document.getElementById('pdp-preview-layer');
if (previewEl) {
  // 3D carrega adiado (fora do LCP) na primeira entrada no modo config;
  // qualquer falha (import, WebGL) cai no Preview 2D atual sem quebrar nada.
  let album3d = null;
  let album3dFailed = false;
  const mount2D = () => render(html`<${Preview} />`, previewEl);
  const boot3D = (s) => {
    if (s.mode === 'main' || album3d || album3dFailed) return;
    album3d = 'loading';
    import(ALBUM3D_URL)
      .then((mod) => mod.mountAlbum3D({ host: previewEl, store, cfg, handle: cfg.product.slug }))
      .then((engine) => { album3d = engine; })
      .catch(() => { album3dFailed = true; album3d = null; mount2D(); });
  };
  store.subs.add(boot3D);
  boot3D(store.state);
}
```

O `Preview` 2D continua no arquivo, intocado — é o fallback e a rota de
rollback (basta trocar o bloco acima por `render(html`<${Preview} />`,
previewEl)` de volta).

**c) Nada de CSS obrigatório** — o módulo cria seu wrapper com
`pointer-events:auto` e `touch-action:none` inline (a layer é
`pointer-events:none`; sem `touch-action` o drag briga com o scroll no
mobile — riscos §1–2 do mapa da section). Se preferirem classe no
`{% stylesheet %}`, o wrapper usa `.pdp-preview3d`.

⚠️ Não mover o código do módulo para dentro da section: template literals
com `${{` quebram o parse do Liquid no upload (a causa raiz da FN-922).

## 3. O que o módulo faz

- Assina `store.subs.add` e re-renderiza a cada `set` — mesmo contrato do
  `Preview` 2D (`mode/colorIndex/foilId/coverText/coverIcons/sideText/titleSize/sideSize/sideIcon`)
- `SPECS` por handle: geometria física (Mini 5×7 com aba magnética e gravação
  na aba; Pockets retrato; Table Books/Scrapbooks paisagem), fontes de
  gravação na proporção do `PREVIEW_FS`, escala da trama de linho
- Realismo: environment map (estúdio procedural + PMREM + ACES), foil
  metálico físico (metalness/roughness maps só na gravação), baixo-relevo no
  bump, cantos arredondados, folhas no miolo, sway sutil
  (respeita `prefers-reduced-motion`)
- Ícones (`cover-sym-*.svg`) carregados com `crossOrigin='anonymous'` — o CDN
  da Shopify manda `Access-Control-Allow-Origin: *`, sem taint no canvas

## 4. QA antes de ativar no experimento

- [ ] iPhone/Safari: drag gira sem rolar a página; memória estável trocando
      cores repetidamente
- [ ] Modo config: redimensionar/colapsar seções vizinhas (ResizeObserver)
- [ ] Modais (ConfigModal/dialog) abrem POR CIMA do canvas (top layer)
- [ ] `?edit=<line_key>` (edição vinda do carrinho) monta o 3D direto
- [ ] Fallback: bloquear `album-3d.js` no DevTools → Preview 2D aparece
- [ ] Produto sem personalização (`is_personalization` falso) não monta nada
- [ ] Lighthouse: LCP inalterado (o import só dispara em `mode !== 'main'`)

## 5. Deploy

Somente no tema **[AB]** via `deploy-ab-theme` (workflow com o fix da
FN-922 — conferir que o upload do Liquid não reportou erro). A variante A
(`sections/product.liquid`) não é tocada.

## Referência viva

As 9 réplicas com este engine rodando (e o toggle "2D atual" para
comparação): https://benhuur1.github.io/app/album-3d/pdp/
`harness.html` neste diretório testa o módulo isolado (servir a pasta do
repo por HTTP e abrir `/album-3d/theme-integration/harness.html`).
