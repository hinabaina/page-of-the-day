/* Приложение: запись дня → анализ → система → страница; папка дня; лента-архив; озвучка; экспорт. */
(function (PV) {
  const { U } = PV, $ = U.$, $$ = U.$$;
  const POSTER_V = 3;
  const state = { days: [], photos: [], audio: null, filter: 'all', q: '', renderer: null, heroR: null, audioEl: null, current: null, recording: false };

  const toast = (msg, ms = 2600) => { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, ms); };
  const ask = text => new Promise(res => { const m = $('#confirm'); $('#confirm-text').textContent = text; m.hidden = false; const done = v => { m.hidden = true; res(v); }; $('#confirm-yes').onclick = () => done(true); $('#confirm-no').onclick = () => done(false); });

  // интерфейс принимает цвет дня
  function tint(sys) {
    const r = document.documentElement.style;
    if (!sys) { r.removeProperty('--tint-a'); r.removeProperty('--tint-b'); r.removeProperty('--day'); PV.aura.set(null); return; }
    PV.aura.set([...sys.palette.colors.slice(0, 4), sys.palette.accent]);
    const P = sys.palette, a = U.rgb2hsl(...P.colors[0]), b = U.rgb2hsl(...P.accent);
    r.setProperty('--tint-a', U.hex(U.hsl2rgb(a[0], Math.min(.5, a[1]), .16)));
    r.setProperty('--tint-b', U.hex(U.hsl2rgb(b[0], Math.min(.6, b[1]), .22)));
    r.setProperty('--day', U.hex(U.hsl2rgb(b[0], U.clamp(b[1], .45, .85), .6)));
  }

  /* ---------- сборка дня из ввода ---------- */
  async function buildDay(input, status = () => { }) {
    status('Разбираю фото: цвета, свет, контраст…');
    const imgs = await Promise.all(input.photos.map(U.blobToImage));
    const images = PV.analyzeImages(imgs);
    status('Читаю запись: настроение, места, люди, время…');
    const text = PV.analyzeText(input.text, { date: input.date, time: input.time });
    let music = PV.describeMusic(input.song);
    if (input.audio) {
      status('Слушаю песню: темп, энергия, лад…');
      try { const a = await PV.analyzeAudio(input.audio, status); const known = input.song.genre || music.artistKnown; music = Object.assign({}, music, a, { genre: known ? music.genre : '', genreName: known ? music.genreName : '', year: music.year }); }
      catch (e) { console.warn(e); toast('Не удалось разобрать аудио — беру описание песни'); }
    }
    status('Подбираю приём, палитру, ритм и название…');
    const meta = { date: input.date, time: input.time, weather: input.weather };
    const system = PV.buildSystem({ text, images, music, meta });
    const day = {
      id: input.id || U.uid(), created: Date.now(), num: input.num, date: input.date, time: input.time, text: input.text,
      title: system.title, photos: input.photos, audio: input.audio || null, audioName: input.audioName || '', song: input.song, weather: input.weather || null,
      analysis: { text, images: Object.assign({}, images, { per: undefined }), music }, system, seed: U.hash(input.text + input.date), demo: !!input.demo
    };
    status('Рисую страницу дня…');
    const r = new PV.Renderer(U.canvas(10, 10)); await r.prepare(day, imgs);
    day.poster = r.poster(.5); day.posterV = POSTER_V;
    imgs.forEach(im => URL.revokeObjectURL(im.src));
    return day;
  }

  async function seedDemo() {
    const done = await PV.store.meta('demo-v2'); if (done) return;
    for (const d of await PV.store.all()) if (d.demo) await PV.store.del(d.id);
    const ownCount = (await PV.store.all()).length;
    $('#feed-count').textContent = 'Собираю демо-дни из записей, фото и песен…';
    let i = 0;
    for (const d of PV.DEMO.slice().sort((a, b) => a.date.localeCompare(b.date))) {
      const photos = await PV.demoPhotos(d, i);
      const song = Object.assign({ service: 'YouTube' }, d.song, { link: d.song.link });
      const day = await buildDay({ text: d.text, date: d.date, time: d.time, photos, song, num: ++i + ownCount, demo: true });
      day.song = Object.assign(PV.parseSongLink(d.song.link) || {}, d.song);
      await PV.store.put(day);
    }
    await PV.store.meta('demo-v2', true);
  }

  /* ---------- лента ---------- */
  async function loadDays() { state.days = (await PV.store.all()).sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))); }
  function renderChips() {
    const used = new Set(state.days.map(d => d.system.tech));
    $('#chips').innerHTML = [['all', 'Все дни'], ...PV.TECH_ORDER.filter(k => used.has(k)).map(k => [k, PV.TECH[k].name])]
      .map(([k, n]) => `<button class="chip${state.filter === k ? ' on' : ''}" data-f="${k}" type="button">${U.esc(n)}</button>`).join('');
  }
  function renderSpectrum() {
    const days = state.days.slice().reverse();
    $('#spectrum').innerHTML = days.map(d => `<a href="#day-${d.id}" title="${U.esc(d.title)}" style="--w:${1}">${d.system.palette.hex.colors.slice(0, 4).map(c => `<i style="background:${c}"></i>`).join('')}<b style="background:${d.system.palette.hex.accent}"></b></a>`).join('');
  }
  function renderFeed() {
    const q = state.q.toLowerCase().replace(/ё/g, 'е');
    const list = state.days.filter(d => (state.filter === 'all' || d.system.tech === state.filter) && (!q || (d.title + ' ' + d.text + ' ' + PV.TECH[d.system.tech].name + ' ' + d.system.mood).toLowerCase().replace(/ё/g, 'е').includes(q)));
    $('#feed-count').textContent = `${state.days.length} ${plural(state.days.length, 'день', 'дня', 'дней')} в дневнике${list.length !== state.days.length ? ` · найдено ${list.length}` : ''}`;
    $('#feed').innerHTML = list.map(d => `
      <a class="card" href="#day-${d.id}" data-id="${d.id}" style="--rot:${((U.hash(d.id) % 70) / 10 - 3.5).toFixed(1)}deg;--dy:${(U.hash(d.id + 'y') % 40) - 10}px;--c:${d.system.palette.hex.accent}">
        <span class="num">№ ${String(d.num || 1).padStart(3, '0')}</span>
        <div class="pic"><img src="${d.poster}" alt="Страница дня «${U.esc(d.title)}»" loading="lazy"></div>
        <div class="cap"><b>${U.esc(d.title)}</b><span>${U.fmtDate(d.date).replace(/ \d{4}$/, '')}</span></div>
        <div class="tag">${U.esc(PV.TECH[d.system.tech].name)} · ${U.esc(d.system.mood)}</div>
      </a>`).join('') + (state.filter === 'all' && !q ? `<a class="card new" href="#new"><div class="pic">+ Записать сегодняшний день</div></a>` : '')
      || `<p class="muted">Ничего не нашлось. Попробуйте другое слово.</p>`;
    renderChips(); renderSpectrum(); hero(list[0] || state.days[0]);
    const mq = state.days.map(d => `<span style="--c:${d.system.palette.hex.accent}">${U.esc(d.title)}</span>`).join('');
    $('#marquee').innerHTML = mq + mq;
  }
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };
  async function hero(d) {
    if (!d || (state.heroR && state.heroR.day && state.heroR.day.id === d.id)) return;
    const st = $('#hero-stage'); st.innerHTML = '<canvas></canvas>';
    const imgs = await Promise.all(d.photos.map(U.blobToImage));
    if (state.heroR) state.heroR.stop();
    const r = new PV.Renderer(st.querySelector('canvas')); await r.prepare(d, imgs); state.heroR = r;
    const t0 = performance.now(); r.start(() => (performance.now() - t0) / 1000);
    $('#hero-cap').innerHTML = `<a href="#day-${d.id}"><b>${U.esc(d.title)}</b></a><span>${U.fmtDate(d.date)} · ${U.esc(PV.TECH[d.system.tech].name)} · ${d.system.bpm} BPM</span>`;
    tint(d.system);
  }

  /* ---------- форма ---------- */
  function initForm() {
    $('#f-genre').innerHTML = '<option value="">Жанр: узнать по артисту</option>' + Object.entries(PV.GENRES).map(([k, g]) => `<option value="${k}">${g[0]}</option>`).join('');
    $('#f-date').value = U.todayISO();
    const now = new Date(); $('#f-time').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    $$('.tab').forEach(b => b.onclick = () => { $$('.tab').forEach(x => x.classList.toggle('on', x === b)); $$('.tabpane').forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab); });
    const addPhotos = async files => {
      for (const f of files) { if (!f.type.startsWith('image/')) continue; try { state.photos.push(await U.downscale(f)); } catch (e) { toast('Не открылось одно из фото'); } }
      drawThumbs();
    };
    $('#f-photos').onchange = e => { addPhotos([...e.target.files]); e.target.value = ''; };
    const drop = $('#drop');
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => addPhotos([...e.dataTransfer.files]));
    $('#f-audio').onchange = e => { const f = e.target.files[0]; if (!f) return; state.audio = f; $('#audio-name').textContent = f.name; if (!$('#f-song').value) $('#f-song').value = f.name.replace(/\.[^.]+$/, '').replace(/^\d+[\s._-]*/, ''); };
    $('#f-link').addEventListener('change', async e => {
      const info = PV.parseSongLink(e.target.value); if (!info) return;
      $('#song-hint').textContent = `Распознано: ${info.service}${info.embed ? ' — песня будет играть прямо в записи' : ''}.`;
      const t = await PV.fetchSongTitle(info.url);
      if (t) { if (!$('#f-artist').value) $('#f-artist').value = t.artist; if (!$('#f-song').value) $('#f-song').value = t.title; artistHint(); }
    });
    $('#f-artist').addEventListener('input', artistHint);
    $('#form').addEventListener('submit', onSubmit);
  }
  function artistHint() { const a = PV.lookupArtist($('#f-artist').value); if (a) $('#song-hint').textContent = `Узнал артиста: ${PV.GENRES[a[0]][0].toLowerCase()}, около ${a[1]} года${a[2] === 'minor' ? ', чаще минор' : ''}. Можно уточнить жанр и год.`; }
  function drawThumbs() {
    $('#thumbs').innerHTML = state.photos.map((b, i) => `<figure><img src="${URL.createObjectURL(b)}" alt="Фото ${i + 1}"><button type="button" data-rm="${i}" aria-label="Убрать фото">×</button></figure>`).join('');
  }
  async function getWeather(date) {
    if (!$('#f-weather').checked || date !== U.todayISO() || !navigator.geolocation) return null;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 }));
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude.toFixed(2)}&longitude=${pos.coords.longitude.toFixed(2)}&current=temperature_2m,weather_code`);
      const j = await r.json(); const c = j.current.weather_code;
      return { temp: j.current.temperature_2m, code: c, label: c >= 71 && c <= 77 ? 'снег' : c >= 51 && c <= 67 || c >= 80 ? 'дождь' : c >= 45 && c <= 48 ? 'туман' : c <= 1 ? 'ясно' : 'облачно' };
    } catch (e) { toast('Погоду получить не удалось — продолжаю без неё'); return null; }
  }
  async function onSubmit(e) {
    e.preventDefault();
    const text = $('#f-text').value.trim();
    if (text.length < 10) return toast('Напишите о дне хотя бы пару предложений');
    if (!state.photos.length) return toast('Добавьте хотя бы одно фото дня');
    const link = $('#f-link').value.trim();
    if (!link && !state.audio && !$('#f-artist').value.trim()) return toast('Добавьте песню: ссылку, файл или хотя бы исполнителя');
    const btn = $('#build'); btn.disabled = true;
    const status = s => $('#new-status').textContent = s;
    try {
      const date = $('#f-date').value, time = $('#f-time').value;
      const info = PV.parseSongLink(link) || {};
      const song = Object.assign(info, { link, artist: $('#f-artist').value.trim(), title: $('#f-song').value.trim(), genre: $('#f-genre').value, year: +$('#f-year').value || 0, tempo: $('#f-tempo').value, mode: $('#f-mode').value });
      if (!song.service) song.service = state.audio ? 'Свой файл' : 'Песня';
      const weather = await getWeather(date);
      const num = state.days.length + 1;
      const day = await buildDay({ text, date, time, photos: state.photos.slice(), audio: state.audio, audioName: state.audio ? state.audio.name : '', song, weather, num }, status);
      await PV.store.put(day);
      state.photos = []; state.audio = null; $('#form').reset(); drawThumbs(); $('#audio-name').textContent = 'Выберите mp3 / m4a / wav'; initDates();
      status(''); await loadDays();
      location.hash = 'day-' + day.id; toast(`Папка «${day.title}» сохранена`);
    } catch (err) { console.error(err); status('Что-то пошло не так: ' + err.message); }
    btn.disabled = false;
  }
  function initDates() { $('#f-date').value = U.todayISO(); }

  /* ---------- папка дня ---------- */
  function stopDay() {
    if (state.renderer) state.renderer.stop();
    if (state.audioEl) { state.audioEl.pause(); URL.revokeObjectURL(state.audioEl.src); state.audioEl = null; }
    try { speechSynthesis.cancel(); } catch (e) { }
  }
  async function openDay(id) {
    const d = await PV.store.get(id); if (!d) { location.hash = 'feed'; return; }
    state.current = d; tint(d.system);
    const st = $('#day-stage'); st.innerHTML = '<canvas></canvas>';
    const imgs = await Promise.all(d.photos.map(U.blobToImage));
    const r = new PV.Renderer(st.querySelector('canvas')); await r.prepare(d, imgs); state.renderer = r;
    let t0 = performance.now();
    if (d.audio) { state.audioEl = new Audio(URL.createObjectURL(d.audio)); state.audioEl.loop = true; }
    const clock = () => state.audioEl && !state.audioEl.paused ? state.audioEl.currentTime : (performance.now() - t0) / 1000;
    r.start(clock);
    const S = d.system, A = d.analysis, T = A.text, M = A.music;
    $('#d-title').textContent = d.title;
    $('#d-meta').textContent = `${U.fmtDate(d.date)}${d.time ? ', ' + d.time : ''} · день № ${String(d.num || 1).padStart(3, '0')} · ${S.mood}`;
    $('#p-info').textContent = `${S.bpm} BPM · смена кадра ${S.interval.toFixed(1)} с · голос: ${S.voice.name}`;
    $('#p-play').textContent = d.audio ? '▶ Смотреть со звуком' : (d.song && d.song.embed ? '▶ Включить песню ниже' : '↗ Открыть песню');
    // встроенный плеер сервиса
    const sg = d.song || {};
    $('#embed').innerHTML = !d.audio && sg.embed ? `<iframe src="${U.esc(sg.embed)}" height="${sg.height || 152}" allow="autoplay; clipboard-write; encrypted-media" loading="lazy" title="Песня дня"></iframe>`
      : sg.link ? `<a href="${U.esc(sg.link)}" target="_blank" rel="noopener">Песня дня: ${U.esc([sg.artist, sg.title].filter(Boolean).join(' — ') || sg.service)} ↗</a>` : '';
    // файлы папки
    const files = folderFiles(d);
    $('#d-files').innerHTML = files.map(f => `<li><span>${U.esc(f.name.split('/').pop())}</span><span>${f.size}</span></li>`).join('');
    $('#d-why').innerHTML = S.why.map(w => `<li>${w}</li>`).join('');
    $('#d-text').textContent = d.text;
    const sw = cols => `<span class="swatches">${cols.map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
    const facts = [
      ['Настроение', `${S.mood} <span class="muted">(валентность ${S.V.toFixed(2)}, энергия ${S.A.toFixed(2)})</span>`],
      ['Слова', T.moodWords.length ? T.moodWords.map(U.esc).join(', ') : '—'],
      ['Время и сезон', [T.time && T.time.nom.toLowerCase() + (T.time.fromClock ? ' (по часам)' : ''), { winter: 'зима', spring: 'весна', summer: 'лето', autumn: 'осень' }[T.season] + (T.seasonFromDate ? ' (по дате)' : '')].filter(Boolean).join(', ')],
      ['Место', T.place ? T.place.nom : '—'], ['Люди', T.people.length ? T.people.join(', ') : T.alone ? 'в одиночестве' : '—'],
      ['Детали', T.objects.concat(T.sensory).slice(0, 8).join(', ') || '—'],
      ['Фото', `${A.images.count} шт., ${A.images.key}, контраст ${A.images.contrast.toFixed(2)} ${sw(A.images.palette.map(p => p.hex))}`],
      ['Палитра дня', sw([S.palette.hex.paper, ...S.palette.hex.colors, S.palette.hex.accent])],
      ['Песня', `${M.source === 'audio' ? 'аудиоанализ' : 'по описанию'}: ${M.bpm} BPM, ${M.key || M.mode}, энергия ${Math.round(M.energy * 100)}%${M.genreName ? ', ' + M.genreName.toLowerCase() : ''}${M.year ? ', ' + M.year : ''}`],
      d.weather ? ['Погода', `${Math.round(d.weather.temp)}°, ${d.weather.label}`] : null
    ].filter(Boolean);
    $('#d-facts').innerHTML = facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#a-status').textContent = ''; $('#title-edit').hidden = true;
    imgs.forEach(im => URL.revokeObjectURL(im.src));
    $('#p-play').onclick = () => {
      if (state.audioEl) { if (state.audioEl.paused) { state.audioEl.play().catch(() => toast('Браузер не дал включить звук')); $('#p-play').textContent = '❚❚ Пауза'; } else { state.audioEl.pause(); t0 = performance.now() - state.audioEl.currentTime * 1000; $('#p-play').textContent = '▶ Смотреть со звуком'; } }
      else if (sg.embed) $('#embed').scrollIntoView({ behavior: 'smooth', block: 'center' });
      else if (sg.link) window.open(sg.link, '_blank', 'noopener');
    };
    $('#p-voice').onclick = () => speak(d);
  }
  function folderFiles(d) {
    const f = [{ name: 'запись.txt', size: U.fmtBytes(new Blob([d.text]).size) }];
    d.photos.forEach((p, i) => f.push({ name: `фото_${i + 1}.jpg`, size: U.fmtBytes(p.size) }));
    if (d.audio) f.push({ name: 'песня' + (d.audioName.match(/\.[^.]+$/) || ['.mp3'])[0], size: U.fmtBytes(d.audio.size) });
    if (d.song && d.song.link) f.push({ name: 'песня — ссылка.txt', size: '1 КБ' });
    f.push({ name: 'воспоминание.png', size: '1080×1350' });
    if (d.video) f.push({ name: 'воспоминание.webm', size: U.fmtBytes(d.video.size) });
    f.push({ name: 'озвучка.json', size: d.system.voice.name }, { name: 'система.json', size: 'правила дня' });
    return f;
  }

  /* ---------- озвучка ---------- */
  function pickVoice(prefer) {
    const vs = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang)); if (!vs.length) return null;
    const fem = /(milena|irina|svetlana|alena|alyona|katya|darya|anna|ekaterina|elena|female|жен|google)/i, mal = /(yuri|pavel|dmitr|maxim|male|муж)/i;
    return vs.find(v => (prefer === 'm' ? mal : fem).test(v.name)) || vs[0];
  }
  function speak(d) {
    if (!('speechSynthesis' in window)) return toast('Браузер не умеет озвучивать текст');
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); $('#p-voice').textContent = 'Озвучить запись'; return; }
    const V = d.system.voice, voice = pickVoice(V.prefer);
    if (!voice) toast('Русский голос не найден в системе — читаю голосом по умолчанию');
    const parts = d.text.split(/(?<=[.!?…])\s+/).filter(Boolean);
    const vol0 = state.audioEl ? state.audioEl.volume : 1; if (state.audioEl) state.audioEl.volume = .35;
    $('#p-voice').textContent = '■ Остановить голос';
    let i = 0;
    const next = () => {
      if (i >= parts.length) { if (state.audioEl) state.audioEl.volume = vol0; $('#p-voice').textContent = 'Озвучить запись'; return; }
      const u = new SpeechSynthesisUtterance(parts[i++]); u.lang = 'ru-RU'; if (voice) u.voice = voice; u.rate = V.rate; u.pitch = V.pitch; u.volume = V.volume || 1;
      u.onend = () => setTimeout(next, V.pause); u.onerror = () => { $('#p-voice').textContent = 'Озвучить запись'; if (state.audioEl) state.audioEl.volume = vol0; };
      speechSynthesis.speak(u);
    };
    next();
  }

  /* ---------- экспорт ---------- */
  async function fullPng() { const r = state.renderer; r.draw(r.sys.interval * .6); return U.canvasToBlob(r.cv, 'image/png'); }
  async function exportZip() {
    const d = state.current, dir = U.safeName(d.title) + '/';
    $('#a-status').textContent = 'Собираю папку…';
    const files = [{ name: dir + 'запись.txt', data: `${d.title}\n${U.fmtDate(d.date)}${d.time ? ', ' + d.time : ''}\n\n${d.text}\n` }];
    d.photos.forEach((p, i) => files.push({ name: `${dir}фото_${i + 1}.jpg`, data: p }));
    if (d.audio) files.push({ name: dir + 'песня' + (d.audioName.match(/\.[^.]+$/) || ['.mp3'])[0], data: d.audio });
    if (d.song && d.song.link) files.push({ name: dir + 'песня — ссылка.txt', data: `${[d.song.artist, d.song.title].filter(Boolean).join(' — ')}\n${d.song.link}\n` });
    files.push({ name: dir + 'воспоминание.png', data: await fullPng() });
    if (d.video) files.push({ name: dir + 'воспоминание.webm', data: d.video });
    files.push({ name: dir + 'озвучка.json', data: JSON.stringify({ голос: d.system.voice.name, rate: d.system.voice.rate, pitch: d.system.voice.pitch, пауза_мс: d.system.voice.pause, текст: d.text }, null, 2) });
    const S = d.system;
    files.push({ name: dir + 'система.json', data: JSON.stringify({ приём: PV.TECH[S.tech].name, второй: PV.TECH[S.second].name, настроение: S.mood, валентность: +S.V.toFixed(3), энергия: +S.A.toFixed(3), тепло: +S.W.toFixed(3), ночь: S.night, воздух: +S.air.toFixed(3), зерно: +S.grain.toFixed(3), bpm: S.bpm, долей_на_кадр: S.beatsPer, палитра: S.palette.hex, правило_названия: S.titleRule, почему: S.why.map(w => w.replace(/<[^>]+>/g, '')), анализ: d.analysis }, null, 2) });
    const zip = await PV.makeZip(files);
    U.download(zip, U.safeName(d.title) + '.zip'); $('#a-status').textContent = `Папка «${d.title}» — ${U.fmtBytes(zip.size)}`;
  }
  async function recordVideo() {
    const d = state.current, r = state.renderer;
    if (state.recording) return; if (!window.MediaRecorder || !r.cv.captureStream) return toast('Этот браузер не умеет записывать видео');
    state.recording = true; const btn = $('#a-video'); btn.disabled = true;
    const stream = r.cv.captureStream(30); let ac = null, el = null;
    if (d.audio) {
      el = new Audio(URL.createObjectURL(d.audio)); ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaElementSource(el), dest = ac.createMediaStreamDestination(); src.connect(dest); src.connect(ac.destination);
      dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
    }
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6e6 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const L = r.loop, t0 = performance.now();
    if (state.audioEl) state.audioEl.pause();
    r.start(() => el ? el.currentTime : (performance.now() - t0) / 1000);
    rec.start(250); if (el) await el.play().catch(() => { });
    const iv = setInterval(() => { const s = (performance.now() - t0) / 1000; $('#a-status').textContent = `Запись видео: ${Math.min(L, s).toFixed(0)} / ${L.toFixed(0)} с${d.audio ? '' : ' (песня по ссылке в видео не попадёт — только ритм)'}`; }, 300);
    await U.sleep(L * 1000 + 200); rec.stop(); await new Promise(res => rec.onstop = res); clearInterval(iv);
    if (el) { el.pause(); URL.revokeObjectURL(el.src); } if (ac) ac.close();
    const blob = new Blob(chunks, { type: 'video/webm' }); d.video = blob; await PV.store.put(d);
    U.download(blob, U.safeName(d.title) + '.webm');
    $('#a-status').textContent = `Видео ${L.toFixed(0)} с сохранено в папку дня (${U.fmtBytes(blob.size)})`;
    $('#d-files').innerHTML = folderFiles(d).map(f => `<li><span>${U.esc(f.name)}</span><span>${f.size}</span></li>`).join('');
    const t1 = performance.now(); r.start(() => (performance.now() - t1) / 1000);
    btn.disabled = false; state.recording = false;
  }
  function initDayActions() {
    $('#a-zip').onclick = () => exportZip().catch(e => { console.error(e); $('#a-status').textContent = 'Не получилось собрать архив'; });
    $('#a-png').onclick = async () => U.download(await fullPng(), U.safeName(state.current.title) + '.png');
    $('#a-video').onclick = () => recordVideo().catch(e => { console.error(e); state.recording = false; $('#a-video').disabled = false; $('#a-status').textContent = 'Запись видео не удалась'; });
    $('#a-rename').onclick = () => { $('#title-edit').hidden = false; $('#d-title-input').value = state.current.title; $('#d-title-input').focus(); };
    $('#d-title-save').onclick = async () => {
      const v = $('#d-title-input').value.trim(); if (!v) return; const d = state.current; d.title = v;
      d.poster = (state.renderer.draw(d.system.interval * .6), (() => { const c = U.canvas(540, 675); c.getContext('2d').drawImage(state.renderer.cv, 0, 0, 540, 675); return c.toDataURL('image/jpeg', .86); })());
      await PV.store.put(d); $('#d-title').textContent = v; $('#title-edit').hidden = true; await loadDays(); toast('Название папки обновлено');
    };
    $('#a-del').onclick = async () => { if (!await ask(`Удалить папку «${state.current.title}» со всеми фото и песней? Это нельзя отменить.`)) return; await PV.store.del(state.current.id); await loadDays(); location.hash = 'feed'; toast('Папка удалена'); };
  }

  /* ---------- страница «Система» ---------- */
  function renderSystem() {
    const days = state.days.slice().sort((a, b) => a.date.localeCompare(b.date));
    const ex = {}; days.forEach(d => { if (!ex[d.system.tech]) ex[d.system.tech] = d; });
    const any = days[0];
    const pal = any ? [any.system.palette.hex.paper, ...any.system.palette.hex.colors.slice(0, 5), any.system.palette.hex.accent] : [];
    const photoDay = days.find(d => d.system.tech === 'monet') || any;
    const As = days.map(d => d.system.A), Vs = days.map(d => d.system.V);
    const nA = a => (a - Math.min(...As)) / ((Math.max(...As) - Math.min(...As)) || 1), nV = v => (v - Math.min(...Vs)) / ((Math.max(...Vs) - Math.min(...Vs)) || 1);
    const map = days.map(d => {
      const x = (.06 + nA(d.system.A) * .88) * 100, y = (1 - (.08 + nV(d.system.V) * .84)) * 100;
      return `<a class="pin" href="#day-${d.id}" style="left:${(8 + x * .84).toFixed(1)}%;top:${(8 + y * .84).toFixed(1)}%;--c:${d.system.palette.hex.accent}"><img src="${d.poster}" alt=""><span>${U.esc(d.title)}</span></a>`;
    }).join('');
    const rules = [
      ['🐢', 'Медленная песня', 'кадры сменяются реже, всё плавно «дышит»'], ['⚡', 'Быстрый трек', 'резкие склейки точно в долю, формы вздрагивают'],
      ['🌧', 'Минор и грусть', 'цвета тише, пустого места больше'], ['🌙', 'Ночь', 'тёмная бумага, огни и мягкие пятна'],
      ['📼', 'Старая песня', 'плёночное зерно и выцветшие тени'], ['👯', 'Много людей', 'коллаж из обрывков фото'],
      ['⏰', 'Дедлайн и спешка', 'жёсткая сетка и геометрия'], ['☕', 'Тепло и уют', 'мазки и тёплый свет, как у Моне']
    ];
    $('#sys').innerHTML = `
      <section class="s-hero">
        <p class="kicker"><i></i> Как это работает</p>
        <h1>Три вещи о дне → <em>одна живая страница</em></h1>
        <div class="flow">
          <div class="step"><div class="ic">✍️</div><b>Пишешь</b><span>пару фраз, как другу</span></div>
          <div class="plus">+</div>
          <div class="step"><div class="ic">📷</div><b>Фото</b><span>одно или несколько</span></div>
          <div class="plus">+</div>
          <div class="step"><div class="ic">🎧</div><b>Песня</b><span>ссылка или mp3</span></div>
          <div class="arrow">→</div>
          <div class="step out">${any ? `<img src="${any.poster}" alt="">` : ''}<b>Страница дня</b><span>в своей папке, с названием</span></div>
        </div>
      </section>

      <section class="bento">
        <div class="tile t-text">
          <p class="tl">01 · текст</p><h3>Система читает настроение</h3>
          <p class="sample">Гуляли по <mark class="m-place">набережной</mark> до <mark class="m-time">заката</mark>, было <mark class="m-cold">прохладно</mark>, пили <mark class="m-warm">какао</mark> — <mark class="m-pos">тепло и спокойно</mark>.</p>
          <div class="legend"><span class="m-place">место</span><span class="m-time">время</span><span class="m-cold">холод</span><span class="m-warm">тепло</span><span class="m-pos">настроение</span></div>
          <p class="res">→ «Осенняя набережная и какао» · тёплое спокойствие</p>
        </div>
        <div class="tile t-photo">
          <p class="tl">02 · фото</p><h3>Из фото берутся цвета</h3>
          ${photoDay ? `<img src="${photoDay.poster}" alt="">` : ''}
          <div class="swatch-row">${(photoDay ? [photoDay.system.palette.hex.paper, ...photoDay.system.palette.hex.colors.slice(0, 5), photoDay.system.palette.hex.accent] : pal).map(c => `<i style="background:${c}"></i>`).join('')}</div>
          <p class="res">→ палитра страницы, светлая или тёмная бумага</p>
        </div>
        <div class="tile t-music">
          <p class="tl">03 · песня</p><h3>Музыка задаёт ритм</h3>
          <div class="beats" style="--bpm:96">${Array.from({ length: 16 }, (_, i) => `<i style="animation-delay:${(i % 4) * -0.156}s;--h:${30 + ((i * 37) % 60)}%"></i>`).join('')}</div>
          <p class="res">96 BPM → кадр меняется каждые 4 доли · минор → цвета тише</p>
        </div>
      </section>

      <section class="mood">
        <div class="mood-text"><p class="tl">карта настроений</p><h2>Каждый день находит своё место</h2><p>По горизонтали — сколько в дне энергии, по вертикали — насколько он светлый. От того, куда попадает день, зависит художественный приём.</p></div>
        <div class="mood-map">
          <span class="ax ax-x">энергия →</span><span class="ax ax-y">светлее ↑</span>
          <span class="q q1">уют и тепло</span><span class="q q2">драйв и радость</span><span class="q q3">тишина и грусть</span><span class="q q4">напряжение</span>
          ${map}
        </div>
      </section>

      <section class="anat">
        <div class="anat-pic">${any ? `<img src="${any.poster}" alt="Страница дня">` : ''}
          <span class="lb" style="top:6.5%">№ дня · дата · время</span>
          <span class="lb" style="top:40%">окно: здесь меняется стиль</span>
          <span class="lb" style="top:80.5%">название папки</span>
          <span class="lb" style="top:85%">подпись от руки</span>
          <span class="lb" style="top:93%">5 шкал + волна песни</span>
        </div>
        <div><p class="tl">один дневник</p><h2>Рамка одна, внутри — каждый раз новое</h2>
          <p>Номер, дата, название, подпись и «партитура» всегда стоят на своих местах — поэтому 6 разных дней рядом выглядят как дневник одного человека.</p>
          <p>Внутри окна меняются стиль, цвета, зерно и скорость. А внизу — настоящая форма громкости вашей песни.</p></div>
      </section>

      <section><p class="tl">шесть стилей</p><h2>Какой день — такая живопись</h2>
        <div class="styles">${PV.TECH_ORDER.map(k => { const t = PV.TECH[k], d = ex[k]; return `<a class="style" ${d ? `href="#day-${d.id}"` : ''}>${d ? `<img src="${d.poster}" alt="">` : '<div class="ph"></div>'}<b>${t.name}</b><span class="ref">${U.esc(t.ref.split(',')[0])}</span><span>${U.esc(t.when.split(';')[0])}</span></a>`; }).join('')}</div>
      </section>

      <section><p class="tl">простые правила</p><h2>Если… то…</h2>
        <div class="rules2">${rules.map(([i, a, b]) => `<div><span class="ri">${i}</span><b>${a}</b><span>${b}</span></div>`).join('')}</div>
      </section>
      <p class="disclaimer muted">Система угадывает настроение, чтобы красиво оформить страницу. Это не психологическая оценка.</p>`;
  }

  /* ---------- маршруты ---------- */
  function route() {
    const h = location.hash.replace('#', '') || 'feed';
    stopDay(); if (state.heroR && !h.startsWith('feed')) state.heroR.stop();
    const view = h.startsWith('day-') ? 'day' : ['feed', 'new', 'system'].includes(h) ? h : 'feed';
    $$('.view').forEach(v => v.hidden = v.id !== 'view-' + view);
    $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === view));
    if (view === 'day') openDay(h.slice(4));
    if (view === 'feed') { tint(null); state.heroR = null; renderFeed(); }
    if (view === 'system') { tint(null); renderSystem(); }
    if (view === 'new') tint(null);
    window.scrollTo(0, 0);
  }

  async function init() {
    initForm(); initDayActions();
    $('#thumbs').addEventListener('click', e => { const i = e.target.dataset.rm; if (i != null) { state.photos.splice(+i, 1); drawThumbs(); } });
    $('#chips').addEventListener('click', e => { const f = e.target.dataset.f; if (f) { state.filter = f; renderFeed(); } });
    $('#search').addEventListener('input', e => { state.q = e.target.value; renderFeed(); });
    $('#feed').addEventListener('mouseover', e => { const c = e.target.closest('.card[data-id]'); if (!c) return; const d = state.days.find(x => x.id === c.dataset.id); if (d) { clearTimeout(init.h); init.h = setTimeout(() => hero(d), 220); } });
    window.addEventListener('hashchange', route);
    try { if (speechSynthesis) speechSynthesis.getVoices(); } catch (e) { }
    try { await seedDemo(); } catch (e) { console.error('demo', e); }
    await loadDays();
    // после обновления дизайна перерисовываем обложки старых записей
    const old = state.days.filter(d => d.posterV !== POSTER_V);
    if (old.length) {
      $('#feed-count').textContent = 'Обновляю обложки страниц…';
      try { await Promise.race([document.fonts.ready, U.sleep(2000)]); } catch (e) { }
      for (const d of old) { const imgs = await Promise.all(d.photos.map(U.blobToImage)); const r = new PV.Renderer(U.canvas(10, 10)); await r.prepare(d, imgs); d.poster = r.poster(.5); d.posterV = POSTER_V; imgs.forEach(im => URL.revokeObjectURL(im.src)); await PV.store.put(d); }
    }
    route();
    if (!PV.store.persistent) toast('Хранилище браузера недоступно: дни сохранятся только до закрытия вкладки', 5000);
  }
  init();
})(window.PV);
