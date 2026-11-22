/* AI-генератор страницы дня: материалы дня → анализ → настроение и стиль → композиция.
   Не выбирает готовый шаблон: раскладка, фон, палитра, шрифты, рамки и стикеры подбираются
   из диапазонов настроения с учётом фото, слов, музыки, анкеты и накопленного вкуса пользователя.
   Если подключён Gemini (PV.gemini), его подсказки уточняют темы, подпись и название. */
(function (PV) {
  const { U } = PV, T = (s, v) => PV.T(s, v);
  const PW = 540, PH = 760, M0 = 34;

  /* ---------- настроения: диапазоны, а не шаблоны ---------- */
  const MOODS = {
    calm: { e: .25, sat: [.18, .42], tilt: 3, nSt: [1, 3], stSize: [54, 78],
      bgs: { paper: 3, grain: 2, lined: 2, dotgrid: 1.5, mesh: 1, stripes: 1 },
      fonts: { 'Cormorant Garamond': 3, 'Bad Script': 2, Neucha: 1.5, Caveat: 1.5, Comfortaa: 1 },
      frames: { round: 3, polaroid: 1.5, stroke: 1, none: 1 },
      grammars: { hero: 3, grid: 2.5, split: 2, strip: 1 },
      st: ['star-line', 'sparkle', 'asterisk', 'leaf', 'cloud', 'heart-line', 'arrow'], dates: ['mini', 'pill'] },
    joy: { e: .85, sat: [.5, .78], tilt: 11, nSt: [4, 7], stSize: [70, 110],
      bgs: { dots: 3, stripes: 2, gingham: 2, mesh: 1.5, paper: 1, hearts: .8, rainbow: .6 },
      fonts: { 'Rubik Mono One': 2, Pacifico: 2, Caveat: 2, Unbounded: 2, Lobster: 1, 'Amatic SC': 1 },
      frames: { polaroid: 3, tape: 2, stroke: 1.5, heart: 1, circle: 1 },
      grammars: { scatter: 4, hero: 2, stack: 1.5, grid: .5 },
      st: ['flash', 'star', 'sparkle', 'smile', 'cherry', 'rainbow', 'crown', 'candy', 'hearts', 'asterisk', 'bubble:{wow}'], dates: ['ticket', 'stamp', 'big'] },
    nostalgia: { e: .4, sat: [.22, .45], tilt: 7, nSt: [2, 4], stSize: [60, 92],
      bgs: { kraft: 3, paper: 2.5, grain: 2, lined: 1.5, crumpled: 1 },
      fonts: { 'Marck Script': 3, 'Cormorant Garamond': 2, 'Bad Script': 1.5, Lobster: 1.5, 'JetBrains Mono': 1 },
      frames: { polaroid: 3, film: 2.5, tape: 2 },
      grammars: { stack: 3, strip: 2.5, hero: 2, scatter: 1 },
      st: ['film', 'camera', 'tape-k', 'label:core memory', 'star-line', 'note', 'leaf', 'clip', 'label:{year}'], dates: ['stamp', 'ticket'] },
    tender: { e: .45, sat: [.3, .55], tilt: 5, nSt: [3, 5], stSize: [60, 96],
      bgs: { stripes: 3, paper: 2, hearts: 1.5, gingham: 1.5, mesh: 1 },
      fonts: { 'Cormorant Garamond': 3, 'Marck Script': 2.5, 'Bad Script': 2, Caveat: 1.5 },
      frames: { polaroid: 2.5, round: 2, heart: 1.5, circle: 1 },
      grammars: { hero: 3, stack: 2, scatter: 1.5, split: 1.5 },
      st: ['heart', 'hearts', 'bow', 'butterfly', 'sparkle', 'tulip', 'daisy', 'heart-line', 'bubble:{love}'], dates: ['mini', 'big'] },
    tired: { e: .2, sat: [.12, .3], tilt: 3, nSt: [1, 2], stSize: [52, 74],
      bgs: { paper: 3, lined: 2.5, grain: 1.5, crumpled: 1 },
      fonts: { Neucha: 3, Caveat: 2, Onest: 1.5, 'Amatic SC': 1 },
      frames: { round: 2, polaroid: 2, none: 1 },
      grammars: { hero: 2, split: 2.5, grid: 2 },
      st: ['cup', 'cloud', 'moon', 'note', 'scribble', 'star-line', 'label:{remember}'], dates: ['mini'] },
    sad: { e: .2, sat: [.1, .28], tilt: 2, nSt: [0, 2], stSize: [50, 70],
      bgs: { paper: 2.5, grain: 2.5, lined: 1, crumpled: 1 },
      fonts: { 'Cormorant Garamond': 3, 'Marck Script': 2, Onest: 1.5, Neucha: 1 },
      frames: { film: 2, round: 2, polaroid: 1.5, none: 1 },
      grammars: { split: 3, hero: 2.5, strip: 1.5 },
      st: ['cloud', 'moon', 'star-line', 'heart-line', 'note', 'scribble'], dates: ['mini'] },
    everyday: { e: .5, sat: [.25, .5], tilt: 6, nSt: [2, 4], stSize: [58, 90],
      bgs: { lined: 3, grid: 2.5, paper: 2.5, dotgrid: 1.5, kraft: 1 },
      fonts: { Caveat: 3, 'Bad Script': 2, Neucha: 2, Comfortaa: 1 },
      frames: { polaroid: 3, tape: 2, round: 1.5 },
      grammars: { grid: 2, hero: 2, scatter: 2, stack: 1.5, strip: 1 },
      st: ['cup', 'note', 'asterisk', 'clip', 'pin', 'arrow', 'sun', 'scribble', 'bubble:{myday}'], dates: ['pill', 'mini', 'stamp'] }
  };
  PV.MOOD_KEYS = ['calm', 'joy', 'nostalgia', 'tender', 'tired', 'sad', 'everyday'];
  PV.MOOD_NAMES = { calm: 'Спокойно', joy: 'Радостно', nostalgia: 'Ностальгия', tender: 'Нежно', tired: 'Устало', sad: 'Грустно', everyday: 'Обычный день' };
  PV.MOOD_ADJ = { calm: 'спокойное', joy: 'радостное', nostalgia: 'ностальгическое', tender: 'нежное', tired: 'усталое', sad: 'грустное', everyday: 'повседневное' };
  PV.MOOD_COLORS = { calm: '#a8c8e0', joy: '#ffc46b', nostalgia: '#d6b48c', tender: '#f2a7c3', tired: '#b9b4c8', sad: '#8a9bb8', everyday: '#e8e2d6' };
  const DARK_BG = { stars: 3, grain: 2, mesh: 2, dotgrid: 1 };
  const FONT_K = { 'Bad Script': .95, 'Rubik Mono One': .58, Unbounded: .66, 'Amatic SC': 1.25, Pacifico: .82, 'JetBrains Mono': .68, Lobster: .92, 'Cormorant Garamond': 1.05, Comfortaa: .78, Onest: .78, Neucha: .95, Caveat: 1.1, 'Marck Script': 1.02 };

  // слова → настроение (только то, что человек сам написал или выбрал)
  const MOOD_WORDS = {
    calm: ['спокой', 'тих', 'умиротвор', 'расслаб', 'уютн', 'размерен', 'calm', 'quiet', 'peace', 'relax', 'cozy', 'chill'],
    joy: ['рад', 'весел', 'счаст', 'кайф', 'ура', 'восторг', 'лучший', 'смеял', 'круто', 'супер', 'happy', 'fun', 'joy', 'amazing', 'best', 'awesome', 'excited'],
    nostalgia: ['ностальг', 'вспомина', 'детств', 'раньше', 'как когда-то', 'плёнк', 'пленк', 'memories', 'nostalg', 'remember when', 'childhood'],
    tender: ['нежн', 'любл', 'романт', 'свидани', 'обним', 'поцел', 'особенн', 'love', 'romantic', 'date', 'tender', 'special', 'hug'],
    tired: ['устал', 'вымот', 'нет сил', 'выжат', 'сонн', 'tired', 'exhausted', 'sleepy', 'drained'],
    sad: ['грус', 'печал', 'плак', 'слёз', 'слез', 'тоск', 'одиноко', 'расстал', 'больно', 'sad', 'cry', 'lonely', 'tears', 'miss', 'hurt'],
    everyday: ['обычн', 'как всегда', 'ничего особенного', 'рутин', 'usual', 'ordinary', 'normal day', 'routine']
  };
  // темы дня → какие стикеры уместны
  const THEMES = {
    friends: [['друз', 'подруг', 'девочк', 'девчонк', 'пацан', 'ребят', 'компани', 'класс', 'friend', 'girls', 'guys'], ['hearts', 'smile', 'bubble:{love}', 'star']],
    coffee: [['кофе', 'какао', 'чай', 'латте', 'капучино', 'coffee', 'tea', 'cocoa', 'latte'], ['cup']],
    music: [['концерт', 'песн', 'музык', 'наушник', 'плейлист', 'concert', 'music', 'song', 'playlist'], ['note', 'flash']],
    travel: [['поездк', 'путешеств', 'самолёт', 'самолет', 'поезд', 'дорог', 'аэропорт', 'trip', 'travel', 'flight', 'train', 'road'], ['camera', 'film', 'arrow']],
    nature: [['парк', 'лес', 'горы', 'гор ', 'озер', 'природ', 'цвет', 'park', 'forest', 'mountain', 'lake', 'flower', 'nature'], ['leaf', 'daisy', 'tulip', 'sun']],
    study: [['учёб', 'учеб', 'урок', 'экзамен', 'ент', 'универ', 'школ', 'сесси', 'study', 'exam', 'school', 'class', 'uni'], ['clip', 'pin', 'note', 'label:{remember}']],
    food: [['пицц', 'торт', 'ужин', 'завтрак', 'обед', 'мороженое', 'вкусн', 'food', 'cake', 'dinner', 'breakfast', 'pizza', 'ice cream'], ['strawberry', 'cherry', 'candy']],
    rain: [['дожд', 'ливен', 'rain'], ['cloud']],
    snow: [['снег', 'снеж', 'зим', 'snow', 'winter'], ['snow', 'sparkle']],
    night: [['ноч', 'звёзд', 'звезд', 'луна', 'night', 'star', 'moon'], ['moon', 'star-line', 'sparkle']],
    sun: [['солн', 'жара', 'пляж', 'море', 'sun', 'beach', 'sea', 'summer'], ['sun', 'cherry']],
    birthday: [['день рождени', 'днюх', 'праздник', 'birthday', 'party', 'celebrat'], ['crown', 'candy', 'star', 'sparkle']],
    love: [['любл', 'свидани', 'любим', 'парень', 'девушк', 'love', 'date', 'boyfriend', 'girlfriend'], ['heart', 'heart-line', 'bow']],
    sport: [['трениров', 'спорт', 'бег', 'матч', 'зал', 'sport', 'gym', 'run', 'match', 'workout'], ['flash', 'star', 'asterisk']]
  };
  // анкета → эстетика
  const AES = {
    minimal: { bgs: { dotgrid: 2, grid: 1.5, paper: 1.5 }, fonts: { Onest: 2, Unbounded: 1 }, frames: { round: 1.5, none: 1 }, st: -1.5 },
    cozy: { bgs: { kraft: 2, paper: 1.5, grain: 1 }, fonts: { Caveat: 2, Neucha: 1 }, frames: { polaroid: 1.5, tape: 1 }, st: 0 },
    night: { bgs: { stars: 2, grain: 1.5 }, fonts: { 'Marck Script': 2 }, frames: { film: 2 }, st: 0, dark: 1 },
    pop: { bgs: { mesh: 2, dots: 2 }, fonts: { 'Rubik Mono One': 2, Unbounded: 1 }, frames: { stroke: 1.5, polaroid: 1 }, st: 1.5 },
    retro: { bgs: { grain: 2, kraft: 2 }, fonts: { Lobster: 2, 'JetBrains Mono': 1 }, frames: { polaroid: 2, film: 1.5 }, st: .5 },
    soft: { bgs: { mesh: 2, gingham: 1.5 }, fonts: { 'Marck Script': 2, 'Cormorant Garamond': 1 }, frames: { polaroid: 1.5, round: 1 }, st: .5 }
  };
  const FAMILY = { warm: { h: 22, s: 1, l: 0 }, cool: { h: 205, s: 1, l: 0 }, pastel: { h: null, s: .75, l: .03 }, mono: { h: null, s: .15, l: 0 }, neon: { h: null, s: 1.35, l: 0 }, earth: { h: 35, s: .7, l: -.01 } };
  const INTEREST_ST = { study: ['clip', 'pin', 'label:{remember}'], friends: ['hearts', 'bubble:{love}', 'smile'], music: ['note', 'label:mood', 'sparkle'], sport: ['flash', 'star', 'asterisk'], travel: ['camera', 'film', 'arrow'], food: ['cup', 'strawberry', 'cherry'], nature: ['leaf', 'daisy', 'sun'], art: ['scribble', 'sparkle', 'star-line'] };

  /* ---------- утилиты ---------- */
  const hexRgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const hsl = rgb => U.rgb2hsl(...rgb);
  const mixHex = (a, b, t) => { const x = hexRgb(a), y = hexRgb(b); return U.hex(x.map((c, i) => Math.round(c + (y[i] - c) * t))); };
  const hx = (h, s, l) => U.hex(U.hsl2rgb(h, U.clamp(s), U.clamp(l)));
  const mixHue = (a, b, t) => { const d = ((b - a + 540) % 360) - 180; return (a + d * t + 360) % 360; };
  const has = (text, stems) => stems.some(s => text.includes(s));
  function pickW(w, rng, avoid) {
    const e = Object.entries(w).filter(([k, v]) => v > 0 && k !== avoid);
    const list = e.length ? e : Object.entries(w);
    const sum = list.reduce((a, [, v]) => a + v, 0); let r = rng() * sum;
    for (const [k, v] of list) { r -= v; if (r <= 0) return k; }
    return list[list.length - 1][0];
  }
  const mergeW = (...ws) => { const o = {}; ws.forEach(w => w && Object.entries(w).forEach(([k, v]) => { o[k] = (o[k] || 0) + v; })); return o; };
  const label = n => n.replace('{wow}', T('вау!')).replace('{love}', T('люблю')).replace('{myday}', T('мой день')).replace('{remember}', T('не забыть')).replace('{year}', new Date().getFullYear());
  const rr = (rng, a, b) => a + (b - a) * rng();

  /* ---------- анализ ---------- */
  const photoCache = new Map();
  async function photoInfo(blob) {
    if (photoCache.has(blob)) return photoCache.get(blob);
    const im = await U.blobToImage(blob); const a = PV.analyzeImages([im]);
    const r = { a, asp: im.naturalHeight / im.naturalWidth }; URL.revokeObjectURL(im.src); photoCache.set(blob, r); return r;
  }
  function moodFromWords(text) {
    const t = ' ' + (text || '').toLowerCase().replace(/ё/g, 'е') + ' ';
    const sc = {}; Object.entries(MOOD_WORDS).forEach(([k, st]) => { const n = st.filter(s => t.includes(s.replace(/ё/g, 'е'))).length; if (n) sc[k] = n; });
    const best = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : null;
  }

  // input: { text, mood, moodText, prompt:{id,kind,q,answer}, place, song, date, time }, медиа берём из day.items/blobs
  async function analyze(day, prof) {
    const inp = day.input || {};
    const media = day.items.filter(i => (i.type === 'photo' || i.type === 'video') && day.blobs[i.type === 'video' ? i.poster : i.key]);
    const infos = [];
    for (const m of media) infos.push(await photoInfo(day.blobs[m.type === 'video' ? m.poster : m.key]));
    const allPal = infos.flatMap(x => x.a.palette.map(p => ({ rgb: p.rgb, share: p.share / infos.length })));
    const bright = infos.length ? infos.reduce((s, x) => s + x.a.brightness, 0) / infos.length : .6;
    const warmth = infos.length ? infos.reduce((s, x) => s + x.a.warmth, 0) / infos.length : 0;
    const satur = infos.length ? infos.reduce((s, x) => s + x.a.saturation, 0) / infos.length : .3;
    const ans = inp.prompt && inp.prompt.answer ? inp.prompt.answer : '';
    const words = [inp.text || '', ans, inp.place || '', inp.extra || ''].join(' ');
    const Tx = PV.analyzeText(words, { date: day.date, time: day.time });
    const low = words.toLowerCase().replace(/ё/g, 'е');
    const G = day.ai || null; // ответ Gemini, если был
    // настроение: выбор человека → его слова → Gemini (только если сказано в тексте) → нейтральное
    let mood = null, moodSrc = 'neutral';
    if (inp.mood && MOODS[inp.mood]) { mood = inp.mood; moodSrc = 'chosen'; }
    else if (inp.moodText) { mood = moodFromWords(inp.moodText) || (PV.analyzeText(inp.moodText).valence > .2 ? 'joy' : PV.analyzeText(inp.moodText).valence < -.2 ? 'sad' : 'everyday'); moodSrc = 'own'; }
    else { const w = moodFromWords(words); if (w) { mood = w; moodSrc = 'text'; } else if (G && G.moodStated && MOODS[G.mood]) { mood = G.mood; moodSrc = 'ai'; } }
    if (!mood) mood = 'everyday';
    // время и свет — это обстановка, а не эмоция
    const night = (Tx.time && Tx.time.key === 'night') || (infos.length && bright < .32);
    const themes = Object.entries(THEMES).filter(([, [st]]) => has(low, st.map(s => s.replace(/ё/g, 'е')))).map(([k]) => k);
    (G && G.themes || []).forEach(k => { if (THEMES[k] && !themes.includes(k)) themes.push(k); });
    if (night && !themes.includes('night')) themes.push('night');
    const M = day.song ? (day.song.music || (day.song.artist || day.song.genre ? PV.describeMusic({ artist: day.song.artist, genre: day.song.genre, year: day.song.year, mode: day.song.mode, tempo: day.song.tempo }) : null)) : null;
    let hint = null;
    if (inp.prompt && inp.prompt.kind === 'color' && ans && PV.colorFromWords) hint = PV.colorFromWords(ans);
    if (!hint && PV.colorFromWords) hint = PV.colorFromWords(inp.moodText || '');
    const V = prof && prof.vibe;
    return { media, infos, palette: allPal.sort((a, b) => b.share - a.share), bright, warmth, satur, Tx, mood, moodSrc, night, themes, M, hint, V, G, words, hasText: !!(inp.text || ans).trim() };
  }

  /* ---------- стиль ---------- */
  function style(A, opts, taste, rng) {
    const mood = opts.mood || A.mood, MD = MOODS[mood];
    const V = A.V, ae = V ? AES[V.style] || null : null, fam = V ? FAMILY[V.colors] : null;
    const tw = (k, w) => PV.taste ? PV.taste.weigh(taste, k, w) : w;
    const density = U.clamp(opts.density || 0, -2, 2);
    let E = MD.e;
    if (A.M) E = E * .55 + A.M.energy * .45;
    if (A.hasText && mood === A.mood) E = E * .8 + A.Tx.arousal * .2;
    E = U.clamp(E + density * .06);
    const minor = A.M ? A.M.mode === 'minor' : false;
    // палитра: оттенки из фото, подсказка цвета из ответа, семья цветов из анкеты
    let h1 = 30, h2 = 330, sBase = .4;
    if (A.palette.length) {
      const dom = A.palette[0].rgb, viv = A.palette.filter(p => p.share > .03).sort((a, b) => hsl(b.rgb)[1] - hsl(a.rgb)[1])[0] || A.palette[0];
      h1 = hsl(dom)[0]; h2 = hsl(viv.rgb)[0]; sBase = U.clamp(A.satur * 1.1, .2, .7);
      if (Math.abs(((h2 - h1 + 540) % 360) - 180) < 20) h2 = (h1 + 35 + rng() * 40) % 360;
    } else if (V && PV.VCOLORS_HEX && PV.VCOLORS_HEX[V.colors]) { const cs = PV.VCOLORS_HEX[V.colors]; h1 = hsl(hexRgb(cs[0]))[0]; h2 = hsl(hexRgb(cs[1]))[0]; }
    else { h1 = { calm: 205, joy: 40, nostalgia: 32, tender: 340, tired: 250, sad: 220, everyday: 28 }[mood]; h2 = (h1 + 40) % 360; }
    if (A.hint) { const hh = hsl(hexRgb(A.hint))[0]; h2 = hh; h1 = mixHue(h1, hh, .6); sBase = Math.max(sBase, .6); }
    if (fam && fam.h != null) { h1 = mixHue(h1, fam.h, .22); h2 = mixHue(h2, fam.h, .15); }
    h1 = (h1 + (rng() - .5) * 14 + 360) % 360;
    let sat = U.clamp(U.lerp(MD.sat[0], MD.sat[1], U.clamp(sBase + (E - .5) * .5)) * (fam ? fam.s : 1) * (minor ? .8 : 1), .05, .85);
    const lAdd = fam ? fam.l : 0;
    const dark = (A.night && ['calm', 'nostalgia', 'sad', 'tender', 'everyday', 'tired'].includes(mood) && rng() < .45) || (ae && ae.dark && rng() < .6);
    // фон
    let bgW = mergeW(MD.bgs, ae && ae.bgs && Object.fromEntries(Object.entries(ae.bgs).map(([k, v]) => [k, v * .6])));
    if (dark) bgW = Object.fromEntries(Object.entries(mergeW(DARK_BG, bgW)).filter(([k]) => DARK_BG[k]));
    Object.keys(bgW).forEach(k => bgW[k] = tw('bg:' + k, bgW[k]));
    const bgType = pickW(bgW, rng, opts.avoid && opts.avoid.bg);
    let c1, c2, c3, c4, ink, acc;
    if (dark) {
      c1 = hx(h1, U.clamp(sat + .1, .25, .55), .12 + rng() * .05); c2 = bgType === 'stars' ? '#fff3b0' : hx(h2, .5, .62);
      c3 = hx(h1, .55, .3); c4 = hx(h2, .5, .26); ink = '#f6f1fb'; acc = hx(h2, .7, .66);
    } else {
      c1 = hx(h1, sat, U.clamp(.915 + rng() * .035 + lAdd, .86, .97)); c2 = hx(h2, U.clamp(sat + .15), U.clamp(.74 + rng() * .08 + lAdd));
      c1 = mixHex(c1, '#f8f2e8', bgType === 'stripes' || bgType === 'dots' || bgType === 'gingham' ? .35 : .6);
      c3 = hx(h1, U.clamp(sat + .2), .8); c4 = hx(h2, U.clamp(sat + .25), .78);
      ink = hx(h1, .38, mood === 'joy' ? .2 : .18); acc = hx(h2, U.clamp(.55 + E * .3), .5);
    }
    if (bgType === 'kraft') ink = '#3b2a1e';
    const bg = { type: bgType, c1, c2, c3, c4 };
    // шрифты, рамки, раскладка
    const fW = mergeW(MD.fonts, ae && ae.fonts, V && V.font ? { [V.font]: 1.2 } : null);
    Object.keys(fW).forEach(k => fW[k] = tw('font:' + k, fW[k]));
    const font = pickW(fW, rng, opts.avoid && opts.avoid.font);
    const hand = ['Caveat', 'Marck Script', 'Neucha', 'Amatic SC', 'Bad Script'].includes(font) ? font : pickW({ Caveat: 3, 'Bad Script': 2.5, Neucha: 1.5, 'Marck Script': mood === 'tender' || mood === 'nostalgia' ? 3 : .5 }, rng);
    const frW = mergeW(MD.frames, ae && ae.frames); Object.keys(frW).forEach(k => frW[k] = tw('frame:' + k, frW[k]));
    const frame = pickW(frW, rng), frame2 = pickW(frW, rng, frame);
    const n = A.media.length;
    const gW = Object.assign({}, MD.grammars);
    const ok = { hero: n >= 1, grid: n >= 2 && n <= 6, split: n >= 1 && n <= 3, strip: n >= 2 && n <= 4, stack: n >= 2 && n <= 5, scatter: n >= 2 };
    Object.keys(gW).forEach(k => { if (!ok[k]) delete gW[k]; });
    if (n >= 6) Object.assign(gW, { grid: 3, scatter: 2 });
    const grammar = n === 0 ? 'typo' : pickW(Object.keys(gW).length ? gW : { hero: 1 }, rng, opts.avoid && opts.avoid.grammar);
    // стикеры: темы дня → настроение → интересы из анкеты, с учётом вкуса
    let nSt = Math.round(U.lerp(MD.nSt[0], MD.nSt[1], rng()) + density * 1.6 + (E - .5) * 2 + (ae ? ae.st * .5 : 0));
    nSt = U.clamp(nSt, density <= -2 ? 0 : density < 0 ? 0 : 1, 10);
    const pool = [];
    A.themes.forEach(k => THEMES[k][1].forEach(s => pool.push([s, 3])));
    MD.st.forEach(s => pool.push([s, 1.6]));
    (V && V.interests || []).forEach(k => (INTEREST_ST[k] || []).forEach(s => pool.push([s, .9])));
    const stW = {}; pool.forEach(([s, w]) => stW[s] = (stW[s] || 0) + w);
    Object.keys(stW).forEach(k => stW[k] = tw('st:' + k, stW[k]));
    const stickers = []; const w2 = Object.assign({}, stW);
    for (let i = 0; i < nSt && Object.keys(w2).length; i++) { const s = pickW(w2, rng); stickers.push(label(s)); delete w2[s]; }
    return { mood, E, density, dark, bg, ink, acc, font, hand, frame, frame2, grammar, stickers, tilt: MD.tilt * (.6 + E * .8), stSize: MD.stSize, dates: MD.dates, palette: [c1, c2, c3, c4, acc] };
  }

  /* ---------- раскладка ---------- */
  function frameH(w, asp, fr) {
    switch (fr) {
      case 'polaroid': return w * (.88 * asp + .28);
      case 'tape': return w * (.92 * asp + .08);
      case 'film': return w * (.92 * asp + .18);
      case 'heart': return w * .92;
      case 'circle': return w;
      default: return w * asp;
    }
  }
  const box = (x, y, w, h, rot = 0) => { const r = Math.abs(rot) * Math.PI / 180, bw = w * Math.cos(r) + h * Math.sin(r), bh = h * Math.cos(r) + w * Math.sin(r); return { x: x - bw / 2, y: y - bh / 2, w: bw, h: bh }; };
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  // высота текста: меряем в скрытом блоке с теми же стилями, что у .tx на странице; без DOM — оценка
  let meas = null;
  function textH(txt, size, w, font, pill) {
    if (typeof document === 'undefined' || !document.body) { const cw = size * .5 / (FONT_K[font] || 1); return String(txt).split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length * cw / w)), 0) * size * 1.15 + 8; }
    if (!meas) { meas = document.createElement('div'); meas.setAttribute('aria-hidden', 'true'); meas.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre-wrap;word-break:break-word;box-sizing:border-box'; document.body.appendChild(meas); }
    Object.assign(meas.style, { width: w + 'px', fontFamily: `'${font}'`, fontSize: size + 'px', padding: pill ? '10px 14px' : '4px 8px', lineHeight: pill ? '1.3' : '1.12' });
    meas.textContent = txt; return meas.offsetHeight;
  }
  async function ensureFont(font, size) { try { if (document.fonts) await Promise.race([document.fonts.load(`${size}px '${font}'`, 'Абв'), U.sleep(1500)]); } catch (e) { } }

  function placePhotos(S, media, rng) {
    const n = media.length, tilt = S.tilt, out = [];
    const fr = i => (i === 0 ? S.frame : S.frame2);
    const rot = () => (rng() - .5) * 2 * tilt;
    let text = { x: 270, y: 600, w: 450, align: 'center' };
    const g = S.grammar;
    if (g === 'hero') {
      const above = rng() < .35;
      const hw = U.clamp(rr(rng, 320, 400) - (n > 3 ? 30 : 0), 260, 420); const asp = media[0].asp || .75, f0 = fr(0);
      const hh = Math.min(frameH(hw, asp, f0), 430);
      const top = above ? 250 : 110;
      const hx0 = 270 + (rng() - .5) * 60, hy = top + hh / 2;
      out.push({ m: media[0], x: hx0, y: hy, w: hw, rot: rot() * .5, frame: f0 });
      const corners = [[1, 1], [-1, -1], [-1, 1], [1, -1]].sort(() => rng() - .5);
      media.slice(1, 5).forEach((m, i) => { const [sx, sy] = corners[i]; const w = rr(rng, 130, 170); out.push({ m, x: U.clamp(hx0 + sx * hw * .48, 90, 450), y: U.clamp(hy + sy * hh * .45, 120, 560), w, rot: sx * rr(rng, 4, 4 + tilt), frame: S.frame2 === 'none' ? 'polaroid' : S.frame2 }); });
      media.slice(5).forEach((m, i) => out.push({ m, x: 100 + i * 110, y: 560, w: 110, rot: rot(), frame: 'polaroid' }));
      text = above ? { x: 270, y: 150, w: 460, align: rng() < .5 ? 'center' : 'left', top: true } : { x: 270, y: Math.min(hy + hh / 2 + 80, 610), w: 460, align: rng() < .6 ? 'center' : 'left' };
    } else if (g === 'grid') {
      const cols = n <= 2 ? 2 : n === 3 ? 2 : n === 4 ? 2 : 3, gap = 14, w = (PW - 2 * M0 - 20 - (cols - 1) * gap) / cols;
      const f = ['polaroid', 'tape'].includes(S.frame) ? 'round' : S.frame === 'heart' || S.frame === 'circle' ? 'round' : S.frame;
      let y0 = 210, rowH = 0;
      const cells = []; media.forEach((m, i) => { if (n === 3 && i === 0) { cells.push({ m, w: PW - 2 * M0 - 20, full: 1 }); } else cells.push({ m, w }); });
      let x = M0 + 10, y = y0;
      cells.forEach((c, i) => {
        const asp = Math.min(c.m.asp || .75, 1.25), h = frameH(c.w, asp, f);
        if (c.full) { out.push({ m: c.m, x: 270, y: y + h / 2, w: c.w, rot: 0, frame: f }); y += h + gap; return; }
        if (x + c.w > PW - M0) { x = M0 + 10; y += rowH + gap; rowH = 0; }
        out.push({ m: c.m, x: x + c.w / 2, y: y + h / 2, w: c.w, rot: 0, frame: f }); x += c.w + gap; rowH = Math.max(rowH, h);
      });
      const bottom = Math.max(...out.map(o => o.y + frameH(o.w, Math.min(o.m.asp || .75, 1.25), f) / 2));
      if (bottom > 640) { const k = 430 / (bottom - y0); out.forEach(o => { o.w *= k; o.x = 270 + (o.x - 270) * k; o.y = y0 + (o.y - y0) * k; }); }
      text = { x: 270, y: 140, w: 470, align: 'left', top: true, under: Math.min(bottom, 640) + 50 };
    } else if (g === 'scatter') {
      const placed = []; const base = n <= 3 ? 250 : n <= 5 ? 200 : 160;
      media.forEach((m, i) => {
        let best = null;
        for (let k = 0; k < 40; k++) {
          const w = base * rr(rng, .85, 1.15), h = frameH(w, m.asp || .75, fr(i)), x = rr(rng, M0 + w / 2, PW - M0 - w / 2), y = rr(rng, 110 + h / 2, 560 - h / 2 + 40), r = rot();
          const b = box(x, y, w, h, r); const ov = placed.reduce((s, p) => s + inter(b, p), 0) / (b.w * b.h);
          const sc = -Math.abs(ov - .12) - (y - 330) ** 2 / 4e5;
          if (!best || sc > best.sc) best = { sc, x, y, w, r, b };
        }
        placed.push(best.b); out.push({ m, x: best.x, y: best.y, w: best.w, rot: best.r, frame: fr(i) });
      });
      text = { x: 270, y: 640, w: 470, align: 'center', tilt: (rng() - .5) * 8 };
    } else if (g === 'stack') {
      const cx = 255 + (rng() - .5) * 50, cy = 330, w = U.clamp(300 - n * 14, 220, 290);
      media.forEach((m, i) => { const k = i - (n - 1) / 2; out.push({ m, x: cx + k * 34 + (rng() - .5) * 18, y: cy + k * 26 + (rng() - .5) * 14, w, rot: (i % 2 ? 1 : -1) * rr(rng, 3, 4 + tilt), frame: S.frame === 'film' ? 'film' : 'polaroid' }); });
      out.reverse();
      text = { x: 270, y: 640, w: 470, align: rng() < .5 ? 'center' : 'left' };
    } else if (g === 'strip') {
      const w = 210, x = 150 + (rng() - .5) * 20; let y = 70; const f = S.frame === 'film' || S.mood === 'nostalgia' ? 'film' : S.frame;
      const tot = media.reduce((s, m) => s + frameH(w, m.asp || .75, f), 0); const k = Math.min(1, 600 / tot); y = 380 - tot * k / 2;
      media.forEach(m => { const h = frameH(w * k, m.asp || .75, f); out.push({ m, x, y: y + h / 2, w: w * k, rot: f === 'film' ? 0 : rot() * .4, frame: f }); y += h + (f === 'film' ? -1 : 12); });
      text = { x: 402, y: 300, w: 220, align: 'left', side: true };
    } else if (g === 'split') {
      const m0 = media[0], asp = Math.min(m0.asp || .75, .85), h = PW * asp;
      out.push({ m: m0, x: 270, y: h / 2, w: PW + 2, rot: 0, frame: 'none', bleed: 1 });
      media.slice(1).forEach((m, i) => out.push({ m, x: 420 - i * 120, y: h - 10 + i * 30, w: 140, rot: rr(rng, -8, 8), frame: 'polaroid' }));
      text = { x: 270, y: h + 90, w: 470, align: 'left' };
    } else { // typo — страница без фото: слова дня крупно
      text = { x: 270, y: 300, w: 470, align: 'center', big: 1 };
    }
    return { photos: out, text };
  }

  async function buildItems(day, A, S, rng) {
    const items = [], rects = [], inp = day.input || {};
    const add = (it, rect) => { it.id = U.uid(); it.auto = 1; it.page = 0; items.push(it); if (rect) rects.push(rect); return it; };
    const { photos, text } = placePhotos(S, A.media.map((m, i) => Object.assign({ asp: A.infos[i] ? A.infos[i].asp : .75 }, m)), rng);
    const pBox = p => box(p.x, p.y, p.w, frameH(p.w, p.m.asp || .75, p.frame), p.rot);
    // название и подпись: размер подбираем по реальной высоте текста в нужном шрифте
    const title = makeTitle(day, A, S);
    const fk = FONT_K[S.font] || 1, tlen = title.length, tW = text.w;
    let size = Math.round(U.clamp((text.big ? 84 : 66) - tlen * (text.side ? 1.3 : 0.9), text.side ? 26 : 32, text.big ? 84 : 66) * fk);
    if (text.side) size = Math.min(size, 40);
    let capSrc = S.density > -2 ? (A.G && A.G.caption) || caption(inp, A) : '';
    if (capSrc && capSrc.replace(/[.!…\s]+$/, '').toLowerCase() === title.toLowerCase()) capSrc = ''; // короткая запись уже стала названием
    let cs = Math.round(U.clamp(30 - capSrc.length * .06, 20, 28) * (S.hand === 'Amatic SC' ? 1.2 : 1));
    await ensureFont(S.font, size); if (capSrc) await ensureFont(S.hand, cs);
    // вид подписи решаем до подгонки: рваный листок выше обычного текста и должен влезть целиком
    const cr = rng(), torn = !!capSrc && !S.dark && cr < .5 && capSrc.length > 24, mark = !!capSrc && !torn && !S.dark && cr < .72;
    const cw = torn ? Math.min(tW, 400) : tW;
    const capH = () => (capSrc ? textH(capSrc, cs, cw, S.hand, torn) + (torn ? 12 : 0) : 0);
    let tH = textH(title, size, tW, S.font), cH = capH();
    const LIMIT = 690, GAP = 10, CG = torn ? 14 : 4;
    const need = () => tH + (cH ? cH + CG : 0);
    const shrinkText = room => { for (let k = 0; k < 6 && need() > room; k++) { size = Math.round(size * .9); cs = Math.max(17, Math.round(cs * .93)); tH = textH(title, size, tW, S.font); cH = capH(); } };
    // фото ужимаются к верху страницы, если тексту не хватает места
    const scalePhotos = (k, oy) => photos.forEach(p => { if (p.bleed) return; p.x = 270 + (p.x - 270) * k; p.y = oy + (p.y - oy) * k; p.w *= k; });
    const pTop = () => Math.min(...photos.filter(p => !p.bleed).map(p => pBox(p).y), 999), pBot = () => Math.max(...photos.map(p => pBox(p).y + pBox(p).h), 0);
    let ty;
    if (text.big || !photos.length) { shrinkText(420); ty = 330 - need() / 2 + tH / 2; }
    else if (text.side) { shrinkText(520); ty = U.clamp(text.y, 110 + tH / 2, LIMIT - need() + tH / 2); }
    else if (text.top) {
      shrinkText(240); ty = 98 + tH / 2;
      const under = text.under != null; // сетка: подпись под фото, название сверху
      const top = ty + tH / 2 + GAP + 6, bottomRoom = under && cH ? cH + 12 : 0;
      if (pTop() < top) photos.forEach(p => { p.y += top - pTop(); });
      if (pBot() > LIMIT - bottomRoom) { const k = U.clamp((LIMIT - bottomRoom - top) / (pBot() - top), .5, 1); scalePhotos(k, top); }
    } else {
      shrinkText(300);
      if (pBot() + GAP + need() > LIMIT) { const k = U.clamp((LIMIT - GAP - need() - 96) / (pBot() - 96), .55, 1); scalePhotos(k, 96); }
      if (pBot() + GAP + need() > LIMIT) shrinkText(LIMIT - GAP - pBot());
      ty = Math.max(pBot() + GAP + tH / 2, Math.min(text.y, LIMIT - need() + tH / 2));
    }
    photos.forEach((p, i) => {
      const it = Object.assign({}, p.m, { x: p.x, y: p.y, w: p.w, rot: p.rot, frame: p.frame, sc: S.dark ? '#f6f1fb' : '#fff', z: 10 + i, page: 0 });
      delete it.m; items.push(it); rects.push(pBox(p));
    });
    if (photos.length && !S.dark && S.density > -2 && rng() < .7) { const p = photos[0]; if (!p.bleed && p.frame !== 'film') { const h = frameH(p.w, p.m.asp || .75, p.frame); add({ type: 'sticker', name: pickW({ 'tape-k': 2, 'tape-clear': 1.5, tape: 1 }, rng), x: p.x + (rng() - .5) * p.w * .2, y: p.y - h / 2 + 2, w: 118, rot: (rng() - .5) * 16, z: 31, color: null }); } }
    const txAlign = text.align, tx = txAlign === 'left' && !text.side ? M0 + tW / 2 : text.x;
    add({ type: 'text', role: 'title', text: title, font: S.font, size, color: S.ink, x: tx, y: ty, w: tW, rot: text.tilt || (S.E > .6 ? (rng() - .5) * 5 : 0), z: 32, bgs: 'none', align: txAlign }, box(tx, ty, tW, tH));
    let capBottom = ty + tH / 2;
    if (capSrc) {
      const ch = cH;
      let cy = text.top && text.under != null ? Math.min(pBot() + 8 + ch / 2, LIMIT - ch / 2) : ty + tH / 2 + CG + ch / 2;
      const cx = torn ? (txAlign === 'left' ? M0 + cw / 2 : U.clamp(tx + (rng() - .5) * 40, M0 + cw / 2, PW - M0 - cw / 2)) : tx;
      add({ type: 'text', role: 'caption', text: capSrc, font: S.hand, size: cs, color: torn ? '#3a3346' : S.ink, x: cx, y: cy, w: cw, rot: torn ? (rng() - .5) * 4 : 0, z: 33, bgs: torn ? 'torn' : mark ? 'mark' : 'none', mark: mixHex(S.palette[1], '#ffffff', .2), align: torn ? 'left' : txAlign }, box(cx, cy, cw, ch));
      if (torn) add({ type: 'sticker', name: 'clip', x: cx + cw * (rng() < .5 ? -.3 : .3), y: cy - ch / 2 - 4, w: 46, rot: (rng() - .5) * 20, z: 34, color: null });
      capBottom = cy + ch / 2;
    }
    // дата, погода, место, песня
    const split = S.grammar === 'split';
    const dStyle = S.dates[Math.floor(rng() * S.dates.length)];
    // ширина виджета задаёт размер шрифта, а текст не переносится: подбираем w под видимую ширину
    const ds = split ? 'pill' : dStyle;
    const DW = { pill: [136, 290], mini: [210, 262], big: [190, 170], stamp: [190, 150], ticket: [190, 150] }[ds] || [190, 200];
    const [dw, vis] = DW, dx = rng() < .7 || ds === 'pill' || ds === 'mini' ? M0 + vis / 2 : 270, dy = ds === 'big' ? 70 : 58;
    add({ type: 'date', style: ds, x: dx, y: dy, w: dw, rot: S.E > .6 ? (rng() - .5) * 8 : 0, z: 30, color: split || ds === 'pill' || ds === 'ticket' ? '#121212' : S.ink }, box(dx, dy, vis, ds === 'big' ? 90 : 50));
    const season = A.Tx.season && !A.Tx.seasonFromDate ? A.Tx.season : seasonOf(day.date);
    const temp = day.temp != null ? day.temp : Math.round({ winter: -6, spring: 13, summer: 27, autumn: 8 }[season] + A.warmth * 12);
    const wx = PW - M0 - 66, wy = dx + vis / 2 > wx - 70 ? dy + 52 : 60;
    if (S.density >= 0 && dx < 300) add({ type: 'weather', season, temp, x: wx, y: wy, w: 150, rot: S.E > .6 ? 4 : 0, z: 31, color: '#121212', style: 'pill' }, box(wx, wy, 132, 44));
    const foot = [];
    if (day.song) foot.push(['song', [day.song.artist, day.song.title].filter(Boolean).join(' — ') || T('песня дня')]);
    if (inp.place) foot.push(['place', inp.place]);
    let fy = 716, fx = M0;
    foot.forEach(([k, t]) => {
      const w = Math.min(300, 70 + t.length * 8.5);
      const it = k === 'song' ? { type: 'link', song: 1, title: t, url: day.song.link || '', color: S.acc } : { type: 'text', role: 'place', text: '⌖ ' + t, font: 'Onest', size: 17, color: '#121212', bgs: 'pill', align: 'center' };
      const x = fx + w / 2; add(Object.assign(it, { x, y: fy, w, rot: 0, z: 46 }), box(x, fy, w, 44)); fx += w + 10;
    });
    // ответ на вопрос дня — маленькая карточка
    if (inp.prompt && inp.prompt.answer && S.density > -2) {
      const q = PV.lang === 'en' && inp.prompt.en ? inp.prompt.en : inp.prompt.q;
      const t = q + '\n' + inp.prompt.answer, w = 250, size = 17, h = textH(t, size, w, 'Onest', true);
      const spot = freeSpot(rects, w, h, rng, [[400, capBottom + h / 2 + 10], [150, 560], [390, 560], [270, capBottom + h / 2 + 10]]);
      if (spot) add({ type: 'text', role: 'prompt', text: t, font: 'Onest', size, color: '#121212', bgs: 'pill', align: 'left', x: spot[0], y: spot[1], w, rot: (rng() - .5) * 5, z: 34 }, box(spot[0], spot[1], w, h));
    }
    // стикеры: углы фото и свободные места
    const corners = []; photos.forEach(p => { const h = frameH(p.w, p.m.asp || .75, p.frame); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => corners.push([p.x + sx * p.w * .46, p.y + sy * h * .44])); });
    S.stickers.forEach((name, i) => {
      const isTape = /^tape/.test(name), isLbl = /^(label|bubble)/.test(name);
      const w = isTape ? 120 : isLbl ? 130 : rr(rng, S.stSize[0], S.stSize[1]);
      let spot;
      if (isTape && photos.length) { const p = photos[Math.floor(rng() * photos.length)]; const h = frameH(p.w, p.m.asp || .75, p.frame); spot = [p.x + (rng() - .5) * p.w * .3, p.y - h / 2 + 4]; }
      else spot = freeSpot(rects, w, w, rng, rng() < .45 ? corners.sort(() => rng() - .5).slice(0, 4) : null, .35);
      if (!spot) return;
      add({ type: 'sticker', name, x: spot[0], y: spot[1], w, rot: (rng() - .5) * 2 * (isTape ? 12 : 10 + S.tilt), z: 40 + i, color: null }, box(spot[0], spot[1], w * .8, w * .8));
    });
    // «больше деталей»: персонаж и подпись-ярлык
    if (S.density >= 1 && PV.ocSvg) { const s = freeSpot(rects, 96, 110, rng, [[470, 640], [70, 640], [470, 120]]); if (s) add({ type: 'oc', x: s[0], y: s[1], w: 96, rot: (rng() - .5) * 12, z: 45 }); }
    return { items, title, temp, season };
  }
  function freeSpot(rects, w, h, rng, prefer, tol = .08) {
    const cand = (prefer || []).slice();
    for (let i = 0; i < 70; i++) cand.push([rr(rng, M0 + w / 2, PW - M0 - w / 2), rr(rng, 90 + h / 2, PH - 70 - h / 2)]);
    let best = null;
    cand.forEach(([x, y], i) => {
      x = U.clamp(x, M0 + w / 2 - 14, PW - M0 - w / 2 + 14); y = U.clamp(y, 40 + h / 2, PH - 60 - h / 2);
      const b = { x: x - w / 2, y: y - h / 2, w, h }, ov = rects.reduce((s, r) => s + inter(b, r), 0) / (w * h);
      if (ov > tol && !(prefer && i < prefer.length && ov < .5)) return;
      const sc = -ov * 3 + (prefer && i < prefer.length ? .6 : 0) + rng() * .3;
      if (!best || sc > best.sc) best = { sc, x, y };
    });
    return best ? [best.x, best.y] : null;
  }
  function seasonOf(date) { const m = U.parseDate(date).getMonth(); return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; }
  function caption(inp, A) {
    const t = (inp.text || '').trim(); if (!t) return '';
    if (t.length <= 120) return t;
    return A.Tx.caption || t.slice(0, 110) + '…';
  }
  const TITLES = {
    calm: ['Тихий {t}', 'Спокойный {t}', 'Без спешки'], joy: ['Яркий {t}', 'День, который хочется повторить', 'Лучший {t}'],
    nostalgia: ['Как на старой плёнке', 'Тёплые воспоминания', '{T}, который останется'], tender: ['Нежный {t}', 'Что-то особенное', 'Мой тёплый {t}'],
    tired: ['Длинный {t}', 'Выдохнуть', 'Просто пережить {t}'], sad: ['Тихо внутри', 'Неяркий {t}', 'Пусть останется здесь'],
    everyday: ['Обычный {t}', 'Маленькие радости', 'Мой {t}']
  };
  // «Best day of summer with my friends…» → «Best day of summer»: режем перед предлогом или союзом
  const STOP = ['with', 'at', 'and', 'in', 'on', 'to', 'for', 'after', 'before', 'because', 'when', 'и', 'с', 'со', 'в', 'во', 'на', 'до', 'после', 'а', 'но', 'когда', 'потому', 'пока', 'чтобы'];
  function shortPhrase(t) {
    const w = t.replace(/[,;:—–-]+/g, ' , ').split(/\s+/).filter(Boolean); let r = '';
    for (let i = 0; i < w.length; i++) {
      const nx = w[i];
      if (nx === ',') { if (r.length >= 10) break; continue; }
      if (r && (r.length + nx.length + 1 > 32 || (r.length >= 12 && STOP.includes(nx.toLowerCase())))) break;
      r = r ? r + ' ' + nx : nx;
    }
    return r.replace(/\s+(с|в|на|и|а|with|at|and|the|a|my)$/i, '');
  }
  function makeTitle(day, A, S) {
    if (day.title && day.titleLocked) return day.title;
    if (A.G && A.G.title) return A.G.title;
    const t = (day.input && day.input.text || '').trim();
    if (t && t.length <= 30 && !/[.!?…].+/.test(t)) return t.replace(/[.!…]+$/, '');
    if (t && /[а-яё]/i.test(t) && PV.titleFor && A.Tx.words > 3) {
      const lab = { calm: 'calm', joy: 'joy', nostalgia: 'warm', tender: 'warm', tired: 'calm', sad: 'sad', everyday: 'warm' }[S.mood];
      try { const r = PV.titleFor(A.Tx, ['', lab]).title; if (r && r.length < 46) return r; } catch (e) { }
    }
    if (t) { const first = t.split(/[.!?…\n]/)[0].trim(); return first.length <= 34 ? first : shortPhrase(first); }
    const h = +(day.time || '12:00').split(':')[0], tod = h < 5 || h >= 22 ? 'ночь' : h < 11 ? 'утро' : h < 17 ? 'день' : 'вечер';
    const list = TITLES[S.mood] || TITLES.everyday, tpl = list[U.hash(day.id + S.mood + (day.gen ? day.gen.seed : 0)) % list.length];
    // «ночь» женского рода: прилагательные шаблонов согласованы с мужским — для ночи берём нейтральный вариант
    const tpl2 = tod === 'ночь' && /\{t\}/.test(tpl) ? list.find(x => !/\{t\}|\{T\}/.test(x)) || 'Моя ночь' : tpl;
    let r = T(tpl2, { t: T(tod), T: T(tod).charAt(0).toUpperCase() + T(tod).slice(1) });
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  /* ---------- объяснение решений ---------- */
  function explain(A, S) {
    const w = [];
    const src = { chosen: T('вы выбрали настроение «{m}»', { m: T(PV.MOOD_NAMES[S.mood]).toLowerCase() }), own: T('по вашим словам о настроении — «{m}»', { m: T(PV.MOOD_NAMES[S.mood]).toLowerCase() }), text: T('в записи есть слова, похожие на «{m}»', { m: T(PV.MOOD_NAMES[S.mood]).toLowerCase() }), ai: T('Gemini увидел это настроение в вашей записи'), neutral: T('настроение не указано — оформление спокойное, без догадок о чувствах') }[A.moodSrc];
    w.push(`<b>${T('Настроение')}:</b> ${S.mood !== A.mood ? T('вы сменили его на «{m}»', { m: T(PV.MOOD_NAMES[S.mood]).toLowerCase() }) : src}.`);
    if (A.media.length) w.push(`<b>${T('Фото')}:</b> ${T('цвета страницы взяты из ваших снимков')}${A.night ? ', ' + T('снимки тёмные — страница ночная') : ''}.`);
    if (A.hint) w.push(`<b>${T('Цвет дня')}:</b> ${T('из вашего ответа на вопрос дня')}.`);
    if (A.M) w.push(`<b>${T('Песня')}:</b> ${A.M.bpm} BPM, ${A.M.mode === 'minor' ? T('минор') : T('мажор')} → ${S.E > .6 ? T('больше движения и стикеров') : T('спокойная композиция')}.`);
    if (A.themes.length) w.push(`<b>${T('Детали')}:</b> ${T('стикеры под темы дня')} (${A.themes.map(k => T(THEME_RU[k] || k)).join(', ')}).`);
    if (A.V) w.push(`<b>${T('Ваш стиль')}:</b> ${T('учтены цвета, шрифт и интересы из анкеты')}.`);
    w.push(`<b>${T('Композиция')}:</b> ${T(GRAMMAR_RU[S.grammar])}, ${T('шрифт')} ${S.font}.`);
    return w;
  }
  const THEME_RU = { friends: 'друзья', coffee: 'кофе и чай', music: 'музыка', travel: 'дорога', nature: 'природа', study: 'учёба', food: 'еда', rain: 'дождь', snow: 'снег', night: 'ночь', sun: 'солнце', birthday: 'праздник', love: 'любовь', sport: 'спорт' };
  const GRAMMAR_RU = { hero: 'одно главное фото и детали вокруг', grid: 'аккуратная сетка', scatter: 'живой коллаж', stack: 'стопка полароидов', strip: 'плёночная лента', split: 'фото во всю ширину', typo: 'страница из слов' };

  /* ---------- вход ---------- */
  // opts: { seed, density (-2..2), mood, avoid:{bg,font,grammar} }
  PV.generate = async function (day, prof, opts = {}) {
    const A = await analyze(day, prof);
    const seed = opts.seed != null ? opts.seed : U.hash(day.id + Date.now());
    const rng = U.rng(seed);
    const taste = PV.taste ? PV.taste.get(prof) : null;
    const S = style(A, opts, taste, rng);
    const { items, title, temp, season } = await buildItems(day, A, S, rng);
    const keep = day.items.filter(i => !i.auto && i.type !== 'photo' && i.type !== 'video');
    keep.forEach(k => items.push(k));
    return {
      items, bg: S.bg, mood: S.mood, temp, season, title, palette: S.palette, why: explain(A, S),
      beat: A.M ? 60 / A.M.bpm : null,
      gen: { seed, density: S.density, mood: S.mood, moodSrc: A.moodSrc, grammar: S.grammar, bg: S.bg.type, font: S.font, frame: S.frame },
      steps: { photos: A.media.length, palette: (A.palette.slice(0, 4).map(p => U.hex(p.rgb))), words: A.Tx.moodWords.slice(0, 3), themes: A.themes.slice(0, 3), music: A.M ? `${A.M.bpm} BPM` : '', vibe: A.V ? A.V.style : '' }
    };
  };
  PV.genAnalyze = analyze;
})(window.PV);
