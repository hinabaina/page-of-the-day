/* Разбор записи: настроение, события, места, люди, время года и суток. Работает локально, без внешних сервисов. */
(function (PV) {
  const { U, L } = PV;
  const norm = s => String(s || '').toLowerCase().replace(/ё/g, 'е');
  const tokenize = s => norm(s).match(/[а-яa-z0-9-]+/g) || [];
  const hit = (tok, stem) => stem[0] === '=' ? tok === stem.slice(1) : tok.startsWith(stem);

  function findFirst(tokens, list, text) {
    // возвращает первую по порядку в тексте найденную запись словаря
    let best = null, bestPos = 1e9;
    for (const item of list) {
      const stem = item[0];
      if (stem.includes(' ')) { const p = text.indexOf(stem); if (p >= 0 && p < bestPos * 8) { best = item; bestPos = p / 8; } continue; }
      const i = tokens.findIndex(t => hit(t, stem));
      if (i >= 0 && i < bestPos) { best = item; bestPos = i; }
    }
    return best;
  }
  function findAll(tokens, list) {
    const out = [];
    for (const item of list) if (tokens.some(t => hit(t, item[0])) && !out.some(o => o[1] === item[1])) out.push(item);
    return out;
  }
  const count = (tokens, text, stems) => stems.reduce((n, st) => n + (st.includes(' ') ? (text.includes(st) ? 1 : 0) : tokens.filter(t => hit(t, st)).length), 0);

  PV.analyzeText = function (raw, opts = {}) {
    const text = norm(raw);
    const tokens = tokenize(raw);
    let v = 0, a = 0, w = 0, n = 0;
    const moodWords = [];
    tokens.forEach((t, i) => {
      for (const [stem, dv, da, dw] of L.affect) {
        if (!hit(t, stem)) continue;
        const neg = (i > 0 && L.negators.includes(tokens[i - 1])) ? -1 : 1;
        v += dv * neg; a += da; w += dw * (neg > 0 ? 1 : 0); n++;
        moodWords.push((neg < 0 ? 'не ' : '') + t);
        break;
      }
    });
    const hi = count(tokens, text, L.arousalHi), lo = count(tokens, text, L.arousalLo);
    const warmN = count(tokens, text, L.warm), coldN = count(tokens, text, L.cold);
    const tension = count(tokens, text, L.tension);
    const quiet = count(tokens, text, L.quiet);
    const nost = count(tokens, text, L.nostalgia);
    const exclaim = (raw.match(/!/g) || []).length;

    const valence = U.clamp(n ? v / (n + 1.2) : 0.1, -1, 1);
    const arousal = U.clamp(0.4 + (hi - lo) * 0.09 + (n ? a / n : 0) * 0.25 + Math.min(exclaim, 4) * 0.04 + tension * 0.05, 0, 1);
    const warmth = U.clamp((warmN - coldN) * 0.22 + (n ? w / n : 0) * 0.4, -1, 1);

    const tText = text.replace(/(с самого утра|с утра|до утра|до самого утра|утра до|в \S+ утра)/g, ' ');
    const timeHit = L.times.map(tm => ({ tm, i: tText.search(tm.re) })).filter(x => x.i >= 0).sort((x, y) => x.i - y.i)[0];
    let time = timeHit ? timeHit.tm : null;
    if (!time && opts.time) {
      const h = +opts.time.split(':')[0];
      time = L.times[h < 5 || h >= 22 ? 3 : h < 11 ? 0 : h < 17 ? 1 : 2];
      time = Object.assign({ fromClock: true }, time);
    }
    // сезон: голосуют слова записи, дата добавляет полголоса
    const votes = {};
    L.seasons.forEach(s => { const m = text.match(new RegExp(s.re.source, 'g')); if (m) votes[s.key] = m.length; });
    let dateSeason = null;
    if (opts.date) { const m = U.parseDate(opts.date).getMonth(); dateSeason = m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; }
    const anyText = Object.keys(votes).length > 0;
    if (dateSeason) votes[dateSeason] = (votes[dateSeason] || 0) + .5;
    const ranked = Object.entries(votes).sort((x, y) => y[1] - x[1]);
    let season = ranked.length ? ranked[0][0] : null; const seasonFromDate = !anyText && !!season;
    const weather = L.weatherAdj.find(x => x.re.test(text)) || null;

    const placeItem = findFirst(tokens, L.places, text);
    const place = placeItem ? { nom: placeItem[1], g: placeItem[2], loc: placeItem[3] } : null;
    const peopleItems = findAll(tokens, L.people);
    const alone = L.alone.test(text) && peopleItems.length === 0;
    const objects = findAll(tokens, L.objects).map(o => o[1]);
    const ev = findFirst(tokens, L.events, text);
    const af = text.includes('после') ? findFirst(tokens, L.after, text) : null;
    const sensory = findAll(tokens, L.sensory.map(s => [s, s])).map(s => s[0]);

    // подпись: предложение, в котором больше всего деталей
    const sentences = raw.split(/(?<=[.!?…])\s+|\n+/).map(s => s.trim()).filter(Boolean);
    const detail = s => { const tk = tokenize(s); return L.objects.filter(o => tk.some(t => hit(t, o[0]))).length * 2 + L.sensory.filter(x => tk.some(t => hit(t, x))).length + L.places.filter(p => tk.some(t => hit(t, p[0]))).length; };
    let cap = sentences.slice().sort((x, y) => detail(y) - detail(x))[0] || raw;
    cap = cap.replace(/\s+/g, ' ').replace(/[.!…]+$/, '');
    if (cap.length > 62) { cap = cap.slice(0, 62); cap = cap.slice(0, cap.lastIndexOf(' ')) + '…'; }

    return {
      valence, arousal, warmth, tension, quiet, nostalgia: nost, exclaim,
      social: peopleItems.length, alone, people: peopleItems.map(p => p[1]),
      time, season, seasonFromDate, weather: weather ? weather.key : null, weatherAdj: weather ? weather.a : null,
      place, objects, event: ev ? ev[1] : null, after: af ? af[1] : null, sensory,
      moodWords: moodWords.slice(0, 8), caption: cap, words: tokens.length
    };
  };
})(window.PV);
