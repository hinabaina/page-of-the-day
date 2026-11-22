/* Страница дня — дневник-скрапбук: разворот дня, где всё двигается как в сторис,
   автоподбор фона/цвета/температуры/стикеров по фото, секреты в конвертиках, персонаж, друзья через файл. */
(function (PV) {
  const { U } = PV, $ = U.$, $$ = U.$$;
  const PW = 540, PH = 760;
  const T = (s, v) => PV.T(s, v);
  const FONTS = [['Unbounded', 'Unbounded'], ['Onest', 'Onest'], ['Cormorant Garamond', 'Cormorant'], ['Caveat', 'Caveat'], ['Marck Script', 'Marck'], ['Neucha', 'Neucha'], ['Lobster', 'Lobster'], ['Pacifico', 'Pacifico'], ['Amatic SC', 'Amatic'], ['Comfortaa', 'Comfortaa'], ['Nunito', 'Nunito'], ['Rubik Mono One', 'Rubik'], ['JetBrains Mono', 'Mono']];
  const COLORS = ['#3b2340', '#ffffff', '#ff5c93', '#ff3d6e', '#ff9a4a', '#ffd84d', '#8fd18a', '#4fc3a1', '#7fc4ff', '#5b7cff', '#b79cff', '#c06bff', '#8a6a5a', '#2e2228'];
  const PAPERS = [['pink', 'Розовая'], ['black', 'Чёрная'], ['board', 'Зелёная'], ['rainbow', 'Радужная'], ['grid', 'В клетку'], ['crumpled', 'Мятая'], ['wide', 'Широкая линия'], ['narrow', 'Узкая линия']];
  const TEMPLATES = {
    feel: ['Как я себя чувствовала', ['Одним словом, сегодня я…', 'Что подняло настроение?', 'Что хочется забыть?', 'Чем я горжусь?']],
    weather: ['Какая была погода', ['За окном было…', 'Температура и ощущения', 'Что я надела', 'Запах дня']],
    three: ['Три причины запомнить этот день', ['Первая', 'Вторая', 'Третья']],
    best: ['Лучший момент дня', ['Где это было?', 'Кто был рядом?', 'Что играло в наушниках?']],
    love: ['Маленькие радости', ['Что было вкусного?', 'Кто меня рассмешил?', 'Что я увидела красивого?']]
  };
  const st = { profile: null, days: [], friends: [], cur: null, curFriend: null, ro: false, sel: null, scale: 1, urls: new Map(), mode: 'result', draft: null };
  const toast = (m, ms = 2600) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, ms); };

  /* ---------- хранилище ---------- */
  const DB = (() => {
    let p = null, mem = null;
    const open = () => p || (p = new Promise(res => { try { const r = indexedDB.open('poslevkusie-diary', 1); r.onupgradeneeded = () => ['days', 'friends', 'meta'].forEach(n => r.result.objectStoreNames.contains(n) || r.result.createObjectStore(n)); r.onsuccess = () => res(r.result); r.onerror = () => { mem = {}; res(null); }; } catch (e) { mem = {}; res(null); } }));
    const tx = async (s, mode, fn) => { const db = await open(); if (!db) { mem[s] = mem[s] || new Map(); return fn(null, mem[s]); } return new Promise((res, rej) => { const t = db.transaction(s, mode), o = t.objectStore(s); const r = fn(o); t.oncomplete = () => res(r && 'result' in r ? r.result : undefined); t.onerror = () => rej(t.error); }); };
    return {
      all: s => tx(s, 'readonly', (o, m) => m ? [...m.values()] : o.getAll()),
      get: (s, k) => tx(s, 'readonly', (o, m) => m ? m.get(k) : o.get(k)),
      put: (s, k, v) => tx(s, 'readwrite', (o, m) => m ? m.set(k, v) : o.put(v, k)),
      del: (s, k) => tx(s, 'readwrite', (o, m) => m ? m.delete(k) : o.delete(k)),
      get mem() { return !!mem; }
    };
  })();

  const url = (blobs, key) => { if (!blobs || !blobs[key]) return ''; const id = blobs[key]; if (!st.urls.has(id)) st.urls.set(id, URL.createObjectURL(id)); return st.urls.get(id); };
  const svgUrl = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  /* ---------- фоны ---------- */
  const pastel = (rgb, l = .92, sMin = .35) => { const [h, s] = U.rgb2hsl(...rgb); return U.hex(U.hsl2rgb(h, U.clamp(Math.max(s, sMin), 0, .75), l)); };
  function bgCss(bg) {
    const { type, c1 = '#fff3f7', c2 = '#ffb3cf' } = bg || {};
    const heart = c => `url("${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><path d='M30 44C18 36 13 30 14 23c1-5 7-8 11-5 2 1 4 3 5 5 1-2 3-4 5-5 4-3 10 0 11 5 1 7-4 13-16 21z' fill='${c}' opacity='.55'/></svg>`)}")`;
    const star = c => `url("${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><path d='M20 10l2 6 6 1-5 4 2 6-5-4-5 4 2-6-5-4 6-1z' fill='${c}'/><circle cx='65' cy='55' r='1.6' fill='${c}'/><circle cx='40' cy='75' r='1' fill='${c}'/><circle cx='80' cy='20' r='1.2' fill='${c}'/></svg>`)}")`;
    switch (type) {
      case 'grid': return `linear-gradient(${c2}66 1px,transparent 1px) 0 0/26px 26px,linear-gradient(90deg,${c2}66 1px,transparent 1px) 0 0/26px 26px,${c1}`;
      case 'dots': return `radial-gradient(${c2} 3px,transparent 3.5px) 0 0/30px 30px,radial-gradient(${c2}88 3px,transparent 3.5px) 15px 15px/30px 30px,${c1}`;
      case 'lined': return `linear-gradient(90deg,transparent 58px,#ff8fab 58px 60px,transparent 60px),repeating-linear-gradient(transparent 0 31px,${c2}99 31px 32px),${c1}`;
      case 'gingham': return `repeating-linear-gradient(0deg,${c2}55 0 22px,transparent 22px 44px),repeating-linear-gradient(90deg,${c2}55 0 22px,transparent 22px 44px),${c1}`;
      case 'gradient': return `radial-gradient(80% 60% at 20% 10%,#ffffffaa,transparent 60%),linear-gradient(165deg,${c1},${c2})`;
      case 'rainbow': return `radial-gradient(70% 50% at 50% 0%,#ffffffcc,transparent 70%),linear-gradient(170deg,#ffd1e3,#ffe7c7 25%,#fff7c2 45%,#d6f5d6 62%,#d3e9ff 80%,#e6dbff)`;
      case 'hearts': return `${heart(c2)} 0 0/60px 60px,${c1}`;
      case 'stars': return `${star(c2)} 0 0/90px 90px,radial-gradient(90% 60% at 50% 0%,#ffffff22,transparent 70%),${c1}`;
      case 'dotgrid': return `radial-gradient(${c2} 1.3px,transparent 1.8px) 0 0/22px 22px,${c1}`;
      case 'mesh': return `radial-gradient(60% 50% at 15% 15%,${bg.c3 || c2},transparent 70%),radial-gradient(55% 45% at 85% 30%,${bg.c4 || c2}cc,transparent 70%),radial-gradient(70% 55% at 50% 100%,${c2}bb,transparent 70%),${c1}`;
      case 'kraft': return `url("${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/><feColorMatrix values='0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .1  0 0 0 .25 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}"),#d9c29c`;
      case 'grain': return `url("${svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .07 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}"),radial-gradient(80% 60% at 30% 0%,#ffffff80,transparent 70%),${c1}`;
      case 'holo': return `linear-gradient(120deg,#ffffff00 30%,#ffffffaa 45%,#ffffff00 60%),linear-gradient(135deg,#e5eeff,#fbe1ff 30%,#dffcf1 60%,#fff3d1)`;
      case 'crumpled': return `linear-gradient(115deg,#0000 40%,#00000010 41%,#0000 47%),linear-gradient(35deg,#0000 55%,#ffffff60 56%,#0000 63%),linear-gradient(160deg,#0000 20%,#0000000c 21%,#0000 30%),linear-gradient(75deg,#0000 70%,#ffffff55 71%,#0000 78%),radial-gradient(circle at 30% 30%,#ffffff70,transparent 50%),${c1}`;
      default: return `radial-gradient(70% 50% at 30% 10%,#ffffff90,transparent 70%),${c1}`;
    }
  }
  const BG_TYPES = [['mesh', 'Mesh из фото'], ['grain', 'Зерно'], ['dotgrid', 'Точки'], ['grid', 'Тетрадь'], ['lined', 'Линейка'], ['kraft', 'Крафт'], ['paper', 'Бумага'], ['gradient', 'Градиент'], ['holo', 'Голограмма'], ['gingham', 'Клетка'], ['dots', 'Горошек'], ['hearts', 'Сердечки'], ['rainbow', 'Радуга'], ['crumpled', 'Мятая'], ['stars', 'Ночь']];

  function setAccent(pal) {
    const r = document.documentElement.style;
    if (!pal || !pal.length) { const v = vibe(); if (v) { const cs = (VCOLORS[v.colors] || VCOLORS.warm)[1]; r.setProperty('--acc', cs[0]); r.setProperty('--acc2', cs[1]); } else { r.removeProperty('--acc'); r.removeProperty('--acc2'); } return; }
    const cs = pal.map(hexRgb).map(c => U.rgb2hsl(...c)).sort((a, b) => b[1] - a[1]);
    r.setProperty('--acc', U.hex(U.hsl2rgb(cs[0][0], U.clamp(cs[0][1], .55, .85), .55)));
    r.setProperty('--acc2', U.hex(U.hsl2rgb((cs[1] || cs[0])[0] + 35, .55, .6)));
  }
  /* ---------- вайб пользователя: тест после регистрации ---------- */
  const VIBES = {
    minimal: { name: 'Минимализм', desc: 'чисто, воздух, строгий шрифт', bg: ['dotgrid', 'grid'], font: 'Onest', st: ['asterisk', 'arrow', 'star-line', 'label:mood'], acc: ['#121212', '#8a8f98'] },
    cozy: { name: 'Уют', desc: 'крафт, тёплый свет, какао', bg: ['kraft', 'paper'], font: 'Caveat', st: ['cup', 'leaf', 'heart-line', 'tape-k'], acc: ['#c4563f', '#d9a441'] },
    night: { name: 'Ночь', desc: 'тёмное, звёзды, плёнка', bg: ['stars', 'grain'], font: 'Marck Script', st: ['moon', 'sparkle', 'film', 'star-line'], acc: ['#8b7fd1', '#4b6fd8'], dark: 1 },
    pop: { name: 'Яркий поп', desc: 'цвет, стикеры, энергия', bg: ['mesh', 'dots'], font: 'Rubik Mono One', st: ['flash', 'cherry', 'smile', 'bubble:вау!'], acc: ['#ff3d6e', '#ffb300'] },
    retro: { name: 'Ретро', desc: 'плёнка, полароид, зерно', bg: ['grain', 'kraft'], font: 'Lobster', st: ['film', 'camera', 'tape', 'label:2026'], acc: ['#d9a441', '#6c7a5b'] },
    soft: { name: 'Нежный', desc: 'пастель, бантики, облака', bg: ['mesh', 'gingham'], font: 'Marck Script', st: ['bow', 'cloud', 'butterfly', 'hearts'], acc: ['#e06a9a', '#b79cff'] }
  };
  const VCOLORS = { warm: ['Тёплые', ['#c4563f', '#d9a441', '#e8a07a']], cool: ['Холодные', ['#3b6fd8', '#4fb3a5', '#8fb6e8']], pastel: ['Пастель', ['#f2a7c3', '#c9b2ff', '#a8e0d1']], mono: ['Чёрно-белые', ['#121212', '#8a8f98', '#e8e2d6']], neon: ['Яркие', ['#ff3d6e', '#00c2a8', '#ffb300']], earth: ['Природные', ['#6c7a5b', '#a8865b', '#d9c29c']] };
  PV.VCOLORS_HEX = Object.fromEntries(Object.entries(VCOLORS).map(([k, v]) => [k, v[1]]));
  const VFONTS = { Caveat: 'От руки', Onest: 'Аккуратно', 'Marck Script': 'Красиво', Unbounded: 'Громко', Lobster: 'С характером' };
  const VINTEREST = { study: ['Учёба', ['clip', 'pin', 'label:не забыть']], friends: ['Друзья', ['hearts', 'bubble:люблю', 'smile']], music: ['Музыка', ['note', 'label:mood', 'sparkle']], sport: ['Спорт', ['flash', 'star', 'asterisk']], travel: ['Поездки', ['camera', 'film', 'arrow']], food: ['Кофе и еда', ['cup', 'strawberry', 'cherry']], nature: ['Природа', ['leaf', 'daisy', 'sun']], art: ['Творчество', ['scribble', 'sparkle', 'star-line']] };
  const VMUSIC = {
    pop: ['Поп', [['Dua Lipa — Levitating', 'Dua Lipa Levitating'], ['Harry Styles — As It Was', 'Harry Styles As It Was'], ['Монеточка — Каждый раз', 'Монеточка Каждый раз'], ['JONY — Комета', 'JONY Комета']]],
    rap: ['Рэп и фонк', [['Miyagi & Эндшпиль — I Got Love', 'Miyagi Эндшпиль I Got Love'], ['Скриптонит — Это любовь', 'Скриптонит Это любовь'], ['Kordhell — Murder In My Mind', 'Kordhell Murder In My Mind'], ['Macan — ASPHALT 8', 'Macan ASPHALT 8']]],
    rock: ['Рок и инди', [['Arctic Monkeys — 505', 'Arctic Monkeys 505'], ['Три дня дождя — Демоны', 'Три дня дождя Демоны'], ['Кино — Группа крови', 'Кино Группа крови'], ['Tame Impala — The Less I Know the Better', 'Tame Impala The Less I Know the Better']]],
    electro: ['Электроника', [['Daft Punk — Get Lucky', 'Daft Punk Get Lucky'], ['Kavinsky — Nightcall', 'Kavinsky Nightcall'], ['Justice — D.A.N.C.E.', 'Justice DANCE'], ['Moderat — A New Error', 'Moderat A New Error']]],
    lofi: ['Lo-fi и спокойное', [['Joji — Glimpse of Us', 'Joji Glimpse of Us'], ['Ludovico Einaudi — Nuvole Bianche', 'Ludovico Einaudi Nuvole Bianche'], ['Billie Eilish — ocean eyes', 'Billie Eilish ocean eyes'], ['Lana Del Rey — Young and Beautiful', 'Lana Del Rey Young and Beautiful']]],
    ru: ['Русская классика', [['Кино — Звезда по имени Солнце', 'Кино Звезда по имени Солнце'], ['Земфира — Хочешь?', 'Земфира Хочешь'], ['Сплин — Выхода нет', 'Сплин Выхода нет'], ['Звери — Районы-кварталы', 'Звери Районы-кварталы']]]
  };
  const vibe = () => st.profile && st.profile.vibe;
  const vibeStickers = () => { const v = vibe(); if (!v) return []; return [...new Set([...(VIBES[v.style] || VIBES.minimal).st, ...(v.interests || []).flatMap(k => (VINTEREST[k] || [, []])[1])])]; };
  function applyVibe() {
    const v = vibe(); document.body.dataset.vibe = v ? v.style : '';
    if (v) { const cs = (VCOLORS[v.colors] || VCOLORS.warm)[1]; const r = document.documentElement.style; r.setProperty('--vacc', cs[0]); r.setProperty('--vacc2', cs[1]); }
  }
  function vibeQuiz(onDone, first) {
    const v = Object.assign({ style: '', colors: '', font: '', interests: [], music: '' }, vibe() || {});
    const box = $('#modal-box'); $('#modal').hidden = false; let step = 0;
    const Q = [
      [T('Какой у тебя вайб?'), T('Под него я буду собирать главную и твои страницы'), 'style'],
      [T('Какие цвета тебе ближе?'), T('Ими будет подсвечен интерфейс, пока день не принесёт свои'), 'colors'],
      [T('Как ты пишешь?'), T('Этим шрифтом будут подписаны твои дни'), 'font'],
      [T('Что чаще бывает в твоих днях?'), T('Можно выбрать несколько — под это подберу стикеры'), 'interests'],
      [T('Какую музыку слушаешь?'), T('Песни дня буду предлагать в твоём жанре'), 'music']
    ];
    const card = (k, inner, on, attr) => `<button type="button" class="vq${on ? ' on' : ''}" ${attr}="${k}">${inner}</button>`;
    const draw = () => {
      const [title, sub, key] = Q[step];
      let body = '';
      if (key === 'style') body = `<div class="vq-grid">${Object.entries(VIBES).map(([k, x]) => card(k, `<span class="vq-prev" style="background:${bgCss({ type: x.bg[0], c1: x.dark ? '#1d1a33' : '#f6f1ea', c2: x.dark ? '#fff3b0' : x.acc[1] + '88', c3: x.acc[0] + '55', c4: x.acc[1] + '55' })}">${x.st.slice(0, 2).map(n => `<i>${PV.stickerSvg(n)}</i>`).join('')}</span><b>${T(x.name)}</b><small>${T(x.desc)}</small>`, v.style === k, 'data-vs')).join('')}</div>`;
      if (key === 'colors') body = `<div class="vq-grid">${Object.entries(VCOLORS).map(([k, [n, cs]]) => card(k, `<span class="vq-dots">${cs.map(c => `<i style="background:${c}"></i>`).join('')}</span><b>${T(n)}</b>`, v.colors === k, 'data-vc')).join('')}</div>`;
      if (key === 'font') body = `<div class="vq-grid">${Object.entries(VFONTS).map(([k, n]) => card(k, `<span class="vq-font" style="font-family:'${k}'">${T('мой день')}</span><b>${T(n)}</b>`, v.font === k, 'data-vf')).join('')}</div>`;
      if (key === 'interests') body = `<div class="vq-grid four">${Object.entries(VINTEREST).map(([k, [n, sts]]) => card(k, `<span class="vq-ic">${PV.stickerSvg(sts[0])}</span><b>${T(n)}</b>`, v.interests.includes(k), 'data-vi')).join('')}</div>`;
      if (key === 'music') body = `<div class="vq-grid">${Object.entries(VMUSIC).map(([k, [n, songs]]) => card(k, `<b>${T(n)}</b><small>${U.esc(songs[0][0])}</small>`, v.music === k, 'data-vm')).join('')}</div>`;
      const ok = key === 'interests' ? v.interests.length > 0 : !!v[key];
      box.innerHTML = `<div class="vq-top">${first ? `<p class="pill">${T('шаг 3 из 3 · твой вайб')}</p>` : `<p class="pill">${T('твой вайб')}</p>`}<div class="vq-prog">${Q.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div></div>
        <h2>${title}</h2><p class="sub" style="margin:6px 0 18px">${sub}</p>${body}
        <div class="row vq-nav">${step ? `<button class="btn ghost" type="button" id="vq-back">${T('← Назад')}</button>` : first ? '' : `<button class="btn ghost" type="button" id="vq-skip">${T('Отмена')}</button>`}<button class="btn pink big" type="button" id="vq-next" ${ok ? '' : 'disabled'}>${step === Q.length - 1 ? T('Готово ✦') : T('Дальше →')}</button></div>`;
      const pick = (sel, k) => $$(sel, box).forEach(b => b.onclick = () => { v[k] = b.dataset[Object.keys(b.dataset)[0]]; if (k === 'style' && !v.font) v.font = VIBES[v.style].font; draw(); });
      pick('[data-vs]', 'style'); pick('[data-vc]', 'colors'); pick('[data-vf]', 'font'); pick('[data-vm]', 'music');
      $$('[data-vi]', box).forEach(b => b.onclick = () => { const k = b.dataset.vi, i = v.interests.indexOf(k); i >= 0 ? v.interests.splice(i, 1) : v.interests.push(k); draw(); });
      const bk = $('#vq-back', box); if (bk) bk.onclick = () => { step--; draw(); };
      const sk = $('#vq-skip', box); if (sk) sk.onclick = () => $('#modal').hidden = true;
      $('#vq-next', box).onclick = () => { if (step < Q.length - 1) { step++; draw(); } else onDone(v); };
    };
    draw();
  }
  async function saveVibe(v) { st.profile.vibe = v; await DB.put('meta', 'profile', st.profile); applyVibe(); }
  function vibeSummary() {
    const v = vibe(); if (!v) return '';
    const vs = VIBES[v.style] || VIBES.minimal;
    return `<div class="vibe-row"><span class="vb-main">${T(vs.name)}</span><span class="vq-dots small">${(VCOLORS[v.colors] || VCOLORS.warm)[1].map(c => `<i style="background:${c}"></i>`).join('')}</span><span style="font-family:'${v.font}'">${T(VFONTS[v.font] || '')}</span>${(v.interests || []).slice(0, 3).map(k => `<span>${T(VINTEREST[k][0])}</span>`).join('')}<span>${T((VMUSIC[v.music] || ['', []])[0])}</span><button type="button" class="vb-edit" id="vibe-edit">${T('изменить')}</button></div>`;
  }

  /* ---------- погода и музыка дня ---------- */
  function seasonOf(date) { const m = U.parseDate(date).getMonth(); return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; }
  const SEASON_RU = { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' };
  const SEASON_T = { winter: -6, spring: 13, summer: 27, autumn: 8 };
  async function analyzePhoto(blob) { const im = await U.blobToImage(blob); const a = PV.analyzeImages([im]); const asp = im.naturalHeight / im.naturalWidth; URL.revokeObjectURL(im.src); return { a, asp }; }
  // музыка дня: по файлу (аудиоанализ) или по описанию/артисту
  function musicOf(day) {
    const sg = day.song; if (!sg) return null;
    if (sg.music) return sg.music;
    if (sg.artist || sg.genre) return PV.describeMusic({ artist: sg.artist, genre: sg.genre, year: sg.year, mode: sg.mode, tempo: sg.tempo });
    return null;
  }

  /* ---------- AI-генерация страницы (движок — js/generate.js) ---------- */
  let aiCfg = {};
  async function generateDay(d, opts = {}) {
    if (aiCfg.key && opts.ai !== false && !d.ai) {
      try { d.ai = await PV.gemini.analyze(d, aiCfg); delete d.aiError; } catch (e) { console.warn('Gemini', e); d.aiError = String(e.message || e); }
    }
    const g = await PV.generate(d, st.profile, opts);
    Object.assign(d, { items: g.items, bg: g.bg, mood: g.mood, temp: g.temp, palette: g.palette, why: g.why, beat: g.beat, gen: g.gen });
    if (!d.titleLocked) d.title = g.title;
    return g;
  }
  // кнопки под страницей: другой вариант, минималистичнее, больше деталей, настроение
  async function aiAct(kind, mood) {
    const d = st.cur; if (!d || st.ro) return;
    const g0 = d.gen || { density: PV.taste.density(st.profile) };
    const opts = { density: g0.density || 0, mood: g0.mood, seed: g0.seed };
    if (kind === 'regen') { opts.seed = U.hash(d.id + Date.now()); opts.avoid = { grammar: g0.grammar, bg: g0.bg, font: g0.font }; if (g0.bg) { PV.taste.bump(st.profile, 'bg:' + g0.bg, -.12); PV.taste.bump(st.profile, 'font:' + g0.font, -.12); } }
    if (kind === 'less') { if (opts.density <= -2) return toast(T('Это уже самый минималистичный вариант'), 1800); opts.density--; PV.taste.bump(st.profile, 'density', -.3); }
    if (kind === 'more') { if (opts.density >= 2) return toast(T('Деталей уже максимум'), 1800); opts.density++; PV.taste.bump(st.profile, 'density', .3); }
    if (kind === 'mood') { opts.mood = mood; opts.seed = U.hash(d.id + mood + Date.now()); }
    const b = $(`[data-ai="${kind}"]`); if (b) b.classList.add('busy');
    try { await generateDay(d, opts); } finally { if (b) b.classList.remove('busy'); }
    st.sel = null; st.dirty = true; $('#ed-title').value = d.title || ''; setAccent(d.palette); renderSpread(); commit(); syncAi();
  }
  function syncAi() {
    const d = st.cur; if (!d) return;
    const m = (d.gen && d.gen.mood) || d.mood || 'everyday', den = d.gen ? d.gen.density || 0 : 0;
    $('#ai-mood').innerHTML = `<i style="background:${PV.MOOD_COLORS[m] || '#ccc'}"></i>${T('Настроение')}: ${T(PV.MOOD_NAMES[m] || 'Обычный день').toLowerCase()} ▾`;
    $('[data-ai=less]').disabled = den <= -2; $('[data-ai=more]').disabled = den >= 2;
    const src = d.gen ? { chosen: T('настроение выбрано вами'), own: T('настроение — по вашим словам'), text: T('настроение — из вашей записи'), ai: T('настроение заметил Gemini в записи'), neutral: T('настроение не указано — без догадок') }[d.gen.moodSrc] : '';
    $('#why-line').innerHTML = d.gen ? `${U.esc(src || '')}${d.aiError ? ' · ' + T('Gemini недоступен, собрано встроенным движком') : d.ai ? ' · ' + T('с анализом Gemini') : ''} · <button type="button" id="why-open">${T('Почему так?')}</button>` : '';
    const wo = $('#why-open'); if (wo) wo.onclick = () => showWhy(d);
    $('#why-list').innerHTML = (d.why || []).map(w => `<li>${w}</li>`).join('');
  }
  function sheetMood() {
    const cur = st.cur.gen ? st.cur.gen.mood : st.cur.mood;
    sheet(T('Настроение страницы'), `<p class="note">${T('Страница пересоберётся в другой атмосфере. Фото, текст и твои записки останутся.')}</p><div class="moods">${PV.MOOD_KEYS.map(k => `<button type="button" data-m="${k}" class="${k === cur ? 'on' : ''}"><i style="background:${PV.MOOD_COLORS[k]}"></i>${T(PV.MOOD_NAMES[k])}</button>`).join('')}</div>`,
      r => r.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { closeSheet(); aiAct('mood', b.dataset.m); }));
  }
  function setMode(m) { st.mode = m; document.body.classList.toggle('mode-edit', m === 'edit'); if (m !== 'edit') select(null); syncBars(); fit(); }

  /* ---------- отрисовка элементов (DOM) ---------- */
  const linkColor = u => /youtu/.test(u) ? '#ff3d3d' : /spotify/.test(u) ? '#1db954' : /yandex/.test(u) ? '#ffcc00' : /soundcloud/.test(u) ? '#ff7700' : '#ff5c93';
  function fmtDateWidget(it, day) {
    const d = U.parseDate(day.date), wd = [T('воскресенье'), T('понедельник'), T('вторник'), T('среда'), T('четверг'), T('пятница'), T('суббота')][d.getDay()];
    const tm = day.time || '';
    switch (it.style) {
      case 'big': return `<b>${d.getDate()}</b>${U.MONTHS[d.getMonth()]}${tm ? ' · ' + tm : ''}`;
      case 'ticket': return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}${tm ? '<br>' + tm : ''}`;
      case 'mini': return `${wd} · ${d.getDate()} ${U.MONTHS[d.getMonth()]}${tm ? ' · ' + tm : ''}`;
      case 'stamp': return `${d.getDate()} ${U.MONTHS[d.getMonth()]}<br><small>${wd}${tm ? ', ' + tm : ''}</small>`;
      default: return `${d.getDate()} ${U.MONTHS[d.getMonth()]} · ${wd}${tm ? ' · ' + tm : ''}`;
    }
  }
  const seasonIc = { winter: '❄', spring: '✿', summer: '☀', autumn: '🍂' };
  function inner(it, day, blobs) {
    const prof = it.ocOf || st.profile && st.profile.oc;
    switch (it.type) {
      case 'photo': return `<div class="ph fr-${it.frame || 'none'}" style="--sc:${it.sc || '#fff'}"><img src="${url(blobs, it.key)}" alt=""></div>`;
      case 'video': return `<div class="ph fr-${it.frame || 'none'}" style="--sc:${it.sc || '#fff'}"><video src="${url(blobs, it.key)}" muted loop autoplay playsinline></video></div>`;
      case 'sticker': return `<div class="st">${PV.stickerSvg(it.name, it.color)}</div>`;
      case 'oc': return PV.ocSvg(prof);
      case 'text': return `<div class="tx${it.bgs === 'pill' ? ' bg-pill' : ''}" style="font-family:'${it.font}';font-size:${it.size}px;color:${it.color};text-align:${it.align || 'center'};${it.bgs === 'pill' ? 'background:#fff;' : it.bgs === 'mark' ? `background:linear-gradient(transparent 55%,${it.mark || '#ffd1e3'} 55%);` : ''}">${U.esc(it.text)}</div>`;
      case 'date': return `<div class="wd wd-${it.style}" style="color:${it.color};font-size:${Math.round(it.w / (it.style === 'mini' ? 15 : it.style === 'big' ? 12 : 9))}px">${fmtDateWidget(it, day)}</div>`;
      case 'weather': return `<div class="wd wd-${it.style || 'pill'}" style="color:${it.color};font-size:${Math.round(it.w / 8)}px">${seasonIc[it.season] || '☁'} ${T(SEASON_RU[it.season] || '')} · ${it.temp > 0 ? '+' : ''}${it.temp}°</div>`;
      case 'link': return it.url ? `<a class="lk" href="${U.esc(it.url)}" target="_blank" rel="noopener" style="font-size:${Math.round(it.w / 20)}px"><i style="background:${linkColor(it.url)}">${it.song || /youtu|spotify|yandex|soundcloud|music/.test(it.url) ? '♪' : '↗'}</i>${U.esc(it.title || it.url)}</a>` : `<span class="lk" style="font-size:${Math.round(it.w / 20)}px"><i style="background:#ff3d6e">♪</i>${U.esc(it.title || T('песня дня'))}</span>`;
      case 'template': { const t = TEMPLATES[it.tpl]; return `<div class="tpl" style="font-size:${Math.round(it.w / 18)}px;background:${it.color || '#fff'}"><h4>${T(t[0])}</h4>${t[1].map((q, i) => `<p>${T(q)}</p><span class="ans" data-i="${i}">${U.esc((it.ans || [])[i] || '')}</span>`).join('')}</div>`; }
      case 'secret': return `<div class="secret">${PV.stickerSvg(it.kind === 'gift' ? 'gift' : 'envelope', it.color)}<span class="tag">${it.from ? T('от') + ' ' + U.esc(it.from) : it.kind === 'gift' ? T('открой меня') : T('секрет')}${it.voice ? ' · 🎙' : ''}</span></div>`;
    }
    return '';
  }
  function place(el, it) { el.style.width = it.w + 'px'; el.style.transform = `translate(${it.x}px,${it.y}px) translate(-50%,-50%) rotate(${it.rot || 0}deg)`; el.style.zIndex = it.z || 1; }
  function itemEl(it, day, blobs) {
    const el = document.createElement('div'); el.className = 'it' + (st.sel === it.id ? ' sel' : ''); el.dataset.id = it.id;
    el.innerHTML = inner(it, day, blobs) + (st.ro || it.lock ? '' : `<span class="h dl" title="${T('Удалить')}">✕</span><span class="h rs" title="${T('Размер и поворот')}">⤡</span>`);
    place(el, it);
    const v = el.querySelector('video'); if (v) v.addEventListener('timeupdate', () => { if (v.currentTime > 5) v.currentTime = 0; });
    return el;
  }

  /* ---------- история (отменить) ---------- */
  const snap = () => JSON.stringify({ items: st.cur.items, bg: st.cur.bg, bg2: st.cur.bg2, pages: st.cur.pages });
  function commit() { if (!st.cur || st.ro) return; const s0 = snap(); if (st.hist[st.hist.length - 1] !== s0) { st.hist.push(s0); if (st.hist.length > 60) st.hist.shift(); } }
  let commitT = 0; const commitSoon = () => { clearTimeout(commitT); commitT = setTimeout(commit, 500); };
  function undo() { if (st.hist.length < 2) return toast(T('Отменять больше нечего'), 1400); st.hist.pop(); const o = JSON.parse(st.hist[st.hist.length - 1]); Object.assign(st.cur, o); st.sel = null; st.dirty = true; renderSpread(); }
  /* ---------- редактор ---------- */
  function fit() {
    const d = st.cur; if (!d) return;
    const two = d.pages === 2, wrap = $('#ed-wrap'), sp = $('#spread');
    const aw = wrap.clientWidth - 8, ah = Math.max(360, innerHeight - (st.mode === 'edit' || st.ro ? 250 : innerWidth >= 1100 ? 200 : innerWidth < 760 ? 300 : 330));
    st.col = two && aw < 760; sp.classList.toggle('col', st.col);
    st.scale = st.col ? Math.min(aw / PW, 1) : Math.min(aw / (PW * (two ? 2 : 1)), ah / PH, 1.25);
    sp.style.transform = `scale(${st.scale})`; wrap.style.height = PH * st.scale * (st.col ? 2 : 1) + 24 + 'px';
  }
  function renderSpread() {
    const d = st.cur, blobs = d.blobs, sp = $('#spread');
    sp.className = 'spread' + (d.pages === 2 ? ' two' : '');
    sp.innerHTML = '';
    for (let p = 0; p < d.pages; p++) {
      const pg = document.createElement('div'); pg.className = 'pg'; pg.dataset.page = p;
      const bg = p === 1 && d.bg2 ? d.bg2 : d.bg; pg.style.background = bgCss(bg);
      if (p === 0) pg.innerHTML = `<button class="notes-ic${d.notes && d.notes.text ? ' has' : ''}" type="button" title="${T('Заметки дня')}" aria-label="${T('Заметки дня')}"><svg viewBox="0 0 24 24"><path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"/></svg></button>`;
      pg.insertAdjacentHTML('beforeend', '<i class="guide v"></i><i class="guide h"></i>');
      if (p === 1 && !d.items.some(i => i.page === 1)) pg.insertAdjacentHTML('beforeend', `<p class="pg-hint">${T('Вторая страница ♡')}<br>${T('нажми сюда, а потом добавляй фото, стикеры и текст — или перетащи их с первой страницы')}</p>`);
      if (st.cur.pages === 2 && (st.page || 0) === p) pg.classList.add('act');
      if (p === 1 && d.bg2owner) pg.insertAdjacentHTML('beforeend', `<span class="owner">${T('страница')}: ${U.esc(d.bg2owner)}</span>`);
      if (p === 0 && !d.items.length && !st.ro) pg.insertAdjacentHTML('beforeend', `<div class="empty-pg"><div class="ep-ic"><svg><use href="#i-photo"/></svg></div><b>${T('С чего начался этот день?')}</b><p>${T('Добавь одно фото — фон, цвет, температура, стикеры и песня подберутся сами')}</p><button class="btn pink" type="button" data-ep="photo">${T('Выбрать фото')}</button><span>${T('или перетащи фото сюда')}</span></div>`);
      d.items.filter(i => (i.page || 0) === p).sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(it => pg.appendChild(itemEl(it, d, blobs)));
      sp.appendChild(pg);
    }
    $$('.seg button').forEach(b => b.classList.toggle('on', +b.dataset.pages === d.pages));
    syncBars(); fit();
  }
  const curItem = () => st.cur && st.cur.items.find(i => i.id === st.sel);
  function syncBars() {
    const it = curItem();
    $('#tools').hidden = !!it || st.ro; $('#itbar').hidden = !it || st.ro;
    if (it) {
      const t = it.type;
      $('[data-it=edit]').hidden = !['text', 'link', 'template', 'secret', 'weather', 'date'].includes(t);
      $('[data-it=frame]').hidden = !['photo', 'video'].includes(t);
      $('[data-it=color]').hidden = ['photo', 'video', 'oc'].includes(t);
    }
    if (st.ro) $('#tools').hidden = true;
  }
  function select(id) { if (id && st.mode !== 'edit' && !st.ro) setMode('edit'); st.sel = id; $$('.it').forEach(e => e.classList.toggle('sel', e.dataset.id === id)); syncBars(); }
  const maxZ = () => Math.max(0, ...st.cur.items.map(i => i.z || 0));
  function addItem(it) { setTimeout(commit, 0); it.id = it.id || U.uid(); if (it.page == null) it.page = visiblePage(); it.z = it.z || maxZ() + 1; st.cur.items.push(it); st.dirty = true; renderSpread(); select(it.id); return it; }
  function updateEl(it) { const el = $(`.it[data-id="${it.id}"]`); if (!el) return renderSpread(); const sel = el.classList.contains('sel'); const n = itemEl(it, st.cur, st.cur.blobs); if (sel) n.classList.add('sel'); el.replaceWith(n); st.dirty = true; commitSoon(); }

  // жесты: перетаскивание, растяжение-поворот угловой ручкой, щипок двумя пальцами
  function initGestures() {
    const sp = $('#spread'); const ptrs = new Map(); let g = null;
    const toPage = (e, pgEl) => { const r = pgEl.getBoundingClientRect(); return { x: (e.clientX - r.left) / st.scale, y: (e.clientY - r.top) / st.scale }; };
    sp.addEventListener('pointerdown', e => {
      if (e.target.closest('.notes-ic')) return openNotes();
      if (e.target.closest('[data-ep]')) { e.preventDefault(); return sheetPhoto(); }
      const el = e.target.closest('.it');
      if (!el) { if (!st.ro) { select(null); const pgc = e.target.closest('.pg'); if (pgc) { st.page = +pgc.dataset.page; $$('.pg').forEach(x => x.classList.toggle('act', x === pgc)); } } return; }
      const it = st.cur.items.find(i => i.id === el.dataset.id); if (!it) return;
      if (st.ro || it.lock) { if (it.type === 'secret') openSecret(it); return; }
      if (e.target.closest('[contenteditable=true]')) return;
      if (e.target.closest('.dl')) { e.preventDefault(); removeItem(it.id); return; }
      e.preventDefault();
      const wasSel = st.sel === it.id; select(it.id);
      const pgEl = el.parentElement; ptrs.set(e.pointerId, e); el.setPointerCapture(e.pointerId);
      const p = toPage(e, pgEl);
      if (ptrs.size === 2 && g && g.it === it) { const [a, b] = [...ptrs.values()]; g = { mode: 'pinch', it, el, pgEl, d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), a0: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX), w0: it.w, r0: it.rot || 0, s0: it.size }; return; }
      if (e.target.closest('.rs')) g = { mode: 'rs', it, el, pgEl, d0: Math.hypot(p.x - it.x, p.y - it.y), a0: Math.atan2(p.y - it.y, p.x - it.x), w0: it.w, r0: it.rot || 0, s0: it.size };
      else g = { mode: 'mv', it, el, pgEl, dx: p.x - it.x, dy: p.y - it.y, moved: false, wasSel, sx: e.clientX, sy: e.clientY };
    });
    sp.addEventListener('pointermove', e => {
      if (!g || !ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, e);
      const it = g.it, p = toPage(e, g.pgEl);
      if (g.mode === 'mv') { if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 4) g.moved = true; it.x = p.x - g.dx; it.y = p.y - g.dy; const sv = Math.abs(it.x - PW / 2) < 7, sh = Math.abs(it.y - PH / 2) < 7; if (sv) it.x = PW / 2; if (sh) it.y = PH / 2; const gv = g.pgEl.querySelector('.guide.v'), gh = g.pgEl.querySelector('.guide.h'); if (gv) gv.classList.toggle('on', sv); if (gh) gh.classList.toggle('on', sh); }
      else if (g.mode === 'rs') { const k = Math.hypot(p.x - it.x, p.y - it.y) / (g.d0 || 1); it.w = U.clamp(g.w0 * k, 30, 1000); if (it.type === 'text') it.size = U.clamp(g.s0 * k, 10, 200); it.rot = g.r0 + (Math.atan2(p.y - it.y, p.x - it.x) - g.a0) * 180 / Math.PI; if (it.type === 'text') { g.el.querySelector('.tx').style.fontSize = it.size + 'px'; } }
      else if (g.mode === 'pinch' && ptrs.size >= 2) { const [a, b] = [...ptrs.values()]; const k = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / g.d0; it.w = U.clamp(g.w0 * k, 30, 1000); if (it.type === 'text') { it.size = U.clamp(g.s0 * k, 10, 200); g.el.querySelector('.tx').style.fontSize = it.size + 'px'; } it.rot = g.r0 + (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) - g.a0) * 180 / Math.PI; }
      if (['date', 'weather', 'link', 'template'].includes(it.type) && g.mode !== 'mv') { updateEl(it); g.el = $(`.it[data-id="${it.id}"]`); }
      place(g.el, it); st.dirty = true;
    });
    const end = e => {
      if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId);
      if (!g) return;
      const it = g.it; $$('.guide.on').forEach(x => x.classList.remove('on')); if (g.moved || g.mode !== 'mv') commit();
      if (g.mode === 'mv' && !g.moved && g.wasSel) { if (it.type === 'secret') openSecret(it); else if (it.type === 'text' || it.type === 'template') inlineEdit(it); }
      // переезд между страницами разворота
      if (g.mode === 'mv' && st.cur.pages === 2 && st.col) { if (it.page === 0 && it.y > PH + 10) { it.page = 1; it.y -= PH; renderSpread(); } else if (it.page === 1 && it.y < -10) { it.page = 0; it.y += PH; renderSpread(); } }
      else if (g.mode === 'mv' && st.cur.pages === 2) { if (it.page === 0 && it.x > PW + 10) { it.page = 1; it.x -= PW; renderSpread(); } else if (it.page === 1 && it.x < -10) { it.page = 0; it.x += PW; renderSpread(); } }
      if (ptrs.size === 0) g = null;
    };
    sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
    sp.addEventListener('dblclick', e => { const el = e.target.closest('.it'); if (!el || st.ro) return; const it = st.cur.items.find(i => i.id === el.dataset.id); if (it && (it.type === 'text' || it.type === 'template')) inlineEdit(it); });
  }
  function inlineEdit(it) {
    const el = $(`.it[data-id="${it.id}"]`); if (!el) return;
    const targets = it.type === 'text' ? [el.querySelector('.tx')] : $$('.ans', el);
    targets.forEach(t => { t.contentEditable = 'true'; });
    (targets[0] || {}).focus && targets[0].focus();
    const done = () => {
      if (it.type === 'text') it.text = targets[0].innerText.trim() || T('текст');
      else it.ans = targets.map(t => t.innerText.trim());
      targets.forEach(t => t.contentEditable = 'false'); st.dirty = true; updateEl(it);
    };
    targets.forEach(t => t.addEventListener('blur', () => setTimeout(() => { if (!targets.includes(document.activeElement)) done(); }, 50), { once: true }));
  }
  function removeItem(id) { const gone = st.cur.items.find(i => i.id === id); if (gone && gone.type === 'sticker') PV.taste.bump(st.profile, 'st:' + gone.name.split(':')[0], -.4); st.cur.items = st.cur.items.filter(i => i.id !== id); st.sel = null; st.dirty = true; renderSpread(); commit(); }

  /* ---------- листы ---------- */
  function sheet(title, html, bind) { $('#sheet-title').textContent = title; $('#sheet-body').innerHTML = html; $('#sheet').hidden = false; bind && bind($('#sheet-body')); }
  const closeSheet = () => $('#sheet').hidden = true;
  const swatchHtml = (cur) => `<div class="swatches">${COLORS.map(c => `<button type="button" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}<label class="btn small ghost">${T('своя')}<input type="color" data-own value="${cur || '#ff5c93'}" style="width:0;height:0;opacity:0"></label></div>`;
  function bindSwatches(root, fn) { root.querySelectorAll('[data-c]').forEach(b => b.onclick = () => fn(b.dataset.c)); const o = root.querySelector('[data-own]'); if (o) o.oninput = () => fn(o.value); }

  function sheetStickers(cat) {
    const cats = (vibeStickers().length ? ['Для тебя'] : []).concat(Object.keys(PV.STICKER_CATS)); cat = cat || cats[0];
    const listOf = c => c === 'Для тебя' ? vibeStickers() : PV.STICKER_CATS[c];
    sheet(T('Стикеры'), `<div class="chips cats">${cats.map(c => `<button type="button" data-cat="${c}" class="${c === cat ? 'on' : ''}">${T(c)}</button>`).join('')}<button type="button" data-cat="oc">${T('Мой персонаж')}</button></div><div class="grid-st">${listOf(cat).map(n => `<button type="button" data-st="${n}" aria-label="${n}">${PV.stickerSvg(n)}</button>`).join('')}</div>`, r => {
      r.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { if (b.dataset.cat === 'oc') { addItem({ type: 'oc', x: 110, y: 640, w: 130, rot: -5 }); closeSheet(); } else sheetStickers(b.dataset.cat); });
      r.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const n = b.dataset.st; PV.taste.bump(st.profile, 'st:' + n.split(':')[0], .3); addItem({ type: 'sticker', name: n, x: 270 + (Math.random() - .5) * 120, y: 380 + (Math.random() - .5) * 160, w: /^(tape|label)/.test(n) ? 150 : 100, rot: (Math.random() - .5) * 20 }); closeSheet(); });
    });
  }
  function sheetPhoto() {
    const all = []; st.days.forEach(d => (d.items || []).forEach(i => { if (i.type === 'photo' && d.blobs && d.blobs[i.key] && (!st.cur || d.id !== st.cur.id)) all.push({ d, i }); }));
    sheet(T('Фото'), `<label class="btn pink big">${T('С устройства — одно или несколько')}<input type="file" id="ph-dev" accept="image/*" multiple hidden></label><p class="note">${T('Выбери несколько фото сразу — получится коллаж. Первое станет главным, по центру.')}</p>
      ${all.length ? `<h3>${T('Из моих дней')}</h3><div class="pick">${all.slice(0, 60).map((x, k) => `<button type="button" data-g="${k}"><img src="${url(x.d.blobs, x.i.key)}" alt=""></button>`).join('')}</div>` : ''}`, r => {
      r.querySelector('#ph-dev').onchange = e => { closeSheet(); addPhotos([...e.target.files]); };
      r.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const x = all[+b.dataset.g]; const k = 'p' + U.uid(); st.cur.blobs[k] = x.d.blobs[x.i.key]; addItem({ type: 'photo', key: k, asp: x.i.asp, frame: 'polaroid', x: 270 + (Math.random() - .5) * 100, y: 400, w: 220, rot: (Math.random() - .5) * 12 }); closeSheet(); });
    });
  }
  function sheetPos(it) {
    const P = [['↖', 90, 90], ['Наверху', 270, 90], ['↗', 450, 90], ['Слева', 100, 380], ['Центр', 270, 380], ['Справа', 440, 380], ['↙', 90, 690], ['Внизу', 270, 690], ['↘', 450, 690]];
    sheet(T('Куда поставить'), `<div class="posgrid">${P.map(([n, x, y]) => `<button type="button" data-x="${x}" data-y="${y}">${T(n)}</button>`).join('')}</div><div class="chips"><button type="button" id="ps-rot">${T('Выровнять поворот')}</button></div>`, r => {
      r.querySelectorAll('[data-x]').forEach(b => b.onclick = () => { it.x = +b.dataset.x; it.y = +b.dataset.y; updateEl(it); commit(); });
      r.querySelector('#ps-rot').onclick = () => { it.rot = 0; updateEl(it); commit(); };
    });
  }
  const visiblePage = () => (st.cur && st.cur.pages === 2 ? st.page || 0 : 0);
  function sheetTemplates() {
    sheet(T('Шаблоны с вопросами'), `<div class="list">${Object.entries(TEMPLATES).map(([k, [t, q]]) => `<button type="button" data-t="${k}">${T(t)}<small>${q.map(x => T(x)).join(' · ')}</small></button>`).join('')}</div>`, r => r.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { addItem({ type: 'template', tpl: b.dataset.t, x: 270, y: 420, w: 330, rot: -2, ans: [], color: '#fff' }); closeSheet(); toast(T('Нажми на карточку ещё раз, чтобы вписать ответы')); }));
  }
  function sheetWidgets() {
    const styles = [['pill', 'Капсула'], ['stamp', 'Штамп'], ['big', 'Крупно'], ['ticket', 'Билетик'], ['mini', 'Строчкой']];
    sheet(T('Дата, время и погода'), `
      <div class="field"><span>${T('Время дня')}</span><input type="time" id="w-time" value="${st.cur.time || ''}"></div>
      <h3>${T('Добавить дату')}</h3><div class="chips">${styles.map(([k, n]) => `<button type="button" data-ds="${k}">${T(n)}</button>`).join('')}</div>
      <h3>${T('Время года и температура')}</h3><div class="chips">${Object.keys(SEASON_RU).map(k => `<button type="button" data-se="${k}" class="${seasonOf(st.cur.date) === k ? 'on' : ''}">${seasonIc[k]} ${T(SEASON_RU[k])}</button>`).join('')}</div>
      <div class="field"><span>${T('Температура, °C')}</span><input type="number" id="w-temp" value="${st.cur.temp != null ? st.cur.temp : SEASON_T[seasonOf(st.cur.date)]}"></div>
      <button class="btn pink" type="button" id="w-add">${T('Добавить погоду')}</button>`, r => {
      let se = seasonOf(st.cur.date);
      r.querySelector('#w-time').onchange = e => { st.cur.time = e.target.value; st.dirty = true; renderSpread(); };
      r.querySelectorAll('[data-ds]').forEach(b => b.onclick = () => { addItem({ type: 'date', style: b.dataset.ds, x: 270, y: 80, w: 220, rot: 0, color: '#3b2340' }); closeSheet(); });
      r.querySelectorAll('[data-se]').forEach(b => b.onclick = () => { se = b.dataset.se; r.querySelectorAll('[data-se]').forEach(x => x.classList.toggle('on', x === b)); });
      r.querySelector('#w-add').onclick = () => { const t = +r.querySelector('#w-temp').value; st.cur.temp = t; addItem({ type: 'weather', season: se, temp: t, x: 400, y: 80, w: 170, rot: 3, color: '#3b2340', style: 'pill' }); closeSheet(); };
    });
  }
  function sheetBg() {
    const d = st.cur, pal = (d.palette && d.palette.length ? d.palette : ['#ffd1e3', '#e6dbff', '#d3f5e6', '#fff1c2', '#ffe0cc']);
    const cs = [...new Set([...pal.map(c => pastel(hexRgb(c))), '#ffe3ef', '#efe6ff', '#e3f7ee', '#fff6d6', '#ffe8d9', '#1d1a33', '#ffffff'])];
    const cur = d.bg || {};
    sheet(T('Фон страницы'), `<div class="grid-bg">${BG_TYPES.map(([k, n]) => `<button type="button" data-bg="${k}" class="${cur.type === k ? 'on' : ''}" style="background:${bgCss({ type: k, c1: k === 'stars' ? '#1d1a33' : cur.c1 || '#ffe3ef', c2: k === 'stars' ? '#fff3b0' : cur.c2 || '#ffb3cf' })}"><span>${T(n)}</span></button>`).join('')}</div>
      <h3>${T('Цвет фона')} ${d.palette ? `<small class="note">${T('первые — из твоего фото')}</small>` : ''}</h3><div class="swatches">${cs.map(c => `<button type="button" data-c1="${c}" style="background:${c}"></button>`).join('')}</div>
      <h3>${T('Цвет узора')}</h3><div class="swatches">${['#ffb3cf', '#ff8fb8', '#c9b2ff', '#9fe6c8', '#ffd27a', '#8ccaff', '#ffffff', '#fff3b0', ...pal].map(c => `<button type="button" data-c2="${c}" style="background:${c}"></button>`).join('')}</div>`, r => {
      const set = (k, v) => { d.bg = Object.assign({ type: 'paper', c1: '#f4f1ec', c2: '#c9c3b8' }, d.bg, { [k]: v }); st.dirty = true; renderSpread(); commitSoon(); };
      r.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { PV.taste.learnEdit(st.profile, 'bg', d.bg && d.bg.type, b.dataset.bg); if (b.dataset.bg === 'stars') { d.bg = { type: 'stars', c1: '#1d1a33', c2: '#fff3b0' }; renderSpread(); } else set('type', b.dataset.bg); r.querySelectorAll('[data-bg]').forEach(x => x.classList.toggle('on', x === b)); });
      r.querySelectorAll('[data-c1]').forEach(b => b.onclick = () => set('c1', b.dataset.c1));
      r.querySelectorAll('[data-c2]').forEach(b => b.onclick = () => set('c2', b.dataset.c2));
    });
  }
  const hexRgb = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  function sheetText(it) {
    sheet(T('Текст'), `<div class="field"><textarea id="t-tx">${U.esc(it.text)}</textarea></div>
      <div class="fonts">${FONTS.map(([f, n]) => `<button type="button" data-f="${f}" style="font-family:'${f}'" class="${it.font === f ? 'on' : ''}">${n}</button>`).join('')}</div>
      ${swatchHtml(it.color)}
      <div class="chips"><button type="button" data-bgs="none">${T('Без фона')}</button><button type="button" data-bgs="pill">${T('Плашка')}</button><button type="button" data-bgs="mark">${T('Маркер')}</button><button type="button" data-al="left">⟸</button><button type="button" data-al="center">≡</button><button type="button" data-al="right">⟹</button></div>`, r => {
      r.querySelector('#t-tx').oninput = e => { it.text = e.target.value; updateEl(it); };
      r.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { if (it.role === 'title') PV.taste.learnEdit(st.profile, 'font', it.font, b.dataset.f); it.font = b.dataset.f; r.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); updateEl(it); });
      bindSwatches(r, c => { it.color = c; updateEl(it); });
      r.querySelectorAll('[data-bgs]').forEach(b => b.onclick = () => { it.bgs = b.dataset.bgs; updateEl(it); });
      r.querySelectorAll('[data-al]').forEach(b => b.onclick = () => { it.align = b.dataset.al; updateEl(it); });
    });
  }
  function sheetLink(it) {
    const isNew = !it;
    sheet(T('Ссылка'), `<div class="field"><span>${T('Ссылка (песня, видео, что угодно)')}</span><input id="l-u" type="url" placeholder="https://…" value="${it ? U.esc(it.url) : ''}"></div><div class="field"><span>${T('Как назвать')}</span><input id="l-t" placeholder="${T('наша песня ♡')}" value="${it ? U.esc(it.title) : ''}"></div><button class="btn pink" id="l-ok" type="button">${isNew ? T('Добавить') : T('Сохранить')}</button>`, r => r.querySelector('#l-ok').onclick = () => {
      const u = r.querySelector('#l-u').value.trim(), t = r.querySelector('#l-t').value.trim(); if (!u) return toast(T('Вставь ссылку'));
      if (isNew) addItem({ type: 'link', url: /^https?:/.test(u) ? u : 'https://' + u, title: t || u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 30), x: 270, y: 690, w: 300, rot: 0, color: '#ff3d6e' }); else { it.url = u; it.title = t; updateEl(it); }
      closeSheet();
    });
  }
  function sheetSong() {
    const d = st.cur, sg = d.song || {};
    const genres = Object.entries(PV.GENRES).map(([k, g]) => `<option value="${k}" ${sg.genre === k ? 'selected' : ''}>${T(g[0])}</option>`).join('');
    sheet(T('Песня дня'), `<p class="note">${T('Песня не просто прикрепляется: её темп, энергия и лад меняют цвета, количество и движение стикеров, а в «Прожить день» она играет и задаёт ритм.')}</p>
      <div class="field"><span>${T('Ссылка (YouTube, Spotify, Яндекс Музыка, SoundCloud…)')}</span><input id="sg-link" type="url" placeholder="https://…" value="${U.esc(sg.link || '')}"></div>
      <div class="row" style="margin-top:0"><label class="btn ghost">🎵 ${T('Или свой аудиофайл')}<input type="file" id="sg-file" accept="audio/*" hidden></label><span class="note" id="sg-st">${sg.music && sg.music.source === 'audio' ? T('Файл разобран: {bpm} BPM, {key}', { bpm: sg.music.bpm, key: sg.music.key }) : ''}</span></div>
      <div class="field"><span>${T('Исполнитель')}</span><input id="sg-artist" placeholder="${T('Например, Земфира')}" value="${U.esc(sg.artist || '')}"></div>
      <div class="field"><span>${T('Название')}</span><input id="sg-title" placeholder="${T('Хочешь?')}" value="${U.esc(sg.title || '')}"></div>
      <div class="field"><span>${T('Жанр (если артист незнакомый)')}</span><select id="sg-genre" style="font:16px var(--ui);border:1px solid var(--line);border-radius:14px;padding:11px"><option value="">${T('узнать по артисту')}</option>${genres}</select></div>
      <div class="row"><button class="btn pink" id="sg-ok" type="button">${T('Сохранить песню')}</button>${d.song ? `<button class="btn ghost" id="sg-del" type="button">${T('Убрать')}</button>` : ''}</div>`, r => {
      let audio = null, music = sg.music && sg.music.source === 'audio' ? sg.music : null;
      const stt = t => r.querySelector('#sg-st').textContent = t;
      r.querySelector('#sg-file').onchange = async e => {
        const f = e.target.files[0]; if (!f) return; audio = f; stt(T('Слушаю песню…'));
        try { music = await PV.analyzeAudio(f, () => { }); stt(T('Разобрала: {bpm} BPM, {key}, энергия {energy}%', { bpm: music.bpm, key: music.key, energy: Math.round(music.energy * 100) })); } catch (er) { music = null; stt(T('Не удалось разобрать звук — возьму описание')); }
        if (!r.querySelector('#sg-title').value) r.querySelector('#sg-title').value = f.name.replace(/\.[^.]+$/, '');
      };
      r.querySelector('#sg-link').onchange = async e => { const t = await PV.fetchSongTitle(e.target.value); if (t) { if (!r.querySelector('#sg-artist').value) r.querySelector('#sg-artist').value = t.artist; if (!r.querySelector('#sg-title').value) r.querySelector('#sg-title').value = t.title; } };
      const del = r.querySelector('#sg-del'); if (del) del.onclick = () => { delete d.song; d.items = d.items.filter(i => !i.song); st.dirty = true; renderSpread(); closeSheet(); };
      r.querySelector('#sg-ok').onclick = () => {
        const link = r.querySelector('#sg-link').value.trim(), artist = r.querySelector('#sg-artist').value.trim(), title = r.querySelector('#sg-title').value.trim(), genre = r.querySelector('#sg-genre').value;
        if (!link && !audio && !sg.audioKey && !artist && !title) return toast(T('Добавь ссылку, файл или хотя бы исполнителя'));
        const ns = { link, artist, title, genre };
        if (audio) { const k = 'a' + U.uid(); d.blobs[k] = audio; ns.audioKey = k; ns.audioName = audio.name; } else if (sg.audioKey) { ns.audioKey = sg.audioKey; ns.audioName = sg.audioName; }
        if (music) ns.music = Object.assign({}, music, { genre: genre || music.genre });
        d.song = ns; const M = musicOf(d); d.beat = M ? 60 / M.bpm : null;
        const name = [artist, title].filter(Boolean).join(' — ') || T('песня дня');
        const chip = d.items.find(i => i.song) || d.items.find(i => i.type === 'link' && i.auto);
        if (chip) Object.assign(chip, { title: name, url: link, song: 1 }); else addItem({ type: 'link', song: 1, title: name, url: link, x: 300, y: 712, w: 300, rot: 0, color: '#ff3d6e' });
        st.dirty = true; renderSpread(); closeSheet();
        toast(M ? T('Песня учтена: {bpm} BPM, {mode}. Нажми ✨ — оформление подстроится', { bpm: M.bpm, mode: M.mode === 'minor' ? T('минор') : T('мажор') }) : T('Песня добавлена'), 3200);
      };
    });
  }
  function sheetFrame(it) {
    const fr = [['none', 'Без рамки'], ['round', 'Скруглить'], ['polaroid', 'Полароид'], ['film', 'Плёнка'], ['circle', 'Кружок'], ['heart', 'Сердце'], ['tape', 'На скотче'], ['stroke', 'Обводка']];
    sheet(T('Рамка и обводка'), `<div class="chips">${fr.map(([k, n]) => `<button type="button" data-fr="${k}" class="${it.frame === k ? 'on' : ''}">${T(n)}</button>`).join('')}</div><h3>${T('Цвет обводки')}</h3>${swatchHtml(it.sc)}`, r => {
      r.querySelectorAll('[data-fr]').forEach(b => b.onclick = () => { PV.taste.learnEdit(st.profile, 'frame', it.frame, b.dataset.fr); it.frame = b.dataset.fr; r.querySelectorAll('[data-fr]').forEach(x => x.classList.toggle('on', x === b)); updateEl(it); });
      bindSwatches(r, c => { it.sc = c; if (it.frame === 'none') it.frame = 'stroke'; updateEl(it); });
    });
  }
  function sheetColor(it) { sheet(T('Цвет'), swatchHtml(it.color), r => bindSwatches(r, c => { it.color = c; updateEl(it); })); }
  function sheetWidgetEdit(it) {
    if (it.type === 'date') { const styles = [['pill', 'Капсула'], ['stamp', 'Штамп'], ['big', 'Крупно'], ['ticket', 'Билетик'], ['mini', 'Строчкой']]; sheet(T('Стиль даты'), `<div class="chips">${styles.map(([k, n]) => `<button type="button" data-ds="${k}">${T(n)}</button>`).join('')}</div>`, r => r.querySelectorAll('[data-ds]').forEach(b => b.onclick = () => { it.style = b.dataset.ds; updateEl(it); })); return; }
    sheet(T('Погода'), `<div class="chips">${Object.keys(SEASON_RU).map(k => `<button type="button" data-se="${k}" class="${it.season === k ? 'on' : ''}">${seasonIc[k]} ${T(SEASON_RU[k])}</button>`).join('')}</div><div class="field"><span>${T('Температура')}</span><input type="number" id="we-t" value="${it.temp}"></div>`, r => {
      r.querySelectorAll('[data-se]').forEach(b => b.onclick = () => { it.season = b.dataset.se; r.querySelectorAll('[data-se]').forEach(x => x.classList.toggle('on', x === b)); updateEl(it); });
      r.querySelector('#we-t').oninput = e => { it.temp = +e.target.value; st.cur.temp = it.temp; updateEl(it); };
    });
  }

  /* ---------- секреты: конверт / подарок, голосовые до 10 с ---------- */
  function wav(buf, maxSec = 10) {
    const sr = buf.sampleRate, n = Math.min(buf.length, Math.floor(sr * maxSec)), ch = buf.getChannelData(0), out = new DataView(new ArrayBuffer(44 + n * 2));
    const w = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); out.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, sr, true); out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) out.setInt16(44 + i * 2, U.clamp(ch[i], -1, 1) * 32767, true);
    return new Blob([out], { type: 'audio/wav' });
  }
  async function trimAudio(blob) { const ac = new (window.AudioContext || window.webkitAudioContext)(); try { const b = await ac.decodeAudioData(await blob.arrayBuffer()); return { blob: wav(b, 10), dur: Math.min(10, b.duration), full: b.duration }; } finally { ac.close(); } }
  function sheetSecret(it) {
    const isNew = !it; it = it || { type: 'secret', kind: 'envelope', text: '', x: 440, y: 560, w: 110, rot: 8, color: null };
    const vids = st.cur.items.filter(i => i.type === 'video');
    sheet(isNew ? T('Секретная записка') : T('Изменить секрет'), `
      <div class="chips"><button type="button" data-k="envelope" class="${it.kind === 'envelope' ? 'on' : ''}">💌 ${T('Конвертик')}</button><button type="button" data-k="gift" class="${it.kind === 'gift' ? 'on' : ''}">🎁 ${T('Подарочек')}</button></div>
      <div class="field"><span>${T('Что внутри (появится с анимацией)')}</span><textarea id="s-tx" placeholder="${T('Письмо себе через год…')}">${U.esc(it.text || '')}</textarea></div>
      <h3>${T('Голосовое до 10 секунд')}</h3>
      <div class="chips"><button type="button" id="s-rec">🎙 ${T('Записать')}</button><label class="btn small ghost">${T('Загрузить аудио')}<input type="file" accept="audio/*" id="s-up" hidden></label>${vids.length ? `<button type="button" id="s-vid">🎬 ${T('Взять звук из видео дня')}</button>` : ''}</div>
      <p class="note" id="s-st">${it.voice ? T('Голосовое прикреплено ✓') : T('Голосового пока нет')}</p>
      <button class="btn pink" id="s-ok" type="button">${isNew ? (it.kind === 'gift' ? T('Спрятать в подарок') : T('Спрятать в конверт')) : T('Сохранить')}</button>`, r => {
      let voiceBlob = null; const status = s => r.querySelector('#s-st').textContent = s;
      r.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { it.kind = b.dataset.k; r.querySelectorAll('[data-k]').forEach(x => x.classList.toggle('on', x === b)); });
      r.querySelector('#s-rec').onclick = async () => {
        try {
          const ms = await navigator.mediaDevices.getUserMedia({ audio: true }); const rec = new MediaRecorder(ms), ch = [];
          rec.ondataavailable = e => ch.push(e.data); rec.start(); let s = 10; status(T('Запись… 10'));
          const iv = setInterval(() => { s--; status(T('Запись… {s}', { s: s })); if (s <= 0) stop(); }, 1000);
          const stop = () => { clearInterval(iv); if (rec.state !== 'inactive') rec.stop(); };
          r.querySelector('#s-rec').textContent = '■ ' + T('Стоп'); r.querySelector('#s-rec').onclick = stop;
          rec.onstop = () => { ms.getTracks().forEach(t => t.stop()); voiceBlob = new Blob(ch, { type: rec.mimeType }); status(T('Голосовое записано ✓')); r.querySelector('#s-rec').textContent = '🎙 ' + T('Перезаписать'); };
        } catch (e) { status(T('Нет доступа к микрофону — можно загрузить аудиофайл')); }
      };
      r.querySelector('#s-up').onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const t = await trimAudio(f); voiceBlob = t.blob; status(t.full > 10 ? T('Взяла первые 10 секунд из {full} ✓', { full: Math.round(t.full) }) : T('Аудио прикреплено ✓')); } catch (er) { voiceBlob = f; status(T('Аудио прикреплено ✓')); } };
      const vb = r.querySelector('#s-vid'); if (vb) vb.onclick = async () => { try { status(T('Достаю звук…')); const t = await trimAudio(st.cur.blobs[vids[0].key]); voiceBlob = t.blob; status(T('Звук из видео прикреплён ({dur} с) ✓', { dur: t.dur.toFixed(1) })); } catch (er) { status(T('В этом видео не нашлось звука')); } };
      r.querySelector('#s-ok').onclick = () => {
        it.text = r.querySelector('#s-tx').value.trim();
        if (voiceBlob) { const k = 'v' + U.uid(); st.cur.blobs[k] = voiceBlob; it.voice = k; }
        if (!it.text && !it.voice) return toast(T('Напиши что-нибудь или запиши голос'));
        if (st.ro && st.curFriend) { it.from = st.profile ? st.profile.name : T('друг'); it.mine = 1; }
        if (isNew) addItem(it); else updateEl(it); closeSheet();
        if (st.ro && st.curFriend) saveFriend();
      };
    });
  }
  function openSecret(it) {
    const box = $('#modal-box');
    box.innerHTML = `<div class="letter"><div class="env ${it.kind === 'gift' ? 'gift' : ''}" id="env"><div class="flap"></div><div class="paper" id="paper"></div></div></div>
      <p class="note" style="text-align:center">${it.from ? T('Записка от {name}', { name: U.esc(it.from) }) : T('Нажми, чтобы закрыть')}</p>
      <div class="row" style="justify-content:center">${!st.ro && !it.lock ? `<button class="btn ghost" id="sec-edit" type="button">${T('Изменить')}</button>` : ''}<button class="btn pink" id="sec-x" type="button">${T('Закрыть')}</button></div>`;
    $('#modal').hidden = false;
    const env = $('#env'), paper = $('#paper'), txt = it.text || (it.voice ? '🎙 ' + T('голосовое') : '');
    setTimeout(() => env.classList.add('open'), 250);
    let i = 0; setTimeout(function type() { paper.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(type, 28); }, 1200);
    let au = null; if (it.voice && st.cur.blobs[it.voice]) { au = new Audio(url(st.cur.blobs, it.voice)); setTimeout(() => au.play().catch(() => { }), 1100); }
    const close = () => { if (au) au.pause(); $('#modal').hidden = true; };
    $('#sec-x').onclick = close; const se = $('#sec-edit'); if (se) se.onclick = () => { close(); sheetSecret(it); };
  }

  /* ---------- заметки ---------- */
  const paperCss = p => ({
    pink: 'background:#ffe3ef;color:#3b2340', black: 'background:#141218;color:#f4eefa', board: 'background:#1f4a3a;color:#eaf7ef', rainbow: 'background:linear-gradient(170deg,#ffd1e3,#ffe7c7,#fff7c2,#d6f5d6,#d3e9ff,#e6dbff);color:#3b2340',
    grid: 'background:linear-gradient(#c9d6ff 1px,transparent 1px) 0 0/24px 24px,linear-gradient(90deg,#c9d6ff 1px,transparent 1px) 0 0/24px 24px,#fff;color:#28305a',
    crumpled: `background:${bgCss({ type: 'crumpled', c1: '#f6f0e6' })};color:#3b2340`, wide: 'background:repeating-linear-gradient(transparent 0 37px,#b9c8ff 37px 38px),#fffdf8;color:#2a2a4a', narrow: 'background:repeating-linear-gradient(transparent 0 23px,#c9d3ff 23px 24px),#fffdf8;color:#2a2a4a'
  }[p] || '');
  function openNotes() {
    const d = st.cur; d.notes = d.notes || { text: '', paper: 'pink' };
    const box = $('#modal-box');
    box.innerHTML = `<div class="sheet-head"><b>${T('Заметки дня')}</b><button class="x" id="n-x" type="button">✕</button></div>
      <div class="chips">${PAPERS.map(([k, n]) => `<button type="button" data-p="${k}" class="${d.notes.paper === k ? 'on' : ''}">${n}</button>`).join('')}</div>
      <div class="notes-panel" id="n-pan" style="${paperCss(d.notes.paper)}"><textarea id="n-tx" ${st.ro ? 'readonly' : ''} placeholder="${T('Опиши день подробнее: что было, кто рядом, какие запахи и звуки…')}">${U.esc(d.notes.text)}</textarea></div>
      ${!st.ro ? `<p class="note">${T('Из заметок я придумаю название дня, когда буду пересобирать страницу.')}</p>` : ''}`;
    $('#modal').hidden = false;
    $$('[data-p]', box).forEach(b => b.onclick = () => { if (st.ro) return; d.notes.paper = b.dataset.p; $('#n-pan').style.cssText = paperCss(b.dataset.p); $$('[data-p]', box).forEach(x => x.classList.toggle('on', x === b)); st.dirty = true; });
    $('#n-tx').oninput = e => { d.notes.text = e.target.value; st.dirty = true; };
    $('#n-x').onclick = () => $('#modal').hidden = true;
  }

  /* ---------- медиа ---------- */
  async function addPhotos(files) {
    const d = st.cur; let n = 0;
    const existing = d.items.filter(i => i.type === 'photo').length;
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      const b = await U.downscale(f, 1600); const k = 'p' + U.uid(); d.blobs[k] = b;
      const { asp } = await analyzePhoto(b); const i = existing + n;
      const coll = files.length > 1; // коллаж: раскладываем сеткой
      const col = i % 2, row = Math.floor(i / 2);
      addItem(coll ? { type: 'photo', key: k, asp, frame: 'polaroid', x: 150 + col * 240, y: 200 + (row % 3) * 230, w: 220, rot: (col ? 4 : -4), page: d.pages === 2 && i >= 4 ? 1 : visiblePage() } : { type: 'photo', key: k, asp, frame: i ? 'polaroid' : 'round', x: i ? 120 + (i % 3) * 150 : 270, y: i ? 600 : 350, w: i ? 150 : 340, rot: i ? (i % 2 ? 6 : -6) : 0 });
      n++;
    }
    if (n && !d.palette) { const first = d.items.find(i => i.type === 'photo'); const { a } = await analyzePhoto(d.blobs[first.key]); d.palette = a.palette.map(p => p.hex); setAccent(d.palette); }
    if (n) toast(n > 1 ? T('Фото добавлены. Нажми «Готово» и «Другой вариант» — страница пересоберётся с ними') : T('Фото добавлено. Нажми «Готово» и «Другой вариант» — страница пересоберётся с ним'), 3200);
  }
  async function addVideo(f) {
    const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(f); v.playsInline = true;
    await new Promise(r => { v.onloadeddata = r; v.onerror = r; });
    if (v.duration > 5.2) toast(T('Видео {n} с — в дневнике будет крутиться первые 5 секунд', { n: Math.round(v.duration) }), 3500);
    v.currentTime = Math.min(.5, v.duration / 2 || 0); await new Promise(r => { v.onseeked = r; setTimeout(r, 800); });
    const c = U.canvas(v.videoWidth || 320, v.videoHeight || 240); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const k = 'm' + U.uid(), pk = k + '_poster'; st.cur.blobs[k] = f; st.cur.blobs[pk] = await U.canvasToBlob(c);
    addItem({ type: 'video', key: k, poster: pk, asp: c.height / c.width, frame: 'round', x: 270, y: 350, w: 320, rot: 0 });
    URL.revokeObjectURL(v.src);
  }

  /* ---------- отрисовка дня в картинку (обложки, экспорт) ---------- */
  const loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  function drawBg(x, bg, w, h) {
    const { type, c1 = '#ffe3ef', c2 = '#ffb3cf' } = bg || {};
    if (type === 'gradient') { const g = x.createLinearGradient(0, 0, w * .4, h); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; }
    else if (type === 'holo') { const g = x.createLinearGradient(0, 0, w, h); ['#e5eeff', '#fbe1ff', '#dffcf1', '#fff3d1'].forEach((c, i) => g.addColorStop(i / 3, c)); x.fillStyle = g; }
    else if (type === 'kraft') x.fillStyle = '#d9c29c';
    else if (type === 'rainbow') { const g = x.createLinearGradient(0, 0, 0, h); ['#ffd1e3', '#ffe7c7', '#fff7c2', '#d6f5d6', '#d3e9ff', '#e6dbff'].forEach((c, i) => g.addColorStop(i / 5, c)); x.fillStyle = g; }
    else x.fillStyle = c1;
    x.fillRect(0, 0, w, h);
    x.save(); x.globalAlpha = .45; x.fillStyle = c2; x.strokeStyle = c2;
    if (type === 'grid') { x.lineWidth = 1; for (let i = 0; i < w; i += 26) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let j = 0; j < h; j += 26) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); } }
    if (type === 'lined') { for (let j = 32; j < h; j += 32) x.fillRect(0, j, w, 1); x.fillStyle = '#ff8fab'; x.fillRect(58, 0, 2, h); }
    if (type === 'dots') for (let j = 0; j < h; j += 30) for (let i = 0; i < w; i += 30) { x.beginPath(); x.arc(i + (j / 30 % 2) * 15, j, 3, 0, 7); x.fill(); }
    if (type === 'gingham') { x.globalAlpha = .3; for (let i = 0; i < w; i += 44) x.fillRect(i, 0, 22, h); for (let j = 0; j < h; j += 44) x.fillRect(0, j, w, 22); }
    if (type === 'hearts' || type === 'stars') { x.globalAlpha = .6; x.font = '22px sans-serif'; for (let j = 20; j < h; j += 60) for (let i = 10; i < w; i += 60) x.fillText(type === 'hearts' ? '♥' : '✦', i + (j % 120 ? 30 : 0), j); }
    if (type === 'mesh') { x.globalAlpha = 1; [[.15, .15, bg.c3 || c2], [.85, .3, bg.c4 || c2], [.5, 1, c2]].forEach(([px, py, c]) => { const g = x.createRadialGradient(px * w, py * h, 0, px * w, py * h, w * .75); g.addColorStop(0, c); g.addColorStop(1, c + '00'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); }
    if (type === 'dotgrid') { for (let j = 0; j < h; j += 22) for (let i = 0; i < w; i += 22) { x.beginPath(); x.arc(i, j, 1.4, 0, 7); x.fill(); } }
    if (type === 'grain' || type === 'kraft') { x.globalAlpha = .12; x.fillStyle = '#000'; const r = U.rng(7); for (let i = 0; i < 5000; i++) x.fillRect(r() * w, r() * h, 1, 1); }
    x.restore();
  }
  // картинки для элементов загружаем заранее — потом кадры рисуются синхронно (нужно и для видео)
  async function loadAssets(d, items) {
    const A = new Map();
    await Promise.all(items.map(async it => {
      if (it.type === 'photo' || it.type === 'video') A.set(it.id, await loadImg(url(d.blobs, it.type === 'video' ? it.poster : it.key)));
      else if (['sticker', 'oc', 'secret'].includes(it.type)) { const svg = it.type === 'oc' ? PV.ocSvg(it.ocOf || st.profile && st.profile.oc) : it.type === 'secret' ? PV.stickerSvg(it.kind === 'gift' ? 'gift' : 'envelope', it.color) : PV.stickerSvg(it.name, it.color); A.set(it.id, await loadImg(svgUrl(svg))); }
    }));
    return A;
  }
  function drawItem(x, it, d, A) {
    const w = it.w, im = A.get(it.id);
    if (it.type === 'photo' || it.type === 'video') {
      const ih = w * (it.asp || .75); if (!im) return;
      const fr = it.frame;
      if (fr === 'polaroid' || fr === 'tape') { const pad = w * .06, bot = fr === 'polaroid' ? w * .22 : pad; x.shadowColor = '#0003'; x.shadowBlur = 14; x.fillStyle = '#fff'; x.fillRect(-w / 2 - pad, -ih / 2 - pad, w + 2 * pad, ih + pad + bot); x.shadowBlur = 0; x.drawImage(im, -w / 2, -ih / 2, w, ih); if (fr === 'tape') { x.fillStyle = '#d6b98ce6'; x.fillRect(-w / 2 - pad, -ih / 2 - pad * 2, w * .34, pad * 2); x.fillStyle = '#ffffffaa'; x.fillRect(w / 2 - w * .3, -ih / 2 - pad * 2, w * .34, pad * 2); } }
      else if (fr === 'film') { const pad = w * .05; x.fillStyle = '#121212'; x.fillRect(-w / 2 - pad, -ih / 2 - pad * 2.2, w + pad * 2, ih + pad * 4.4); x.fillStyle = '#fff'; for (let k = 0; k < 9; k++) { x.fillRect(-w / 2 + k * w / 9 + 4, -ih / 2 - pad * 1.7, w / 22, pad * .9); x.fillRect(-w / 2 + k * w / 9 + 4, ih / 2 + pad * .8, w / 22, pad * .9); } x.drawImage(im, -w / 2, -ih / 2, w, ih); }
      else { x.save(); x.beginPath(); if (fr === 'circle') x.arc(0, 0, w / 2, 0, 7); else if (fr === 'round') x.roundRect(-w / 2, -ih / 2, w, ih, 18); else if (fr === 'heart') { const s2 = w / 100, hh = w * .92; x.translate(-w / 2, -hh / 2); x.moveTo(50 * s2, 90 * s2); x.bezierCurveTo(-10 * s2, 50 * s2, 10 * s2, -10 * s2, 50 * s2, 21 * s2); x.bezierCurveTo(90 * s2, -10 * s2, 110 * s2, 50 * s2, 50 * s2, 90 * s2); x.translate(w / 2, hh / 2); } else x.rect(-w / 2, -ih / 2, w, ih); x.clip(); const dh = fr === 'circle' ? w : fr === 'heart' ? w * .92 : ih; const k = Math.max(w / im.width, dh / im.height); x.drawImage(im, -im.width * k / 2, -im.height * k / 2, im.width * k, im.height * k); x.restore(); if (fr === 'stroke') { x.lineWidth = 8; x.strokeStyle = it.sc || '#fff'; x.strokeRect(-w / 2, -ih / 2, w, ih); } }
    } else if (['sticker', 'oc', 'secret'].includes(it.type)) {
      if (im) { const hh = w * (im.height / im.width || 1); x.drawImage(im, -w / 2, -hh / 2, w, hh); }
    } else if (it.type === 'text') {
      x.fillStyle = it.color; x.font = `${it.size}px '${it.font}'`; x.textAlign = it.align || 'center'; x.textBaseline = 'middle';
      const lines = wrap(x, it.text, w - 16); const lh = it.size * 1.15, ax = it.align === 'left' ? -w / 2 + 8 : it.align === 'right' ? w / 2 - 8 : 0;
      if (it.bgs === 'pill') { x.save(); x.fillStyle = '#fff'; x.beginPath(); x.roundRect(-w / 2, -lines.length * lh / 2 - 6, w, lines.length * lh + 12, 16); x.fill(); x.restore(); }
      lines.forEach((l, i) => x.fillText(l, ax, (i - (lines.length - 1) / 2) * lh));
    } else {
      const label = it.type === 'date' ? fmtDateWidget(it, d).replace(/<br>/g, ' · ').replace(/<[^>]+>/g, ' ') : it.type === 'weather' ? `${SEASON_RU[it.season] || ''} · ${it.temp > 0 ? '+' : ''}${it.temp}°` : it.type === 'link' ? '♪ ' + (it.title || '') : TEMPLATES[it.tpl] ? TEMPLATES[it.tpl][0] : '';
      const fs = it.type === 'template' ? w / 14 : w / 11; x.font = `600 ${fs}px Onest, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const tw = Math.min(w, x.measureText(label).width + 30), hh = it.type === 'template' ? w * .9 : fs * 2.1;
      x.fillStyle = it.type === 'template' ? it.color || '#fff' : '#ffffffe6'; x.beginPath(); x.roundRect(-tw / 2, -hh / 2, tw, hh, 16); x.fill();
      x.fillStyle = it.type === 'link' ? '#121212' : it.color && it.type !== 'template' ? it.color : '#121212'; x.fillText(label, 0, it.type === 'template' ? -hh / 2 + fs * 1.2 : 0);
    }
  }
  async function drawDay(d, scale = .5, firstOnly = false) {
    const pages = firstOnly ? 1 : d.pages || 1, c = U.canvas(PW * pages * scale, PH * scale), x = c.getContext('2d');
    x.scale(scale, scale);
    try { await Promise.race([document.fonts.ready, U.sleep(800)]); } catch (e) { }
    const A = await loadAssets(d, d.items.filter(i => (i.page || 0) < pages));
    for (let p = 0; p < pages; p++) {
      x.save(); x.translate(p * PW, 0); x.beginPath(); x.rect(0, 0, PW, PH); x.clip();
      drawBg(x, p === 1 && d.bg2 ? d.bg2 : d.bg, PW, PH);
      d.items.filter(i => (i.page || 0) === p).sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(it => { x.save(); x.translate(it.x, it.y); x.rotate((it.rot || 0) * Math.PI / 180); drawItem(x, it, d, A); x.restore(); });
      x.restore();
    }
    return c.toDataURL('image/jpeg', .85);
  }
  // видео дня для сторис: элементы влетают по очереди, стикеры качаются в такт песне, звучит песня
  async function exportVideo(d) {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return toast(T('Этот браузер не умеет записывать видео — попробуй Chrome'));
    const S = 2, c = U.canvas(PW * S, PH * S), x = c.getContext('2d');
    try { await Promise.race([document.fonts.ready, U.sleep(800)]); } catch (e) { }
    const items = d.items.filter(i => (i.page || 0) === 0).sort((a, b) => (a.z || 0) - (b.z || 0));
    const A = await loadAssets(d, items), M = musicOf(d), beat = d.beat || (M ? 60 / M.bpm : 1.2);
    const dur = U.clamp(2.5 + items.length * .28 + 3, 7, 15);
    const stream = c.captureStream(30); let ac = null, el = null;
    if (d.song && d.song.audioKey && d.blobs[d.song.audioKey]) { el = new Audio(url(d.blobs, d.song.audioKey)); ac = new (window.AudioContext || window.webkitAudioContext)(); const src = ac.createMediaElementSource(el), dest = ac.createMediaStreamDestination(); src.connect(dest); src.connect(ac.destination); dest.stream.getAudioTracks().forEach(t => stream.addTrack(t)); }
    const mime = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const eb = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
    const frame = t => {
      x.setTransform(S, 0, 0, S, 0, 0); x.save(); const z = 1 + .04 * t / dur; x.translate(PW / 2, PH / 2); x.scale(z, z); x.translate(-PW / 2, -PH / 2); drawBg(x, d.bg, PW, PH); x.restore();
      items.forEach((it, k) => {
        const p = U.clamp((t - .4 - k * .28) / .7); if (p <= 0) return;
        const bob = ['sticker', 'secret', 'oc'].includes(it.type) && p >= 1 ? Math.sin(2 * Math.PI * (t / beat)) * (M ? 2 + M.energy * 5 : 3) : 0;
        x.save(); x.globalAlpha = Math.min(1, p * 1.6); x.translate(it.x, it.y); x.rotate(((it.rot || 0) + (1 - p) * -18 + bob) * Math.PI / 180); const sc = .5 + .5 * eb(p); x.scale(sc, sc); drawItem(x, it, d, A); x.restore();
      });
      const note = (d.notes && d.notes.text) || '', tp = U.clamp((t - (dur - 3.2)) / 2.4);
      if (note && tp > 0) { x.save(); x.fillStyle = `rgba(10,10,12,${.62 * Math.min(1, tp * 2.5)})`; x.fillRect(0, 0, PW, PH); x.fillStyle = '#fff'; x.font = "32px Caveat, cursive"; x.textAlign = 'center'; x.textBaseline = 'middle'; const all = wrap(x, note, PW - 80).slice(0, 8), shown = Math.ceil(all.join(' ').length * Math.min(1, tp * 1.3)); let left = shown; all.forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; x.fillText(part, PW / 2, PH / 2 - (all.length - 1) * 19 + i * 38); }); x.font = "600 15px Onest, sans-serif"; x.globalAlpha = .8; x.fillText((d.title || '') + ' · ' + U.fmtDate(d.date), PW / 2, PH / 2 + all.length * 19 + 36); x.restore(); }
    };
    toast(T('Записываю видео…'), dur * 1000);
    rec.start(200); if (el) el.play().catch(() => { });
    const t0 = performance.now();
    await new Promise(res => { const loop = () => { const t = (performance.now() - t0) / 1000; frame(Math.min(t, dur)); if (t < dur) requestAnimationFrame(loop); else res(); }; loop(); });
    rec.stop(); await new Promise(r => rec.onstop = r); if (el) el.pause(); if (ac) ac.close();
    const blob = new Blob(chunks, { type: mime.split(';')[0] }); const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    d.video = blob; d.videoExt = ext; await DB.put('days', d.id, d);
    U.download(blob, U.safeName(d.title || 'день') + '.' + ext); toast(T('Видео {n} с готово — можно в сторис', { n: Math.round(dur) }), 3200);
  }
  function wrap(x, t, mw) { const out = []; String(t).split('\n').forEach(par => { let line = ''; par.split(' ').forEach(w => { const tt = line ? line + ' ' + w : w; if (x.measureText(tt).width > mw && line) { out.push(line); line = w; } else line = tt; }); out.push(line); }); return out; }

  /* ---------- сохранение, дни, друзья ---------- */
  function newDay() {
    const now = new Date();
    return { id: U.uid(), created: Date.now(), date: U.todayISO(), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, title: '', pages: 1, bg: { type: 'grain', c1: '#faf7f2', c2: '#d9d2c5' }, items: [], blobs: {}, notes: { text: '', paper: 'pink' } };
  }
  async function saveDay(quiet) {
    const d = st.cur; if (!d) return;
    d.title = $('#ed-title').value.trim() || d.title || 'Мой день'; d.date = $('#ed-date').value || d.date;
    d.thumb = await drawDay(d, .45, true); d.updated = Date.now();
    await DB.put('days', d.id, d); st.dirty = false;
    st.days = (await DB.all('days')); if (!quiet) toast(T('Сохранено в дневник ♡'));
  }
  async function saveFriend() { const f = st.curFriend; f.day = st.cur; await DB.put('friends', f.id, f); st.friends = await DB.all('friends'); }
  const blobToData = b => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); });
  const dataToBlob = async u => (await fetch(u)).blob();
  async function pack(d) { const blobs = {}; for (const [k, b] of Object.entries(d.blobs || {})) blobs[k] = await blobToData(b); const day = Object.assign({}, d, { blobs: undefined }); return { day, blobs }; }
  async function unpack(o) { const blobs = {}; for (const [k, u] of Object.entries(o.blobs || {})) blobs[k] = await dataToBlob(u); return Object.assign(o.day, { blobs }); }
  async function shareDay() {
    await saveDay(true);
    const pkd = await pack(st.cur);
    const data = { format: 'poslevkusie-day', v: 1, from: st.profile.name, oc: st.profile.oc, origId: st.ro && st.curFriend ? st.curFriend.origId : st.cur.id, reply: !!st.ro, ...pkd };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    U.download(blob, `${U.safeName(st.cur.title || 'день')} — от ${U.safeName(st.profile.name)}.json`);
    toast(st.ro ? T('Файл с твоими записками готов — отправь его другу') : T('Файл дня готов — отправь его другу в любом мессенджере'), 3500);
  }
  async function importFile(f) {
    try {
      const o = JSON.parse(await f.text());
      if (o.format === 'poslevkusie-backup') { for (const p of o.days) { const d = await unpack(p); await DB.put('days', d.id, d); } toast(T('Восстановлено дней: {n}', { n: o.days.length })); st.days = await DB.all('days'); return route(); }
      if (o.format !== 'poslevkusie-day') return toast(T('Это не файл дня из «Страницы дня»'));
      const day = await unpack(o);
      // друг вернул мой день со своими записками
      const mine = st.days.find(d => d.id === o.origId);
      if (o.reply && mine) {
        const add = day.items.filter(i => i.from && !mine.items.some(m => m.id === i.id)).map(i => Object.assign(i, { lock: 1 }));
        add.forEach(i => { if (i.voice && day.blobs[i.voice]) mine.blobs[i.voice] = day.blobs[i.voice]; });
        mine.items.push(...add); mine.reactions = (mine.reactions || []).concat(day.friendReactions || []); await DB.put('days', mine.id, mine); st.days = await DB.all('days');
        toast(T('{name} оставил(а) в твоём дне записок: {n} 💌', { name: o.from, n: add.length }), 4000); location.hash = 'day-' + mine.id; return;
      }
      const fr = { id: U.uid(), from: o.from || 'друг', oc: o.oc, origId: o.origId, day, reactions: [], added: Date.now() };
      await DB.put('friends', fr.id, fr); st.friends = await DB.all('friends'); toast(T('День от {name} добавлен ♡', { name: fr.from })); location.hash = 'friend-' + fr.id;
    } catch (e) { console.error(e); toast(T('Не получилось прочитать файл')); }
  }
  async function backup() {
    const days = []; for (const d of st.days) days.push(await pack(d));
    U.download(new Blob([JSON.stringify({ format: 'poslevkusie-backup', v: 1, days })], { type: 'application/json' }), 'мой-дневник-страница-дня.json'); toast(T('Копия дневника сохранена'));
  }

  /* ---------- экраны ---------- */
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const isoOf = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const capName = n => n.charAt(0).toUpperCase() + n.slice(1);
  const glowOf = d => { const p = (d.palette || []).filter(Boolean); if (!p.length) return 'var(--acc)'; return p.map(hexRgb).sort((a, b) => U.rgb2hsl(...b)[1] - U.rgb2hsl(...a)[1]).map(U.hex)[0]; };
  function renderHome() {
    const p = st.profile, did = curDiary().id, mine = st.days.filter(d => (d.diaryId || 'main') === did);
    const have = new Set(mine.map(d => d.date)), now = new Date();
    let streak = 0; for (let i = have.has(U.todayISO()) ? 0 : 1; i < 400; i++) { const dt = new Date(now); dt.setDate(now.getDate() - i); if (have.has(isoOf(dt))) streak++; else break; }
    $('#hello-k').textContent = `${T(WD[now.getDay()])} · ${now.getDate()} ${U.MONTHS[now.getMonth()]}${streak > 1 ? ' · ' + T('{n} дн. подряд', { n: streak }) : ''}`;
    const h = now.getHours();
    $('#hello-h').textContent = have.has(U.todayISO()) ? T('Ещё что-то случилось, {n}?', { n: capName(p.name) }) : h < 12 ? T('Доброе утро, {n}', { n: capName(p.name) }) : T('Как прошёл твой день, {n}?', { n: capName(p.name) });
    $('#week').innerHTML = [6, 5, 4, 3, 2, 1, 0].map(i => { const dt = new Date(now); dt.setDate(now.getDate() - i); return `<span class="${i ? '' : 'today'}"><i class="${have.has(isoOf(dt)) ? 'on' : ''}"></i>${T(WD[dt.getDay()])}</span>`; }).join('');
    $('#vibe-sum').innerHTML = vibeSummary(); const ve = $('#vibe-edit'); if (ve) ve.onclick = () => vibeQuiz(async v => { await saveVibe(v); $('#modal').hidden = true; route(); toast(T('Вайб обновлён — новые страницы будут под него')); });
    renderQday();
    const q = (st.q || '').toLowerCase().replace(/ё/g, 'е');
    const days = mine.filter(d => !q || ((d.title || '') + ' ' + ((d.notes && d.notes.text) || '') + ' ' + U.fmtDate(d.date) + ' ' + (d.song ? (d.song.artist || '') + ' ' + (d.song.title || '') : '')).toLowerCase().replace(/ё/g, 'е').includes(q)).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
    $('#diary-name').textContent = diaries().length > 1 ? curDiary().name : T('Мои дни');
    $('#days-count').textContent = days.length ? `${days.length}` : '';
    $('#days').innerHTML = `<button class="day-card new" type="button" id="new2"><span class="orb">+</span>${T('новый день')}</button>` + days.map(d => `<a class="day-card" href="#day-${d.id}"><span class="glow" style="--g:${glowOf(d)}"></span><img src="${d.thumb || ''}" alt=""><b>${U.esc(d.title || T('Мой день'))}</b><span>${U.fmtDate(d.date)}</span>${(d.reactions || []).length ? `<span class="who">${d.reactions.slice(0, 4).join('')}</span>` : ''}</a>`).join('');
    $('#new2').onclick = startNew;
    $('#memory').innerHTML = memoryCard(); const mc = $('#memory .memory'); if (mc) mc.onclick = e => { e.preventDefault(); const d = st.days.find(x => x.id === mc.dataset.replay); if (d) replay(d); };
    const last = days.find(d => d.palette); setAccent(last && last.palette);
  }
  // вопрос дня: не каждый день, без повторов подряд, можно пропустить
  function todayPrompt() {
    if (!PV.pickPrompt) return null;
    const today = U.todayISO(), log = st.profile.promptLog = st.profile.promptLog || [];
    let e = log.find(x => x.date === today);
    if (!e) { const recent = log.filter(x => x.id).slice(-6).map(x => x.id).reverse(); const pr = PV.pickPrompt(today, recent); e = { date: today, id: pr ? pr.id : null }; log.push(e); if (log.length > 40) log.shift(); DB.put('meta', 'profile', st.profile); }
    return e.id && !e.skip && !e.done ? Object.assign({ log: e }, PV.PROMPTS.find(x => x.id === e.id)) : null;
  }
  const qText = pr => (PV.lang === 'en' && pr.en ? pr.en : pr.q);
  function renderQday() {
    const pr = todayPrompt(), box = $('#qday'); box.hidden = !pr; if (!pr) return;
    box.innerHTML = `<p class="k"><span>${T('вопрос дня · можно пропустить')}</span></p><b>${U.esc(qText(pr))}</b><div class="row"><button class="btn white small" type="button" id="q-ans">${T('Ответить')}</button><button class="skip" type="button" id="q-skip">${T('Не сегодня')}</button></div>`;
    $('#q-ans').onclick = () => { draft().prompt = pr; location.hash = 'new'; setTimeout(() => { const a = $('#cmp-ans'); if (a) a.focus(); }, 80); };
    $('#q-skip').onclick = async () => { pr.log.skip = true; await DB.put('meta', 'profile', st.profile); renderQday(); };
  }

  /* ---------- «Добавить сегодняшний день»: материалы дня → генерация ---------- */
  const draft = () => st.draft || (st.draft = { text: '', mood: '', moodText: '', media: [], song: '', place: '', extra: '', prompt: undefined, answer: '' });
  const canGen = D => !!(D.text.trim() || D.media.length || D.answer.trim() || D.moodText.trim());
  function renderCompose() {
    const D = draft(), now = new Date();
    if (D.prompt === undefined) D.prompt = todayPrompt();
    $('#cmp-date').textContent = `${T('сегодня')} · ${T(WD[now.getDay()])}, ${now.getDate()} ${U.MONTHS[now.getMonth()]}`;
    const tx = $('#cmp-text'); tx.value = D.text; tx.oninput = () => { D.text = tx.value; validate(); };
    $('#cmp-moods').innerHTML = PV.MOOD_KEYS.map(k => `<button type="button" data-mood="${k}" class="${D.mood === k ? 'on' : ''}"><i style="background:${PV.MOOD_COLORS[k]}"></i>${T(PV.MOOD_NAMES[k])}</button>`).join('') + `<button type="button" data-mood="own" class="${D.mood === 'own' ? 'on' : ''}">✎ ${T('Своими словами')}</button>`;
    const own = $('#cmp-own'); own.hidden = D.mood !== 'own'; own.value = D.moodText; own.oninput = () => { D.moodText = own.value; validate(); };
    $$('[data-mood]').forEach(b => b.onclick = () => { D.mood = D.mood === b.dataset.mood ? '' : b.dataset.mood; $$('[data-mood]').forEach(x => x.classList.toggle('on', x.dataset.mood === D.mood)); own.hidden = D.mood !== 'own'; if (D.mood === 'own') own.focus(); validate(); });
    [['#cmp-song', 'song'], ['#cmp-place', 'place'], ['#cmp-extra', 'extra']].forEach(([s, k]) => { const el = $(s); el.value = D[k]; el.oninput = () => { D[k] = el.value; }; });
    renderMedia(); renderCmpQ(); validate();
    $('#cmp-gen').onclick = runCompose;
  }
  function renderMedia() {
    const D = draft();
    $('#cmp-media').innerHTML = D.media.map((m, i) => `<div class="m${i ? '' : ' main'}" data-main="${T('главное')}"><img src="${m.url}" alt="">${m.type === 'video' ? `<span class="vid">▶ ${T('видео')}</span>` : ''}<button type="button" data-rm="${i}" aria-label="${T('Убрать')}">✕</button></div>`).join('') + `<label class="add"><b>+</b>${D.media.length ? T('ещё') : T('фото или видео')}<input type="file" id="cmp-file" accept="image/*,video/*" multiple hidden></label>`;
    $$('[data-rm]').forEach(b => b.onclick = () => { D.media.splice(+b.dataset.rm, 1); renderMedia(); validate(); });
    $('#cmp-file').onchange = async e => { await addDraftMedia([...e.target.files]); e.target.value = ''; };
  }
  async function addDraftMedia(files) {
    const D = draft();
    for (const f of files) {
      try {
        if (f.type.startsWith('image/')) { const b = await U.downscale(f, 1600); const { asp } = await analyzePhoto(b); D.media.push({ type: 'photo', blob: b, asp, url: URL.createObjectURL(b) }); }
        else if (f.type.startsWith('video/')) { const v = await videoPoster(f); D.media.push({ type: 'video', blob: f, poster: v.poster, asp: v.asp, url: URL.createObjectURL(v.poster) }); if (v.dur > 5.2) toast(T('Видео {n} с — в дневнике будет крутиться первые 5 секунд', { n: Math.round(v.dur) }), 3000); }
      } catch (er) { console.error(er); toast(T('Не получилось открыть файл')); }
      renderMedia(); validate();
    }
  }
  function renderCmpQ() {
    const D = draft(), box = $('#cmp-q'); box.hidden = !D.prompt; if (!D.prompt) return;
    box.innerHTML = `<button type="button" class="qx" id="cmp-qx">${T('убрать')}</button><p class="k" style="position:relative">${T('вопрос дня')}</p><b>${U.esc(qText(D.prompt))}</b><div class="rowi"><i>✦</i><input id="cmp-ans" placeholder="${U.esc(PV.lang === 'en' ? D.prompt.ph_en || '' : D.prompt.ph || '')}"></div>`;
    const a = $('#cmp-ans'); a.value = D.answer; a.oninput = () => { D.answer = a.value; validate(); };
    $('#cmp-qx').onclick = () => { D.prompt = null; D.answer = ''; renderCmpQ(); validate(); };
  }
  function validate() { const ok = canGen(draft()); $('#cmp-gen').disabled = !ok; $('#cmp-hint').hidden = ok; }
  function parseSong(s) {
    s = (s || '').trim(); if (!s) return null;
    if (/^https?:\/\//i.test(s) || /\.(com|ru|be|kz)\//i.test(s)) return { link: /^https?:/i.test(s) ? s : 'https://' + s, artist: '', title: '' };
    const m = s.split(/\s+[—–-]\s+/); return m.length > 1 ? { artist: m[0], title: m.slice(1).join(' — '), link: '' } : { artist: '', title: s, link: '' };
  }
  async function runCompose() {
    const D = draft(); if (!canGen(D)) return;
    const btn = $('#cmp-gen'); btn.disabled = true;
    const d = newDay(); d.diaryId = curDiary().id;
    D.media.forEach((m, i) => { const k = (m.type === 'video' ? 'm' : 'p') + U.uid(); d.blobs[k] = m.blob; const it = { id: U.uid(), type: m.type, key: k, asp: m.asp, frame: 'round', x: 270, y: 350, w: 300, rot: 0, page: 0, z: 10 + i }; if (m.type === 'video') { d.blobs[k + '_poster'] = m.poster; it.poster = k + '_poster'; } d.items.push(it); });
    const pr = D.prompt && D.answer.trim() ? { id: D.prompt.id, kind: D.prompt.kind, q: D.prompt.q, en: D.prompt.en, answer: D.answer.trim() } : null;
    d.input = { text: D.text.trim(), mood: D.mood === 'own' ? '' : D.mood, moodText: D.mood === 'own' ? D.moodText.trim() : '', place: D.place.trim(), extra: D.extra.trim(), prompt: pr };
    d.notes = { text: [D.text.trim(), D.extra.trim(), pr ? qText(pr) + ' — ' + pr.answer : ''].filter(Boolean).join('\n\n'), paper: 'pink' };
    const sg = parseSong(D.song); if (sg) { d.song = sg; if (sg.link && PV.fetchSongTitle) { try { const t = await Promise.race([PV.fetchSongTitle(sg.link), U.sleep(2500)]); if (t) Object.assign(sg, { artist: t.artist || '', title: t.title || '' }); } catch (e) { } } }
    const t0 = performance.now(); showGen(aiCfg.key ? T('Gemini смотрит на фото…') : '');
    try {
      const g = await generateDay(d, { density: PV.taste.density(st.profile) });
      await genSteps(g, d, t0);
      d.thumb = await drawDay(d, .45, true); await DB.put('days', d.id, d); st.days = await DB.all('days');
      if (pr && D.prompt.log) { D.prompt.log.done = true; await DB.put('meta', 'profile', st.profile); }
      D.media.forEach(m => URL.revokeObjectURL(m.url)); st.draft = null;
      location.hash = 'day-' + d.id;
    } catch (e) { console.error(e); toast(T('Не получилось собрать страницу — попробуй ещё раз')); }
    finally { $('#genov').hidden = true; btn.disabled = false; }
  }
  function showGen(p) {
    $('#gsteps').innerHTML = ''; $('#gen-p').textContent = p || T('свет фото, слова, ритм песни и твой стиль');
    ['--o1', '--o2', '--o3'].forEach(k => $('#gorb').style.removeProperty(k)); $('#genov').hidden = false;
  }
  async function genSteps(g, d, t0) {
    const s = g.steps, pal = s.palette.length ? s.palette : g.palette.slice(1, 4);
    ['--o1', '--o2', '--o3'].forEach((k, i) => $('#gorb').style.setProperty(k, pal[i % pal.length] || g.palette[i]));
    $('#gen-p').textContent = T('свет фото, слова, ритм песни и твой стиль');
    const rows = [];
    if (s.photos) rows.push([T('Смотрю на свет и цвета фото'), pal.slice(0, 4).map(c => `<u style="background:${c}"></u>`).join('')]);
    if (d.input.text || (d.input.prompt && d.input.prompt.answer)) rows.push([T('Читаю твои слова'), U.esc(s.words.join(', '))]);
    if (d.ai) rows.push([T('Gemini посмотрел, что на фото'), U.esc((d.ai.objects || []).slice(0, 3).join(', '))]);
    if (s.music) rows.push([T('Слушаю ритм песни'), s.music]);
    if (s.vibe) rows.push([T('Учитываю твой стиль'), '']);
    rows.push([T('Собираю композицию'), T(PV.MOOD_NAMES[g.mood]).toLowerCase()]);
    $('#gsteps').innerHTML = rows.map(([a, b]) => `<div><i>✓</i>${a}<small>${b}</small></div>`).join('');
    for (const el of $$('#gsteps div')) { await U.sleep(360); el.classList.add('on'); }
    const rest = 2700 - (performance.now() - t0); if (rest > 0) await U.sleep(rest);
  }
  async function videoPoster(f) {
    const v = document.createElement('video'); v.muted = true; v.src = URL.createObjectURL(f); v.playsInline = true;
    await new Promise(r => { v.onloadeddata = r; v.onerror = r; });
    v.currentTime = Math.min(.5, v.duration / 2 || 0); await new Promise(r => { v.onseeked = r; setTimeout(r, 800); });
    const c = U.canvas(v.videoWidth || 320, v.videoHeight || 240); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const dur = v.duration; URL.revokeObjectURL(v.src);
    return { poster: await U.canvasToBlob(c), asp: c.height / c.width, dur };
  }
  function renderFriends() {
    const fs = st.friends.slice().sort((a, b) => b.added - a.added);
    $('#friend-days').innerHTML = fs.length ? fs.map(f => `<a class="day-card" href="#friend-${f.id}" style="--r:${(U.hash(f.id) % 60) / 10 - 3}deg"><img src="${f.day.thumb || ''}" alt=""><b>${U.esc(f.day.title || T('день'))}</b><span>${U.fmtDate(f.day.date)}</span><br><span class="who">${U.esc(f.from)} ${(f.reactions || []).join('')}</span></a>`).join('') : `<p class="empty">${T('Пока пусто. Попроси подругу нажать «Поделиться» в своём дне и прислать файл.')}</p>`;
  }
  function startNew() { location.hash = 'new'; }
  function openEditor(d, ro, friend) {
    st.cur = d; st.ro = !!ro; st.curFriend = friend || null; st.sel = null; st.dirty = false;
    $('#ed-title').value = d.title || ''; $('#ed-date').value = d.date; $('#ed-title').readOnly = $('#ed-date').readOnly = st.ro;
    $('#ed-save').hidden = st.ro; $('#ed-png').hidden = false; $('.seg').hidden = st.ro;
    $('#ed-share').querySelector('span').textContent = st.ro ? T('Отправить ответ') : T('Поделиться'); $('#ed-undo').hidden = st.ro;
    let fbar = $('#fbar'); if (fbar) fbar.remove();
    if (st.ro) {
      const emo = ['❤️', '🥺', '😭', '😂', '🔥', '✨', '🌸'];
      $('#dock').insertAdjacentHTML('afterbegin', `<div class="tools" id="fbar"><div class="react">${emo.map(e => `<button type="button" data-e="${e}" class="${(friend.reactions || []).includes(e) ? 'on' : ''}">${e}</button>`).join('')}</div><button class="tool" type="button" id="f-note"><svg><use href="#i-secret"/></svg>${T('Записка')}</button><button class="tool magic" type="button" id="f-joint"><svg><use href="#i-tpl"/></svg>${T('Общий разворот')}</button></div>`);
      $$('[data-e]').forEach(b => b.onclick = async () => { const e = b.dataset.e; friend.reactions = friend.reactions || []; const i = friend.reactions.indexOf(e); i >= 0 ? friend.reactions.splice(i, 1) : friend.reactions.push(e); b.classList.toggle('on'); st.cur.friendReactions = friend.reactions; await saveFriend(); });
      $('#f-note').onclick = () => sheetSecret(null);
      $('#f-joint').onclick = () => jointSpread(friend);
    }
    $('#ed-edit').hidden = $('#ed-done').hidden = st.ro;
    renderSpread(); st.hist = []; commit(); setAccent(d.palette);
    setMode(st.ro ? 'edit' : 'result'); syncAi();
  }
  async function jointSpread(f) {
    const d = newDay(); d.pages = 2; d.diaryId = curDiary().id; d.title = T('Наш день с {name}', { name: f.from });
    d.bg2 = f.day.bg; d.bg2owner = f.from; d.blobs = Object.assign({}, f.day.blobs);
    d.items = f.day.items.filter(i => (i.page || 0) === 0).map(i => Object.assign({}, i, { id: U.uid(), page: 1, lock: 1, ocOf: i.type === 'oc' ? f.oc : undefined }));
    await DB.put('days', d.id, d); st.days = await DB.all('days'); location.hash = 'day-' + d.id; toast(T('Левая страница — твоя, правая — {name}', { name: f.from }), 3500);
  }

  function showWhy(d) {
    const box = $('#modal-box'); $('#modal').hidden = false;
    box.innerHTML = `<div class="sheet-head"><b style="font:600 22px var(--h);letter-spacing:-.04em">${T('Почему день выглядит так')}</b><button class="x" type="button" id="wy-x">✕</button></div>
      ${d.why && d.why.length ? `<ol class="why">${d.why.map(w => `<li>${w}</li>`).join('')}</ol><div class="swatches">${(d.palette || []).map(c => `<i style="width:36px;height:36px;border-radius:50%;background:${c};display:inline-block"></i>`).join('')}</div><p class="note">${T('Цвета страницы — из фото дня. Это интерпретация для оформления, а не психологическая оценка.')}</p>` : `<p class="sub">${T('Нажми «Другой вариант» — и я объясню, почему страница выглядит именно так.')}</p>`}`;
    $('#wy-x').onclick = () => $('#modal').hidden = true;
  }
  async function exportFolder(d) {
    const dir = U.safeName(d.title || 'Мой день') + '/', files = [];
    files.push({ name: dir + 'запись.txt', data: `${d.title || 'Мой день'}\n${U.fmtDate(d.date)}${d.time ? ', ' + d.time : ''}\n\n${(d.notes && d.notes.text) || ''}\n` });
    let n = 0; d.items.filter(i => i.type === 'photo').forEach(i => { if (d.blobs[i.key]) files.push({ name: `${dir}фото_${++n}.jpg`, data: d.blobs[i.key] }); });
    d.items.filter(i => i.type === 'video').forEach((i, k) => d.blobs[i.key] && files.push({ name: `${dir}видео_${k + 1}.${(d.blobs[i.key].type.split('/')[1] || 'mp4').split(';')[0]}`, data: d.blobs[i.key] }));
    d.items.filter(i => i.type === 'secret' && i.voice).forEach((i, k) => d.blobs[i.voice] && files.push({ name: `${dir}голосовое_${k + 1}.${d.blobs[i.voice].type.includes('wav') ? 'wav' : 'webm'}`, data: d.blobs[i.voice] }));
    d.items.filter(i => i.type === 'secret' && i.text).forEach((i, k) => files.push({ name: `${dir}секрет_${k + 1}.txt`, data: i.text }));
    if (d.song) { if (d.song.audioKey && d.blobs[d.song.audioKey]) files.push({ name: dir + 'песня — ' + U.safeName(d.song.audioName || 'файл'), data: d.blobs[d.song.audioKey] }); files.push({ name: dir + 'песня.txt', data: `${[d.song.artist, d.song.title].filter(Boolean).join(' — ')}\n${d.song.link || ''}\n` }); }
    files.push({ name: dir + 'страница.jpg', data: await dataToBlob(await drawDay(d, 2)) });
    if (d.video) files.push({ name: dir + 'видео дня.' + (d.videoExt || 'webm'), data: d.video });
    files.push({ name: dir + 'почему так.json', data: JSON.stringify({ название: d.title, дата: d.date, настроение: d.mood, температура: d.temp, палитра: d.palette, фон: d.bg, песня: musicOf(d), почему: (d.why || []).map(w => w.replace(/<[^>]+>/g, '')) }, null, 2) });
    const zip = await PV.makeZip(files); U.download(zip, U.safeName(d.title || 'день') + '.zip'); toast(`Папка «${d.title}» — ${files.length} файлов`);
  }
  function speakNotes(d) {
    if (!('speechSynthesis' in window)) return toast('Браузер не умеет озвучивать');
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    const t = (d.notes && d.notes.text) || d.title; if (!t) return toast('Сначала напиши заметку');
    const M = musicOf(d), E = M ? M.energy : .4, calm = d.mood === 'night' || (M && M.mode === 'minor');
    const vs = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang)).sort((p, q) => (/natural|online|neural|google/i.test(q.name) ? 1 : 0) - (/natural|online|neural|google/i.test(p.name) ? 1 : 0));
    const male = /dmitry|pavel|yuri|maxim|муж/i, pick = vs.filter(v => calm ? true : !male.test(v.name));
    const u = new SpeechSynthesisUtterance(t); u.lang = 'ru-RU'; if (pick.length) u.voice = pick[0];
    u.rate = calm ? .85 : .95 + E * .2; u.pitch = calm ? .9 : 1.05; speechSynthesis.speak(u);
  }

  /* ---------- прожить день заново ---------- */
  function replay(d) {
    const rp = $('#replay'); const two = d.pages === 2;
    const pal = d.palette && d.palette.length ? d.palette : ['#ff5a36', '#7a6cff', '#ffd27a'];
    rp.innerHTML = `<div class="rp-bg" style="background:radial-gradient(40% 40% at 25% 30%,${pal[0]},transparent 70%),radial-gradient(45% 40% at 75% 60%,${pal[1] || pal[0]},transparent 70%),radial-gradient(40% 40% at 50% 90%,${pal[2] || pal[0]},transparent 70%)"></div>
      <p class="rp-note" id="rp-note"></p><div class="rp-stage spread${two ? ' two' : ''}" id="rp-stage"></div>
      <div class="rp-ui">${rpSong(d)}<button class="btn" type="button" id="rp-voice">🔊 ${T('Озвучить заметку')}</button><button class="btn" type="button" id="rp-again">↺ ${T('Ещё раз')}</button><button class="btn" type="button" id="rp-x">${T('Закрыть')}</button></div>`;
    rp.hidden = false;
    const stage = $('#rp-stage'); const beat = d.beat || (musicOf(d) ? 60 / musicOf(d).bpm : 1.4); stage.style.setProperty('--beat', beat.toFixed(2) + 's');
    let au = null; if (d.song && d.song.audioKey && d.blobs[d.song.audioKey]) { au = new Audio(url(d.blobs, d.song.audioKey)); au.loop = true; au.play().catch(() => { }); }
    $('#rp-voice').onclick = () => speakNotes(d);
    const run = () => {
      stage.innerHTML = ''; const ro = st.ro; st.ro = true; let k = 0;
      for (let p = 0; p < d.pages; p++) {
        const pg = document.createElement('div'); pg.className = 'pg'; pg.style.background = bgCss(p === 1 && d.bg2 ? d.bg2 : d.bg);
        d.items.filter(i => (i.page || 0) === p).sort((a, b) => (a.z || 0) - (b.z || 0)).forEach(it => { const el = itemEl(it, d, d.blobs); el.classList.remove('sel'); el.style.setProperty('--tx', it.x + 'px'); el.style.setProperty('--ty', it.y + 'px'); el.style.setProperty('--r', (it.rot || 0) + 'deg'); el.style.animationDelay = (0.25 + k++ * 0.28) + 's'; pg.appendChild(el); });
        stage.appendChild(pg);
      }
      st.ro = ro;
      const sc = Math.min((innerWidth - 30) / (PW * d.pages), (innerHeight - 170) / PH); stage.style.transform = `scale(${sc})`; stage.style.marginTop = '40px';
      const note = (d.notes && d.notes.text) || ''; const ne = $('#rp-note'); ne.textContent = ''; let i = 0;
      setTimeout(function type() { if (rp.hidden) return; ne.textContent = note.slice(0, ++i); if (i < note.length) setTimeout(type, 35); }, 600 + k * 280);
      stage.querySelectorAll('.it').forEach(el => el.addEventListener('click', () => { const it = d.items.find(x => x.id === el.dataset.id); if (it && it.type === 'secret') { const c = st.cur; st.cur = d; openSecret(it); st.cur = c || d; } }));
    };
    run(); $('#rp-again').onclick = run; $('#rp-x').onclick = () => { if (au) au.pause(); try { speechSynthesis.cancel(); } catch (e) { } rp.hidden = true; rp.innerHTML = ''; };
  }
  function rpSong(d) {
    const sg = d.song, chip = d.items.find(i => i.type === 'link');
    if (sg && sg.audioKey) return `<span class="btn acc">♪ ${U.esc([sg.artist, sg.title].filter(Boolean).join(' — ') || T('песня дня'))}</span>`;
    const info = sg && sg.link ? PV.parseSongLink(sg.link) : null;
    if (info && info.embed) return `<iframe src="${U.esc(info.embed)}" height="80" style="width:min(420px,90vw);border:0;border-radius:14px" allow="autoplay; encrypted-media" title="${T('Песня дня')}"></iframe>`;
    return chip && chip.url ? `<a class="btn acc" href="${U.esc(chip.url)}" target="_blank" rel="noopener">♪ ${U.esc(chip.title)}</a>` : '';
  }
  function renderGallery() {
    const all = []; st.days.forEach(d => (d.items || []).forEach(i => { if ((i.type === 'photo' || i.type === 'video') && d.blobs) all.push({ d, i }); }));
    all.sort((a, b) => b.d.date.localeCompare(a.d.date));
    $('#gallery').innerHTML = all.length ? all.map(({ d, i }) => `<a href="#day-${d.id}"><img src="${url(d.blobs, i.type === 'video' ? i.poster : i.key)}" alt="" loading="lazy"><span>${U.esc(d.title || T('день'))} · ${U.fmtDate(d.date).replace(/ \d{4}$/, '')}</span></a>`).join('') : `<p class="empty">${T('Здесь появятся все фото из твоих дней.')}</p>`;
  }
  function memoryCard() {
    const today = U.todayISO().slice(5), yr = U.todayISO().slice(0, 4);
    const past = st.days.filter(d => d.thumb && d.items && d.items.length && (d.diaryId || 'main') === curDiary().id);
    if (!past.length) return '';
    const same = past.find(d => d.date.slice(5) === today && d.date.slice(0, 4) !== yr);
    const d = same || past[U.hash(U.todayISO()) % past.length];
    return `<a class="memory glass" href="#day-${d.id}" data-replay="${d.id}"><img src="${d.thumb}" alt=""><div><p class="k">${same ? T('в этот день, {n} год назад', { n: yr - d.date.slice(0, 4) }) : T('вспомни этот день')}</p><h3>${U.esc(d.title || T('Мой день'))}</h3><p>${U.fmtDate(d.date)}${d.notes && d.notes.text ? ' · ' + U.esc(d.notes.text.slice(0, 80)) + (d.notes.text.length > 80 ? '…' : '') : ''}</p><span class="btn white">▶ ${T('Прожить снова')}</span></div></a>`;
  }

  /* ---------- несколько дневников и полка-ярлык ---------- */
  const COVERS = [['#23252b', 'Графит'], ['#2f3a4f', 'Ночь'], ['#6c7a5b', 'Олива'], ['#c4563f', 'Терракота'], ['#8b7fd1', 'Лаванда'], ['#d9c29c', 'Крафт', 1], ['#e8e2d6', 'Лён', 1], ['#b88aa0', 'Пудра']];
  const PATTERNS = [['plain', 'Гладкая'], ['lines', 'Полоски'], ['grid', 'Клетка'], ['dots', 'Точки'], ['wave', 'Волна']];
  const THEMES = ['Личный', 'Путешествия', 'Учёба', 'Вдвоём с другом', 'Лето', 'Спорт', 'Мечты'];
  function coverCss(c) {
    const col = c.color || '#23252b', pt = c.pattern || 'plain';
    const pat = { lines: 'repeating-linear-gradient(135deg,#ffffff14 0 10px,transparent 10px 20px),', grid: 'linear-gradient(#ffffff1a 1px,transparent 1px) 0 0/14px 14px,linear-gradient(90deg,#ffffff1a 1px,transparent 1px) 0 0/14px 14px,', dots: 'radial-gradient(#ffffff2e 1.4px,transparent 1.8px) 0 0/12px 12px,', wave: 'radial-gradient(120% 60% at 0% 100%,#ffffff22 30%,transparent 31%),radial-gradient(120% 60% at 100% 0%,#00000018 30%,transparent 31%),', plain: '' }[pt];
    return `background:${pat}linear-gradient(160deg,#ffffff1f,transparent 50%),${col}`;
  }
  const isLight = c => (COVERS.find(x => x[0] === c.color) || [])[2];
  const diaries = () => { st.profile.diaries = st.profile.diaries || [{ id: 'main', name: 'Мой дневник', color: '#23252b', pattern: 'plain', theme: 'Личный' }]; return st.profile.diaries; };
  const curDiary = () => diaries().find(d => d.id === st.diary) || diaries()[0];
  function renderShelf() {
    const sh = $('#shelf'); sh.hidden = !st.profile; $('#shelf-dim').hidden = !st.profile;
    if (!st.profile) return;
    const cnt = id => st.days.filter(x => (x.diaryId || 'main') === id).length;
    $('#shelf-panel').innerHTML = `<h4>${T('Дневники')} <small>${diaries().length}</small></h4><button type="button" class="dadd" id="shelf-add" aria-label="${T('Создать дневник')}"><b>+</b>${T('новый')}</button><div class="shelf-row">${diaries().map(d => `<div class="shelf-item"><button type="button" class="dcover${d.id === curDiary().id ? ' on' : ''}${isLight(d) ? ' light' : ''}" data-diary="${d.id}" style="${coverCss(d)}" aria-label="${U.esc(d.name)}"><span>${U.esc(T(d.theme || ''))}</span></button><small>${U.esc(d.name)}<i>${cnt(d.id)} ${cnt(d.id) === 1 ? T('день') : cnt(d.id) > 1 && cnt(d.id) < 5 ? T('дня') : T('дней')}</i></small></div>`).join('')}</div>`;
    $$('[data-diary]').forEach(b => b.onclick = async () => { st.diary = b.dataset.diary; await DB.put('meta', 'curDiary', st.diary); shelf(false); location.hash = 'home'; route(); toast(T('Открыт дневник «{name}»', { name: curDiary().name }), 1600); });
    $('#shelf-add').onclick = () => { shelf(false); newDiaryModal(); };
    requestAnimationFrame(() => sh.style.setProperty('--pw', $('#shelf-panel').offsetWidth + 'px'));
  }
  function shelf(open) { $('#shelf').classList.toggle('open', open); }
  function initShelf() {
    const sh = $('#shelf'), hd = $('#shelf-handle'), pn = $('#shelf-panel'); let x0 = null, dx = 0, w = 0, wasOpen = false;
    hd.addEventListener('pointerdown', e => { x0 = e.clientX; dx = 0; w = pn.offsetWidth; wasOpen = sh.classList.contains('open'); sh.classList.add('drag'); hd.setPointerCapture(e.pointerId); });
    hd.addEventListener('pointermove', e => { if (x0 == null) return; dx = e.clientX - x0; const off = wasOpen ? U.clamp(dx, -w, 0) : U.clamp(-w + dx, -w, 0); sh.style.transform = `translateX(${off}px)`; });
    const up = () => { if (x0 == null) return; sh.classList.remove('drag'); sh.style.transform = ''; const tap = Math.abs(dx) < 6; shelf(tap ? !wasOpen : wasOpen ? dx > -40 : dx > 40); x0 = null; };
    hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    // свайп влево по самой панели — закрыть
    let px = null; pn.addEventListener('pointerdown', e => { px = e.clientX; }); pn.addEventListener('pointerup', e => { if (px != null && e.clientX - px < -50) shelf(false); px = null; });
    $('#shelf-dim').addEventListener('click', () => shelf(false));
  }
  function newDiaryModal() {
    const d = { id: U.uid(), name: '', color: '#2f3a4f', pattern: 'plain', theme: 'Личный' };
    const box = $('#modal-box'); $('#modal').hidden = false;
    const draw = () => {
      box.innerHTML = `<div class="sheet-head"><b style="font:600 22px var(--h);letter-spacing:-.04em">${T('Новый дневник')}</b><button class="x" type="button" id="nd-x">✕</button></div>
        <div class="new-diary"><div class="cover-prev${isLight(d) ? ' light' : ''}" style="${coverCss(d)}"><small>${U.esc(T(d.theme))}</small><b>${U.esc(d.name || T('Название'))}</b><small>${st.profile.name} · ${U.todayISO().slice(0, 4)}</small></div>
        <div><div class="field"><span>${T('Как назовём')}</span><input id="nd-name" maxlength="28" placeholder="${T('Например: Лето на Иссык-Куле')}" value="${U.esc(d.name)}"></div>
          <h3>${T('О чём он')}</h3><div class="chips">${THEMES.map(t => `<button type="button" data-th="${t}" class="${d.theme === t ? 'on' : ''}">${T(t)}</button>`).join('')}</div>
          <h3>${T('Обложка')}</h3><div class="swatches">${COVERS.map(([c, n]) => `<button type="button" data-cc="${c}" title="${T(n)}" style="background:${c};${d.color === c ? 'box-shadow:0 0 0 2px #121212' : ''}"></button>`).join('')}</div>
          <div class="chips">${PATTERNS.map(([k, n]) => `<button type="button" data-pt="${k}" class="${d.pattern === k ? 'on' : ''}">${n}</button>`).join('')}</div>
          <div class="row"><button class="btn pink big" type="button" id="nd-ok">${T('Создать дневник')}</button></div></div></div>`;
      const nm = $('#nd-name'); nm.oninput = () => { d.name = nm.value; box.querySelector('.cover-prev b').textContent = d.name || T('Название'); };
      $$('[data-th]', box).forEach(b => b.onclick = () => { d.theme = b.dataset.th; if (!d.name) d.name = d.theme === 'Личный' ? '' : T(d.theme); draw(); });
      $$('[data-cc]', box).forEach(b => b.onclick = () => { d.color = b.dataset.cc; draw(); });
      $$('[data-pt]', box).forEach(b => b.onclick = () => { d.pattern = b.dataset.pt; draw(); });
      $('#nd-x').onclick = () => $('#modal').hidden = true;
      $('#nd-ok').onclick = async () => { d.name = (d.name || '').trim() || d.theme; diaries().push(d); st.diary = d.id; await DB.put('meta', 'profile', st.profile); await DB.put('meta', 'curDiary', d.id); $('#modal').hidden = true; location.hash = 'home'; route(); toast(T('Дневник «{name}» создан — добавь первый день', { name: d.name }), 2600); };
      nm.focus();
    };
    draw();
  }

  /* ---------- персонаж и регистрация ---------- */
  function ocEditor(oc, onDone, first) {
    oc = Object.assign({}, PV.OC_DEFAULT, oc);
    const box = $('#modal-box');
    const human = () => oc.kind === 'girl' || oc.kind === 'boy';
    const opts = (arr, key) => `<div class="chips">${arr.map(([k, n]) => `<button type="button" data-${key}="${k}" class="${oc[key] === k ? 'on' : ''}">${T(n)}</button>`).join('')}</div>`;
    const cols = (arr, key) => `<div class="swatches">${arr.map(c => `<button type="button" data-${key}="${c}" style="background:${c}"></button>`).join('')}</div>`;
    const draw = () => {
      box.innerHTML = `${first ? `<p class="pill">${T('шаг 2 из 3')}</p>` : ''}<h2 style="margin-bottom:14px">${first ? T('Создай своего персонажа') : T('Мой персонаж')}</h2>
        <div class="oc-ed"><div class="oc-stage">${PV.ocSvg(oc)}</div><div>
          <h3>${T('Кто это')}</h3>${opts(PV.OC_KINDS, 'kind')}
          ${human() ? `<h3>${T('Кожа')}</h3>${cols(PV.OC_SKIN, 'skin')}<h3>${T('Причёска')}</h3>${opts(PV.OC_HAIRSTYLE, 'style')}<h3>${T('Цвет волос')}</h3>${cols(PV.OC_HAIR, 'hair')}` : `<h3>${T('Шёрстка')}</h3>${cols(PV.OC_FUR, 'fur')}`}
          <h3>${T('Глазки')}</h3>${opts(PV.OC_EYES, 'eyes')}<h3>${T('Аксессуар')}</h3>${opts(PV.OC_ACC, 'acc')}<h3>${T('Одежда')}</h3>${cols(['#2f3a4f', '#e8e2d6', '#c4563f', '#6c7a5b', '#7a8fd1', '#d9a441', '#121212', '#b88aa0'], 'outfit')}
          <div class="row"><label class="btn ghost">📷 ${T('Создать по моему фото')}<input type="file" accept="image/*" id="oc-photo" hidden></label><button class="btn pink" id="oc-ok" type="button">${first ? T('Готово, в дневник!') : T('Сохранить')}</button></div>
          <p class="note">${T('По фото я подберу цвет кожи и волос. Фото никуда не отправляется.')}</p></div></div>`;
      ['kind', 'style', 'eyes', 'acc', 'skin', 'hair', 'fur', 'outfit'].forEach(k => $$(`[data-${k}]`, box).forEach(b => b.onclick = () => { oc[k] = b.dataset[k]; draw(); }));
      $('#oc-photo', box).onchange = async e => { const f = e.target.files[0]; if (!f) return; const im = await U.blobToImage(f); const c = U.canvas(60, 80), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, 60, 80); const avg = (sx, sy, w, h) => { const d = x.getImageData(sx, sy, w, h).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return [r / n, g / n, b / n]; }; const near = (rgb, arr) => arr.slice().sort((a, b) => dist(hexRgb(a), rgb) - dist(hexRgb(b), rgb))[0]; const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2; oc.kind = oc.kind === 'boy' ? 'boy' : 'girl'; oc.skin = near(avg(22, 30, 16, 16), PV.OC_SKIN); oc.hair = near(avg(18, 4, 24, 10), PV.OC_HAIR); URL.revokeObjectURL(im.src); draw(); toast(T('Подобрала цвета по фото — допиши детали')); };
      $('#oc-ok', box).onclick = () => onDone(oc);
    };
    $('#modal').hidden = false; draw();
  }
  function onboarding() {
    const box = $('#modal-box'); $('#modal').hidden = false;
    box.innerHTML = `<p class="pill">${T('шаг 1 из 3')}</p><h2>${T('Привет! Это твой дневник ♡')}</h2><p class="sub">${T('Здесь каждый день превращается в страничку, которую хочется пережить заново. Регистрация — только имя, всё хранится у тебя.')}</p>
      <div class="field"><span>${T('Как тебя зовут?')}</span><input id="ob-name" maxlength="24" placeholder="${T('Например, Аружан')}"></div><button class="btn pink big" id="ob-next" type="button">${T('Дальше →')}</button>`;
    $('#ob-name').focus();
    $('#ob-next').onclick = () => { const name = $('#ob-name').value.trim(); if (!name) return toast(T('Напиши имя')); ocEditor(PV.OC_DEFAULT, async oc => { st.profile = { name, oc, created: Date.now() }; await DB.put('meta', 'profile', st.profile); vibeQuiz(async v => { await saveVibe(v); $('#modal').hidden = true; toast(T('Собираю дневник под твой вайб…'), 2500); await seedDemo(); route(); }, true); }, true); };
  }
  // пример дня, чтобы было что открыть сразу
  // демо-дни: культовые моменты, собранные тем же автоподбором (фото → фон и цвета, заметка → название, песня → ритм и стикеры)
  async function seedDemo(force) {
    if (!PV.DEMO) return;
    if (!force && (await DB.get('meta', 'demo-scrap-v2'))) return;
    const densities = [0, 1, 0, 1, -1, 0], secrets = { 0: 'Помнишь его толстовку и как пахло какао? Через год прочитай это ещё раз ♡', 2: 'Мы обещали не теряться. Напиши им сегодня.', 5: 'Это пройдёт. Честно. Ты справилась ✦' };
    const list = PV.DEMO.slice();
    for (let i = 0; i < list.length; i++) {
      const D = list[i], d = newDay(); d.diaryId = 'main'; d.demo = 1; d.date = D.date; d.time = D.time; d.title = '';
      d.notes = { text: D.text, paper: ['pink', 'grid', 'crumpled', 'rainbow', 'narrow', 'black'][i % 6] };
      const blobs = await PV.demoPhotos(D, i);
      for (let k = 0; k < blobs.length; k++) { const key = 'p' + U.uid(); d.blobs[key] = blobs[k]; d.items.push({ id: U.uid(), type: 'photo', key, asp: 900 / 1200, frame: 'round', x: 270, y: 350, w: k ? 150 : 340, rot: 0, page: 0, z: 10 + k }); }
      d.song = { link: D.song.link, artist: D.song.artist, title: D.song.title, genre: D.song.genre, year: D.song.year, mode: D.song.mode, tempo: D.song.tempo };
      d.input = { text: D.text, mood: '', moodText: '', place: '', extra: '' };
      st.cur = d; await generateDay(d, { seed: 1000 + i * 7, density: densities[i % 6], ai: false });
      if (secrets[i]) d.items.push({ id: U.uid(), type: 'secret', kind: i === 5 ? 'gift' : 'envelope', text: secrets[i], x: 452, y: 500, w: 92, rot: 10, page: 0, z: 70 });
      d.thumb = await drawDay(d, .45, true);
      await DB.put('days', d.id, d);
    }
    st.cur = null; st.days = await DB.all('days'); await DB.put('meta', 'demo-scrap-v2', true);
  }

  /* ---------- маршруты ---------- */
  async function leaveEditor() { if (st.cur && st.dirty && !st.ro) await saveDay(true); else if (st.cur && st.ro && st.curFriend) await saveFriend(); }
  async function route() {
    const h = location.hash.slice(1) || 'home';
    if (!h.startsWith('day-') && !h.startsWith('friend-')) { await leaveEditor(); st.cur = null; }
    const v = h.startsWith('day-') || h.startsWith('friend-') ? 'edit' : ['home', 'friends', 'me', 'photos', 'new'].includes(h) ? h : 'home';
    $$('.view').forEach(x => x.hidden = x.id !== 'v-' + v);
    document.body.classList.toggle('in-edit', v === 'edit'); document.body.classList.toggle('in-new', v === 'new'); $('#ed-menu').hidden = true;
    if (v !== 'edit') document.body.classList.remove('mode-edit');
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === v));
    renderShelf(); if (v === 'edit' || v === 'new') { $('#shelf').hidden = true; shelf(false); }
    if (st.profile) { $('#me-ava').innerHTML = PV.ocSvg(st.profile.oc); $('#me-name').textContent = st.profile.name.charAt(0).toUpperCase() + st.profile.name.slice(1); }
    if (v === 'home') renderHome();
    if (v === 'friends') renderFriends();
    if (v === 'photos') renderGallery();
    if (v === 'me') { $('#me-oc').innerHTML = PV.ocSvg(st.profile.oc); $('#me-h').textContent = st.profile.name; $('#ai-key').value = aiCfg.key || ''; $('#ai-model').value = aiCfg.model || ''; }
    if (v === 'new') renderCompose();
    if (h.startsWith('day-')) { const d = st.days.find(x => x.id === h.slice(4)) || await DB.get('days', h.slice(4)); if (!d) return location.hash = 'home'; d.blobs = d.blobs || {}; openEditor(d, false); }
    if (h.startsWith('friend-')) { const f = st.friends.find(x => x.id === h.slice(7)); if (!f) return location.hash = 'friends'; openEditor(f.day, true, f); }
    window.scrollTo(0, 0);
  }

  async function init() {
    $('#sheet-x').onclick = closeSheet; $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && st.profile) $('#modal').hidden = true; });
    $('#new-day').onclick = startNew;
        $('#add-video').onchange = e => { const f = e.target.files[0]; if (f) addVideo(f); e.target.value = ''; };
    $$('[data-sheet]').forEach(b => b.onclick = () => ({ song: sheetSong, photo: sheetPhoto, stickers: () => sheetStickers(), templates: sheetTemplates, widgets: sheetWidgets, secrets: () => sheetSecret(null), bg: sheetBg })[b.dataset.sheet]());
    $$('[data-act]').forEach(b => b.onclick = () => {
      const a = b.dataset.act;
      if (a === 'text') { const it = addItem({ type: 'text', text: T('мой день'), font: 'Caveat', size: 44, color: '#121212', x: 270, y: 640, w: 380, rot: -2, bgs: 'none', align: 'center' }); sheetText(it); }
      if (a === 'link') sheetLink(null);
      if (a === 'oc') addItem({ type: 'oc', x: 110, y: 640, w: 130, rot: -5 });
    });
    $$('[data-it]').forEach(b => b.onclick = () => {
      const it = curItem(); if (!it) return; const a = b.dataset.it;
      if (a === 'done') return select(null);
      if (a === 'del') return removeItem(it.id);
      if (a === 'dup') return addItem(Object.assign(JSON.parse(JSON.stringify(it)), { id: U.uid(), x: it.x + 24, y: it.y + 24, z: maxZ() + 1 }));
      if (a === 'up' || a === 'down') { const sorted = st.cur.items.filter(i => i.page === it.page).sort((x, y) => (x.z || 0) - (y.z || 0)); const i = sorted.indexOf(it), j = a === 'up' ? i + 1 : i - 1; if (sorted[j]) { const t = sorted[j].z || 0; sorted[j].z = it.z || 0; it.z = t === it.z ? t + (a === 'up' ? 1 : -1) : t; } st.dirty = true; renderSpread(); select(it.id); toast(a === 'up' ? T('Поверх соседей') : T('Под соседями'), 1200); return; }
      if (a === 'pos') return sheetPos(it);
      if (a === 'frame') return sheetFrame(it);
      if (a === 'color') return sheetColor(it);
      if (a === 'edit') return ({ text: sheetText, link: sheetLink, secret: sheetSecret, template: () => inlineEdit(it), date: sheetWidgetEdit, weather: sheetWidgetEdit })[it.type](it);
    });
    $$('.seg button').forEach(b => b.onclick = () => { st.cur.pages = +b.dataset.pages; st.dirty = true; renderSpread(); });
    $('#ed-save').onclick = async () => { await saveDay(true); PV.taste.learnSaved(st.profile, st.cur); await DB.put('meta', 'profile', st.profile); toast(T('Сохранено в дневник ♡')); location.hash = 'home'; };
    $('#ed-edit').onclick = () => setMode('edit'); $('#ed-done').onclick = () => setMode('result');
    $$('[data-ai]').forEach(b => b.onclick = () => b.dataset.ai === 'mood' ? sheetMood() : aiAct(b.dataset.ai));
    $('#ed-more').onclick = e => { e.stopPropagation(); $('#ed-menu').hidden = !$('#ed-menu').hidden; };
    document.addEventListener('click', e => { if (!e.target.closest('#ed-menu') && !e.target.closest('#ed-more')) $('#ed-menu').hidden = true; });
    $$('#ed-menu > button').forEach(b => b.addEventListener('click', () => { $('#ed-menu').hidden = true; }));
    $$('[data-lang]').forEach(b => { b.classList.toggle('on', b.dataset.lang === PV.lang); b.onclick = async () => { if (b.dataset.lang === PV.lang) return; await leaveEditor(); PV.setLang(b.dataset.lang); }; });
    $('#ai-save').onclick = async () => { aiCfg = { key: $('#ai-key').value.trim(), model: $('#ai-model').value.trim() }; await DB.put('meta', 'ai', aiCfg); $('#ai-st').textContent = aiCfg.key ? T('Ключ сохранён в этом браузере') : T('Ключ удалён — работает встроенный движок'); };
    $('#ai-test').onclick = async () => { const cfg = { key: $('#ai-key').value.trim(), model: $('#ai-model').value.trim() }; if (!cfg.key) return $('#ai-st').textContent = T('Сначала вставь ключ'); $('#ai-st').textContent = T('Проверяю…'); try { await PV.gemini.test(cfg); $('#ai-st').textContent = T('Gemini отвечает ✓'); } catch (e) { $('#ai-st').textContent = T('Ошибка: {e}', { e: e.message || e }); } };
    $('#ed-undo').onclick = undo; $('#ed-play').onclick = () => replay(st.cur);
    $('#ed-why').onclick = () => showWhy(st.cur); $('#ed-video').onclick = async () => { await saveDay(true); exportVideo(st.cur).catch(e => { console.error(e); toast(T('Не получилось записать видео')); }); }; $('#ed-zip').onclick = async () => { await saveDay(true); exportFolder(st.cur); };
    $('#search').oninput = e => { st.q = e.target.value; renderHome(); };
    $('#ed-share').onclick = () => shareDay();
    $('#ed-png').onclick = async () => { const u = await drawDay(st.cur, 2); U.download(await dataToBlob(u), U.safeName(st.cur.title || 'день') + '.jpg'); };
    $('#ed-title').oninput = e => { st.cur.title = e.target.value; st.dirty = true; };
    $('#ed-date').onchange = e => { st.cur.date = e.target.value; st.dirty = true; renderSpread(); };
    ['#import-home', '#import-friends'].forEach(s => $(s).onchange = e => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; });
    $('#edit-vibe').onclick = () => vibeQuiz(async v => { await saveVibe(v); $('#modal').hidden = true; route(); toast(T('Вайб обновлён')); });
    $('#edit-oc').onclick = () => ocEditor(st.profile.oc, async oc => { st.profile.oc = oc; await DB.put('meta', 'profile', st.profile); $('#modal').hidden = true; route(); });
    $('#backup').onclick = backup; $('#restore').onchange = e => { const f = e.target.files[0]; if (f) importFile(f); };
    addEventListener('resize', fit); addEventListener('hashchange', route);
    addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && st.cur && !e.target.closest('input,textarea,[contenteditable=true]')) { e.preventDefault(); undo(); return; } if ((e.key === 'Delete' || e.key === 'Backspace') && st.sel && !e.target.closest('input,textarea,[contenteditable=true]')) removeItem(st.sel); });
    initGestures(); initShelf();
    const wrap = $('#ed-wrap'); wrap.addEventListener('dragover', e => { e.preventDefault(); wrap.classList.add('drop'); }); wrap.addEventListener('dragleave', () => wrap.classList.remove('drop')); wrap.addEventListener('drop', async e => { e.preventDefault(); wrap.classList.remove('drop'); if (st.cur && !st.ro) { const fs = [...e.dataTransfer.files]; const vid = fs.find(f => f.type.startsWith('video/')); if (vid) await addVideo(vid); await addPhotos(fs.filter(f => f.type.startsWith('image/'))); } });
    PV.applyI18n(); aiCfg = (await DB.get('meta', 'ai')) || {};
    st.profile = await DB.get('meta', 'profile'); st.diary = await DB.get('meta', 'curDiary') || 'main'; st.days = await DB.all('days') || []; st.friends = await DB.all('friends') || [];
    if (DB.mem) toast(T('Браузер не даёт сохранять — дни проживут до закрытия вкладки'), 5000);
    if (st.profile) applyVibe();
    if (st.profile && !st.profile.vibe) { vibeQuiz(async v => { await saveVibe(v); $('#modal').hidden = true; route(); }, false); }
    if (!st.profile) onboarding(); else { if (!(await DB.get('meta', 'demo-scrap-v2'))) { toast(T('Добавляю примеры дней…'), 2500); await seedDemo(); } route(); }
  }
  // отрисовка дня в картинку нужна и снаружи: проверочные прогоны генератора
  PV.drawDay = drawDay; PV.newDay = newDay;
  init();
})(window.PV);
