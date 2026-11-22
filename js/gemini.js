/* Необязательный анализ через Gemini: что на фото, темы дня, название.
   Работает только если человек сам указал ключ в профиле. Раскладку всё равно строит локальный движок,
   а при любой ошибке генерация продолжается без Gemini. */
(function (PV) {
  const { U } = PV;
  const THEMES = ['friends', 'coffee', 'music', 'travel', 'nature', 'study', 'food', 'rain', 'snow', 'night', 'sun', 'birthday', 'love', 'sport'];
  const MOODS = ['calm', 'joy', 'nostalgia', 'tender', 'tired', 'sad', 'everyday'];
  const SCHEMA = {
    type: 'OBJECT',
    properties: {
      themes: { type: 'ARRAY', items: { type: 'STRING', enum: THEMES } },
      objects: { type: 'ARRAY', items: { type: 'STRING' } },
      mood: { type: 'STRING', enum: MOODS },
      moodStated: { type: 'BOOLEAN' },
      title: { type: 'STRING' },
      caption: { type: 'STRING' }
    },
    required: ['themes', 'mood', 'moodStated', 'title']
  };
  async function toB64(blob, size = 512) {
    const im = await U.blobToImage(blob); const k = Math.min(1, size / Math.max(im.naturalWidth, im.naturalHeight));
    const c = U.canvas(Math.round(im.naturalWidth * k), Math.round(im.naturalHeight * k)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(im.src); return c.toDataURL('image/jpeg', .8).split(',')[1];
  }
  function prompt(day) {
    const inp = day.input || {}, en = PV.lang === 'en';
    return [
      'You help a visual diary app design one page for the user\'s day. Analyse the photos and the notes below.',
      'Rules: never invent feelings the user did not express. Set moodStated=true only if the user\'s own words (text, chosen mood or mood description) clearly express that mood; otherwise pick the closest neutral option and set moodStated=false.',
      `title: a short warm page title (max 40 characters) in ${en ? 'English' : 'Russian'}, based on what actually happened; no emojis, no quotes.`,
      `caption: only if the user wrote no text — one short descriptive line about what is in the photos (max 90 characters, ${en ? 'English' : 'Russian'}, no feelings). Otherwise return an empty string.`,
      'themes: pick only themes clearly present in the photos or text. objects: up to 6 concrete things visible in the photos, in English.',
      '',
      `User text: ${inp.text || '(none)'}`,
      `Chosen mood: ${inp.mood || '(none)'}; mood in own words: ${inp.moodText || '(none)'}`,
      `Place: ${inp.place || '(none)'}; extra note: ${inp.extra || '(none)'}`,
      `Song: ${day.song ? [day.song.artist, day.song.title].filter(Boolean).join(' - ') : '(none)'}`,
      inp.prompt && inp.prompt.answer ? `Question of the day: ${inp.prompt.en || inp.prompt.q} Answer: ${inp.prompt.answer}` : ''
    ].join('\n');
  }
  async function call(cfg, parts) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model || 'gemini-2.5-flash')}:generateContent`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
        body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { temperature: .4, responseMimeType: 'application/json', responseSchema: SCHEMA } })
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j.error && j.error.message) || 'HTTP ' + r.status);
      const txt = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map(p => p.text || '').join('');
      return JSON.parse(txt);
    } finally { clearTimeout(t); }
  }
  PV.gemini = {
    // возвращает подсказки для генератора или null, если ключа нет или запрос не удался
    async analyze(day, cfg) {
      if (!cfg || !cfg.key) return null;
      const media = day.items.filter(i => (i.type === 'photo' || i.type === 'video') && day.blobs[i.type === 'video' ? i.poster : i.key]).slice(0, 4);
      const parts = [{ text: prompt(day) }];
      for (const m of media) parts.push({ inline_data: { mime_type: 'image/jpeg', data: await toB64(day.blobs[m.type === 'video' ? m.poster : m.key]) } });
      const o = await call(cfg, parts);
      return {
        themes: (o.themes || []).filter(t => THEMES.includes(t)), objects: (o.objects || []).slice(0, 6),
        mood: MOODS.includes(o.mood) ? o.mood : null, moodStated: !!o.moodStated,
        title: String(o.title || '').slice(0, 48), caption: day.input && day.input.text ? '' : String(o.caption || '').slice(0, 110)
      };
    },
    async test(cfg) { const o = await call(cfg, [{ text: 'Return themes [], mood "everyday", moodStated false, title "ok".' }]); return !!o; }
  };
})(window.PV);
