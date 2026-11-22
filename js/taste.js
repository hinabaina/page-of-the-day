/* Вкус пользователя: что он оставляет, меняет и удаляет на сгенерированных страницах.
   Ключи вида 'bg:kraft', 'font:Caveat', 'frame:polaroid', 'st:cup', 'density'. Значения −3…3.
   Вес никогда не обнуляется — генератор продолжает пробовать и другие стили. */
(function (PV) {
  const { U } = PV;
  const get = prof => (prof && prof.taste) || {};
  const bump = (prof, k, d) => { if (!prof) return; const t = prof.taste = prof.taste || {}; t[k] = U.clamp((t[k] || 0) + d, -3, 3); };
  PV.taste = {
    get,
    bump,
    weigh: (t, k, w) => (t && t[k] ? w * Math.exp(U.clamp(t[k], -2.5, 2.5) * .45) : w),
    // страница сохранена: то, что на ней осталось, нравится
    learnSaved(prof, day) {
      if (!prof || !day) return;
      const t = prof.taste = prof.taste || {};
      Object.keys(t).forEach(k => { t[k] *= .97; });
      if (day.bg) bump(prof, 'bg:' + day.bg.type, .6);
      const title = day.items.find(i => i.role === 'title'); if (title) bump(prof, 'font:' + title.font, .6);
      day.items.filter(i => i.type === 'photo' && i.frame).forEach(i => bump(prof, 'frame:' + i.frame, .25));
      day.items.filter(i => i.type === 'sticker').forEach(i => bump(prof, 'st:' + i.name.split(':')[0], .2));
      if (day.gen) bump(prof, 'density', U.clamp(day.gen.density || 0, -2, 2) * .3);
    },
    // ручная правка на странице
    learnEdit(prof, kind, from, to) { if (from) bump(prof, kind + ':' + from, -.35); if (to) bump(prof, kind + ':' + to, .5); },
    density: prof => U.clamp(Math.round(get(prof).density || 0), -1, 1)
  };
})(window.PV);
