/* Пиксельный чиби-персонаж: большая голова, тёмные глаза с бликом, румянец, однопиксельный контур.
   Рисуется в сетке 32×46 и отдаётся как SVG из прямоугольников (чёткие пиксели при любом размере).
   Заменяет PV.ocSvg из stickers.js; параметры персонажа те же. */
(function (PV) {
  const W = 32, H = 48, OY = 6; // OY — запас сверху под пучки, уши и корону
  const hex2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, k) => toHex(hex2(h).map(c => c * k));
  const mix = (a, b, t) => { const x = hex2(a), y = hex2(b); return toHex(x.map((c, i) => c + (y[i] - c) * t)); };
  const lum = h => { const [r, g, b] = hex2(h); return (r * .3 + g * .59 + b * .11) / 255; };

  PV.OC_EYES = [['dot', 'Большие'], ['shine', 'Блестящие'], ['happy', 'Счастливые'], ['wink', 'Подмигивает']];
  PV.OC_BOTTOMS = ['#5a5f6b', '#2c2b33', '#c9ccd4', '#8a97b8', '#e8e2d6', '#6c7a5b'];

  PV.ocSvg = function (o) {
    o = Object.assign({}, PV.OC_DEFAULT, o || {});
    const g = Array.from({ length: H }, () => new Array(W).fill(null));
    const px = (x, y, c) => { y += OY; if (x >= 0 && x < W && y >= 0 && y < H && c) g[y][x] = c; };
    const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, c); };
    const ell = (cx, cy, rx, ry, c, keep) => { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) { const d = ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2; if (d <= 1 && (!keep || keep(x, y))) px(x, y, c); } };

    const human = o.kind === 'girl' || o.kind === 'boy', girl = o.kind !== 'boy';
    const sk = o.skin, skD = shade(sk, .9), blush = mix(sk, '#ff7f96', .42), mouth = shade(sk, .72);
    const hr = human ? o.hair : o.fur, hrD = lum(hr) < .2 ? mix(hr, '#000', .35) : shade(hr, .74), hrL = lum(hr) < .2 ? mix(hr, '#8a8698', .28) : mix(hr, '#fff', .28);
    const top = o.outfit, topD = shade(top, .82);
    const bot = o.bottom || (lum(top) < .35 ? '#c9ccd4' : '#5a5f6b');
    const shoe = lum(bot) > .6 ? '#6b6470' : '#3a3438';
    const st = o.style;

    // волосы сзади
    if (human) {
      if (st === 'long' || st === 'curly') for (let y = 9; y <= (st === 'long' ? 33 : 28); y++) { const wave = y > 19 ? Math.round(Math.sin(y * .9) * (st === 'curly' ? 1.4 : .8)) : 0; rect(6 - wave, y, 25 + wave, y, hr); }
      if (st === 'bob') rect(6, 9, 25, 22, hr);
      if (st === 'pony') { ell(26, 18, 2.6, 8, hr); ell(25, 11, 2.4, 2.4, hrD); }
      if (st === 'buns') { ell(8.5, 4.5, 3.4, 3.4, hr); ell(23.5, 4.5, 3.4, 3.4, hr); px(7, 3, hrL); px(22, 3, hrL); }
    }
    // тело: кофта, рукава, ладони, низ, ноги, обувь
    rect(12, 23, 19, 23, top); rect(11, 24, 20, 31, top);
    rect(9, 24, 10, 30, topD); rect(21, 24, 22, 30, topD);
    rect(9, 31, 10, 31, sk); rect(21, 31, 22, 31, sk);
    if (lum(top) < .5) { px(14, 23, '#f4f2f6'); px(17, 23, '#f4f2f6'); px(15, 24, '#f4f2f6'); px(16, 24, '#f4f2f6'); }
    else { px(15, 23, topD); px(16, 23, topD); }
    if (o.dots && o.dots !== '0') [[13, 26], [18, 27], [15, 29], [12, 30], [19, 30], [16, 26]].forEach(([x, y]) => px(x, y, '#2c2830'));
    if (girl && human) { rect(11, 32, 20, 34, bot); rect(10, 35, 21, 35, bot); rect(12, 36, 14, 38, sk); rect(17, 36, 19, 38, sk); }
    else { rect(11, 32, 20, 33, bot); rect(12, 34, 15, 38, bot); rect(16, 34, 19, 38, bot); px(15, 36, null); }
    rect(11, 39, 14, 40, shoe); rect(17, 39, 20, 40, shoe);
    // голова
    rect(14, 21, 17, 22, skD);
    ell(15.5, 13.2, 9.4, 9, sk);
    px(6, 14, sk); px(25, 14, sk);
    // лицо
    const eyeC = '#2a2430', iris = '#5b4552', lid = '#1a1518';
    const eye = (x0, mode) => {
      if (mode === 'line') { rect(x0, 16, x0 + 2, 16, lid); return; }
      if (mode === 'happy') { px(x0, 16, lid); px(x0 + 1, 15, lid); px(x0 + 2, 16, lid); return; }
      if (mode === 'dot') { rect(x0 + 1, 15, x0 + 2, 16, eyeC); return; }
      rect(x0 - 1, 13, x0 + 2, 13, lid); rect(x0, 14, x0 + 2, 17, eyeC); rect(x0, 16, x0 + 2, 17, iris); px(x0, 14, '#ffffff'); if (mode === 'shine') px(x0 + 2, 16, '#f6e6f2');
    };
    const em = o.eyes === 'happy' ? 'happy' : o.eyes === 'shine' ? 'shine' : 'big';
    eye(10, em); eye(19, o.eyes === 'wink' ? 'line' : em);
    rect(8, 18, 9, 18, blush); rect(22, 18, 23, 18, blush);
    rect(15, 19, 16, 19, mouth);
    // волосы спереди: шапка волос, чёлка с прядками, боковые пряди, блик
    if (human) {
      const tips = { long: [11, 12, 11, 11, 12, 11, 10, 11, 12, 11, 12, 11], bob: [11, 11, 12, 11, 11, 11, 11, 11, 12, 11, 11, 11], curly: [11, 12, 11, 12, 11, 12, 11, 12, 11, 12, 11, 12], buns: [10, 11, 11, 10, 11, 11, 10, 11, 11, 10, 11, 11], pony: [9, 10, 10, 11, 11, 12, 12, 12, 11, 12, 12, 11], short: [11, 12, 10, 12, 11, 10, 12, 11, 12, 10, 12, 11] }[st] || [];
      ell(15.5, 12.4, 10.3, 9.6, hr, (x, y) => { if (x < 8 || x > 23) return y <= 12; const t = tips[(x - 8) % tips.length]; return y <= t; });
      for (let x = 8; x <= 23; x++) { const t = tips[(x - 8) % tips.length]; px(x, t, hrD); }
      const side = { long: 21, bob: 22, curly: 21, buns: 18, pony: 17, short: 15 }[st] || 18;
      rect(6, 10, 8, side, hr); rect(23, 10, 25, side, hr); px(8, side, hrD); px(23, side, hrD);
      if (st === 'curly') for (let y = 12; y <= side; y += 2) { px(5, y, hr); px(26, y, hr); }
      if (st === 'short') { [[10, 3], [13, 2], [16, 3], [19, 2], [22, 4]].forEach(([x, y]) => { px(x, y, hr); px(x, y + 1, hr); }); }
      rect(11, 6, 13, 6, hrL); rect(18, 6, 20, 6, hrL); px(14, 7, hrL); px(10, 7, hrL);
    } else {
      // капюшон с ушками у зверят
      const fur = o.fur, furD = shade(fur, .8), inner = mix(fur, '#ff9fb2', .45);
      ell(15.5, 12.6, 11, 10.2, fur, (x, y) => y <= 11 || x < 8 || x > 23);
      rect(6, 11, 7, 21, fur); rect(24, 11, 25, 21, fur);
      for (let x = 8; x <= 23; x++) px(x, 11, furD);
      if (o.kind === 'cat' || o.kind === 'fox') { [6, 22].forEach(x0 => { px(x0 + 1, 0, fur); rect(x0, 1, x0 + 2, 1, fur); rect(x0, 2, x0 + 3, 4, fur); px(x0 + 1, 2, inner); rect(x0 + 1, 3, x0 + 2, 3, inner); }); if (o.kind === 'fox') { px(7, 0, '#fff'); px(23, 0, '#fff'); } }
      if (o.kind === 'bunny') { ell(10.5, -1, 1.8, 5.5, fur); ell(21.5, -1, 1.8, 5.5, fur); rect(10, -3, 10, 2, inner); rect(21, -3, 21, 2, inner); }
      if (o.kind === 'bear') { ell(7.5, 3.5, 2.6, 2.6, fur); ell(24.5, 3.5, 2.6, 2.6, fur); px(7, 3, inner); px(24, 3, inner); }
    }
    // аксессуары
    const acc = o.acc;
    if (acc === 'phones') { ell(15.5, 12, 11.6, 10.6, '#ecebf0', (x, y) => y <= 6 && ((x + .5 - 15.5) / 11.6) ** 2 + ((y + .5 - 12) / 10.6) ** 2 >= .8); rect(3, 11, 6, 18, '#f4f2f6'); rect(25, 11, 28, 18, '#f4f2f6'); rect(4, 12, 5, 17, '#cfcbd4'); rect(26, 12, 27, 17, '#cfcbd4'); }
    if (acc === 'bow') { [[21, 6], [23, 6], [20, 7], [21, 7], [22, 7], [23, 7], [24, 7], [21, 8], [22, 8], [23, 8], [22, 9]].forEach(([x, y]) => px(x, y, '#f39ab5')); px(21, 6, '#ffd3e0'); }
    if (acc === 'glasses') { const f = '#3a3036'; [[8, 12, 13, 18], [18, 12, 23, 18]].forEach(([a, b, c, d]) => { rect(a, b, c, b, f); rect(a, d, c, d, f); rect(a, b, a, d, f); rect(c, b, c, d, f); }); rect(14, 14, 17, 14, f); }
    if (acc === 'flower') { [[22, 5], [24, 5], [21, 6], [25, 6], [22, 7], [24, 7]].forEach(([x, y]) => px(x, y, '#ffffff')); px(23, 6, '#ffd84d'); px(23, 5, '#ffc2d6'); px(23, 7, '#ffc2d6'); }
    if (acc === 'crown') { rect(11, 2, 20, 3, '#f5c84c'); [11, 14, 17, 20].forEach(x => { px(x, 1, '#f5c84c'); px(x, 0, '#f5c84c'); }); px(15, 2, '#e85d75'); }
    if (acc === 'beanie') { const c = mix(o.outfit, '#ffffff', .15); ell(15.5, 9, 10.6, 7, c, (x, y) => y <= 8); rect(6, 7, 25, 8, shade(c, .85)); px(15, 1, c); px(16, 1, c); }

    // контур: пустой пиксель рядом с закрашенным становится тёмным краем соседа
    const out = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (g[y][x]) continue;
      const n = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => (g[y + dy] || [])[x + dx]).find(Boolean);
      if (n) out[y][x] = lum(n) < .15 ? '#0f0c10' : shade(n, .55);
    }
    let rects = '';
    for (let y = 0; y < H; y++) for (let x = 0; x < W;) { const c = out[y][x]; if (!c) { x++; continue; } let e = x; while (e + 1 < W && out[y][e + 1] === c) e++; rects += `<rect x="${x}" y="${y}" width="${e - x + 1}" height="1" fill="${c}"/>`; x = e + 1; }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${rects}</svg>`;
  };
})(window.PV);
