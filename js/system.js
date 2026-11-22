/* ВИЗУАЛЬНАЯ СИСТЕМА: правила, по которым текст, фото и песня превращаются в форму страницы.
   Всё детерминировано и объяснимо: каждое решение сопровождается причиной (why). */
(function (PV) {
  const { U, L } = PV;

  PV.TECH = {
    monet: {
      name: 'Мазок и свет', ref: 'Клод Моне, импрессионизм',
      when: 'спокойные, тёплые, светлые дни; акустика, джаз, классика',
      why: 'Короткий мазок растворяет контуры: память хранит свет и цвет, а не детали. Медленные наплывы — как неспешный разговор.'
    },
    kandinsky: {
      name: 'Композиция', ref: 'Василий Кандинский, геометрическая абстракция; конструктивизм',
      when: 'напряжённые, быстрые, городские дни; электроника, техно',
      why: 'Жёсткая сетка, острые углы и пятна-удары передают давление и концентрацию. Кадры режутся точно в долю песни.'
    },
    film: {
      name: 'Плёнка', ref: 'любительская плёночная фотография 1970–90-х',
      when: 'ностальгия, семья, дача, песни прошлых десятилетий',
      why: 'Зерно, выцветшие тени и тёплая засветка читаются как «это было давно и по-настоящему».'
    },
    ma: {
      name: 'Ма — пустота', ref: 'японская минималистичная графика, понятие «ма», дождь штрихами Хиросигэ',
      when: 'тихие, медленные, одинокие дни; фортепиано, эмбиент, минор',
      why: 'Много пустого поля даёт воздух; одно цветовое пятно — одна мысль. Кадры почти не двигаются.'
    },
    collage: {
      name: 'Вырезки', ref: 'гуаши-вырезки Анри Матисса, коллаж дадаистов',
      when: 'шумные, людные, радостные дни; поп, рок, хип-хоп',
      why: 'Рваные края и яркие формы — много людей, голосов и событий одновременно. Обрывки подпрыгивают в такт.'
    },
    nocturne: {
      name: 'Ноктюрн', ref: '«Ноктюрны» Джеймса Уистлера, цветовые поля в духе живописи цветового поля',
      when: 'ночь, холод, минор, усталость или тихая грусть',
      why: 'Мягкие поля без границ и редкие огни — как город, который видишь сквозь усталость. Очень медленный ритм.'
    }
  };
  PV.TECH_ORDER = ['monet', 'kandinsky', 'film', 'ma', 'collage', 'nocturne'];

  const pct = x => Math.round(x * 100) + '%';

  function moodLabel(V, A, W, night) {
    if (V > .15 && A < .5) return W > .05 ? ['тёплое спокойствие', 'warm'] : ['светлая тишина', 'calm'];
    if (V > .15) return ['шумная радость', 'joy'];
    if (V > -.2) return A >= .55 ? ['собранное напряжение', 'tense'] : night ? ['ночная задумчивость', 'calm'] : ['ровный, тихий день', 'calm'];
    return A >= .55 ? ['тревожный ритм', 'tense'] : ['тихая грусть', 'sad'];
  }

  function chooseTechnique(f) {
    const g = f.genre || '';
    const S = {
      monet: 1.1 * f.V + 0.9 * (1 - f.A) - (f.A > .55 ? 0.4 : 0) + 0.7 * f.W + (f.night ? -0.6 : 0.3) + (['jazz', 'swing', 'classical', 'acoustic', 'soul'].includes(g) ? 0.35 : 0),
      kandinsky: 1.5 * f.A + 0.25 * f.tension + (['electronic', 'techno', 'house', 'metal', 'postpunk', 'phonk'].includes(g) ? 0.6 : 0) + (f.urban ? 0.3 : 0) - 0.4 * f.W - 0.3 * Math.max(0, f.V) - 0.4,
      film: 1.3 * f.era + 0.4 * f.T.nostalgia + 0.25 * Math.max(0, f.W) + 0.15,
      ma: 1.2 * (1 - f.A) + 0.6 * f.T.quiet / 3 + (f.T.alone ? 0.5 : 0) + (f.minor ? 0.25 : 0) + (f.I.count === 1 ? 0.25 : 0) + (['piano', 'ambient', 'lofi'].includes(g) ? 0.5 : 0) - 0.25 * f.T.social - 0.45,
      collage: 0.35 * Math.min(f.T.social, 3) + (f.T.social && f.A > .5 ? 0.45 : 0) + 0.12 * Math.min(f.T.exclaim, 3) + 0.8 * f.A + 0.7 * f.V + (f.I.count >= 3 ? 0.35 : 0) + (['pop', 'rock', 'hiphop', 'kpop', 'indie'].includes(g) ? 0.3 : 0) - 0.4,
      nocturne: (f.night ? 0.9 : 0) + Math.max(0, -f.V) * 1.1 + (f.minor ? 0.4 : 0) + Math.max(0, -f.W) * 0.4 + (1 - f.A) * 0.35 + (f.I.brightness < .3 ? 0.3 : 0) + (f.T.season === 'winter' || f.T.weather === 'snow' ? 0.3 : 0) - 0.3
    };
    const ranked = Object.entries(S).sort((a, b) => b[1] - a[1]);
    return { tech: ranked[0][0], second: ranked[1][0], scores: S };
  }

  function buildPalette(f, tech) {
    const base = (f.I.palette.length ? f.I.palette : [{ rgb: [180, 170, 160], share: 1 }]).map(p => p.rgb);
    const satK = U.clamp(0.55 + f.A * 0.55 + f.V * 0.2 - (f.minor ? 0.2 : 0), 0.25, 1.35);
    const warmTarget = f.W >= 0 ? 32 : 212, warmK = Math.abs(f.W) * 0.28 + (tech === 'monet' ? 0.08 : 0) + (tech === 'nocturne' ? 0.15 : 0);
    const colors = base.map(rgb => {
      let [h, s, l] = U.rgb2hsl(...rgb);
      h = U.hueToward(h, tech === 'nocturne' ? 222 : warmTarget, U.clamp(warmK, 0, .5));
      s = U.clamp(s * satK + (tech === 'collage' ? .15 : 0), 0, .92);
      l = U.clamp(l + f.V * 0.05 - (f.night ? 0.08 : 0), 0.06, 0.92);
      return U.hsl2rgb(h, s, l);
    });
    const dark = tech === 'nocturne' || (tech === 'kandinsky' && (f.night || f.I.brightness < .35)) || (f.night && f.V < 0.15 && tech !== 'film');
    const domH = U.rgb2hsl(...colors[0])[0];
    const paper = dark ? U.hsl2rgb(domH, 0.28, 0.085) : U.hsl2rgb(U.hueToward(domH, 40, .5), 0.1 + Math.max(0, f.W) * 0.12, tech === 'ma' ? 0.95 : 0.925);
    const ink = dark ? U.hsl2rgb(domH, 0.12, 0.88) : U.hsl2rgb(domH, 0.25, 0.12);
    // акцент: самый насыщенный цвет из фото, доведённый до читаемой яркости
    const sat = colors.map(c => ({ c, s: U.rgb2hsl(...c)[1] * (0.6 + U.lum(c) * 0.4) })).sort((a, b) => b.s - a.s);
    let [ah, as] = U.rgb2hsl(...sat[0].c);
    if (tech === 'ma') { ah = U.hueToward(ah, 6, .7); as = .62; }
    const accent = U.hsl2rgb(ah, U.clamp(Math.max(as, 0.45 + f.A * 0.35)), dark ? 0.6 : 0.5);
    const accent2 = U.hsl2rgb(ah + (tech === 'kandinsky' ? 180 : 40), U.clamp(as * .9 + .1), dark ? 0.55 : 0.45);
    return { colors, paper, ink, accent, accent2, dark, hex: { paper: U.hex(paper), ink: U.hex(ink), accent: U.hex(accent), colors: colors.map(U.hex) } };
  }

  function titleFor(T, label) {
    const time = T.time || { nom: 'День', g: 'm' };
    const tnom = time.nom.toLowerCase();
    const sAdj = T.season ? L.seasonAdj[T.season] : null;
    const adj = (g) => (T.weatherAdj || (sAdj) || L.moodAdj[label[1]])[g];
    const obj = T.objects.find(o => !['снег', 'дождь', 'листья', 'музыка', 'наушники'].includes(o));
    const food = ['какао', 'глинтвейн', 'кофе', 'чай', 'пицца', 'торт', 'плов', 'шашлык', 'мороженое', 'костёр', 'рассвет', 'закат'].includes(obj);
    let parts, rule;
    if (T.event) { parts = [time.nom, T.place ? T.place.loc : '', T.event]; rule = 'событие «перед…»: время + место + событие'; }
    else if (T.after) { parts = [(sAdj || L.moodAdj[label[1]])[time.g], tnom, T.place ? T.place.loc : '', T.after]; rule = 'событие «после…»: сезон + время + место + событие'; }
    else if (T.place && obj && T.place.nom !== 'дом' && T.place.g !== 'pl' && (food || !T.people.length)) { parts = [(sAdj || L.moodAdj[label[1]])[T.place.g], T.place.nom, 'и', obj]; rule = 'место + деталь: «{сезон} {место} и {деталь}»'; }
    else if (T.place && T.people.length) { parts = [time.nom, T.place.loc, T.people[0]]; if (sAdj) parts = [sAdj[time.g], tnom, T.place.loc, T.people[0]]; rule = 'место + люди: «{время} {где} {с кем}»'; }
    else if (T.place && T.alone) { parts = [adj(time.g), tnom, T.place.loc, 'в одиночестве']; rule = 'место + одиночество'; }
    else if (T.place) { parts = [adj(time.g), tnom, T.place.loc]; if (obj) parts.push('и', obj); rule = 'место: «{сезон/погода} {время} {где}»'; }
    else if (obj) { parts = [adj(time.g), tnom, 'и', obj]; rule = 'деталь: «{сезон} {время} и {деталь}»'; }
    else { const sw = { winter: 'этой зимы', spring: 'этой весны', summer: 'этого лета', autumn: 'этой осени' }[T.season] || 'без названия'; parts = [L.moodAdj[label[1]][time.g], tnom, sw]; rule = 'настроение + время + сезон'; }
    let words = parts.filter(Boolean).join(' ').split(/\s+/);
    if (words.length > 7) words = words.slice(0, 7);
    if (words.length < 3) words.unshift(L.moodAdj[label[1]][time.g]);
    let title = words.join(' ').replace(/\s+/g, ' ').trim();
    title = title[0].toUpperCase() + title.slice(1);
    return { title, rule };
  }

  const VOICES = {
    monet: { name: 'тихий и тёплый', rate: .88, pitch: 1.0, pause: 650, prefer: 'f' },
    kandinsky: { name: 'собранный, быстрый', rate: 1.14, pitch: .95, pause: 160, prefer: 'm' },
    film: { name: 'рассказчик, неторопливый', rate: .95, pitch: .96, pause: 420, prefer: 'f' },
    ma: { name: 'почти шёпот, с паузами', rate: .8, pitch: 1.04, pause: 950, prefer: 'f', volume: .85 },
    collage: { name: 'живой и быстрый', rate: 1.12, pitch: 1.12, pause: 220, prefer: 'f' },
    nocturne: { name: 'низкий ночной', rate: .83, pitch: .84, pause: 720, prefer: 'm' }
  };

  PV.titleFor = titleFor;
  PV.buildSystem = function ({ text: T, images: I, music: M, meta }) {
    const why = [];
    const genre = M.genre || '';
    const musicV = (M.mode === 'major' ? .35 : -.35) + (M.brightness - .5) * .4 + (M.energy - .5) * .2;
    const V = U.clamp(T.valence * .65 + musicV * .35 + (I.brightness - .5) * .15, -1, 1);
    const A = U.clamp(T.arousal * .45 + M.energy * .45 + I.contrast * .35 - .05);
    const seasonW = { summer: .12, winter: -.12, autumn: .03, spring: .04 }[T.season] || 0;
    const wx = meta.weather; const wxCold = wx && wx.temp != null ? U.clamp((10 - wx.temp) / 30, -.3, .3) : 0;
    const W = U.clamp(T.warmth * .55 + I.warmth * .45 + seasonW - wxCold, -1, 1);
    const tk = T.time && T.time.key;
    const night = tk === 'night' || (tk === 'evening' && I.brightness < .33) || I.brightness < .2;
    const year = M.year || 0;
    const era = U.clamp((year && year < 1975 ? 1 : year && year < 1995 ? .7 : year && year < 2008 ? .3 : 0) + T.nostalgia * .25);
    const minor = M.mode === 'minor';
    const urban = !!(T.place && ['офис', 'город', 'метро', 'улица', 'вокзал', 'аэропорт', 'клуб', 'бар'].includes(T.place.nom));
    const f = { T, I, M, V, A, W, night, era, minor, genre, urban, tension: T.tension };
    const label = moodLabel(V, A, W, night);
    const choice = chooseTechnique(f);
    const tech = choice.tech, TT = PV.TECH[tech];

    // ритм из песни
    const bpm = U.clamp(M.bpm || 100, 50, 200);
    let beatsPer = A > .72 ? 2 : A > .5 ? 4 : A > .3 ? 8 : 16;
    if (tech === 'kandinsky') beatsPer = Math.min(beatsPer, 4);
    if (tech === 'ma' || tech === 'nocturne') beatsPer = Math.max(beatsPer, 8);
    let interval = beatsPer * 60 / bpm;
    while (interval < 0.9) { beatsPer *= 2; interval *= 2; }
    while (interval > 9) { beatsPer /= 2; interval /= 2; }
    const air = U.clamp(.22 + (1 - A) * .45 + (minor ? .12 : 0) + (T.alone ? .1 : 0) - Math.min(T.social, 3) * .04);
    const grain = U.clamp(.12 + era * .5 + (night ? .12 : 0) + (tech === 'film' ? .2 : 0));
    const motion = U.clamp(.15 + A * .85);
    const palette = buildPalette(f, tech);
    const ttl = titleFor(T, label);
    const voice = Object.assign({}, VOICES[tech]);
    voice.rate = +U.clamp(voice.rate + (A - .5) * .12, .7, 1.3).toFixed(2);
    voice.pitch = +U.clamp(voice.pitch + V * .06, .7, 1.3).toFixed(2);

    // объяснение — простыми словами и с числами
    const top = Object.entries(choice.scores).sort((a, b) => b[1] - a[1]);
    const reasons = [];
    if (A > .6) reasons.push(`высокая энергия дня (${pct(A)})`); if (A < .4) reasons.push(`медленный, тихий день (энергия ${pct(A)})`);
    if (V > .25) reasons.push('светлое настроение записи'); if (V < -.15) reasons.push('грустные слова в записи');
    if (W > .15) reasons.push('тёплые детали и цвета'); if (W < -.15) reasons.push('холод в словах и на фото');
    if (night) reasons.push('ночь или очень тёмные кадры'); if (era > .4) reasons.push(year ? `песня ${year} года` : 'воспоминания о прошлом');
    if (T.alone) reasons.push('вы были одни'); if (T.social >= 2) reasons.push('рядом было много людей');
    if (T.tension >= 2) reasons.push('слова дедлайна и спешки');
    if (M.genre && PV.GENRES[M.genre]) reasons.push(`жанр — ${PV.GENRES[M.genre][0].toLowerCase()}`);
    why.push(`<b>Приём «${TT.name}»</b> (${TT.ref}): ${reasons.slice(0, 3).join(', ') || 'сумма признаков дня'}. Второй по силе — «${PV.TECH[choice.second].name}».`);
    why.push(`<b>Ритм из песни:</b> ${bpm} BPM → кадр сменяется каждые ${beatsPer} ${beatsPer === 2 || beatsPer === 4 ? 'доли' : 'долей'} (${interval.toFixed(1)} с), пульс формы — на каждую долю${M.source === 'audio' ? ', фаза совпадает с ударами трека' : ''}.`);
    why.push(`<b>${minor ? 'Минор' : 'Мажор'}${M.key && M.source === 'audio' ? ' (' + M.key + ')' : ''}:</b> ${minor ? 'насыщенность приглушена, пустого поля больше' : 'цвета чище и светлее'}; энергия песни ${pct(M.energy)} → амплитуда движения ${pct(motion)}.`);
    why.push(`<b>Палитра из фото:</b> ${I.count} ${I.count === 1 ? 'кадр' : I.count < 5 ? 'кадра' : 'кадров'}, ${I.key}; цвета сдвинуты ${W >= 0 ? 'к тёплому охристому' : 'к холодному синему'} на ${pct(Math.abs(W) * .28)} и ${palette.dark ? 'положены на тёмную бумагу' : 'положены на светлую бумагу'}.`);
    why.push(`<b>Воздух ${pct(air)}:</b> ${air > .5 ? 'много пустого поля — день был медленным' : 'плотная композиция — день был наполненным'}. <b>Зерно ${pct(grain)}</b>${era > .4 ? ' — ностальгия и старая запись' : ''}.`);
    why.push(`<b>Название</b> по правилу ${ttl.rule}. <b>Голос:</b> ${voice.name}, темп ×${voice.rate}.`);

    return {
      version: 1, tech, second: choice.second, scores: choice.scores, mood: label[0], moodKey: label[1],
      V, A, W, night, era, minor, air, grain, motion, bpm, beatsPer, interval, beatOffset: M.beatOffset || 0,
      palette, title: ttl.title, titleRule: ttl.rule, voice, why,
      meters: [['тепло', (W + 1) / 2], ['энергия', A], ['свет', (V + 1) / 2], ['темп', U.clamp((bpm - 50) / 130)], ['воздух', air]]
    };
  };
})(window.PV);
