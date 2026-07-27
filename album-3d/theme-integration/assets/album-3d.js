/*
 * album-3d.js — Preview 3D do álbum para a PDP variante B (FN-788).
 *
 * Substitui o Preview 2D montado em #pdp-preview-layer: assina o MESMO store
 * pub/sub da section (product-b.liquid:758–774) e renderiza o álbum com
 * Three.js — cor de linho com trama e relevo, gravação em foil metálico
 * (capa, lateral e, no Mini, a aba magnética), cantos arredondados e luz de
 * estúdio via environment map. Geometria data-driven por handle (SPECS).
 *
 * Uso na section (ver INSTALL.md):
 *   const mod = await import(ALBUM3D_URL);
 *   const engine = await mod.mountAlbum3D({ host: previewEl, store, cfg, handle: cfg.product.slug });
 *   // engine.destroy() para desmontar (ex.: teardown de testes)
 *
 * Dependência: Three.js r152. Resolução em ordem: opts.THREE → window.THREE →
 * import('https://esm.sh/three@0.152.2') (mesmo CDN sancionado que a section
 * usa para Preact). Para self-host, suba assets/three.min.js e carregue antes.
 *
 * Vive num asset (e não inline na section) também para evitar a armadilha de
 * parse do Liquid com `${{` em template literals (ver FN-922).
 */

const ESM_THREE = 'https://esm.sh/three@0.152.2';

// ── Spec de geometria por handle ─────────────────────────────────────────
// W/H/CT/PT em unidades de cena (proporções físicas reais dos produtos);
// camZ = distância da câmera; cy = âncora vertical da gravação na capa
// (fração da altura, derivada do PREVIEW_POS real); weave = escala da trama
// (célula ~1,5mm físicos); font/spineFont = px de gravação por tamanho P/M/G
// no canvas de 1024, na proporção do PREVIEW_FS real; flap = aba magnética.
const SPECS = {
  'big-pocket':     { W: 2.3,  H: 3.07, CT: 0.09, PT: 0.5,  camZ: 7.4, cy: 0.33, weave: 0.4,  font: { P: 58, M: 96 },           spineFont: { P: 58 } },
  'classic-pocket': { W: 2.1,  H: 3.15, CT: 0.09, PT: 0.44, camZ: 7.4, cy: 0.33, weave: 0.6,  font: { P: 68, M: 100 },          spineFont: { P: 74 } },
  'large-pocket':   { W: 2.14, H: 3.2,  CT: 0.1,  PT: 0.55, camZ: 7.9, cy: 0.33, weave: 0.28, font: { P: 45, M: 68, G: 93 },    spineFont: { P: 45, M: 68 } },
  'mini-pocket':    { W: 2.0,  H: 2.8,  CT: 0.08, PT: 0.5,  camZ: 7.4, cy: 0.40, weave: 1.0,  font: { P: 78 },                  spineFont: {}, flap: { ST: 0.03, FW: 1.26, letterSpacing: 9 } },
  'table-book-a3':  { W: 3.6,  H: 2.7,  CT: 0.11, PT: 0.5,  camZ: 8.6, cy: 0.30, weave: 0.15, font: { P: 54, M: 70, G: 96 },    spineFont: { P: 54, M: 70 } },
  'table-book-a4':  { W: 3.5,  H: 2.33, CT: 0.1,  PT: 0.45, camZ: 8.3, cy: 0.30, weave: 0.2,  font: { P: 57, M: 77, G: 118 },   spineFont: { P: 57, M: 77 } },
  'scrap-book-a3':  { W: 3.6,  H: 2.7,  CT: 0.11, PT: 0.55, camZ: 8.6, cy: 0.30, weave: 0.15, font: { P: 54, M: 70, G: 96 },    spineFont: { P: 54, M: 70 } },
  'scrap-book-a4':  { W: 3.5,  H: 2.33, CT: 0.1,  PT: 0.5,  camZ: 8.3, cy: 0.30, weave: 0.2,  font: { P: 57, M: 77, G: 118 },   spineFont: { P: 57, M: 77 } },
  'scrap-book-a5':  { W: 2.3,  H: 3.07, CT: 0.09, PT: 0.5,  camZ: 7.4, cy: 0.33, weave: 0.4,  font: { P: 58, M: 96 },           spineFont: { P: 58 } },
};

