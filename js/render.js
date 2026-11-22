/* Рендер страницы дня: постоянная рамка дневника + переменное «окно» в одном из шести приёмов.
   Холст 1080×1350 (4:5). Анимация привязана к долям песни. */
(function (PV) {
  const { U } = PV;
  const W = 1080, H = 1350, M = 64;
  const WIN = { x: M, y: 148, w: W - 2 * M, h: 868 };
  const F = {
    mono: (s, w = 400) => `${w} ${s}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`,
    serif: (s, w = 500) => `${w} ${s}px Unbounded, Onest, "Segoe UI", system-ui, sans-serif`,
    sans: (s, w = 800) => `${w} ${s}px Unbounded, Onest, "Segoe UI", system-ui, sans-serif`,
    hand: (s) => `600 ${s}px Caveat, "Segoe Print", "Comic Sans MS", cursive`
  };
  PV.PAGE = { W, H, WIN };

  // текстуры, общие для всех страниц (постоянный элемент: бумага)
  let NOISE = null, FIBER = null;
  function textures() {
    if (NOISE) return;
    NOISE = [0, 1, 2, 3].map(k => {
      const c = U.canvas(256, 256), x = c.getContext('2d'), d = x.createImageData(256, 256), r = U.rng(99 + k);
      for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0); return c;
    });
    FIBER = U.canvas(512, 512); const x = FIBER.getContext('2d'), r = U.rng(5);
    for (let i = 0; i < 900; i++) {
      x.strokeStyle = `rgba(${r() > .5 ? '0,0,0' : '255,255,255'},${.05 + r() * .07})`; x.lineWidth = .6 + r();
      const px = r() * 512, py = r() * 512, a = r() * Math.PI, l = 4 + r() * 22;
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l / 2 + r() * 4, py + Math.sin(a) * l / 2, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
    }
  }
  function tile(ctx, tex, x, y, w, h, ox = 0, oy = 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const tw = tex.width, th = tex.height;
    for (let yy = y - (oy % th) - th; yy < y + h; yy += th) for (let xx = x - (ox % tw) - tw; xx < x + w; xx += tw) ctx.drawImage(tex, xx, yy);
    ctx.restore();
  }
  function cover(ctx, img, x, y, w, h, zoom = 1, fx = .5, fy = .5) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const k = Math.max(w / iw, h / ih) * zoom, sw = w / k, sh = h / k;
    const sx = U.clamp((iw - sw) * fx, 0, Math.max(0, iw - sw)), sy = U.clamp((ih - sh) * fy, 0, Math.max(0, ih - sh));
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }
  function filtered(img, w, h, filter, after) {
    const c = U.canvas(w, h), x = c.getContext('2d');
    x.filter = filter || 'none'; cover(x, img, 0, 0, w, h); x.filter = 'none';
    if (after) after(x, w, h); return c;
  }
  const pixels = (img, w, h) => { const c = U.canvas(w, h), x = c.getContext('2d', { willReadFrequently: true }); cover(x, img, 0, 0, w, h); return x.getImageData(0, 0, w, h).data; };
  function nearest(pal, c) { let b = pal[0], bd = 1e9; for (const p of pal) { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; b = p; } } return b; }
  function tornPath(ctx, rnd, w, h, jag) {
    const pts = []; const step = 16;
    const edge = (x0, y0, x1, y1, nx, ny) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(L / step)); for (let i = 0; i < n; i++) { const t = i / n, j = (rnd() - .5) * jag; pts.push([x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j]); } };
    edge(0, 0, w, 0, 0, 1); edge(w, 0, w, h, -1, 0); edge(w, h, 0, h, 0, -1); edge(0, h, 0, 0, 1, 0);
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
  }
  function blobPath(ctx, cx, cy, r, rnd, leafy) {
    const n = leafy ? 14 : 9, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rr = r * (leafy ? (i % 2 ? .45 + rnd() * .2 : .85 + rnd() * .35) : .65 + rnd() * .45); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const p = pts[i % n], q = pts[(i + 1) % n], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; i ? ctx.quadraticCurveTo(p[0], p[1], mx, my) : ctx.moveTo(mx, my); }
    ctx.closePath();
  }
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

  /* ---------- подготовка слоёв для каждого приёма ---------- */
  const PREP = {
    monet(r, img, i) {
      const { w, h } = WIN, S = r.sys, pal = S.palette.colors, rnd = U.rng(r.seed + i * 31);
      const c = filtered(img, w, h, 'blur(16px) saturate(1.15)', (x) => { x.globalAlpha = .22; x.fillStyle = U.hex(S.palette.paper); x.fillRect(0, 0, w, h); x.globalAlpha = 1; });
      const x = c.getContext('2d'); const sw = Math.round(w / 4), sh = Math.round(h / 4), px = pixels(img, sw, sh);
      const at = (X, Y) => { X = U.clamp(X | 0, 0, sw - 1); Y = U.clamp(Y | 0, 0, sh - 1); const k = (Y * sw + X) * 4; return [px[k], px[k + 1], px[k + 2]]; };
      const passes = [[24, 1300], [13, 2800], [6.5, 4200]], dens = 1 - S.air * .25;
      x.lineCap = 'round';
      for (const [rad, n] of passes) for (let k = 0; k < n * dens; k++) {
        const X = rnd() * w, Y = rnd() * h, sx = X / 4, sy = Y / 4;
        const l = q => U.lum(at(sx + q[0], sy + q[1]));
        const gx = l([1, 0]) - l([-1, 0]), gy = l([0, 1]) - l([0, -1]), g = Math.hypot(gx, gy);
        if (rad < 8 && g < .04 && rnd() > .35) continue;
        let col = at(sx, sy); col = U.mix(col, nearest(pal, col), .35);
        let [hh, ss, ll] = U.rgb2hsl(...col); hh += (rnd() - .5) * 16; ll = U.clamp(ll + .03 + (rnd() - .5) * .09);
        const ang = (g > .01 ? Math.atan2(gy, gx) + Math.PI / 2 : -.5) + (rnd() - .5) * .7, len = rad * (1.6 + rnd());
        x.strokeStyle = U.rgba(U.hsl2rgb(hh, ss * 1.05, ll), .78); x.lineWidth = rad * (.5 + rnd() * .3);
        x.beginPath(); x.moveTo(X - Math.cos(ang) * len / 2, Y - Math.sin(ang) * len / 2); x.lineTo(X + Math.cos(ang) * len / 2, Y + Math.sin(ang) * len / 2); x.stroke();
      }
      return c;
    },
    kandinsky(r, img) {
      const { w, h } = WIN, P = r.sys.palette; const c = U.canvas(w, h), x = c.getContext('2d');
      const px = pixels(img, w / 2 | 0, h / 2 | 0), d = x.createImageData(w / 2 | 0, h / 2 | 0);
      const lo = P.dark ? U.mix(P.paper, [0, 0, 0], .2) : P.ink, mid = U.mix(P.colors[1] || P.accent2, P.dark ? [60, 80, 140] : [120, 130, 150], .5), hi = P.dark ? P.accent2 : P.paper;
      for (let k = 0; k < px.length; k += 4) { const l = U.lum([px[k], px[k + 1], px[k + 2]]); const c3 = l < .33 ? lo : l < .62 ? mid : hi; d.data[k] = c3[0]; d.data[k + 1] = c3[1]; d.data[k + 2] = c3[2]; d.data[k + 3] = 255; }
      const t = U.canvas(d.width, d.height); t.getContext('2d').putImageData(d, 0, 0);
      x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, w, h); return c;
    },
    film(r, img) {
      const { w, h } = WIN, P = r.sys.palette;
      return filtered(img, w - 60, h - 150, `sepia(${.2 + r.sys.era * .25}) contrast(.9) saturate(${.8 + r.sys.V * .1}) brightness(1.04)`, (x, cw, ch) => {
        x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(46,28,12,.55)'; x.fillRect(0, 0, cw, ch);
        x.globalCompositeOperation = 'multiply'; x.fillStyle = U.rgba(U.mix(P.accent, [255, 200, 140], .5), .16); x.fillRect(0, 0, cw, ch);
        x.globalCompositeOperation = 'source-over';
        const g = x.createRadialGradient(cw / 2, ch / 2, ch * .3, cw / 2, ch / 2, ch * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,10,0,.5)'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
      });
    },
    ma(r, img) {
      const pw = Math.round(WIN.w * (0.6 - r.sys.air * .22)), ph = Math.round(pw * 1.25), P = r.sys.palette;
      return filtered(img, pw, ph, 'grayscale(.5) contrast(.88) brightness(1.06)', (x, cw, ch) => { x.globalCompositeOperation = 'screen'; x.fillStyle = U.rgba(P.paper, .18); x.fillRect(0, 0, cw, ch); x.globalCompositeOperation = 'source-over'; });
    },
    collage(r, img, i) {
      const rnd = U.rng(r.seed + 77 + i * 13), pieces = [], k = r.imgs.length > 2 ? 1 : 2;
      for (let p = 0; p < k; p++) {
        const pw = Math.round(WIN.w * (.48 + rnd() * .18)), ph = Math.round(pw * (.75 + rnd() * .5));
        const c = U.canvas(pw + 30, ph + 30), x = c.getContext('2d');
        x.translate(15, 15); x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = 14; x.shadowOffsetY = 6;
        tornPath(x, rnd, pw, ph, 9); x.fillStyle = '#fbfaf6'; x.fill(); x.shadowColor = 'transparent';
        x.save(); x.translate(7, 7); tornPath(x, rnd, pw - 14, ph - 14, 6); x.clip();
        x.filter = `saturate(${1.15 + r.sys.A * .3}) contrast(1.08)`; cover(x, img, 0, 0, pw - 14, ph - 14, 1 + rnd() * .5, rnd(), rnd()); x.filter = 'none'; x.restore();
        pieces.push({ c, x: rnd(), y: rnd(), rot: (rnd() - .5) * .35, ph: rnd() * 6 });
      }
      return pieces;
    },
    nocturne(r, img) {
      const { w, h } = WIN, P = r.sys.palette;
      const c = filtered(img, w, h, 'blur(7px) brightness(1.15) contrast(1.1) saturate(.8)', (x) => {
        x.globalCompositeOperation = 'multiply'; x.fillStyle = U.rgba(U.mix(U.mix(P.colors[0], [255, 255, 255], .45), [90, 120, 200], .5), .55); x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
      });
      // огни — самые яркие точки исходного кадра
      const sw = 48, sh = 44, px = pixels(img, sw, sh), cand = [];
      for (let y = 1; y < sh - 1; y++) for (let x = 1; x < sw - 1; x++) { const k = (y * sw + x) * 4, l = U.lum([px[k], px[k + 1], px[k + 2]]); if (l > .55) cand.push([l, x / sw, y / sh, [px[k], px[k + 1], px[k + 2]]]); }
      cand.sort((a, b) => b[0] - a[0]);
      const lights = []; for (const cd of cand) { if (lights.length >= 14) break; if (lights.every(l => Math.hypot(l.x - cd[1], l.y - cd[2]) > .07)) lights.push({ x: cd[1], y: cd[2], c: U.mix(cd[3], [255, 214, 150], .5), s: .6 + cd[0] * .8 }); }
      c.lights = lights; return c;
    }
  };

  /* ---------- общий слой для всех кадров дня ---------- */
  function prepShared(r) {
    const S = r.sys, rnd = U.rng(r.seed + 5), P = S.palette;
    const sh = {};
    if (S.tech === 'kandinsky') {
      const n = Math.round(7 + S.A * 12 - S.air * 4), cols = [P.accent, P.accent2, P.ink, P.colors[2] || P.accent, P.colors[3] || P.accent2];
      sh.shapes = Array.from({ length: n }, (_, i) => ({ type: ['circle', 'line', 'tri', 'ring', 'line', 'dots', 'arc'][Math.floor(rnd() * 7)], x: rnd(), y: rnd(), s: .04 + rnd() * .16, a: rnd() * Math.PI, c: cols[i % cols.length], w: 2 + rnd() * 9, sp: (rnd() - .5) * .3 }));
      sh.side = rnd() > .5; sh.grid = 6 + Math.round(S.A * 4);
    }
    if (S.tech === 'collage') {
      const cols = [P.accent, P.accent2, ...P.colors.slice(0, 3)];
      sh.blobs = Array.from({ length: 7 }, (_, i) => ({ x: rnd(), y: rnd(), r: .07 + rnd() * .13, c: cols[i % cols.length], leafy: rnd() > .5, seed: r.seed + i * 3, front: rnd() > .65, sp: .3 + rnd() }));
    }
    if (S.tech === 'nocturne') {
      const c = U.canvas(WIN.w, WIN.h), x = c.getContext('2d'); x.filter = 'blur(38px)';
      const bands = [[.08, .3], [.42, .3], [.76, .2]];
      bands.forEach(([y, hh], i) => { x.fillStyle = U.rgba(U.mix(P.colors[i] || P.accent, P.paper, .35), .55); x.fillRect(WIN.w * .07, WIN.h * y, WIN.w * .86, WIN.h * hh); });
      sh.fields = c;
      sh.snow = (r.day.analysis.text.season === 'winter' || r.day.analysis.text.weather === 'snow') ? Array.from({ length: 140 }, () => [rnd(), rnd(), .5 + rnd() * 2.2, .3 + rnd() * .7]) : null;
    }
    if (S.tech === 'ma') {
      const T = r.day.analysis.text;
      sh.left = rnd() > .5; sh.word = (T.objects.find(o => o.length <= 7) || (T.place && T.place.nom.length <= 7 && T.place.nom) || { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' }[T.season] || 'тишина').toUpperCase();
      sh.rain = T.weather === 'rain';
      sh.rainLines = Array.from({ length: 90 }, () => [rnd(), rnd(), .03 + rnd() * .06]);
    }
    if (S.tech === 'film') sh.frameNo = 1 + Math.floor(rnd() * 30);
    return sh;
  }

  class Renderer {
    constructor(canvas) {
      this.cv = canvas; canvas.width = W; canvas.height = H; this.ctx = canvas.getContext('2d');
      this.raf = 0; this.clock = null; textures();
    }
    async prepare(day, imgs) {
      this.day = day; this.sys = day.system; this.imgs = imgs; this.seed = day.seed >>> 0;
      try { await Promise.race([document.fonts.ready, U.sleep(1500)]); } catch (e) { }
      const prep = PREP[this.sys.tech];
      this.layers = [];
      for (let i = 0; i < imgs.length; i++) { this.layers.push(prep(this, imgs[i], i)); await U.sleep(0); }
      this.shared = prepShared(this);
      const env = (day.analysis.music && day.analysis.music.envelope) || null;
      const rnd = U.rng(this.seed + 9);
      this.env = env || Array.from({ length: 72 }, (_, i) => U.clamp(.3 + this.sys.A * .45 + Math.sin(i * .35 + this.seed) * .18 + (rnd() - .5) * .25, .08, 1));
      return this;
    }
    get loop() { const n = this.imgs.length, iv = this.sys.interval; let L = n * iv; while (L < 15) L += n * iv; return Math.min(L, 40); }
    beat(t) { const p = 60 / this.sys.bpm, b = (t - (this.sys.beatOffset || 0)) / p; const ph = b - Math.floor(b); return { n: Math.floor(b), ph, pulse: Math.exp(-ph * 5) }; }
    seq(t, fade) {
      const n = this.imgs.length, iv = this.sys.interval, k = Math.floor(t / iv), loc = (t % iv) / iv;
      const f = Math.min(.95, fade / iv); const i = ((k % n) + n) % n, prev = ((k - 1) % n + n) % n;
      return { i, prev, k, loc, mix: n > 1 && loc < f ? ease(loc / f) : 1 };
    }
    draw(t) {
      const x = this.ctx, S = this.sys, P = S.palette;
      x.save(); x.fillStyle = U.hex(P.paper); x.fillRect(0, 0, W, H);
      x.globalAlpha = P.dark ? .35 : .55; tile(x, FIBER, 0, 0, W, H); x.globalAlpha = 1;
      // окно
      x.save(); x.beginPath(); x.rect(WIN.x, WIN.y, WIN.w, WIN.h); x.clip(); x.translate(WIN.x, WIN.y);
      DRAW[S.tech](this, x, t);
      // переменное зерно поверх окна
      if (S.grain > .05) { x.globalCompositeOperation = 'overlay'; x.globalAlpha = S.grain * .42; const f = Math.floor(t * 24); tile(x, NOISE[f % 4], 0, 0, WIN.w, WIN.h, (f * 73) % 256, (f * 151) % 256); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      x.restore();
      x.strokeStyle = U.rgba(P.ink, .18); x.lineWidth = 1; x.strokeRect(WIN.x + .5, WIN.y + .5, WIN.w - 1, WIN.h - 1);
      this.chrome(x, t);
      x.restore();
    }
    chrome(x, t) {
      const S = this.sys, P = S.palette, d = this.day, ink = U.hex(P.ink);
      const dt = U.parseDate(d.date);
      x.fillStyle = ink; x.textBaseline = 'alphabetic';
      // шапка: номер, дата, день недели и время — всегда на своих местах
      x.fillStyle = U.hex(P.accent); x.fillRect(M, 82, 14, 14);
      x.fillStyle = ink; x.font = F.mono(22, 500); x.textAlign = 'left'; x.fillText('№ ' + String(d.num || 1).padStart(3, '0'), M + 26, 97);
      x.textAlign = 'center'; x.fillText(`${dt.getDate()} ${U.MONTHS[dt.getMonth()].toUpperCase()} ${dt.getFullYear()}`, W / 2, 97);
      x.textAlign = 'right'; const wx = d.weather ? ` · ${d.weather.temp > 0 ? '+' : ''}${Math.round(d.weather.temp)}°` : '';
      x.fillText(`${U.WD[dt.getDay()]}${d.time ? ' · ' + d.time : ''}${wx}`, W - M, 97);
      x.fillStyle = U.rgba(P.ink, .45); x.fillRect(M, 122, W - 2 * M, 1.5);
      // название папки — шрифт один, характер начертания от приёма
      const ts = { monet: [300, false, false], kandinsky: [900, false, true], film: [500, false, false], ma: [300, false, false], collage: [700, false, false], nocturne: [300, false, false] }[S.tech];
      let title = d.title, size = S.tech === 'ma' ? 44 : 54;
      const font = s => ts[2] ? F.sans(s * .9, 900) : F.serif(s, ts[0]);
      if (ts[2]) title = title.toUpperCase();
      x.textAlign = 'left'; x.font = font(size);
      while (x.measureText(title).width > W - 2 * M && size > 34) { size -= 2; x.font = font(size); }
      x.fillStyle = ink; x.fillText(title, M - 2, 1092);
      // подпись от руки
      x.save(); x.translate(M, 1150); x.rotate(-.012); x.font = F.hand(40); x.fillStyle = U.rgba(P.ink, .78);
      let cap = '— ' + (d.analysis.text.caption || ''); while (x.measureText(cap).width > W - 2 * M && cap.length > 10) cap = cap.slice(0, -2).trimEnd() + '…';
      x.fillText(cap, 0, 0); x.restore();
      x.fillStyle = U.rgba(P.ink, .3); x.fillRect(M, 1190, W - 2 * M, 1);
      // партитура дня: пять шкал
      S.meters.forEach(([lab, v], i) => {
        const bx = M + i * 100; x.font = F.mono(13); x.textAlign = 'left'; x.fillStyle = U.rgba(P.ink, .6); x.fillText(lab, bx, 1224);
        const on = Math.round(U.clamp(v) * 10);
        for (let k = 0; k < 10; k++) { x.fillStyle = k < on ? (i === 1 ? U.hex(P.accent) : ink) : U.rgba(P.ink, .14); x.fillRect(bx + k * 8.4, 1240, 5.4, 26); }
      });
      // нотная лента песни: огибающая громкости + бегущая точка
      const sx = 600, sw = W - M - sx, n = this.env.length, bw = sw / n;
      const m = d.analysis.music || {}, song = d.song || {};
      x.font = F.mono(13); x.fillStyle = U.rgba(P.ink, .6); x.textAlign = 'left';
      let st = '♪ ' + ([song.artist, song.title].filter(Boolean).join(' — ') || song.service || 'песня дня'); while (x.measureText(st).width > sw && st.length > 6) st = st.slice(0, -2) + '…';
      x.fillText(st, sx, 1224);
      const play = ((t % this.loop) / this.loop) * n, bt = this.beat(t);
      for (let i = 0; i < n; i++) { const hh = 4 + this.env[i] * 30 * (Math.abs(i - play) < 1.5 ? 1 + bt.pulse * .25 : 1); x.fillStyle = i < play ? U.hex(P.accent) : U.rgba(P.ink, .35); x.fillRect(sx + i * bw, 1270 - hh, Math.max(1.5, bw - 2), hh); }
      x.textAlign = 'right'; x.fillStyle = U.rgba(P.ink, .6);
      x.fillText(`${S.bpm} BPM · ${m.source === 'audio' && m.key ? m.key : (S.minor ? 'минор' : 'мажор')}`, W - M, 1294);
      // подвал
      x.textAlign = 'left'; x.font = F.mono(13, 500); x.fillStyle = U.rgba(P.ink, .5); x.fillText('СТРАНИЦА ДНЯ', M, 1318);
      x.textAlign = 'right'; x.fillText(`${PV.TECH[S.tech].name.toLowerCase()} · ${S.mood}`, W - M, 1318);
    }
    start(clock) {
      this.stop(); this.clock = clock || (() => performance.now() / 1000);
      const tick = () => { this.draw(this.clock()); this.raf = requestAnimationFrame(tick); };
      tick();
    }
    stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
    poster(scale = .5) { this.draw(this.sys.interval * .6); const c = U.canvas(W * scale, H * scale); c.getContext('2d').drawImage(this.cv, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .86); }
  }

  /* ---------- кадр каждого приёма (координаты внутри окна) ---------- */
  const DRAW = {
    monet(r, x, t) {
      const S = r.sys, { w, h } = WIN, q = r.seq(t, 1.8), b = r.beat(t);
      const draw = (i, a, k) => { const z = 1.03 + .04 * ((t / S.interval + k) % 1) * S.motion; x.globalAlpha = a; x.save(); x.translate(w / 2, h / 2); x.scale(z, z); x.translate(-w / 2 + Math.sin(t * .2 + i) * 8, -h / 2); x.drawImage(r.layers[i], 0, 0); x.restore(); };
      if (q.mix < 1) draw(q.prev, 1, 0); draw(q.i, q.mix, 0); x.globalAlpha = 1;
      // мягкий свет, который «дышит» в такт
      const g = x.createRadialGradient(w * .25, h * .15, 0, w * .25, h * .15, w * .9);
      g.addColorStop(0, U.rgba(U.mix(S.palette.accent, [255, 240, 200], .6), .22 + b.pulse * .06 * S.motion)); g.addColorStop(1, 'rgba(255,240,200,0)');
      x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
    },
    kandinsky(r, x, t) {
      const S = r.sys, P = S.palette, sh = r.shared, { w, h } = WIN, q = r.seq(t, .01), b = r.beat(t);
      x.fillStyle = U.hex(P.paper); x.fillRect(0, 0, w, h);
      const pw = w * .62, px0 = sh.side ? w - pw : 0, cut = q.k % 2 ? .02 : 0;
      x.drawImage(r.layers[q.i], px0 + pw * cut, 0, pw * (1 - cut), h, px0, 0, pw, h);
      if (q.loc * S.interval < .09) { x.fillStyle = U.rgba(P.accent, .55); x.fillRect(px0, 0, pw, h); }
      x.strokeStyle = U.rgba(P.ink, .22); x.lineWidth = 1;
      for (let i = 1; i < sh.grid; i++) { x.beginPath(); x.moveTo(i * w / sh.grid, 0); x.lineTo(i * w / sh.grid, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / sh.grid); x.lineTo(w, i * h / sh.grid); x.stroke(); }
      const k = 1 + b.pulse * .1 * S.motion;
      sh.shapes.forEach((s, i) => {
        const cx = s.x * w, cy = s.y * h, R = s.s * w * (i % 3 === b.n % 3 ? k : 1), a = s.a + t * s.sp * S.motion;
        x.fillStyle = U.hex(s.c); x.strokeStyle = U.hex(s.c); x.lineWidth = s.w;
        x.save(); x.translate(cx, cy); x.rotate(a);
        if (s.type === 'circle') { x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); }
        else if (s.type === 'ring') { for (let j = 0; j < 3; j++) { x.globalAlpha = 1 - j * .25; x.beginPath(); x.arc(0, 0, R * (1 - j * .28), 0, 7); x.stroke(); } x.globalAlpha = 1; }
        else if (s.type === 'line') { x.beginPath(); x.moveTo(-R * 3, 0); x.lineTo(R * 3, 0); x.stroke(); }
        else if (s.type === 'tri') { x.beginPath(); x.moveTo(0, -R); x.lineTo(R * .9, R * .7); x.lineTo(-R * .9, R * .7); x.closePath(); x.globalAlpha = .9; x.fill(); x.globalAlpha = 1; }
        else if (s.type === 'arc') { x.beginPath(); x.arc(0, 0, R * 1.4, 0, Math.PI * .9); x.stroke(); }
        else { for (let j = 0; j < 5; j++) { x.beginPath(); x.arc(j * R * .45 - R, 0, s.w * .9, 0, 7); x.fill(); } }
        x.restore();
      });
    },
    film(r, x, t) {
      const S = r.sys, { w, h } = WIN, q = r.seq(t, .7), sh = r.shared, f = Math.floor(t * 12);
      x.fillStyle = '#17120d'; x.fillRect(0, 0, w, h);
      // перфорация плёнки
      x.fillStyle = U.hex(S.palette.paper);
      for (let i = 0; i < 22; i++) { const hx = 14 + i * (w / 22); x.beginPath(); x.roundRect(hx, 18, 22, 30, 4); x.roundRect(hx, h - 48, 22, 30, 4); x.fill(); }
      const wx = 30 + Math.sin(f * 1.7) * 1.2, wy = 75 + Math.cos(f * 2.3) * 1.2;
      const draw = (i, a) => { x.globalAlpha = a; x.drawImage(r.layers[i], wx, wy); };
      if (q.mix < 1) draw(q.prev, 1); draw(q.i, q.mix); x.globalAlpha = 1;
      if (q.mix < 1) { x.fillStyle = `rgba(255,236,200,${Math.sin(q.mix * Math.PI) * .45})`; x.fillRect(wx, wy, w - 60, h - 150); }
      // засветка у края кадра
      const lx = (Math.sin(t * .23) * .5 + .5) * w, g = x.createRadialGradient(lx, 80, 0, lx, 80, w * .6);
      g.addColorStop(0, `rgba(255,120,40,${.16 + Math.sin(t * .5) * .06})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      x.globalCompositeOperation = 'screen'; x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
      x.fillStyle = `rgba(0,0,0,${(Math.sin(f * 7.1) * .5 + .5) * .05})`; x.fillRect(wx, wy, w - 60, h - 150);
      x.font = F.mono(14, 500); x.fillStyle = 'rgba(255,170,70,.75)'; x.textAlign = 'left';
      x.fillText(`▸ ${sh.frameNo + q.k % 36}A    ПЛЁНКА 400`, 40, h - 56 - 6);
    },
    ma(r, x, t) {
      const S = r.sys, P = S.palette, sh = r.shared, { w, h } = WIN, q = r.seq(t, 2.6), b = r.beat(t);
      x.fillStyle = U.hex(P.paper); x.fillRect(0, 0, w, h); x.globalAlpha = .5; tile(x, FIBER, 0, 0, w, h); x.globalAlpha = 1;
      const L = r.layers[q.i], px0 = sh.left ? w * .1 : w * .9 - L.width, py0 = h * .2 + Math.sin(t * .15) * 4;
      if (q.mix < 1) { x.globalAlpha = 1 - q.mix; x.drawImage(r.layers[q.prev], px0, py0); }
      x.globalAlpha = q.mix; x.drawImage(L, px0, py0); x.globalAlpha = 1;
      const cx = sh.left ? w * .76 : w * .24, cy = h * .3, R = (58 + (1 - S.air) * 40) * (1 + b.pulse * .015);
      x.fillStyle = U.hex(P.accent); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
      x.strokeStyle = U.rgba(P.ink, .55); x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, cy + R + 40); x.lineTo(cx, h * .84); x.stroke();
      x.font = F.serif(24, 400); x.fillStyle = U.rgba(P.ink, .75); x.textAlign = 'center';
      [...sh.word].forEach((ch, i) => x.fillText(ch, cx + 34, cy + R + 70 + i * 36));
      if (sh.rain) { x.strokeStyle = U.rgba(P.ink, .22); x.lineWidth = 1; sh.rainLines.forEach(([rx, ry, l]) => { const yy = ((ry + t * .25) % 1) * h * 1.1 - 40, xx = rx * w; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx - l * h * .25, yy + l * h); x.stroke(); }); }
    },
    collage(r, x, t) {
      const S = r.sys, P = S.palette, sh = r.shared, { w, h } = WIN, q = r.seq(t, .45), b = r.beat(t);
      x.fillStyle = U.hex(U.mix(P.paper, P.accent2, .12)); x.fillRect(0, 0, w, h);
      const blob = (bl, i) => { const rr = U.rng(bl.seed); x.fillStyle = U.hex(bl.c); x.save(); x.translate(bl.x * w, bl.y * h); x.rotate(Math.sin(t * bl.sp * .5 + i) * .08 * S.motion); blobPath(x, 0, 0, bl.r * w * (1 + (i % 2 === b.n % 2 ? b.pulse * .05 : 0)), rr, bl.leafy); x.fill(); x.restore(); };
      sh.blobs.forEach((bl, i) => !bl.front && blob(bl, i));
      const order = r.layers.map((_, i) => i).sort((a, c) => (a === q.i) - (c === q.i));
      order.forEach(i => r.layers[i].forEach((p, j) => {
        const cur = i === q.i, s = (cur ? .95 + q.mix * .1 : .82) * (1 + (cur ? b.pulse * .02 * S.motion : 0));
        const cx = (.18 + p.x * .64) * w, cy = (.18 + p.y * .6) * h - (cur ? b.pulse * 8 * S.motion : 0);
        x.save(); x.translate(cx, cy); x.rotate(p.rot + Math.sin(t * .6 + p.ph) * .015); x.scale(s, s); x.drawImage(p.c, -p.c.width / 2, -p.c.height / 2); x.restore();
      }));
      sh.blobs.forEach((bl, i) => bl.front && blob(bl, i));
    },
    nocturne(r, x, t) {
      const S = r.sys, P = S.palette, sh = r.shared, { w, h } = WIN, q = r.seq(t, 3), b = r.beat(t);
      x.fillStyle = U.hex(P.paper); x.fillRect(0, 0, w, h);
      const draw = (i, a) => { x.globalAlpha = a * .92; const z = 1.04 + Math.sin(t * .05) * .02; x.save(); x.translate(w / 2, h / 2); x.scale(z, z); x.drawImage(r.layers[i], -w / 2, -h / 2); x.restore(); };
      if (q.mix < 1) draw(q.prev, 1 - q.mix); draw(q.i, q.mix); x.globalAlpha = 1;
      x.globalCompositeOperation = 'soft-light'; x.drawImage(sh.fields, 0, 0); x.globalCompositeOperation = 'source-over';
      x.globalAlpha = .35; x.drawImage(sh.fields, 0, 0); x.globalAlpha = 1;
      const lights = r.layers[q.i].lights || [];
      x.globalCompositeOperation = 'screen';
      lights.forEach((l, i) => { const tw = .6 + .4 * Math.sin(t * .8 + i * 1.7) + b.pulse * .15, R = 26 * l.s * tw + 6; const g = x.createRadialGradient(l.x * w, l.y * h, 0, l.x * w, l.y * h, R * 2.2); g.addColorStop(0, U.rgba(l.c, .85 * q.mix)); g.addColorStop(.25, U.rgba(l.c, .28 * q.mix)); g.addColorStop(1, U.rgba(l.c, 0)); x.fillStyle = g; x.fillRect(l.x * w - R * 2.2, l.y * h - R * 2.2, R * 4.4, R * 4.4); });
      x.globalCompositeOperation = 'source-over';
      if (sh.snow) { x.fillStyle = 'rgba(255,255,255,.75)'; sh.snow.forEach(([sx, sy, s, sp]) => { const yy = ((sy + t * .03 * sp) % 1) * h, xx = (sx * w + Math.sin(t * .4 + sy * 9) * 12); x.beginPath(); x.arc(xx, yy, s, 0, 7); x.fill(); }); }
    }
  };
  PV.Renderer = Renderer;
})(window.PV);
