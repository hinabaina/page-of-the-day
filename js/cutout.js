/* Свои стикеры: вырезать предмет или человека из фото.
   «Нажми на предмет» — MediaPipe Interactive Segmenter (Apache-2.0, модель ~6 МБ, работает в браузере, фото никуда не уходит).
   Доводка вручную: ластик, кисть, лассо. На выходе PNG с прозрачностью и белой обводкой, как у настоящего стикера. */
(function (PV) {
  const { U } = PV, T = (s, v) => PV.T(s, v);
  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite';
  const MAXW = 900;
  let segP = null;
  // модель грузится один раз за сессию и только когда человек впервые нажал на предмет
  const segmenter = () => segP || (segP = (async () => {
    const { FilesetResolver, InteractiveSegmenter } = await import(MP + '/vision_bundle.mjs');
    const fs = await FilesetResolver.forVisionTasks(MP + '/wasm');
    return InteractiveSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' }, outputCategoryMask: true, outputConfidenceMasks: false });
  })().catch(e => { segP = null; throw e; }));

  PV.cutout = {
    // src — Blob или URL картинки; onSave(blob, asp) получает готовый стикер
    async open(src, onSave) {
      const box = U.$('#modal-box'); U.$('#modal').hidden = false;
      box.innerHTML = `<div class="sheet-head"><b>${T('Свой стикер из фото')}</b><button class="x" type="button" id="cu-x">✕</button></div><p class="note">${T('Открываю фото…')}</p>`;
      U.$('#cu-x').onclick = () => { U.$('#modal').hidden = true; };
      const url = typeof src === 'string' ? src : URL.createObjectURL(src);
      const im = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = url; }).catch(() => null);
      if (!im) { box.querySelector('.note').textContent = T('Не получилось открыть файл'); return; }
      const k = Math.min(1, MAXW / Math.max(im.naturalWidth, im.naturalHeight)), W = Math.round(im.naturalWidth * k), H = Math.round(im.naturalHeight * k);
      const base = U.canvas(W, H), bx = base.getContext('2d', { willReadFrequently: true }); bx.drawImage(im, 0, 0, W, H);
      const orig = bx.getImageData(0, 0, W, H);
      let mask = new Uint8Array(W * H).fill(255), tool = 'tap', size = 26, outline = true, adding = false;
      const hist = [];
      const push = () => { hist.push(mask.slice()); if (hist.length > 25) hist.shift(); };

      box.innerHTML = `<div class="sheet-head"><b>${T('Свой стикер из фото')}</b><button class="x" type="button" id="cu-x">✕</button></div>
        <div class="cu-tools chips">
          <button type="button" data-tool="tap" class="on">✦ ${T('Нажми на предмет')}</button>
          <button type="button" data-tool="erase">${T('Ластик')}</button>
          <button type="button" data-tool="brush">${T('Кисть')}</button>
          <button type="button" data-tool="lasso">${T('Лассо')}</button>
        </div>
        <p class="note cu-hint" id="cu-hint">${T('Нажми на то, что хочешь вырезать: человека, чашку, цветок. AI выделит его сам.')}</p>
        <div class="cu-stage"><canvas id="cu-cv" width="${W}" height="${H}"></canvas></div>
        <div class="cu-row">
          <label class="cu-size">${T('Размер кисти')} <input type="range" id="cu-size" min="6" max="80" value="${size}"></label>
          <label class="cu-chk"><input type="checkbox" id="cu-add"> ${T('Добавлять к выделенному')}</label>
          <label class="cu-chk"><input type="checkbox" id="cu-out" checked> ${T('Белая обводка')}</label>
        </div>
        <div class="row"><button class="btn ghost small" type="button" id="cu-undo">↶ ${T('Отменить')}</button><button class="btn ghost small" type="button" id="cu-all">${T('Всё фото')}</button><button class="btn pink" type="button" id="cu-ok">${T('Сохранить стикер')}</button></div>`;
      const cv = U.$('#cu-cv'), cx = cv.getContext('2d'), hint = U.$('#cu-hint');
      const view = cx.createImageData(W, H);
      let raf = 0;
      // вырезанное показываем как есть, убранное — бледным, чтобы было видно, что отрезано
      const draw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const s = orig.data, d = view.data; for (let i = 0, j = 0; i < mask.length; i++, j += 4) { d[j] = s[j]; d[j + 1] = s[j + 1]; d[j + 2] = s[j + 2]; d[j + 3] = mask[i] ? s[j + 3] : 46; } cx.putImageData(view, 0, 0); }); };
      draw();
      const close = () => { U.$('#modal').hidden = true; if (typeof src !== 'string') URL.revokeObjectURL(url); };
      U.$('#cu-x').onclick = close;
      U.$$('[data-tool]', box).forEach(b => b.onclick = () => { tool = b.dataset.tool; U.$$('[data-tool]', box).forEach(x => x.classList.toggle('on', x === b)); hint.textContent = { tap: T('Нажми на то, что хочешь вырезать: человека, чашку, цветок. AI выделит его сам.'), erase: T('Проведи по лишнему — оно исчезнет.'), brush: T('Проведи по тому, что нужно вернуть.'), lasso: T('Обведи предмет пальцем — останется только то, что внутри.') }[tool]; });
      U.$('#cu-size').oninput = e => { size = +e.target.value; };
      U.$('#cu-add').onchange = e => { adding = e.target.checked; };
      U.$('#cu-out').onchange = e => { outline = e.target.checked; };
      U.$('#cu-undo').onclick = () => { if (hist.length) { mask = hist.pop(); draw(); } };
      U.$('#cu-all').onclick = () => { push(); mask.fill(255); draw(); };

      const toImg = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
      const dab = (x, y, v) => { const r = size * W / cv.getBoundingClientRect().width / 2, r2 = r * r; for (let yy = Math.max(0, Math.floor(y - r)); yy <= Math.min(H - 1, y + r); yy++) for (let xx = Math.max(0, Math.floor(x - r)); xx <= Math.min(W - 1, x + r); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= r2) mask[yy * W + xx] = v; };
      let down = null, path = [];
      cv.addEventListener('pointerdown', async e => {
        e.preventDefault(); const p = toImg(e);
        if (tool === 'tap') return tapSelect(p);
        cv.setPointerCapture(e.pointerId); push(); down = p; path = [p];
        if (tool !== 'lasso') { dab(p.x, p.y, tool === 'erase' ? 0 : 255); draw(); }
      });
      cv.addEventListener('pointermove', e => {
        if (!down) return; const p = toImg(e);
        if (tool === 'lasso') { path.push(p); draw(); requestAnimationFrame(() => { cx.save(); cx.strokeStyle = '#e98aa8'; cx.lineWidth = Math.max(2, W / 250); cx.setLineDash([8, 6]); cx.beginPath(); path.forEach((q, i) => i ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y)); cx.stroke(); cx.restore(); }); return; }
        const steps = Math.ceil(Math.hypot(p.x - down.x, p.y - down.y) / 3) || 1;
        for (let i = 1; i <= steps; i++) dab(down.x + (p.x - down.x) * i / steps, down.y + (p.y - down.y) * i / steps, tool === 'erase' ? 0 : 255);
        down = p; draw();
      });
      const up = () => {
        if (!down) return; down = null;
        if (tool === 'lasso' && path.length > 5) { const c = U.canvas(W, H), x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#000'; x.beginPath(); path.forEach((q, i) => i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y)); x.closePath(); x.fill(); const a = x.getImageData(0, 0, W, H).data; for (let i = 0; i < mask.length; i++) if (a[i * 4 + 3] < 128) mask[i] = 0; }
        draw();
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      async function tapSelect(p) {
        hint.textContent = segP ? T('Выделяю…') : T('Загружаю AI для выделения (около 15 МБ, только в первый раз)…');
        try {
          const seg = await segmenter();
          let sel = null;
          seg.segment(base, { keypoint: { x: U.clamp(p.x / W, 0, 1), y: U.clamp(p.y / H, 0, 1) } }, res => {
            const m = res.categoryMask, a = m.getAsUint8Array(), mw = m.width, mh = m.height;
            // какой метке принадлежит точка нажатия — та и есть выбранный предмет
            const lab = a[Math.min(mh - 1, Math.round(p.y / H * mh)) * mw + Math.min(mw - 1, Math.round(p.x / W * mw))];
            sel = new Uint8Array(W * H);
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sel[y * W + x] = a[Math.floor(y / H * mh) * mw + Math.floor(x / W * mw)] === lab ? 255 : 0;
            m.close && m.close();
          });
          if (!sel || !sel.some(v => v)) { hint.textContent = T('Не нашла предмет в этом месте — нажми точнее или обведи лассо.'); return; }
          push();
          if (adding && mask.some(v => !v)) for (let i = 0; i < mask.length; i++) mask[i] = mask[i] || sel[i]; else mask = sel;
          draw(); hint.textContent = T('Готово. Можно поправить ластиком или кистью, или нажать «Сохранить стикер».');
        } catch (er) { console.warn('segmenter', er); hint.textContent = T('AI-выделение сейчас недоступно (нужен интернет). Обведи предмет лассо или сотри лишнее ластиком.'); }
      }

      U.$('#cu-ok').onclick = async () => {
        // обрезаем по краям вырезанного, добавляем обводку и лёгкую тень
        let x0 = W, y0 = H, x1 = -1, y1 = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) return hint.textContent = T('Ничего не выделено — нажми на предмет.');
        const cut = U.canvas(W, H), cc = cut.getContext('2d'), id = cc.createImageData(W, H);
        for (let i = 0, j = 0; i < mask.length; i++, j += 4) { id.data[j] = orig.data[j]; id.data[j + 1] = orig.data[j + 1]; id.data[j + 2] = orig.data[j + 2]; id.data[j + 3] = mask[i] ? orig.data[j + 3] : 0; }
        cc.putImageData(id, 0, 0);
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, r = outline ? Math.max(4, Math.round(Math.max(bw, bh) / 45)) : 0, pad = r + 8;
        const out = U.canvas(bw + pad * 2, bh + pad * 2), ox = out.getContext('2d');
        if (outline) {
          const sil = U.canvas(out.width, out.height), sx = sil.getContext('2d');
          for (let a = 0; a < 360; a += 15) sx.drawImage(cut, x0, y0, bw, bh, pad + Math.cos(a * Math.PI / 180) * r, pad + Math.sin(a * Math.PI / 180) * r, bw, bh);
          sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#ffffff'; sx.fillRect(0, 0, sil.width, sil.height);
          ox.shadowColor = 'rgba(40,30,50,.28)'; ox.shadowBlur = 8; ox.shadowOffsetY = 3; ox.drawImage(sil, 0, 0); ox.shadowColor = 'transparent';
        }
        ox.drawImage(cut, x0, y0, bw, bh, pad, pad, bw, bh);
        const sc = Math.min(1, 640 / Math.max(out.width, out.height)), fin = U.canvas(Math.round(out.width * sc), Math.round(out.height * sc));
        fin.getContext('2d').drawImage(out, 0, 0, fin.width, fin.height);
        const blob = await new Promise(res => fin.toBlob(res, 'image/png'));
        close(); onSave && onSave(blob, fin.height / fin.width);
      };
    }
  };
})(window.PV);
