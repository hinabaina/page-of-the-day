/* Страница дня — общие утилиты. Глобальное пространство имён PV (без сборщика, работает и с file://). */
window.PV = window.PV || {};
(function (PV) {
  const U = {};
  U.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = t => t * t * (3 - 2 * t);
  U.$ = (s, r = document) => r.querySelector(s);
  U.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  U.sleep = ms => new Promise(r => setTimeout(r, ms));
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // детерминированный ГПСЧ: один и тот же день всегда рисуется одинаково
  U.hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  U.rng = seed => { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };

  // цвет
  U.rgb2hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  };
  U.hsl2rgb = (h, s, l) => {
    h = ((h % 360) + 360) % 360 / 360; s = U.clamp(s); l = U.clamp(l);
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
  };
  U.hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  U.rgba = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  U.mix = (c1, c2, t) => [0, 1, 2].map(i => c1[i] + (c2[i] - c1[i]) * t);
  U.lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  U.hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  U.hueToward = (h, target, k) => { let d = ((target - h + 540) % 360) - 180; return h + d * k; };

  // даты по-русски
  U.MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  U.WD = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  U.parseDate = s => { const [y, m, d] = (s || '').split('-').map(Number); return new Date(y || 2026, (m || 1) - 1, d || 1); };
  U.fmtDate = s => { const d = U.parseDate(s); return `${d.getDate()} ${U.MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  U.todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  U.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  U.blobToImage = blob => new Promise((res, rej) => {
    const url = URL.createObjectURL(blob); const im = new Image();
    im.onload = () => { res(im); }; im.onerror = e => { URL.revokeObjectURL(url); rej(e); }; im.src = url;
  });
  U.canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  U.canvasToBlob = (c, type = 'image/jpeg', q = 0.9) => new Promise(r => c.toBlob(r, type, q));
  // уменьшает фото до разумного размера перед хранением
  U.downscale = async (file, max = 1600) => {
    const im = await U.blobToImage(file);
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = U.canvas(Math.round(im.naturalWidth * k), Math.round(im.naturalHeight * k));
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(im.src);
    return U.canvasToBlob(c, 'image/jpeg', 0.88);
  };
  U.download = (blob, name) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  };
  U.fmtBytes = n => n > 1e6 ? (n / 1e6).toFixed(1) + ' МБ' : Math.max(1, Math.round(n / 1e3)) + ' КБ';
  U.safeName = s => String(s).replace(/[\\/:*?"<>|]+/g, '').trim() || 'День';
  PV.U = U;
})(window.PV);
