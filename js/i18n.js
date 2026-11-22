/* Два языка интерфейса. Ключ — русская строка, английский перевод лежит в PV.EN (js/i18n-en.js).
   T('Готово, {n} фото', { n: 3 }) — подстановка значений в фигурных скобках. */
(function (PV) {
  PV.EN = PV.EN || {};
  let lang = 'ru';
  try { lang = localStorage.getItem('pv-lang') === 'en' ? 'en' : 'ru'; } catch (e) { }
  PV.lang = lang;
  if (lang === 'en' && PV.U) {
    const U = PV.U;
    U.MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    U.fmtDate = s => { const d = U.parseDate(s); return `${U.MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  }
  PV.T = (s, v) => {
    let r = (PV.lang === 'en' && PV.EN[s]) || s;
    if (v) r = r.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
    return r;
  };
  PV.setLang = l => { try { localStorage.setItem('pv-lang', l); } catch (e) { } location.reload(); };
  // статичный HTML: data-i18n — текст, data-i18n-ph — placeholder, data-i18n-aria — aria-label и title
  PV.applyI18n = (root = document) => {
    document.documentElement.lang = PV.lang;
    root.querySelectorAll('[data-i18n]').forEach(el => { if (!el.dataset.ru) el.dataset.ru = el.textContent.trim(); el.textContent = PV.T(el.dataset.ru); });
    root.querySelectorAll('[data-i18n-ph]').forEach(el => { if (!el.dataset.ruPh) el.dataset.ruPh = el.placeholder; el.placeholder = PV.T(el.dataset.ruPh); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { const k = el.getAttribute('aria-label') || el.title; if (!el.dataset.ruAria) el.dataset.ruAria = k; const t = PV.T(el.dataset.ruAria); el.setAttribute('aria-label', t); if (el.title) el.title = t; });
  };
})(window.PV);
