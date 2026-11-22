/* Демо-дни. «Фото» нарисованы процедурно (чтобы не использовать чужие снимки), дальше они проходят
   тот же конвейер, что и настоящие: анализ → система → страница. Замените их своими днями. */
(function (PV) {
  const { U } = PV;
  const P = { W: 1200, H: 900 };
  function lin(x, y0, y1, stops) { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function glow(x, cx, cy, r, col, a = 1) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
  function finish(c, seed, blur = .6) {
    const x = c.getContext('2d'), r = U.rng(seed), t = U.canvas(c.width, c.height), tx = t.getContext('2d');
    tx.filter = `blur(${blur}px)`; tx.drawImage(c, 0, 0); x.clearRect(0, 0, c.width, c.height); x.drawImage(t, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height); for (let i = 0; i < d.data.length; i += 4) { const n = (r() - .5) * 14; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } x.putImageData(d, 0, 0);
    return c;
  }
  const person = (x, px, py, s, col) => { x.fillStyle = col; x.beginPath(); x.arc(px, py - s * 1.7, s * .32, 0, 7); x.fill(); x.beginPath(); x.roundRect(px - s * .34, py - s * 1.35, s * .68, s * 1.35, s * .25); x.fill(); };
  const S = {
    embankment(x, r) {
      x.fillStyle = lin(x, 0, 560, [[0, '#3c3a78'], [.45, '#c85a6a'], [.8, '#f2a25a'], [1, '#ffd08a']]); x.fillRect(0, 0, P.W, 560);
      glow(x, 820, 470, 300, 'rgba(255,200,120,A)', .9); x.fillStyle = '#ffe2a8'; x.beginPath(); x.arc(820, 500, 46, 0, 7); x.fill();
      x.fillStyle = '#2a2240'; [[0, 120, 340], [130, 80, 300], [250, 160, 360], [1000, 110, 330], [1100, 70, 300]].forEach(([bx, bw, by]) => x.fillRect(bx, by, bw, 260));
      for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,214,140,.8)'; x.fillRect(r() < .5 ? r() * 360 : 1000 + r() * 200, 360 + r() * 180, 4, 6); }
      x.fillStyle = lin(x, 560, 760, [[0, '#d78a6a'], [1, '#4a3a6a']]); x.fillRect(0, 560, P.W, 200);
      for (let i = 0; i < 80; i++) { x.fillStyle = `rgba(255,${190 + r() * 50},140,${.2 + r() * .4})`; x.fillRect(640 + (r() - .5) * 420, 570 + r() * 180, 30 + r() * 70, 3); }
      x.fillStyle = '#1e1a2a'; x.fillRect(0, 740, P.W, 160); x.fillStyle = '#2b2538'; x.fillRect(0, 728, P.W, 16);
      for (let i = 0; i < 13; i++) x.fillRect(i * 100, 690, 6, 40);
      person(x, 470, 728, 70, '#141019'); person(x, 540, 728, 64, '#2a1720');
      x.strokeStyle = '#f4f0ea'; x.lineWidth = 3; x.beginPath(); x.moveTo(478, 610); x.quadraticCurveTo(505, 660, 532, 618); x.stroke();
    },
    study(x, r) {
      x.fillStyle = '#120f16'; x.fillRect(0, 0, P.W, P.H);
      for (let i = 0; i < 26; i++) { const c = ['#ffd84a', '#ff8fb1', '#8fd6ff', '#b8ff8f'][i % 4]; x.save(); x.translate(120 + (i % 9) * 120 + r() * 30, 60 + Math.floor(i / 9) * 130 + r() * 30); x.rotate((r() - .5) * .3); x.fillStyle = c; x.fillRect(-48, -48, 96, 96); x.fillStyle = 'rgba(0,0,0,.45)'; x.font = '600 20px monospace'; x.fillText(['log₂8=3', 'sin²+cos²', 'x=−b/2a', 'v=s/t', 'aⁿ·aᵐ', 'ΔABC', '√144', 'F=ma', 'π≈3.14'][i % 9], -40, 6); x.restore(); }
      glow(x, 330, 420, 520, 'rgba(255,214,140,A)', .55);
      x.fillStyle = '#2a2230'; x.fillRect(0, 560, P.W, 340);
      x.fillStyle = '#1a1520'; x.beginPath(); x.moveTo(250, 560); x.lineTo(300, 300); x.lineTo(330, 300); x.lineTo(300, 560); x.fill(); x.fillStyle = '#ffcf70'; x.beginPath(); x.moveTo(250, 300); x.lineTo(380, 300); x.lineTo(350, 250); x.lineTo(280, 250); x.fill();
      x.fillStyle = '#f0ebe0'; x.save(); x.translate(620, 690); x.rotate(-.08); x.fillRect(-230, -90, 460, 180); x.strokeStyle = 'rgba(40,60,140,.5)'; x.lineWidth = 2; for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(-210, -60 + k * 22); x.lineTo(-210 + 200 + r() * 200, -60 + k * 22); x.stroke(); } x.restore();
      [[950, 640, '#3fd16a'], [1040, 660, '#3a8cff'], [880, 700, '#3fd16a']].forEach(([cx, cy, c]) => { x.fillStyle = c; x.beginPath(); x.roundRect(cx - 32, cy - 90, 64, 150, 10); x.fill(); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(cx - 32, cy - 30, 64, 14); });
    },
    dawnRoof(x, r) {
      x.fillStyle = lin(x, 0, 640, [[0, '#6c7fc8'], [.4, '#e9a0b8'], [.75, '#ffc89a'], [1, '#fff0c8']]); x.fillRect(0, 0, P.W, 640);
      glow(x, 600, 600, 380, 'rgba(255,240,200,A)', .95);
      x.fillStyle = '#7c6a9a'; let bx = 0; while (bx < P.W) { const w = 60 + r() * 110, h = 80 + r() * 200; x.fillRect(bx, 600 - h, w - 6, h + 40); bx += w; }
      x.fillStyle = '#3a2f4a'; x.fillRect(0, 640, P.W, 260); x.fillStyle = '#4a3d5c'; x.fillRect(0, 630, P.W, 14);
      for (let i = 0; i < 9; i++) { const px = 140 + i * 115 + (r() - .5) * 30, s = 60 + r() * 14; person(x, px, 640, s, '#221a2c'); x.strokeStyle = ['#e33', '#fff', '#3a7'][i % 3]; x.lineWidth = 6; x.beginPath(); x.moveTo(px - s * .3, 640 - s * 1.3); x.lineTo(px + s * .3, 640 - s * .4); x.stroke(); }
      for (let i = 0; i < 30; i++) { x.fillStyle = `hsl(${r() * 360},80%,70%)`; x.fillRect(r() * P.W, r() * 400, 6, 10); }
    },
    concert(x, r) {
      x.fillStyle = '#07060c'; x.fillRect(0, 0, P.W, P.H);
      [['255,60,140', 300], ['80,140,255', 600], ['255,200,60', 900], ['160,80,255', 450], ['80,255,200', 760]].forEach(([c, sx]) => { const g = x.createLinearGradient(sx, 0, sx, 600); g.addColorStop(0, `rgba(${c},.75)`); g.addColorStop(1, `rgba(${c},0)`); x.fillStyle = g; x.beginPath(); x.moveTo(sx - 10, 0); x.lineTo(sx + 10, 0); x.lineTo(sx + 260 * (r() - .5) + 160, 620); x.lineTo(sx + 260 * (r() - .5) - 160, 620); x.fill(); });
      x.fillStyle = '#1a1626'; x.fillRect(200, 360, 800, 60); glow(x, 600, 360, 260, 'rgba(255,255,255,A)', .5);
      for (let i = 0; i < 520; i++) { x.fillStyle = `rgba(255,255,230,${.4 + r() * .6})`; x.beginPath(); x.arc(r() * P.W, 120 + r() * 520, .8 + r() * 2.2, 0, 7); x.fill(); }
      for (let i = 0; i < 60; i++) { const px = r() * P.W, py = 700 + r() * 220; x.fillStyle = '#05040a'; x.beginPath(); x.arc(px, py, 26 + r() * 14, 0, 7); x.fill(); if (r() > .6) { x.fillRect(px - 4, py - 110, 8, 80); x.fillStyle = '#fff'; x.beginPath(); x.arc(px, py - 116, 6, 0, 7); x.fill(); glow(x, px, py - 116, 30, 'rgba(255,255,255,A)', .5); } }
    },
    park(x, r) {
      x.fillStyle = lin(x, 0, 520, [[0, '#b9c6cc'], [1, '#efd6a4']]); x.fillRect(0, 0, P.W, P.H);
      for (let i = 0; i < 60; i++) { x.fillStyle = `hsla(${32 + r() * 18},70%,${55 + r() * 15}%,.55)`; x.beginPath(); x.arc(r() * P.W, 300 + r() * 120, 40 + r() * 70, 0, 7); x.fill(); }
      x.fillStyle = lin(x, 480, 900, [[0, '#b28a4e'], [1, '#6e4e2b']]); x.fillRect(0, 480, P.W, 420);
      x.fillStyle = '#d9c39a'; x.beginPath(); x.moveTo(560, 470); x.lineTo(640, 470); x.lineTo(980, 900); x.lineTo(220, 900); x.fill();
      [[150, 1.2], [330, .8], [880, .9], [1060, 1.3]].forEach(([tx, s]) => {
        x.fillStyle = '#3b2a1c'; x.fillRect(tx - 12 * s, 260, 24 * s, 300 * s);
        for (let i = 0; i < 70; i++) { x.fillStyle = `hsl(${30 + r() * 22},${70 + r() * 20}%,${45 + r() * 22}%)`; x.beginPath(); x.arc(tx + (r() - .5) * 320 * s, 220 + (r() - .5) * 240 * s, 18 + r() * 30, 0, 7); x.fill(); }
      });
      for (let i = 0; i < 260; i++) { x.fillStyle = `hsl(${34 + r() * 18},80%,${45 + r() * 20}%)`; x.beginPath(); x.ellipse(r() * P.W, 560 + r() * 340, 5 + r() * 6, 3, r() * 3, 0, 7); x.fill(); }
      person(x, 585, 520, 46, '#2b2422'); person(x, 625, 522, 42, '#5a2f2a');
    },
    cocoa(x, r) {
      x.fillStyle = lin(x, 0, 900, [[0, '#7a5232'], [1, '#4b301c']]); x.fillRect(0, 0, P.W, P.H);
      for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(30,15,5,${.1 + r() * .15})`; x.lineWidth = 2 + r() * 4; x.beginPath(); x.moveTo(0, r() * 900); x.bezierCurveTo(400, r() * 900, 800, r() * 900, 1200, r() * 900); x.stroke(); }
      [[430, 450], [760, 500]].forEach(([cx, cy], i) => {
        x.fillStyle = 'rgba(0,0,0,.3)'; x.beginPath(); x.ellipse(cx + 18, cy + 22, 170, 150, 0, 0, 7); x.fill();
        x.fillStyle = i ? '#e7dccb' : '#c94f32'; x.beginPath(); x.arc(cx, cy, 160, 0, 7); x.fill();
        x.fillStyle = '#5a3420'; x.beginPath(); x.arc(cx, cy, 125, 0, 7); x.fill();
        x.fillStyle = '#c99b72'; x.beginPath(); x.arc(cx - 10, cy - 8, 82, 0, 7); x.fill();
        for (let k = 0; k < 9; k++) { x.fillStyle = '#f4ece0'; x.beginPath(); x.arc(cx - 40 + r() * 70, cy - 40 + r() * 60, 10 + r() * 8, 0, 7); x.fill(); }
      });
      for (let i = 0; i < 7; i++) { x.fillStyle = `hsl(${38 + r() * 12},85%,52%)`; x.save(); x.translate(r() * P.W, r() * P.H); x.rotate(r() * 6); x.beginPath(); x.ellipse(0, 0, 50, 22, 0, 0, 7); x.fill(); x.restore(); }
      glow(x, 300, 180, 520, 'rgba(255,214,150,A)', .25);
    },
    pond(x, r) {
      x.fillStyle = lin(x, 0, 420, [[0, '#9fb0b8'], [1, '#e4c68e']]); x.fillRect(0, 0, P.W, 420);
      for (let i = 0; i < 90; i++) { x.fillStyle = `hsla(${28 + r() * 25},75%,${45 + r() * 20}%,.8)`; x.beginPath(); x.arc(r() * P.W, 260 + r() * 160, 30 + r() * 50, 0, 7); x.fill(); }
      x.fillStyle = lin(x, 420, 760, [[0, '#7b8a8a'], [1, '#3e4e52']]); x.fillRect(0, 420, P.W, 340);
      for (let i = 0; i < 120; i++) { x.fillStyle = `hsla(${35 + r() * 10},70%,60%,${.15 + r() * .25})`; x.fillRect(r() * P.W, 430 + r() * 300, 40 + r() * 120, 3); }
      x.fillStyle = '#5c4630'; x.fillRect(0, 740, P.W, 160);
      x.fillStyle = '#2a1f17'; x.fillRect(360, 650, 460, 22); x.fillRect(380, 690, 420, 16); x.fillRect(390, 640, 14, 120); x.fillRect(780, 640, 14, 120);
      person(x, 560, 650, 52, '#2c2523'); person(x, 620, 652, 48, '#6d3326');
    },
    office(x, r) {
      x.fillStyle = '#0d1424'; x.fillRect(0, 0, P.W, P.H);
      x.fillStyle = '#121d33'; x.fillRect(60, 40, 1080, 480);
      for (let i = 0; i < 260; i++) { x.fillStyle = r() > .3 ? `rgba(255,${190 + r() * 60},${120 + r() * 80},${.4 + r() * .6})` : 'rgba(160,200,255,.7)'; x.fillRect(80 + r() * 1040, 200 + r() * 300, 3 + r() * 5, 3 + r() * 5); }
      x.strokeStyle = '#05080f'; x.lineWidth = 10; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(60 + i * 270, 40); x.lineTo(60 + i * 270, 520); x.stroke(); } x.beginPath(); x.moveTo(60, 280); x.lineTo(1140, 280); x.stroke();
      x.fillStyle = '#1c2230'; x.fillRect(0, 600, P.W, 300);
      glow(x, 600, 470, 560, 'rgba(70,140,255,A)', .45);
      x.fillStyle = '#0a0f1a'; x.fillRect(330, 300, 540, 330); x.fillStyle = '#122a52'; x.fillRect(348, 316, 504, 296);
      for (let i = 0; i < 16; i++) { x.fillStyle = ['#5fd3ff', '#9cff9c', '#ffd36b', '#d7e3ff'][i % 4]; x.fillRect(370 + (i % 3) * 26, 334 + i * 17, 80 + r() * 300, 6); }
      x.fillStyle = '#2b3243'; x.fillRect(410, 700, 380, 90);
      for (let i = 0; i < 60; i++) { x.fillStyle = '#3c4559'; x.fillRect(420 + (i % 15) * 25, 710 + Math.floor(i / 15) * 19, 20, 14); }
      x.fillStyle = '#e8e2d6'; x.beginPath(); x.arc(960, 760, 60, 0, 7); x.fill(); x.fillStyle = '#2a1a10'; x.beginPath(); x.arc(960, 760, 46, 0, 7); x.fill();
    },
    desk(x, r) {
      x.fillStyle = '#171b24'; x.fillRect(0, 0, P.W, P.H);
      glow(x, 1200, 0, 900, 'rgba(80,150,255,A)', .35);
      x.save(); x.translate(560, 470); x.rotate(-.18); x.fillStyle = '#2a303d'; x.fillRect(-380, -140, 760, 280);
      for (let i = 0; i < 70; i++) { x.fillStyle = i === 40 ? '#d84a2e' : '#40485a'; x.fillRect(-360 + (i % 14) * 52, -120 + Math.floor(i / 14) * 50, 44, 40); } x.restore();
      x.fillStyle = '#efe9df'; x.beginPath(); x.arc(980, 240, 95, 0, 7); x.fill(); x.fillStyle = '#1d120b'; x.beginPath(); x.arc(980, 240, 74, 0, 7); x.fill();
      [[140, 150, '#ffd84a'], [230, 210, '#ff8fb1'], [150, 720, '#ffd84a']].forEach(([sx, sy, c]) => { x.save(); x.translate(sx, sy); x.rotate((r() - .5) * .4); x.fillStyle = c; x.fillRect(-60, -60, 120, 120); x.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 3; k++) x.fillRect(-44, -30 + k * 22, 70 + r() * 18, 5); x.restore(); });
    },
    lake(x, r) {
      x.fillStyle = lin(x, 0, 380, [[0, '#4aa3e8'], [1, '#bfe3f6']]); x.fillRect(0, 0, P.W, 380);
      glow(x, 980, 110, 220, 'rgba(255,250,215,A)', .95);
      x.fillStyle = '#6b7f98'; x.beginPath(); x.moveTo(0, 360); [[120, 210], [260, 300], [420, 150], [600, 290], [760, 170], [940, 280], [1080, 190], [1200, 300], [1200, 380], [0, 380]].forEach(p => x.lineTo(...p)); x.fill();
      x.fillStyle = '#f5f8fb'; [[420, 150], [760, 170], [1080, 190], [120, 210]].forEach(([px, py]) => { x.beginPath(); x.moveTo(px, py); x.lineTo(px - 55, py + 55); x.lineTo(px + 50, py + 50); x.fill(); });
      x.fillStyle = lin(x, 380, 640, [[0, '#2fb6c9'], [1, '#1a7fa6']]); x.fillRect(0, 380, P.W, 260);
      for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(255,255,255,.6)'; x.fillRect(r() * P.W, 400 + r() * 230, 30 + r() * 60, 3); }
      x.fillStyle = lin(x, 640, 900, [[0, '#e8d3a6'], [1, '#cfb380']]); x.fillRect(0, 640, P.W, 260);
      [['#ff5d5d', 200], ['#ffd23f', 520], ['#3fa7ff', 860]].forEach(([c, px]) => { x.fillStyle = c; x.save(); x.translate(px, 790); x.rotate(-.1); x.fillRect(-90, -40, 180, 80); x.restore(); });
      [[640, 600], [700, 590], [760, 606], [580, 610]].forEach(([px, py], i) => person(x, px, py - (i % 2) * 40, 54, '#2b2b33'));
    },
    fire(x, r) {
      x.fillStyle = lin(x, 0, 560, [[0, '#2b2350'], [.6, '#a24d5a'], [1, '#f19b4b']]); x.fillRect(0, 0, P.W, 560);
      x.fillStyle = '#3d3247'; x.beginPath(); x.moveTo(0, 520); [[200, 420], [420, 500], [640, 380], [900, 480], [1200, 410], [1200, 560], [0, 560]].forEach(p => x.lineTo(...p)); x.fill();
      x.fillStyle = '#1a1410'; x.fillRect(0, 560, P.W, 340);
      glow(x, 600, 700, 420, 'rgba(255,140,40,A)', .7);
      for (let i = 0; i < 26; i++) { x.fillStyle = `hsla(${20 + r() * 30},100%,${55 + r() * 20}%,.85)`; x.beginPath(); const fx = 560 + r() * 80; x.moveTo(fx - 30, 760); x.quadraticCurveTo(fx + (r() - .5) * 60, 700 - r() * 140, fx + 30, 760); x.fill(); }
      for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(255,200,120,.9)'; x.fillRect(500 + r() * 200, 400 + r() * 300, 3, 3); }
      [[330, 790], [430, 760], [780, 770], [880, 800]].forEach(([px, py]) => person(x, px, py, 64, '#0d0a08'));
    },
    rain(x, r) {
      x.fillStyle = lin(x, 0, 900, [[0, '#8794a0'], [1, '#aab3ba']]); x.fillRect(0, 0, P.W, P.H);
      for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(70,84,96,${.2 + r() * .2})`; x.fillRect(r() * P.W, 200 + r() * 200, 80 + r() * 160, 400); }
      for (let i = 0; i < 300; i++) { x.strokeStyle = 'rgba(230,236,240,.45)'; x.lineWidth = 1 + r() * 1.5; const px = r() * P.W, py = r() * 700; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 2, py + 20 + r() * 40); x.stroke(); }
      for (let i = 0; i < 120; i++) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(r() * P.W, r() * 700, 2 + r() * 5, 0, 7); x.fill(); }
      x.fillStyle = '#d9d3c8'; x.fillRect(0, 700, P.W, 200); x.fillStyle = '#c3bcb0'; x.fillRect(0, 700, P.W, 14);
      x.fillStyle = '#f1ede6'; x.beginPath(); x.roundRect(720, 560, 130, 160, 14); x.fill(); x.fillStyle = '#b9895a'; x.fillRect(732, 576, 106, 30);
      x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(760 + k * 22, 545); x.bezierCurveTo(740 + k * 22, 510, 790 + k * 22, 490, 765 + k * 22, 450); x.stroke(); }
      x.fillStyle = '#5b6f86'; x.save(); x.translate(380, 730); x.rotate(-.06); x.fillRect(-170, -40, 340, 56); x.fillStyle = '#efe7d6'; x.fillRect(-160, -34, 320, 40); x.restore();
    },
    street(x, r) {
      x.fillStyle = lin(x, 0, 900, [[0, '#0b1020'], [1, '#1d2740']]); x.fillRect(0, 0, P.W, P.H);
      [[0, 180, 260], [240, 120, 220], [440, 220, 300], [760, 140, 260], [1000, 200, 200]].forEach(([bx, by, bw]) => { x.fillStyle = '#121a2e'; x.fillRect(bx, by, bw, 900); for (let i = 0; i < 24; i++) if (r() > .72) { x.fillStyle = 'rgba(255,200,120,.85)'; x.fillRect(bx + 20 + (i % 4) * (bw / 4.5), by + 30 + Math.floor(i / 4) * 60, 24, 32); } });
      x.fillStyle = '#c9d2e4'; x.fillRect(0, 700, P.W, 200);
      [[260, 300], [640, 260], [1020, 320]].forEach(([lx, ly]) => { x.fillStyle = '#0a0d16'; x.fillRect(lx - 5, ly, 10, 420); glow(x, lx, ly, 260, 'rgba(255,190,90,A)', .55); x.fillStyle = '#ffd89a'; x.beginPath(); x.arc(lx, ly, 14, 0, 7); x.fill(); glow(x, lx, 720, 180, 'rgba(255,190,90,A)', .35); });
      for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${.4 + r() * .5})`; x.beginPath(); x.arc(r() * P.W, r() * P.H, .8 + r() * 2.5, 0, 7); x.fill(); }
      person(x, 520, 760, 48, '#05070c');
    },
    lamp(x, r) {
      x.fillStyle = '#0c1222'; x.fillRect(0, 0, P.W, P.H);
      for (let i = 0; i < 30; i++) glow(x, r() * P.W, r() * P.H, 30 + r() * 80, `rgba(${r() > .5 ? '255,200,120' : '160,190,255'},A)`, .3);
      glow(x, 640, 330, 380, 'rgba(255,190,90,A)', .7); x.fillStyle = '#ffe2b0'; x.beginPath(); x.arc(640, 330, 30, 0, 7); x.fill();
      x.fillStyle = '#05070c'; x.fillRect(632, 360, 16, 540); x.fillRect(590, 300, 100, 14);
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${.5 + r() * .5})`; x.beginPath(); x.arc(r() * P.W, r() * P.H, 1 + r() * 3.5, 0, 7); x.fill(); }
    },
    dacha(x, r) {
      x.fillStyle = lin(x, 0, 500, [[0, '#a9c98a'], [1, '#5f8a45']]); x.fillRect(0, 0, P.W, 600);
      for (let i = 0; i < 160; i++) { x.fillStyle = `hsla(${85 + r() * 40},${40 + r() * 30}%,${28 + r() * 25}%,.8)`; x.beginPath(); x.arc(r() * P.W, r() * 420, 30 + r() * 60, 0, 7); x.fill(); }
      for (let i = 0; i < 18; i++) { x.fillStyle = '#d23a2a'; x.beginPath(); x.arc(r() * P.W, 60 + r() * 260, 12, 0, 7); x.fill(); }
      glow(x, 900, 80, 600, 'rgba(255,236,170,A)', .55);
      x.fillStyle = '#7b5a3a'; x.fillRect(0, 560, P.W, 340);
      x.fillStyle = '#f3efe6'; x.beginPath(); x.moveTo(140, 520); x.lineTo(1060, 520); x.lineTo(1180, 760); x.lineTo(20, 760); x.fill();
      for (let i = 0; i < 14; i++) { const px = 140 + i * 72; x.fillStyle = ['#e86b4b', '#f2c14e', '#7fb069', '#ffffff'][i % 4]; x.beginPath(); x.arc(px, 600 + (i % 3) * 40, 26, 0, 7); x.fill(); }
      [[200, 520], [380, 500], [800, 505], [980, 520], [600, 490]].forEach(([px, py], i) => person(x, px, py, 62, ['#3a2d2a', '#6b3f2e', '#2e3a4a', '#5a4a3a', '#7a3030'][i]));
    },
    vinyl(x, r) {
      x.fillStyle = lin(x, 0, 900, [[0, '#8a5d3a'], [1, '#5a3a22']]); x.fillRect(0, 0, P.W, P.H);
      glow(x, 200, 120, 700, 'rgba(255,220,160,A)', .45);
      x.fillStyle = '#d8cbb3'; x.fillRect(180, 120, 840, 660);
      x.fillStyle = '#111'; x.beginPath(); x.arc(560, 450, 290, 0, 7); x.fill();
      for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(255,255,255,${.03 + r() * .05})`; x.lineWidth = 1; x.beginPath(); x.arc(560, 450, 100 + k * 4.6, 0, 7); x.stroke(); }
      x.fillStyle = '#d9472b'; x.beginPath(); x.arc(560, 450, 90, 0, 7); x.fill(); x.fillStyle = '#f4e6c8'; x.beginPath(); x.arc(560, 450, 8, 0, 7); x.fill();
      x.strokeStyle = '#bdbdbd'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(920, 200); x.lineTo(900, 520); x.lineTo(780, 600); x.stroke();
    }
  };
  async function photo(name, seed) { const c = U.canvas(P.W, P.H), x = c.getContext('2d'); S[name](x, U.rng(seed)); finish(c, seed, name === 'office' || name === 'street' ? .8 : 1.1); return U.canvasToBlob(c, 'image/jpeg', .88); }
  const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  PV.DEMO = [
    { date: '2026-09-20', time: '20:40', photos: ['embankment', 'cocoa'], text: 'Первое настоящее свидание. Гуляли по набережной до самого заката, слушали музыку в одних наушниках на двоих — один мне, один ему. Было прохладно, он отдал мне свою толстовку, она пахла его парфюмом. Пили какао и долго молчали, но было совсем не неловко — тепло и спокойно.', song: { artist: 'Мальбэк, Сюзанна', title: 'Равнодушие', genre: 'indie', year: 2016, link: yt('Мальбэк Сюзанна Равнодушие') } },
    { date: '2026-06-01', time: '02:40', photos: ['study', 'desk'], text: 'Ночь перед ЕНТ. Третий энергетик, стикеры с формулами по всей стене, глаза слипаются, мама давно спит. В наушниках фонк на повторе, сердце колотится, паника накатывает волнами. В четыре утра наконец разобрался с логарифмами!', song: { artist: 'Kordhell', title: 'Murder In My Mind', genre: 'phonk', year: 2022, link: yt('Kordhell Murder In My Mind') } },
    { date: '2026-06-27', time: '04:50', photos: ['dawnRoof'], text: 'Выпускной. Встречали рассвет всем классом на крыше, девчонки сняли туфли и ходили босиком, у всех ленты через плечо. Обнимались, плакали и смеялись одновременно, обещали никогда не теряться. Странно понимать, что детство вот так закончилось — этот рассвет будем вспоминать всю жизнь.', song: { artist: 'Звери', title: 'Районы-кварталы', genre: 'rusrock', year: 2004, link: yt('Звери Районы-кварталы') } },
    { date: '2026-08-15', time: '23:30', photos: ['concert'], text: 'Первый концерт Макса Коржа! Стояли в фан-зоне с друзьями с самого утра, весь стадион пел хором, тысячи фонариков. Сорвала голос, прыгала до боли в ногах, мурашки по всему телу. Лучший день этого лета!', song: { artist: 'Макс Корж', title: 'Малый повзрослел', genre: 'pop', year: 2016, link: yt('Макс Корж Малый повзрослел') } },
    { date: '2026-09-02', time: '23:10', photos: ['rain'], text: 'Первая ночь в общаге в чужом городе. Соседка ещё не приехала, в комнате пусто и тихо, за окном дождь. Сидела одна на подоконнике с чаем и смотрела на чужие окна. Немного страшно, немного грустно, но где-то внутри — свобода.', song: { artist: 'Joji', title: 'Slow Dancing in the Dark', genre: 'lofi', year: 2018, mode: 'minor', tempo: 'slow', link: yt('Joji Slow Dancing in the Dark') } },
    { date: '2026-01-24', time: '22:40', photos: ['street', 'lamp'], text: 'Сегодня мы расстались. Стояла на остановке под снегом, пропустила уже третий автобус, фонари расплывались от слёз. В наушниках наш плейлист, который теперь больно слушать. Город пустой и тихий, а внутри почему-то тоже тихо.', song: { artist: 'Земфира', title: 'Хочешь?', genre: 'rusrock', year: 2000, mode: 'minor', tempo: 'slow', link: yt('Земфира Хочешь') } }
  ];
  PV.demoPhotos = async (d, i) => Promise.all(d.photos.map((n, k) => photo(n, 1000 + i * 10 + k)));
})(window.PV);
