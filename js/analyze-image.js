/* Анализ фото: доминирующие цвета (k-means), свет, контраст, насыщенность, температура, количество кадров. */
(function (PV) {
  const { U } = PV;
  function sample(img, size = 72) {
    const c = U.canvas(size, size), x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, size, size);
    return x.getImageData(0, 0, size, size).data;
  }
  function kmeans(px, k, iters = 10, seed = 7) {
    const rnd = U.rng(seed);
    let cents = [];
    for (let i = 0; i < k; i++) { const j = Math.floor(rnd() * px.length); cents.push(px[j].slice()); }
    let assign = new Array(px.length).fill(0);
    for (let it = 0; it < iters; it++) {
      const sums = cents.map(() => [0, 0, 0, 0]);
      for (let i = 0; i < px.length; i++) {
        const p = px[i]; let bd = 1e9, bi = 0;
        for (let c = 0; c < k; c++) { const q = cents[c]; const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2; if (d < bd) { bd = d; bi = c; } }
        assign[i] = bi; const s = sums[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
      }
      cents = sums.map((s, i) => s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : px[Math.floor(rnd() * px.length)].slice());
    }
    const counts = new Array(k).fill(0); assign.forEach(a => counts[a]++);
    return cents.map((c, i) => ({ rgb: c.map(Math.round), share: counts[i] / px.length })).filter(c => c.share > 0.01).sort((a, b) => b.share - a.share);
  }
  PV.analyzeImages = function (imgs) {
    const all = []; let L = 0, L2 = 0, S = 0, W = 0, n = 0;
    const per = imgs.map(img => {
      const d = sample(img); let l = 0, l2 = 0, s = 0, w = 0, m = 0;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const lum = U.lum([r, g, b]); const [, sat] = U.rgb2hsl(r, g, b);
        l += lum; l2 += lum * lum; s += sat; w += (r - b) / 255; m++;
        if ((i / 4) % 2 === 0) all.push([r, g, b]);
      }
      L += l; L2 += l2; S += s; W += w; n += m;
      return { brightness: l / m, contrast: Math.sqrt(Math.max(0, l2 / m - (l / m) ** 2)) };
    });
    const brightness = L / n, contrast = Math.sqrt(Math.max(0, L2 / n - brightness ** 2));
    const palette = kmeans(all, 6);
    return {
      count: imgs.length, brightness, contrast, saturation: S / n, warmth: U.clamp(W / n * 2.2, -1, 1), per,
      palette: palette.map(p => ({ hex: U.hex(p.rgb), rgb: p.rgb, share: +p.share.toFixed(3) })),
      key: brightness > .62 ? 'высокий ключ' : brightness < .3 ? 'низкий ключ' : 'средний свет'
    };
  };
})(window.PV);
