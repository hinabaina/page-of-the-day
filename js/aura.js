/* Аура: живой фон интерфейса из цветов дня. Пять мягких пятен медленно плавают; при смене дня цвета перетекают. */
(function (PV) {
  const { U } = PV;
  const DEFAULT = [[214, 72, 44], [92, 40, 120], [26, 64, 110], [196, 140, 52], [40, 24, 30]];
  const cv = document.getElementById('aura'); if (!cv) { PV.aura = { set() { } }; return; }
  const x = cv.getContext('2d');
  let cur = DEFAULT.map(c => c.slice()), target = DEFAULT.map(c => c.slice()), raf = 0, t0 = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blobs = [[.15, .2, .55, .11, .07], [.85, .25, .5, .08, .13], [.5, .85, .6, .06, .09], [.2, .8, .45, .12, .05], [.75, .7, .4, .07, .1]];
  function size() { cv.width = Math.max(64, Math.round(innerWidth / 8)); cv.height = Math.max(64, Math.round(innerHeight / 8)); }
  function frame() {
    const t = (performance.now() - t0) / 1000, W = cv.width, H = cv.height;
    for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) cur[i][k] += (target[i][k] - cur[i][k]) * .03;
    x.fillStyle = '#0b0a09'; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    blobs.forEach(([bx, by, r, sx, sy], i) => {
      const cx = (bx + Math.sin(t * sx + i * 2) * .18) * W, cy = (by + Math.cos(t * sy + i) * .16) * H, R = r * Math.max(W, H) * (1 + Math.sin(t * .2 + i) * .12);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, U.rgba(cur[i], .62)); g.addColorStop(1, U.rgba(cur[i], 0));
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    });
    x.globalCompositeOperation = 'source-over';
    raf = reduce ? 0 : requestAnimationFrame(frame);
  }
  function sat(c) { const [h, s, l] = U.rgb2hsl(...c); return U.hsl2rgb(h, U.clamp(s * 1.25 + .1, 0, .95), U.clamp(l, .28, .55)); }
  PV.aura = {
    set(cols) {
      const src = cols && cols.length ? cols : DEFAULT;
      target = Array.from({ length: 5 }, (_, i) => sat(src[i % src.length]));
      if (reduce) frame();
    }
  };
  size(); addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf && !reduce) frame(); });
  frame();
})(window.PV);