export async function mountAlbum3D(opts) {
  const THREE = opts.THREE || window.THREE || (await import(ESM_THREE));
  const { host, store, cfg } = opts;
  const spec = SPECS[opts.handle] || SPECS[cfg && cfg.product && cfg.product.slug] || SPECS['big-pocket'];
  return createEngine(THREE, host, store, cfg, spec);
}

function createEngine(THREE, host, store, cfg, spec) {
  const { W, H, CT, PT } = spec;
  const TEXW = 1024;
  const COVH = Math.round(TEXW * (H / W));
  const WEAVE_T = 28, WEAVE_C = 14, WEAVE_SCALE = spec.weave;

  // ── wrapper (a layer real é pointer-events:none — reativamos só aqui) ──
  const wrap = document.createElement('div');
  wrap.className = 'pdp-preview3d';
  wrap.style.cssText = 'position:absolute;inset:0;background:#ebebeb;pointer-events:auto;touch-action:none;cursor:grab;display:none;';
  const hint = document.createElement('div');
  hint.textContent = 'Arraste para girar';
  hint.style.cssText = 'position:absolute;left:0;right:0;bottom:8px;text-align:center;font:11px/1.4 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a;pointer-events:none;';
  wrap.appendChild(hint);
  host.appendChild(wrap);

  const iconMap = {};
  (cfg.icons || []).forEach((ic) => { iconMap[ic.name] = ic.url; });

  // ── trama de linho (cor + relevo) ──
  let weaveCanvas = null;
  function weaveTile() {
    if (weaveCanvas) return weaveCanvas;
    const c = document.createElement('canvas');
    c.width = WEAVE_T; c.height = WEAVE_T;
    const x = c.getContext('2d');
    const cell = (cx, cyy, horizontal) => {
      for (let t = 0; t < WEAVE_C; t += 3.5) {
        if (horizontal) {
          x.fillStyle = 'rgba(255,255,255,0.16)';
          x.fillRect(cx, cyy + t + 0.5, WEAVE_C, 1.2);
          x.fillStyle = 'rgba(0,0,0,0.14)';
          x.fillRect(cx, cyy + t + 2.3, WEAVE_C, 1);
        } else {
          x.fillStyle = 'rgba(255,255,255,0.13)';
          x.fillRect(cx + t + 0.5, cyy, 1.2, WEAVE_C);
          x.fillStyle = 'rgba(0,0,0,0.14)';
          x.fillRect(cx + t + 2.3, cyy, 1, WEAVE_C);
        }
      }
      x.fillStyle = 'rgba(0,0,0,0.18)';
      if (horizontal) { x.fillRect(cx, cyy, 1, WEAVE_C); x.fillRect(cx + WEAVE_C - 1, cyy, 1, WEAVE_C); }
      else { x.fillRect(cx, cyy, WEAVE_C, 1); x.fillRect(cx, cyy + WEAVE_C - 1, WEAVE_C, 1); }
    };
    cell(0, 0, true); cell(WEAVE_C, WEAVE_C, true);
    cell(WEAVE_C, 0, false); cell(0, WEAVE_C, false);
    weaveCanvas = c;
    return c;
  }
  function weavePattern(ctx) {
    const pat = ctx.createPattern(weaveTile(), 'repeat');
    if (pat.setTransform) pat.setTransform(new DOMMatrix([WEAVE_SCALE, 0, 0, WEAVE_SCALE, 0, 0]));
    return pat;
  }
  function weaveBumpTexture(repX, repY) {
    const c = document.createElement('canvas');
    c.width = WEAVE_T; c.height = WEAVE_T;
    const x = c.getContext('2d');
    x.fillStyle = '#808080';
    x.fillRect(0, 0, WEAVE_T, WEAVE_T);
    x.drawImage(weaveTile(), 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repX, repY);
    return t;
  }

  // ── foil / gravação ──
  const foilStops = (foilId) => (foilId === 'dourado'
    ? ['hsl(45 96% 72%)', 'hsl(43 98% 60%)', 'hsl(38 95% 52%)', 'hsl(33 92% 46%)', 'hsl(29 88% 40%)']
    : ['hsl(0 0% 78%)', 'hsl(0 0% 90%)', 'hsl(0 0% 78%)', 'hsl(0 0% 70%)']);

  const iconImgs = {};
  let lastState = null;
  function iconImage(name) {
    if (!name || !iconMap[name]) return null;
    if (!iconImgs[name]) {
      const im = new Image();
      im.crossOrigin = 'anonymous'; // CDN da Shopify manda ACAO:* — evita taint do canvas
      im.src = iconMap[name];
      im.onload = () => { if (lastState) redraw(lastState); };
      iconImgs[name] = im;
    }
    return iconImgs[name].complete && iconImgs[name].naturalWidth ? iconImgs[name] : null;
  }
  function tintedIcon(name, px, tone) {
    const im = iconImage(name);
    if (!im) return null;
    const c = document.createElement('canvas');
    c.width = px; c.height = px;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0, px, px);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = tone;
    x.fillRect(0, 0, px, px);
    return c;
  }

  let engraveLog = null;
  function engraveLine(ctx, text, iconName, cx, cyy, px, foilId, flat) {
    if (engraveLog && !flat) engraveLog.push({ m: ctx.getTransform(), ls: ctx.letterSpacing || '0px', text, iconName, cx, cy: cyy, px, foilId });
    const stops = foilStops(foilId);
    const label = (text || '').toUpperCase();
    ctx.font = "500 " + px + "px 'Times New Roman', Times, serif";
    const w = ctx.measureText(label).width;
    const iconPx = Math.round(px * 0.9);
    const gap = label ? px * 0.22 : 0;
    const icon = iconName ? tintedIcon(iconName, iconPx, stops[Math.floor(stops.length / 2)]) : null;
    const total = w + (icon ? gap + iconPx : 0);
    const startX = cx - total / 2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (flat) {
      ctx.fillStyle = flat;
      ctx.fillText(label, startX, cyy);
      if (icon) {
        const solid = tintedIcon(iconName, iconPx, flat);
        if (solid) ctx.drawImage(solid, startX + w + gap, cyy - iconPx / 2, iconPx, iconPx);
      }
      return total;
    }
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillText(label, startX, cyy + Math.max(2, px * 0.035));
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillText(label, startX, cyy - Math.max(2, px * 0.03));
    const grad = ctx.createLinearGradient(0, cyy - px * 0.55, 0, cyy + px * 0.55);
    stops.forEach((s, i) => grad.addColorStop(i / (stops.length - 1), s));
    ctx.fillStyle = grad;
    ctx.fillText(label, startX, cyy);
    if (icon) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowOffsetY = -Math.max(1, px * 0.02);
      ctx.drawImage(icon, startX + w + gap, cyy - iconPx / 2, iconPx, iconPx);
      ctx.restore();
    }
    return total;
  }

  function fitFont(ctx, lines, basePx, maxW) {
    let px = basePx;
    const measure = (p) => {
      ctx.font = "500 " + p + "px 'Times New Roman', Times, serif";
      return Math.max(...lines.map((l) => ctx.measureText((l.text || '').toUpperCase()).width + (l.icon ? p * 1.1 : 0)), 0);
    };
    while (px > 28 && measure(px) > maxW) px -= 4;
    return px;
  }

  function makeEngravedMaps(cw, ch) {
    const mk = () => { const c = document.createElement('canvas'); c.width = cw; c.height = ch; return c; };
    const maps = { metalC: mk(), roughC: mk(), bumpC: mk() };
    maps.metal = new THREE.CanvasTexture(maps.metalC);
    maps.rough = new THREE.CanvasTexture(maps.roughC);
    maps.bump = new THREE.CanvasTexture(maps.bumpC);
    return maps;
  }
  function paintMaps(maps, log) {
    const paint = (canvas, bg, ink, weave) => {
      const x = canvas.getContext('2d');
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.fillStyle = bg;
      x.fillRect(0, 0, canvas.width, canvas.height);
      if (weave) {
        x.fillStyle = weavePattern(x);
        x.fillRect(0, 0, canvas.width, canvas.height);
      }
      (log || []).forEach((e) => {
        x.setTransform(e.m);
        try { x.letterSpacing = e.ls; } catch (err) { /* sem suporte */ }
        engraveLine(x, e.text, e.iconName, e.cx, e.cy, e.px, e.foilId, ink);
      });
      x.setTransform(1, 0, 0, 1, 0, 0);
    };
    paint(maps.metalC, '#000000', '#ffffff', false);
    paint(maps.roughC, '#d9d9d9', '#707070', false);
    paint(maps.bumpC, '#808080', '#4f4f4f', true);
    maps.metal.needsUpdate = true;
    maps.rough.needsUpdate = true;
    maps.bump.needsUpdate = true;
  }

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    const b = Math.min(255, Math.round((n & 255) * f));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  // ── renderer / cena ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  wrap.insertBefore(renderer.domElement, hint);
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0.35, 1.15, spec.camZ);
  camera.lookAt(0, -0.1, 0);

  // estúdio procedural → environment (reflexos do linho e do foil)
  const studio = new THREE.Scene();
  studio.add(new THREE.Mesh(
    new THREE.SphereGeometry(20, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x5c5c5c, side: THREE.BackSide })
  ));
  const softbox = (w, h, x, y, z, level) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(level) })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  softbox(8, 6, -6, 6, 6, 5.0);
  softbox(6, 8, 7, 3, 4, 2.2);
  softbox(10, 4, 0, -6, 5, 0.7);
  softbox(6, 6, 0, 5, -7, 1.5);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a86, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(2.4, 4.2, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.radius = 8;
  scene.add(key);

  // ── texturas e materiais ──
  const mkCanvasTex = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const t = new THREE.CanvasTexture(c);
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const coverTex = mkCanvasTex(TEXW, COVH);
  const spineTex = mkCanvasTex(256, COVH);
  const flapTex = spec.flap ? mkCanvasTex(512, COVH) : null;
  const coverMaps = makeEngravedMaps(TEXW, COVH);
  const spineMaps = makeEngravedMaps(256, COVH);
  const flapMaps = spec.flap ? makeEngravedMaps(512, COVH) : null;

  const coverMats = [];
  const mat = (role) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.04, bumpMap: weaveBumpTexture(36 / WEAVE_SCALE, 50 / WEAVE_SCALE), bumpScale: 0.3, envMapIntensity: 1.15 });
    m.userData.role = role;
    coverMats.push(m);
    return m;
  };
  const faceMat = (map, maps) => new THREE.MeshStandardMaterial({
    map, metalness: 1, roughness: 1,
    metalnessMap: maps.metal, roughnessMap: maps.rough,
    bumpMap: maps.bump, bumpScale: 0.26, envMapIntensity: 1.3,
  });
  const coverFaceMat = faceMat(coverTex, coverMaps);
  const spineFaceMat = faceMat(spineTex, spineMaps);
  const flapFaceMat = spec.flap ? faceMat(flapTex, flapMaps) : null;

  // ── geometria ──
  const group = new THREE.Group();
  const plain = mat('base');
  const coverGeo = (() => {
    const r = Math.min(W, H) * 0.035;
    const hw = W / 2, hh = H / 2;
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
    s.lineTo(hw, hh - r);
    s.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
    s.lineTo(-hw + r, hh);
    s.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-hw, -hh + r);
    s.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: CT * 0.56, bevelEnabled: true, bevelThickness: CT * 0.22,
      bevelSize: CT * 0.18, bevelSegments: 2, curveSegments: 10,
    });
    g.translate(0, 0, -CT * 0.28);
    const posA = g.attributes.position, uvA = g.attributes.uv;
    for (let i = 0; i < uvA.count; i++) {
      uvA.setXY(i, posA.getX(i) / W + 0.5, posA.getY(i) / H + 0.5);
    }
    return g;
  })();
  const front = new THREE.Mesh(coverGeo, [coverFaceMat, plain]);
  front.position.z = PT / 2 + CT / 2;
  const back = new THREE.Mesh(coverGeo, mat('dark'));
  back.position.z = -(PT / 2 + CT / 2);
  const spineDark = mat('dark');
  const spine = new THREE.Mesh(new THREE.BoxGeometry(CT, H, PT + CT * 2), [spineDark, spineFaceMat, spineDark, spineDark, spineDark, spineDark]);
  spine.position.x = -(W / 2 + CT / 2);

  const sheetTex = (horizontal) => {
    const c = document.createElement('canvas');
    c.width = horizontal ? 64 : 512;
    c.height = horizontal ? 512 : 64;
    const x = c.getContext('2d');
    x.fillStyle = '#f2ecdf';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#ded4bd';
    if (horizontal) { for (let y = 0; y < c.height; y += 3) x.fillRect(0, y, c.width, 1); }
    else { for (let xx = 0; xx < c.width; xx += 3) x.fillRect(xx, 0, 1, c.height); }
    const t = new THREE.CanvasTexture(c);
    if ('colorSpace' in t) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const paperPlain = new THREE.MeshStandardMaterial({ color: 0xf2ecdf, roughness: 0.92 });
  const paperEdge = new THREE.MeshStandardMaterial({ map: sheetTex(true), roughness: 0.92 });
  const paperFlat = new THREE.MeshStandardMaterial({ map: sheetTex(false), roughness: 0.92 });
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(W - 0.05, H - 0.07, PT),
    [paperEdge, paperPlain, paperFlat, paperFlat, paperPlain, paperPlain]
  );
  pages.position.x = -0.015;
  const meshes = [front, back, spine, pages];

  if (spec.flap) {
    const { ST, FW } = spec.flap;
    const flapSide = mat('base');
    const flapFront = new THREE.Mesh(
      new THREE.BoxGeometry(FW, H, ST),
      [flapSide, flapSide, flapSide, flapSide, flapFaceMat, flapSide]
    );
    flapFront.position.set(W / 2 - FW / 2, 0, PT / 2 + CT + ST / 2);
    const flapEdge = new THREE.Mesh(new THREE.BoxGeometry(ST, H, PT + CT * 2 + ST * 2), mat('base'));
    flapEdge.position.set(W / 2 + ST / 2, 0, 0);
    meshes.push(flapFront, flapEdge);
  }
  meshes.forEach((m) => { m.castShadow = true; m.receiveShadow = true; group.add(m); });
  scene.add(group);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.25 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -(H / 2) - 0.32;
  ground.receiveShadow = true;
  scene.add(ground);

  // ── desenho por estado ──
  const stateLines = (st) => {
    const cIcons = st.coverIcons || [];
    return (st.coverText || '').split('\n')
      .map((t, i) => ({ text: t, icon: cIcons[i] || '' }))
      .filter((l) => (l.text || '').trim().length || l.icon);
  };

  function drawCover(st) {
    engraveLog = [];
    const ctx = coverTex.image.getContext('2d');
    ctx.clearRect(0, 0, TEXW, COVH);
    ctx.fillStyle = cfg.colors[st.colorIndex].hex;
    ctx.fillRect(0, 0, TEXW, COVH);
    ctx.fillStyle = weavePattern(ctx);
    ctx.fillRect(0, 0, TEXW, COVH);
    const vg = ctx.createRadialGradient(TEXW / 2, COVH * 0.4, TEXW * 0.25, TEXW / 2, COVH / 2, COVH * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0.05)');
    vg.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, TEXW, COVH);
    if (!spec.flap) {
      const lines = stateLines(st);
      if (lines.length) {
        const base = spec.font[st.titleSize] || spec.font.P;
        const px = fitFont(ctx, lines, base, TEXW * 0.8);
        const lineH = px * 1.32;
        const cy0 = COVH * spec.cy - ((lines.length - 1) * lineH) / 2;
        lines.forEach((l, i) => engraveLine(ctx, l.text, l.icon, TEXW / 2, cy0 + i * lineH, px, st.foilId));
      }
    }
    const log = engraveLog;
    engraveLog = null;
    paintMaps(coverMaps, log);
    coverTex.needsUpdate = true;
  }

  function drawFlap(st) {
    if (!spec.flap) return;
    engraveLog = [];
    const ctx = flapTex.image.getContext('2d');
    ctx.clearRect(0, 0, 512, COVH);
    ctx.fillStyle = cfg.colors[st.colorIndex].hex;
    ctx.fillRect(0, 0, 512, COVH);
    ctx.fillStyle = weavePattern(ctx);
    ctx.fillRect(0, 0, 512, COVH);
    const lines = stateLines(st);
    if (lines.length) {
      ctx.save();
      ctx.translate(512 * 0.44, COVH / 2);
      ctx.rotate(Math.PI / 2);
      try { ctx.letterSpacing = spec.flap.letterSpacing + 'px'; } catch (e) { /* sem suporte */ }
      const px = fitFont(ctx, lines, spec.font.P, COVH * 0.72);
      const lineH = px * 1.35;
      lines.forEach((l, i) => {
        const off = (i - (lines.length - 1) / 2) * lineH;
        ctx.save();
        ctx.translate(0, off);
        engraveLine(ctx, l.text, l.icon, 0, 0, px, st.foilId);
        ctx.restore();
      });
      ctx.restore();
    }
    const log = engraveLog;
    engraveLog = null;
    paintMaps(flapMaps, log);
    flapTex.needsUpdate = true;
  }

  function drawSpine(st) {
    engraveLog = [];
    const ctx = spineTex.image.getContext('2d');
    ctx.clearRect(0, 0, 256, COVH);
    ctx.fillStyle = shade(cfg.colors[st.colorIndex].hex, 0.82);
    ctx.fillRect(0, 0, 256, COVH);
    ctx.fillStyle = weavePattern(ctx);
    ctx.fillRect(0, 0, 256, COVH);
    const side = (st.sideText || '').trim();
    if (side || st.sideIcon) {
      ctx.save();
      ctx.translate(128, COVH / 2);
      ctx.rotate(Math.PI / 2);
      const px = spec.spineFont[st.sideSize] || spec.spineFont.P || 58;
      engraveLine(ctx, side, st.sideIcon, 0, 0, px, st.foilId);
      ctx.restore();
    }
    const log = engraveLog;
    engraveLog = null;
    paintMaps(spineMaps, log);
    spineTex.needsUpdate = true;
  }

  function redraw(st) {
    drawCover(st);
    drawFlap(st);
    drawSpine(st);
    const base = cfg.colors[st.colorIndex].hex;
    coverMats.forEach((m) => {
      const f = m.userData.role === 'dark' ? 0.72 : 1;
      m.color.set(new THREE.Color(base).multiplyScalar(f));
    });
  }

  // ── interação + loop ──
  const spin = { rx: 0.08, ry: -0.5, trx: 0.08, try_: -0.5, vy: 0 };
  let dragging = false, px0 = 0, lastDx = 0, interacted = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  wrap.addEventListener('pointerdown', (e) => {
    interacted = true;
    dragging = true; px0 = e.clientX; lastDx = 0;
    wrap.style.cursor = 'grabbing';
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - px0;
    px0 = e.clientX; lastDx = dx;
    spin.try_ += dx * 0.007;
  });
  const up = () => {
    if (!dragging) return;
    dragging = false;
    wrap.style.cursor = 'grab';
    if (!reducedMotion) spin.vy = lastDx * 0.004;
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);

  const resize = () => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); // o modo config colapsa seções vizinhas
  ro.observe(wrap);
  resize();

  const swayT0 = performance.now();
  let raf = 0;
  const loop = () => {
    spin.try_ += spin.vy; spin.vy *= 0.94;
    spin.ry += (spin.try_ - spin.ry) * 0.14;
    spin.rx += (spin.trx - spin.rx) * 0.14;
    const sway = (!interacted && !reducedMotion) ? Math.sin((performance.now() - swayT0) / 2400) * 0.045 : 0;
    group.rotation.y = spin.ry + sway;
    group.rotation.x = spin.rx;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  // ── contrato com o store da section ──
  const onState = (s) => {
    lastState = s;
    wrap.style.display = s.mode === 'main' ? 'none' : 'block';
    if (s.mode !== 'main') {
      redraw(s);
      resize();
    }
  };
  store.subs.add(onState);
  onState(store.state);

  return {
    destroy() {
      store.subs.delete(onState);
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      wrap.remove();
    },
  };
}
