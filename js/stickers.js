/* Библиотека своих стикеров (SVG, нарисованы командой) и конструктор персонажа (OC). */
(function (PV) {
  const sv = (body, vb = '0 0 100 100') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
  const O = 'stroke="#3b2340" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  // c — основной цвет (можно перекрасить)
  const S = {
    heart: c => sv(`<path d="M50 86C20 66 8 50 10 33c2-14 16-22 28-16 6 3 10 8 12 12 2-4 6-9 12-12 12-6 26 2 28 16 2 17-10 33-40 53z" fill="${c || '#ff5c93'}" ${O}/><ellipse cx="30" cy="32" rx="7" ry="4" fill="#fff" opacity=".7" transform="rotate(-30 30 32)"/>`),
    hearts: c => sv(`<path d="M34 60C16 48 9 39 10 29c1-8 9-13 16-9 3 2 6 5 7 7 1-2 4-5 7-7 7-4 15 1 16 9 1 10-6 19-22 31z" fill="${c || '#ff8fb8'}" ${O}/><path d="M70 88C56 78 51 71 52 63c1-6 7-10 12-7 2 1 4 4 5 5 1-1 3-4 5-5 5-3 11 1 12 7 1 8-4 15-16 25z" fill="#ffc2d8" ${O}/>`),
    star: c => sv(`<path d="M50 8l11 26 28 3-21 19 6 28-24-14-24 14 6-28-21-19 28-3z" fill="${c || '#ffd84d'}" ${O}/><circle cx="42" cy="50" r="3" fill="#3b2340"/><circle cx="58" cy="50" r="3" fill="#3b2340"/><path d="M45 58q5 5 10 0" fill="none" ${O}/>`),
    sparkle: c => sv(`<path d="M50 6c4 26 12 36 40 44-28 8-36 18-40 44-4-26-12-36-40-44 28-8 36-18 40-44z" fill="${c || '#fff3a8'}" ${O}/><path d="M82 12c1 7 3 9 10 11-7 2-9 4-10 11-1-7-3-9-10-11 7-2 9-4 10-11z" fill="#ffd1e6" ${O}/>`),
    bow: c => sv(`<path d="M50 50L14 26c-6 0-8 40 0 46zM50 50l36-24c6 0 8 40 0 46z" fill="${c || '#ff6fa5'}" ${O}/><path d="M44 54l-12 30 10-2 6 8 4-34zM56 54l12 30-10-2-6 8-4-34z" fill="${c || '#ff6fa5'}" ${O}/><rect x="42" y="40" width="16" height="20" rx="6" fill="#ffb3d0" ${O}/>`),
    daisy: c => sv(`${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="50" cy="24" rx="11" ry="20" fill="${c || '#fff'}" ${O} transform="rotate(${a} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="14" fill="#ffcf4a" ${O}/>`),
    tulip: c => sv(`<path d="M50 52v40" ${O} fill="none"/><path d="M50 74c-14-2-22-10-24-20 10 2 20 8 24 20z" fill="#8fd18a" ${O}/><path d="M30 18c4 10 10 14 20 14s16-4 20-14c4 14 2 34-20 36-22-2-24-22-20-36z" fill="${c || '#ff7aa8'}" ${O}/><path d="M50 32l-8-18 8 8 8-8z" fill="${c || '#ff7aa8'}" ${O}/>`),
    cherry: c => sv(`<path d="M34 68C40 40 50 22 70 12M66 70C64 44 66 26 70 12" fill="none" ${O}/><path d="M70 12c8 4 14 2 20-4-8-6-16-4-20 4z" fill="#7fcf7a" ${O}/><circle cx="32" cy="72" r="16" fill="${c || '#ff3d6e'}" ${O}/><circle cx="66" cy="74" r="16" fill="${c || '#ff3d6e'}" ${O}/><circle cx="26" cy="66" r="4" fill="#fff" opacity=".8"/><circle cx="60" cy="68" r="4" fill="#fff" opacity=".8"/>`),
    butterfly: c => sv(`<path d="M50 50C36 18 8 16 12 40c2 12 18 14 38 10zM50 50c14-32 42-34 38-10-2 12-18 14-38 10z" fill="${c || '#b79cff'}" ${O}/><path d="M50 52c-18 4-30 14-24 26 6 10 18 0 24-26zM50 52c18 4 30 14 24 26-6 10-18 0-24-26z" fill="#ffb6d9" ${O}/><path d="M50 30v44M50 30l-6-12M50 30l6-12" fill="none" ${O}/>`),
    cloud: c => sv(`<path d="M24 72c-12 0-18-8-16-18 2-9 10-13 18-12 2-14 14-22 28-18 8 2 14 8 16 16 12-2 22 6 22 17 0 9-7 15-16 15z" fill="${c || '#fff'}" ${O}/><circle cx="40" cy="58" r="3" fill="#3b2340"/><circle cx="60" cy="58" r="3" fill="#3b2340"/><path d="M45 65q5 4 10 0" fill="none" ${O}/><ellipse cx="34" cy="64" rx="4" ry="2.5" fill="#ff9cc2"/><ellipse cx="66" cy="64" rx="4" ry="2.5" fill="#ff9cc2"/>`),
    sun: c => sv(`${Array.from({ length: 10 }, (_, i) => `<path d="M50 4l5 12h-10z" fill="#ffb74a" ${O} transform="rotate(${i * 36} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="24" fill="${c || '#ffd84d'}" ${O}/><circle cx="42" cy="48" r="3" fill="#3b2340"/><circle cx="58" cy="48" r="3" fill="#3b2340"/><path d="M44 56q6 6 12 0" fill="none" ${O}/>`),
    moon: c => sv(`<path d="M62 10C40 14 26 34 30 56s28 36 50 30C60 98 22 86 14 58 6 30 30 6 62 10z" fill="${c || '#ffe9a8'}" ${O}/><circle cx="74" cy="22" r="4" fill="#fff3a8" ${O}/><circle cx="86" cy="44" r="3" fill="#fff3a8" ${O}/>`),
    snow: c => sv(`<g ${O} stroke="${c || '#8fc8ff'}" stroke-width="6">${[0, 60, 120].map(a => `<path d="M50 8v84M50 22l-10-8M50 22l10-8M50 78l-10 8M50 78l10 8" transform="rotate(${a} 50 50)" fill="none"/>`).join('')}</g>`),
    rainbow: c => sv(`${['#ff8fab', '#ffc26b', '#fff07a', '#9be59b', '#8ccaff', '#c3a6ff'].map((col, i) => `<path d="M${10 + i * 6} 76a${40 - i * 6} ${40 - i * 6} 0 0 1 ${80 - i * 12} 0" fill="none" stroke="${col}" stroke-width="7"/>`).join('')}<path d="M4 78c0-8 14-10 18-2 6-6 16-2 14 6H6zM64 82c-2-8 8-12 14-6 4-8 18-6 18 2v4z" fill="#fff" ${O}/>`, '0 0 100 90'),
    strawberry: c => sv(`<path d="M50 92C24 80 16 54 22 40c6-12 22-14 28-8 6-6 22-4 28 8 6 14-2 40-28 52z" fill="${c || '#ff4f6d'}" ${O}/><path d="M30 34c6-12 14-14 20-10 6-4 14-2 20 10-8-2-14 0-20 4-6-4-12-6-20-4z" fill="#7fcf7a" ${O}/>${[[38, 52], [56, 50], [46, 64], [62, 66], [36, 70], [50, 78]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="#fff4a8"/>`).join('')}`),
    camera: c => sv(`<rect x="10" y="28" width="80" height="56" rx="12" fill="${c || '#ffb3cf'}" ${O}/><rect x="34" y="18" width="30" height="14" rx="5" fill="${c || '#ffb3cf'}" ${O}/><circle cx="50" cy="56" r="17" fill="#fff" ${O}/><circle cx="50" cy="56" r="8" fill="#6d5a8a"/><circle cx="76" cy="40" r="4" fill="#fff"/>`),
    note: c => sv(`<path d="M38 72V22l44-10v50" fill="none" ${O} stroke-width="5"/><ellipse cx="28" cy="74" rx="13" ry="10" fill="${c || '#c79cff'}" ${O}/><ellipse cx="72" cy="64" rx="13" ry="10" fill="${c || '#c79cff'}" ${O}/>`),
    cup: c => sv(`<path d="M20 38h52l-6 46c-1 6-5 8-10 8H36c-5 0-9-2-10-8z" fill="${c || '#ffd1e3'}" ${O}/><path d="M72 46c14-2 18 18 2 24" fill="none" ${O} stroke-width="5"/><path d="M38 28c-4-8 4-10 0-18M52 28c-4-8 4-10 0-18" fill="none" ${O}/><path d="M38 60q8 6 16 0" fill="none" ${O}/><path d="M40 52v-2M52 52v-2" ${O}/>`),
    leaf: c => sv(`<path d="M50 8c-6 12-22 14-30 10 4 10-4 18-12 20 10 6 10 16 6 24 12-2 22 4 26 14l10-10 10 10c4-10 14-16 26-14-4-8-4-18 6-24-8-2-16-10-12-20-8 4-24 2-30-10z" fill="${c || '#ff9a4a'}" ${O}/><path d="M50 30v62" fill="none" ${O}/>`),
    crown: c => sv(`<path d="M12 74l-4-46 22 18 20-30 20 30 22-18-4 46z" fill="${c || '#ffd84d'}" ${O}/><rect x="12" y="74" width="76" height="12" rx="4" fill="${c || '#ffd84d'}" ${O}/><circle cx="50" cy="56" r="6" fill="#ff6fa5" ${O}/>`),
    candy: c => sv(`<path d="M30 50L8 34v32zM70 50l22-16v32z" fill="#ffd1e6" ${O}/><circle cx="50" cy="50" r="22" fill="${c || '#ff7ab0'}" ${O}/><path d="M36 38c10 4 18 14 24 28M44 30c8 6 14 18 16 30" fill="none" stroke="#fff" stroke-width="5"/>`),
    tape: c => sv(`<path d="M4 18h92l-4 8 4 8-4 8 4 8H4l4-8-4-8 4-8z" fill="${c || '#ffc2dc'}" opacity=".85"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${12 + i * 10}" cy="34" r="3" fill="#fff" opacity=".8"/>`).join('')}`, '0 0 100 68'),
    smile: c => sv(`<circle cx="50" cy="50" r="40" fill="${c || '#fff07a'}" ${O}/><path d="M34 40q4-6 8 0M58 40q4-6 8 0" fill="none" ${O}/><path d="M32 58q18 18 36 0" fill="#ff7aa0" ${O}/><ellipse cx="28" cy="54" rx="6" ry="3.5" fill="#ff9cc2"/><ellipse cx="72" cy="54" rx="6" ry="3.5" fill="#ff9cc2"/>`),
    bubble: (c, t = 'люблю') => sv(`<path d="M10 20c0-8 6-12 12-12h56c8 0 12 6 12 12v30c0 8-6 12-12 12H40l-18 16 4-16h-4c-8 0-12-6-12-12z" fill="${c || '#fff'}" ${O}/><text x="50" y="44" text-anchor="middle" font-family="Caveat, Marck Script, cursive" font-weight="700" font-size="${t.length > 6 ? 18 : 24}" fill="#3b2340">${t}</text>`, '0 0 100 82'),

    // минимал / линейные
    arrow: c => sv(`<path d="M14 72C26 40 52 26 82 30" fill="none" stroke="${c || '#121212'}" stroke-width="5" stroke-linecap="round"/><path d="M70 18l14 12-14 12" fill="none" stroke="${c || '#121212'}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`),
    scribble: c => sv(`<path d="M50 14C24 12 8 30 12 52c4 24 34 36 56 30 22-6 30-30 20-48-8-14-28-20-44-16" fill="none" stroke="${c || '#ff5a36'}" stroke-width="4" stroke-linecap="round"/>`),
    asterisk: c => sv(`<g stroke="${c || '#121212'}" stroke-width="9" stroke-linecap="round">${[0, 45, 90, 135].map(a => `<path d="M50 12v76" transform="rotate(${a} 50 50)"/>`).join('')}</g>`),
    'star-line': c => sv(`<path d="M50 10l11 26 28 3-21 19 6 28-24-14-24 14 6-28-21-19 28-3z" fill="none" stroke="${c || '#121212'}" stroke-width="4" stroke-linejoin="round"/>`),
    'heart-line': c => sv(`<path d="M50 84C20 64 8 48 10 32c2-14 16-22 28-16 6 3 10 8 12 12 2-4 6-9 12-12 12-6 26 2 28 16 2 16-10 32-40 52z" fill="none" stroke="${c || '#ff5a36'}" stroke-width="5" stroke-linejoin="round"/>`),
    flash: c => sv(`<path d="M58 6L18 56h26l-8 38 44-54H54z" fill="${c || '#ffe14d'}" stroke="#121212" stroke-width="3" stroke-linejoin="round"/>`),
    pin: c => sv(`<circle cx="50" cy="34" r="22" fill="${c || '#ff5a36'}" stroke="#121212" stroke-width="3"/><path d="M50 56v36" stroke="#121212" stroke-width="4" stroke-linecap="round"/><circle cx="43" cy="27" r="6" fill="#fff" opacity=".6"/>`),
    clip: c => sv(`<path d="M38 88V26c0-10 8-16 16-16s16 6 16 16v52c0 6-4 10-10 10s-10-4-10-10V32" fill="none" stroke="${c || '#9aa0a6'}" stroke-width="5" stroke-linecap="round"/>`),
    film: c => sv(`<rect x="6" y="24" width="88" height="52" rx="4" fill="${c || '#121212'}"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${11 + i * 11}" y="28" width="6" height="6" rx="1" fill="#fff"/><rect x="${11 + i * 11}" y="66" width="6" height="6" rx="1" fill="#fff"/>`).join('')}<rect x="16" y="38" width="30" height="24" rx="2" fill="#ffb36b"/><rect x="54" y="38" width="30" height="24" rx="2" fill="#7fb8ff"/>`),
    'tape-k': c => sv(`<path d="M4 18h92l-3 8 3 8-3 8 3 8H4l3-8-3-8 3-8z" fill="${c || '#d6b98c'}" opacity=".92"/><path d="M10 26h80M10 40h80" stroke="#00000014" stroke-width="2"/>`, '0 0 100 68'),
    'tape-clear': c => sv(`<path d="M4 18h92l-3 8 3 8-3 8 3 8H4l3-8-3-8 3-8z" fill="${c || '#ffffff'}" opacity=".55" stroke="#00000018"/>`, '0 0 100 68'),
    label: (c, t = 'core memory') => sv(`<rect x="3" y="12" width="94" height="30" rx="15" fill="${c || '#121212'}"/><text x="50" y="32" text-anchor="middle" font-family="Unbounded, Onest, sans-serif" font-weight="700" font-size="${t.length > 11 ? 8.5 : 10.5}" fill="#fff">${t}</text>`, '0 0 100 54'),
    envelope: c => sv(`<rect x="8" y="24" width="84" height="58" rx="8" fill="${c || '#ffd1e3'}" ${O}/><path d="M8 30l42 30 42-30" fill="none" ${O}/><path d="M50 50c-8-6-12-2-12 2 0 5 7 8 12 12 5-4 12-7 12-12 0-4-4-8-12-2z" fill="#ff4f86" ${O}/>`),
    gift: c => sv(`<rect x="14" y="40" width="72" height="50" rx="6" fill="${c || '#c9b2ff'}" ${O}/><rect x="8" y="28" width="84" height="16" rx="5" fill="#e3d6ff" ${O}/><path d="M50 28v62" ${O} stroke="#ff5c93" stroke-width="8"/><path d="M50 28c-10-18-30-16-24-4 4 6 24 4 24 4zM50 28c10-18 30-16 24-4-4 6-24 4-24 4z" fill="#ff8fb8" ${O}/>`)
  };
  PV.STICKERS = S;
  PV.STICKER_CATS = {
    'Минимал': ['arrow', 'scribble', 'asterisk', 'star-line', 'heart-line', 'flash', 'sparkle', 'pin', 'clip', 'film', 'camera', 'note', 'cup', 'sun', 'moon', 'snow', 'leaf'],
    'Скотч и надписи': ['tape-k', 'tape-clear', 'tape', 'label:core memory', 'label:лучший день', 'label:не забыть', 'label:mood', 'label:2026', 'bubble:вау!', 'bubble:люблю', 'bubble:мой день', 'bubble:скучаю'],
    'Милые': ['heart', 'hearts', 'star', 'bow', 'daisy', 'tulip', 'cherry', 'butterfly', 'cloud', 'rainbow', 'strawberry', 'candy', 'crown', 'smile']
  };
  PV.STICKER_LIST = ['heart', 'hearts', 'star', 'sparkle', 'bow', 'daisy', 'tulip', 'cherry', 'butterfly', 'cloud', 'sun', 'moon', 'snow', 'rainbow', 'strawberry', 'camera', 'note', 'cup', 'leaf', 'crown', 'candy', 'tape', 'smile', 'bubble:люблю', 'bubble:вау!', 'bubble:мой день', 'bubble:лучший', 'bubble:скучаю'];
  PV.stickerSvg = (name, color) => { const [n, t] = name.split(':'); return (S[n] || S.heart)(color, t); };

  /* ---------- персонаж ---------- */
  PV.OC_KINDS = [['girl', 'Девочка'], ['boy', 'Мальчик'], ['cat', 'Котик'], ['bunny', 'Зайка'], ['bear', 'Мишка'], ['fox', 'Лисичка']];
  PV.OC_SKIN = ['#fbe1cf', '#f6cfb4', '#e8b393', '#c98d6b', '#9a6447', '#5e3a27'];
  PV.OC_FUR = ['#f7f3ee', '#e9d3b4', '#d29a63', '#e9884a', '#8a6a5a', '#4a4446', '#b9b4c8', '#d8b9a8'];
  PV.OC_HAIR = ['#1f1a1c', '#4a3328', '#7a5236', '#b3794a', '#e3c27a', '#c4563f', '#8b7fd1', '#d9d4cc'];
  PV.OC_HAIRSTYLE = [['long', 'Длинные'], ['bob', 'Каре'], ['buns', 'Пучки'], ['pony', 'Хвост'], ['short', 'Короткие'], ['curly', 'Кудряшки']];
  PV.OC_ACC = [['none', 'Ничего'], ['bow', 'Бантик'], ['glasses', 'Очки'], ['phones', 'Наушники'], ['flower', 'Цветок'], ['crown', 'Корона'], ['beanie', 'Шапка']];
  PV.OC_EYES = [['dot', 'Точки'], ['shine', 'Блестящие'], ['happy', 'Счастливые'], ['wink', 'Подмигивает']];
  PV.OC_DEFAULT = { kind: 'girl', skin: '#f6cfb4', fur: '#e9d3b4', hair: '#4a3328', style: 'long', eyes: 'dot', acc: 'none', outfit: '#2f3a4f' };

  // персонаж в спокойном плоском стиле: портрет по плечи, без толстых контуров
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };
  PV.ocSvg = function (o) {
    o = Object.assign({}, PV.OC_DEFAULT, o || {});
    const human = o.kind === 'girl' || o.kind === 'boy';
    return human ? humanSvg(o) : animalSvg(o);
  };
  function humanSvg(o) {
    const sk = o.skin, sd = shade(sk, .88), sd2 = shade(sk, .78), hr = o.hair, hd = shade(hr, .72), hl = shade(hr, 1.35), girl = o.kind === 'girl';
    const out = o.outfit, od = shade(out, .8), iris = '#5a3a28', lip = shade('#d07a7c', sk > '#c' ? 1 : .9);
    const st = o.style;
    const BACK = {
      long: `<path d="M60 20C34 20 24 42 26 70c1 22-5 44 2 64 7 5 16 5 22 0-4-16-6-32-6-48h32c0 16-2 32-6 48 6 5 15 5 22 0 7-20 1-42 2-64 2-28-8-50-34-50z" fill="${hd}"/>`,
      bob: `<path d="M60 21C36 21 25 42 27 68c1 13 0 26-3 34 9 5 18 3 22-2-4-9-6-19-6-30h40c0 11-2 21-6 30 4 5 13 7 22 2-3-8-4-21-3-34 2-26-9-47-33-47z" fill="${hd}"/>`,
      pony: `<path d="M84 44c16 6 20 30 12 52-2 8-6 14-10 16 2-12 0-26-6-36z" fill="${hd}"/>`,
      buns: `<circle cx="38" cy="26" r="12" fill="${hr}"/><circle cx="82" cy="26" r="12" fill="${hr}"/><path d="M33 22c3-6 9-8 13-6M75 16c4-2 10 0 13 6" fill="none" stroke="${hl}" stroke-width="1.4" opacity=".6"/>`,
      short: '',
      curly: [[30, 50], [27, 66], [30, 82], [34, 96], [90, 50], [93, 66], [90, 82], [86, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${hd}"/>`).join('')
    }[st];
    const FRONT = {
      long: `<path d="M32 66c-3-26 10-42 29-42 18 0 30 13 29 36-9-11-20-17-33-19-6 11-15 20-25 25z" fill="${hr}"/><path d="M58 28c-6 6-12 14-20 22M66 28c8 3 15 10 20 20" fill="none" stroke="${hl}" stroke-width="1.3" opacity=".55" stroke-linecap="round"/>`,
      bob: `<path d="M32 62c0-23 12-36 28-36s28 13 28 36c-4-6-8-9-12-9-5 0-10 3-16 3s-11-3-16-3c-4 0-8 3-12 9z" fill="${hr}"/><path d="M48 30c-4 6-7 13-8 22M72 30c4 6 7 13 8 22" fill="none" stroke="${hl}" stroke-width="1.2" opacity=".5" stroke-linecap="round"/>`,
      buns: `<path d="M33 62c0-22 12-35 27-35s27 13 27 35c-7-10-17-15-27-15s-20 5-27 15z" fill="${hr}"/><path d="M60 27v14" stroke="${hd}" stroke-width="1.4"/>`,
      pony: `<path d="M33 62c0-22 12-35 27-35 16 0 27 12 27 33-11-4-21-11-26-19-5 10-16 18-28 21z" fill="${hr}"/><path d="M62 30c6 6 14 10 22 14" fill="none" stroke="${hl}" stroke-width="1.3" opacity=".55" stroke-linecap="round"/>`,
      short: `<path d="M32 62c-1-24 12-37 29-37 16 0 28 11 27 32-3-6-7-10-12-11-9-7-21-7-30 0-6 3-11 8-14 16z" fill="${hr}"/><path d="M33 62c0 5 1 9 2 11M87 62c0 5-1 9-2 11" stroke="${hr}" stroke-width="4" stroke-linecap="round"/><path d="M46 31c6-3 14-4 22-1" fill="none" stroke="${hl}" stroke-width="1.3" opacity=".55" stroke-linecap="round"/>`,
      curly: `<path d="M31 64c0-24 13-38 29-38s29 14 29 38c-5-7-10-9-15-7-3-6-9-8-14-5-4-4-10-3-14 2-6-2-11 2-15 10z" fill="${hr}"/>${[[40, 34], [52, 28], [66, 28], [79, 35]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${hr}"/>`).join('')}`
    }[st];
    const eye = (cx, wink) => wink ? `<path d="M${cx - 5} 68q5 3.5 10 0" fill="none" stroke="#2b2226" stroke-width="1.8" stroke-linecap="round"/>`
      : o.eyes === 'happy' ? `<path d="M${cx - 5} 69q5-5 10 0" fill="none" stroke="#2b2226" stroke-width="1.8" stroke-linecap="round"/>`
      : `<ellipse cx="${cx}" cy="68" rx="5.2" ry="${o.eyes === 'shine' ? 3.9 : 3.4}" fill="#fff"/><circle cx="${cx}" cy="68.2" r="${o.eyes === 'shine' ? 3 : 2.6}" fill="${iris}"/><circle cx="${cx}" cy="68.2" r="1.3" fill="#1c1416"/><circle cx="${cx + 1}" cy="67" r=".9" fill="#fff"/>
         <path d="M${cx - 5.6} 67.2q5.6-5 11.2 0" fill="none" stroke="#2b2226" stroke-width="${girl ? 1.9 : 1.4}" stroke-linecap="round"/>${girl ? `<path d="M${cx + 5.2} 66.6l1.8-1.6M${cx + 3.6} 65l1-1.9" stroke="#2b2226" stroke-width="1.1" stroke-linecap="round"/>` : ''}`;
    const eyes = eye(49, false) + eye(71, o.eyes === 'wink');
    const brows = `<path d="M43 60c3-2.6 8-3 12-1.4l-.4 1.6c-3.6-1-7.6-.6-11 1.2z" fill="${hd}"/><path d="M77 60c-3-2.6-8-3-12-1.4l.4 1.6c3.6-1 7.6-.6 11 1.2z" fill="${hd}"/>`;
    const nose = `<path d="M60.5 70c.4 4 1.4 7 2.4 9" fill="none" stroke="${sd2}" stroke-width="1.3" stroke-linecap="round"/><path d="M56.5 80.5q3.5 2 7 0" fill="none" stroke="${sd2}" stroke-width="1.3" stroke-linecap="round"/>`;
    const mouth = `<path d="M53.5 87.6c2.2-1.4 4.4-1.6 6.5-.6 2.1-1 4.3-.8 6.5.6-1.8 3.4-4.2 5-6.5 5s-4.7-1.6-6.5-5z" fill="${girl ? lip : shade(lip, .95)}" opacity="${girl ? 1 : .75}"/><path d="M53.5 87.8q6.5 2.4 13 0" fill="none" stroke="${shade(lip, .7)}" stroke-width=".9"/>`;
    const acc = {
      none: '', bow: `<path d="M80 36l11-6c3 0 3 12 0 13zM80 36l-10-6c-3 0-3 12 0 13z" fill="#d9566e"/><circle cx="80" cy="36" r="3" fill="#b8435a"/>`,
      glasses: `<g fill="none" stroke="#2b2226" stroke-width="1.6"><rect x="41" y="62" width="16" height="12" rx="5"/><rect x="63" y="62" width="16" height="12" rx="5"/><path d="M57 67h6M41 66l-8-2M79 66l8-2"/></g>`,
      phones: `<path d="M30 70c0-36 60-36 60 0" fill="none" stroke="#2b2226" stroke-width="4"/><rect x="24" y="62" width="11" height="18" rx="5" fill="#3a3a44"/><rect x="85" y="62" width="11" height="18" rx="5" fill="#3a3a44"/>`,
      flower: `<g transform="translate(83 42)">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-5" rx="3.4" ry="5.4" fill="#fff" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#f0b43c"/></g>`,
      crown: `<path d="M45 30l-2-14 9 7 8-11 8 11 9-7-2 14z" fill="#f0c24a"/>`,
      beanie: `<path d="M30 54c0-26 13-34 30-34s30 8 30 34z" fill="#4b4e6d"/><rect x="28" y="49" width="64" height="9" rx="4.5" fill="#3b3e5a"/>`
    }[o.acc];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><defs><radialGradient id="bl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e98a8f" stop-opacity=".45"/><stop offset="1" stop-color="#e98a8f" stop-opacity="0"/></radialGradient></defs>
      ${BACK}
      <path d="M8 160c2-26 18-40 40-44h24c22 4 38 18 40 44z" fill="${out}"/>
      <path d="M48 116c4 6 20 6 24 0" fill="none" stroke="${od}" stroke-width="5" stroke-linecap="round"/>
      <path d="M30 140c2 8 3 14 3 20M90 140c-2 8-3 14-3 20" stroke="${od}" stroke-width="1.4" fill="none" opacity=".6"/>
      <path d="M52 94h16l2 22c-4 4-16 4-20 0z" fill="${sd}"/><path d="M51 98c4 6 14 6 18 0v6c-5 4-13 4-18 0z" fill="${sd2}" opacity=".7"/>
      <ellipse cx="32.5" cy="72" rx="4.5" ry="7" fill="${sd}"/><ellipse cx="87.5" cy="72" rx="4.5" ry="7" fill="${sd}"/>
      <path d="M60 30c20 0 28 16 28 36 0 18-8 31-21 37-4 2-10 2-14 0-13-6-21-19-21-37 0-20 8-36 28-36z" fill="${sk}"/>
      <path d="M80 50c5 10 6 24 1 36-3 7-8 12-13 15 8-8 12-19 12-32 0-7 0-13 0-19z" fill="${sd}" opacity=".3"/>
      ${FRONT}${brows}${eyes}${nose}${mouth}
      <ellipse cx="44" cy="80" rx="7" ry="4.5" fill="url(#bl)"/><ellipse cx="76" cy="80" rx="7" ry="4.5" fill="url(#bl)"/>
      ${acc}</svg>`;
  }
  function animalSvg(o) {
    const face = o.fur, dk = shade(face, .86), ink = '#2b2226', k = o.kind, inner = '#f6c9cf';
    let ears = '', muzzle = '', extra = '';
    if (k === 'cat' || k === 'fox') ears = `<path d="M34 54l2-30 22 16zM86 54l-2-30-22 16z" fill="${face}"/><path d="M38 46l1.5-15 11 8zM82 46l-1.5-15-11 8z" fill="${inner}"/>`;
    if (k === 'bunny') ears = `<path d="M44 44c-8-28-3-38 3-38 7 0 11 14 9 38zM76 44c8-28 3-38-3-38-7 0-11 14-9 38z" fill="${face}"/><path d="M47 38c-4-17-2-25 1-25s5 8 4 25zM73 38c4-17 2-25-1-25s-5 8-4 25z" fill="${inner}"/>`;
    if (k === 'bear') ears = `<circle cx="38" cy="38" r="11" fill="${face}"/><circle cx="82" cy="38" r="11" fill="${face}"/><circle cx="38" cy="38" r="5.5" fill="${dk}"/><circle cx="82" cy="38" r="5.5" fill="${dk}"/>`;
    muzzle = k === 'fox' ? `<path d="M40 74c6 16 34 16 40 0-2 14-10 22-20 22s-18-8-20-22z" fill="#fbf6ef"/>` : `<ellipse cx="60" cy="82" rx="14" ry="10" fill="#fbf6ef" opacity="${k === 'bear' ? 1 : .75}"/>`;
    extra = (k === 'cat' || k === 'fox') ? `<path d="M44 82l-12-2M44 86l-12 2M76 82l12-2M76 86l12 2" stroke="${shade(face, .6)}" stroke-width="1" stroke-linecap="round"/>` : '';
    const e = cx => o.eyes === 'happy' ? `<path d="M${cx - 4} 71q4-4 8 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>` : `<ellipse cx="${cx}" cy="70" rx="3.2" ry="3.8" fill="${ink}"/><circle cx="${cx + 1}" cy="68.6" r="1" fill="#fff"/>`;
    const acc = { none: '', bow: `<path d="M78 34l11-6c3 0 3 12 0 13zM78 34l-10-6c-3 0-3 12 0 13z" fill="#d9566e"/><circle cx="78" cy="34" r="3" fill="#b8435a"/>`, glasses: `<g fill="none" stroke="${ink}" stroke-width="1.8"><circle cx="50" cy="70" r="8"/><circle cx="70" cy="70" r="8"/><path d="M58 70h4"/></g>`, phones: `<path d="M30 70c0-34 60-34 60 0" fill="none" stroke="#2b2226" stroke-width="4"/><rect x="24" y="62" width="11" height="18" rx="5" fill="#3a3a44"/><rect x="85" y="62" width="11" height="18" rx="5" fill="#3a3a44"/>`, flower: `<g transform="translate(82 40)">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-5" rx="3.4" ry="5.4" fill="#fff" transform="rotate(${a})"/>`).join('')}<circle r="3" fill="#f0b43c"/></g>`, crown: `<path d="M44 32l-2-14 9 7 9-11 9 11 9-7-2 14z" fill="#f0c24a"/>`, beanie: `<path d="M31 52c0-24 13-32 29-32s29 8 29 32z" fill="#4b4e6d"/><rect x="29" y="47" width="62" height="9" rx="4.5" fill="#3b3e5a"/>` }[o.acc];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160">${ears}
      <path d="M14 160c2-26 18-38 46-38s44 12 46 38z" fill="${o.outfit}"/><path d="M50 104h20v18c0 5-20 5-20 0z" fill="${dk}"/>
      <ellipse cx="60" cy="70" rx="30" ry="30" fill="${face}"/>${muzzle}${extra}
      ${o.eyes === 'wink' ? e(50) + `<path d="M66 71q4-4 8 0" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>` : e(50) + e(70)}
      <path d="M56 78h8l-4 4z" fill="${ink}"/><path d="M60 82v3M60 85q-4 3-7 1M60 85q4 3 7 1" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
      <ellipse cx="44" cy="82" rx="5" ry="3" fill="#ef8f9c" opacity=".35"/><ellipse cx="76" cy="82" rx="5" ry="3" fill="#ef8f9c" opacity=".35"/>${acc}</svg>`;
  }
})(window.PV);
