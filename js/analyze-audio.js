/* Аудиоанализ своего файла: темп (BPM, автокорреляция огибающей атак), энергия, яркость спектра,
   тональность и лад (хрома + профили Крумхансла), динамика, огибающая громкости для «нотной ленты». */
(function (PV) {
  const { U } = PV;
  const NOTES = ['до', 'до♯', 'ре', 'ре♯', 'ми', 'фа', 'фа♯', 'соль', 'соль♯', 'ля', 'ля♯', 'си'];
  const MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]];[im[i], im[j]] = [im[j], im[i]]; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let j = 0; j < len / 2; j++) {
          const a = i + j, b = a + len / 2;
          const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }
  const corr = (a, b) => { const ma = a.reduce((s, x) => s + x, 0) / a.length, mb = b.reduce((s, x) => s + x, 0) / b.length; let num = 0, da = 0, db = 0; for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return num / Math.sqrt(da * db || 1); };

  async function decode(blob) {
    const buf = await blob.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    try { return await ctx.decodeAudioData(buf); } finally { ctx.close && ctx.close(); }
  }

  PV.analyzeAudio = async function (blob, onProgress = () => { }) {
    const ab = await decode(blob);
    onProgress('Слушаю песню…');
    const sr0 = ab.sampleRate, dec = Math.max(1, Math.round(sr0 / 11025)), sr = sr0 / dec;
    const chs = Array.from({ length: ab.numberOfChannels }, (_, i) => ab.getChannelData(i));
    const total = Math.floor(ab.length / dec);
    const mono = new Float32Array(total);
    for (let i = 0; i < total; i++) { let s = 0; for (let k = 0; k < dec; k++) for (const ch of chs) s += ch[i * dec + k] || 0; mono[i] = s / (dec * chs.length); }

    // огибающая всей песни — 72 точки для нотной ленты на странице
    const env = []; const seg = Math.floor(total / 72);
    for (let i = 0; i < 72; i++) { let s = 0; for (let j = i * seg; j < (i + 1) * seg; j += 4) s += mono[j] * mono[j]; env.push(Math.sqrt(s / (seg / 4 || 1))); }
    const emax = Math.max(...env, 1e-6);

    // анализируем до 60 с из середины песни (там обычно припев)
    const len = Math.min(total, Math.floor(sr * 60));
    const start = Math.max(0, Math.min(total - len, Math.floor(total * 0.25)));
    const N = 1024, H = 256, win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
    const frames = Math.floor((len - N) / H);
    const flux = new Float32Array(frames), rms = new Float32Array(frames);
    const chroma = new Float64Array(12); let cent = 0, centW = 0;
    let prev = new Float32Array(N / 2);
    const binPc = new Int8Array(N / 2).fill(-1);
    for (let b = 1; b < N / 2; b++) { const f = b * sr / N; if (f >= 60 && f <= 2200) binPc[b] = ((Math.round(12 * Math.log2(f / 440)) + 9) % 12 + 12) % 12; }
    const re = new Float32Array(N), im = new Float32Array(N);
    for (let fr = 0; fr < frames; fr++) {
      const off = start + fr * H; let e = 0;
      for (let i = 0; i < N; i++) { const s = mono[off + i]; re[i] = s * win[i]; im[i] = 0; e += s * s; }
      rms[fr] = Math.sqrt(e / N);
      fft(re, im);
      let fl = 0, num = 0, den = 0;
      for (let b = 1; b < N / 2; b++) {
        const m = Math.sqrt(re[b] * re[b] + im[b] * im[b]);
        const lm = Math.log1p(m * 10); const d = lm - prev[b]; if (d > 0) fl += d; prev[b] = lm;
        num += m * b; den += m; if (binPc[b] >= 0) chroma[binPc[b]] += m * m;
      }
      flux[fr] = fl; if (den > 0) { cent += (num / den) * sr / N * rms[fr]; centW += rms[fr]; }
      if (fr % 400 === 0) await U.sleep(0);
    }
    // огибающая атак: вычитаем скользящее среднее
    const fps = sr / H, onset = new Float32Array(frames); const wlen = Math.round(fps * 0.4);
    for (let i = 0; i < frames; i++) { let s = 0, c = 0; for (let j = Math.max(0, i - wlen); j < Math.min(frames, i + wlen); j++) { s += flux[j]; c++; } onset[i] = Math.max(0, flux[i] - s / c); }
    // темп: автокорреляция с мягким предпочтением 90–130 BPM
    let bestBpm = 100, bestScore = -1;
    for (let bpm = 60; bpm <= 180; bpm += 0.5) {
      const lag = fps * 60 / bpm, l0 = Math.floor(lag), fracl = lag - l0; let s = 0;
      for (let i = 0; i + l0 + 1 < frames; i++) s += onset[i] * (onset[i + l0] * (1 - fracl) + onset[i + l0 + 1] * fracl);
      s /= (frames - l0);
      const w = Math.exp(-0.5 * (Math.log2(bpm / 112) / 0.55) ** 2);
      if (s * w > bestScore) { bestScore = s * w; bestBpm = bpm; }
    }
    // фаза долей — чтобы смены кадров совпадали с ударами
    const per = fps * 60 / bestBpm; let bestPh = 0, bestPhS = -1;
    for (let ph = 0; ph < per; ph += 1) { let s = 0; for (let t = ph; t < frames; t += per) s += onset[Math.round(t)] || 0; if (s > bestPhS) { bestPhS = s; bestPh = ph; } }
    const beatOffset = (start / sr + bestPh / fps) % (60 / bestBpm);

    let meanR = 0; for (const r of rms) meanR += r; meanR /= frames || 1;
    const dbs = Array.from(rms, r => 20 * Math.log10(r + 1e-6)); const mdb = dbs.reduce((a, b) => a + b, 0) / dbs.length;
    const dyn = Math.sqrt(dbs.reduce((a, b) => a + (b - mdb) ** 2, 0) / dbs.length);
    const loud = U.clamp((20 * Math.log10(meanR + 1e-6) + 36) / 26);
    const onsetDensity = U.clamp(onset.reduce((a, b) => a + b, 0) / frames / 3);
    const centroid = centW ? cent / centW : 1500;

    const ch = Array.from(chroma); let best = { r: -2 };
    for (let k = 0; k < 12; k++) for (const [mode, prof] of [['major', MAJ], ['minor', MIN]]) {
      const rot = prof.map((_, i) => prof[(i - k + 12) % 12]); const r = corr(ch, rot); if (r > best.r) best = { r, k, mode };
    }
    return {
      source: 'audio', duration: ab.duration, bpm: Math.round(bestBpm), beatOffset,
      energy: U.clamp(loud * 0.65 + onsetDensity * 0.35 + (bestBpm > 125 ? 0.08 : 0)),
      brightness: U.clamp((centroid - 600) / 2200), centroid: Math.round(centroid),
      mode: best.mode, key: NOTES[best.k] + (best.mode === 'minor' ? ' минор' : ' мажор'), keyConfidence: +best.r.toFixed(2),
      dynamics: +dyn.toFixed(1), envelope: env.map(x => +(x / emax).toFixed(3))
    };
  };
})(window.PV);
