/* Песня по ссылке или описанию: жанр → темп/энергия/лад; узнавание артистов; встраиваемые плееры. */
(function (PV) {
  const { U } = PV;
  // жанр: [название, BPM, энергия, вероятность мажора, яркость звука, «эпоха-ностальгия» по умолчанию]
  const G = {
    jazz: ['Джаз', 108, .38, .65, .4], swing: ['Свинг / эстрада 50–60-х', 122, .52, .8, .45], soul: ['Соул / R&B', 94, .5, .55, .45],
    classical: ['Классика', 78, .28, .55, .35], piano: ['Фортепиано / неоклассика', 70, .18, .4, .3], ambient: ['Эмбиент', 68, .12, .45, .25],
    lofi: ['Лоу-фай', 80, .28, .45, .3], acoustic: ['Акустика / фолк', 96, .34, .6, .4], ethno: ['Этно', 100, .42, .5, .45],
    indie: ['Инди', 112, .5, .5, .5], pop: ['Поп', 116, .66, .7, .62], synthpop: ['Синти-поп', 112, .62, .45, .6],
    rock: ['Рок', 126, .76, .55, .62], rusrock: ['Русский рок', 120, .62, .35, .52], postpunk: ['Пост-панк', 140, .66, .2, .5],
    alt: ['Альтернатива', 106, .55, .35, .5], triphop: ['Трип-хоп', 86, .38, .25, .35], hiphop: ['Хип-хоп / рэп', 90, .66, .4, .55],
    electronic: ['Электроника', 124, .8, .45, .7], techno: ['Техно', 132, .9, .3, .7], house: ['Хаус', 124, .76, .65, .7],
    metal: ['Метал', 150, .95, .25, .7], kpop: ['K-pop / Q-pop', 120, .78, .75, .7], soundtrack: ['Саундтрек', 90, .45, .45, .4], phonk: ['Фонк', 132, .9, .15, .55]
  };
  // известные артисты: жанр и год (ориентир для эпохи, если год не указан)
  const A = {
    'frank sinatra': ['swing', 1964, 'major'], 'синатра': ['swing', 1964, 'major'], 'louis armstrong': ['jazz', 1967, 'major'], 'ella fitzgerald': ['jazz', 1956, 'major'],
    'chet baker': ['jazz', 1954, 'minor'], 'nina simone': ['jazz', 1965, 'minor'], 'norah jones': ['jazz', 2002, 'major'], 'abba': ['pop', 1976, 'major'],
    'the beatles': ['rock', 1967, 'major'], 'beatles': ['rock', 1967, 'major'], 'queen': ['rock', 1980, 'major'], 'michael jackson': ['pop', 1983, 'major'],
    'the cure': ['postpunk', 1989, 'minor'], 'depeche mode': ['synthpop', 1990, 'minor'], 'nirvana': ['rock', 1991, 'minor'], 'radiohead': ['alt', 1997, 'minor'],
    'massive attack': ['triphop', 1998, 'minor'], 'portishead': ['triphop', 1994, 'minor'], 'aphex twin': ['electronic', 1995, 'minor'], 'daft punk': ['electronic', 2001, 'major'],
    'linkin park': ['rock', 2003, 'minor'], 'coldplay': ['pop', 2008, 'major'], 'bon iver': ['indie', 2008, 'minor'], 'kavinsky': ['synthpop', 2010, 'minor'],
    'lana del rey': ['alt', 2012, 'minor'], 'arctic monkeys': ['indie', 2013, 'minor'], 'ludovico einaudi': ['piano', 2013, 'minor'], 'эйнауди': ['piano', 2013, 'minor'],
    'hans zimmer': ['soundtrack', 2014, 'minor'], 'adele': ['pop', 2015, 'minor'], 'taylor swift': ['pop', 2014, 'major'], 'ed sheeran': ['acoustic', 2017, 'major'],
    'imagine dragons': ['rock', 2017, 'minor'], 'billie eilish': ['pop', 2019, 'minor'], 'the weeknd': ['synthpop', 2020, 'minor'], 'joji': ['lofi', 2018, 'minor'],
    'muse': ['rock', 2006, 'minor'], 'dua lipa': ['pop', 2020, 'major'], 'harry styles': ['pop', 2022, 'major'], 'tame impala': ['indie', 2015, 'major'],
    'кино': ['rusrock', 1988, 'minor'], 'виктор цой': ['rusrock', 1988, 'minor'], 'цой': ['rusrock', 1988, 'minor'], 'земфира': ['rusrock', 2000, 'minor'],
    'сплин': ['rusrock', 2001, 'minor'], 'мумий тролль': ['indie', 1998, 'major'], 'би-2': ['rusrock', 2000, 'minor'], 'ддт': ['rusrock', 1992, 'minor'],
    'аквариум': ['rusrock', 1986, 'major'], 'мельница': ['ethno', 2005, 'minor'], 'молчат дома': ['postpunk', 2018, 'minor'], 'нервы': ['rusrock', 2016, 'minor'],
    'скриптонит': ['hiphop', 2017, 'minor'], 'scriptonite': ['hiphop', 2017, 'minor'], 'miyagi': ['hiphop', 2016, 'minor'], 'мияги': ['hiphop', 2016, 'minor'],
    'macan': ['hiphop', 2022, 'minor'], 'jony': ['pop', 2020, 'minor'], 'dimash': ['pop', 2017, 'minor'], 'димаш': ['pop', 2017, 'minor'], 'ninety one': ['kpop', 2016, 'major'],
    'кайрат нуртас': ['pop', 2014, 'major'], 'bts': ['kpop', 2020, 'major'], 'монеточка': ['pop', 2018, 'major'], 'полина гагарина': ['pop', 2015, 'minor'],
    'max richter': ['piano', 2004, 'minor'], 'brian eno': ['ambient', 1978, 'major'], 'ólafur arnalds': ['piano', 2015, 'minor'], 'olafur arnalds': ['piano', 2015, 'minor'],
    'justice': ['electronic', 2007, 'minor'], 'макс корж': ['pop', 2016, 'major'], 'max korzh': ['pop', 2016, 'major'], 'звери': ['rusrock', 2004, 'major'], 'мальбэк': ['indie', 2016, 'major'], 'kordhell': ['phonk', 2022, 'minor'], 'interworld': ['phonk', 2021, 'minor'], 'пошлая молли': ['rock', 2018, 'minor'], 'мэйби бэйби': ['hiphop', 2020, 'major'], 'три дня дождя': ['rock', 2021, 'minor'], 'cupsize': ['indie', 2021, 'minor'], 'шайни': ['pop', 2021, 'minor'], 'moderat': ['electronic', 2013, 'minor'], 'boris brejcha': ['techno', 2017, 'minor'], 'stromae': ['pop', 2013, 'minor']
  };
  PV.GENRES = G;
  PV.lookupArtist = name => { const s = String(name || '').toLowerCase().trim(); if (!s) return null; if (A[s]) return A[s]; const k = Object.keys(A).find(k => s.includes(k)); return k ? A[k] : null; };

  PV.parseSongLink = function (url) {
    url = String(url || '').trim(); if (!url) return null;
    let m, service = 'Ссылка', embed = null, h = 152;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([\w-]{11})/))) { service = 'YouTube'; embed = `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0`; h = 220; }
    else if ((m = url.match(/open\.spotify\.com\/(?:intl-\w+\/)?(track|album|playlist)\/(\w+)/))) { service = 'Spotify'; embed = `https://open.spotify.com/embed/${m[1]}/${m[2]}`; }
    else if ((m = url.match(/music\.yandex\.\w+\/album\/(\d+)\/track\/(\d+)/))) { service = 'Яндекс Музыка'; embed = `https://music.yandex.ru/iframe/track/${m[2]}/${m[1]}`; h = 180; }
    else if (/soundcloud\.com\//.test(url)) { service = 'SoundCloud'; embed = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23d8432b&visual=false`; h = 166; }
    else if ((m = url.match(/music\.apple\.com\/(.+)/))) { service = 'Apple Music'; embed = `https://embed.music.apple.com/${m[1]}`; h = 175; }
    else if (/vk\.com|boom\.ru/.test(url)) service = 'VK Музыка';
    else if (/youtube\.com\/results/.test(url)) service = 'YouTube';
    return { url, service, embed, height: h };
  };
  // название трека по ссылке (если сеть доступна; без неё просто молча пропускаем)
  PV.fetchSongTitle = async function (url) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch('https://noembed.com/embed?url=' + encodeURIComponent(url), { signal: ctl.signal }); clearTimeout(t);
      const j = await r.json(); if (!j || !j.title) return null;
      const parts = j.title.split(/\s[-–—]\s/);
      return parts.length > 1 ? { artist: parts[0].trim(), title: parts.slice(1).join(' — ').replace(/\(.*?(video|клип|lyric|audio).*?\)/i, '').trim() } : { artist: j.author_name || '', title: j.title };
    } catch (e) { return null; }
  };

  // музыкальные признаки по описанию песни (когда нет файла)
  PV.describeMusic = function (meta) {
    const art = PV.lookupArtist(meta.artist);
    const gk = meta.genre || (art && art[0]) || 'pop';
    const g = G[gk] || G.pop;
    const year = +meta.year || (art && art[1]) || 0;
    let bpm = g[1], energy = g[2];
    if (meta.tempo === 'slow') { bpm = Math.min(bpm, 72); energy *= .7; }
    if (meta.tempo === 'fast') { bpm = Math.max(bpm, 128); energy = Math.min(1, energy + .2); }
    if (meta.tempo === 'mid') { bpm = U.clamp(bpm, 92, 118); }
    const mode = meta.mode || (art && art[2]) || (g[3] >= .5 ? 'major' : 'minor');
    return {
      source: 'description', genre: gk, genreName: g[0], year, bpm, beatOffset: 0, energy: U.clamp(energy),
      brightness: g[4], mode, key: mode === 'minor' ? 'минор' : 'мажор', artistKnown: !!art, envelope: null
    };
  };
})(window.PV);
