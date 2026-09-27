// Chapter 2: the waste map. What waste the body makes in a day and which exit each one takes, with
// a live daily budget board that fills as the clock runs.
// Numbers (see excrete.js for the sources): CO2 about 1.0 kg a day for an active adult (NASA BVAD
// 2022), urea about 20–35 g (25 g shown), bilirubin about 0.3 g, salt in sweat about 0.25 g on a
// cool day, water about 2.5 L in and 2.5 L out (Tortora & Derrickson fig. 27.2).
// Routes: CO2 from every cell → veins → heart → lungs → breath. Urea made in the liver → hepatic
// veins → heart → aorta → renal arteries → kidneys → urine. Bilirubin from old red blood cells
// (spleen) → liver → bile → gallbladder → duodenum → colon (turned into brown stercobilin by
// bacteria) → stool; a little is reabsorbed and leaves in urine as yellow urobilin (Guyton & Hall,
// 14th ed., ch. 71). Sweat from about 2–4 million sweat glands in the skin (SkinClear).
// Real life is uneven through the day (more urine in the day than at night, more CO2 when you
// move); the board spreads each amount evenly over 24 hours to keep it simple.
import { THREE, M, canvasTexture, clamp, lerp } from '../kit.js';
import { makeBody, tint, fitNarrow, compactReadout, inReel, board, rrect, pathOf, smoothPts, skinPoints, rnd, P, COLON, URETHRA_F, WASTES, WATER, V } from '../excrete.js';

const PICK = [{ v: 'all', label: 'All' }, ...WASTES.map((w) => ({ v: w.key, label: { co2: 'CO₂', urea: 'Urea', bili: 'Bilirubin', salt: 'Sweat salt', water: 'Water' }[w.key] }))];
const fmtAmt = (w, k) => {
  const x = w.perDay * k;
  if (w.unit === 'mL') return x >= 1000 ? (x / 1000).toFixed(2) + ' L' : Math.round(x) + ' mL';
  if (x >= 1000) return (x / 1000).toFixed(2) + ' kg';
  if (x >= 10) return Math.round(x) + ' g';
  if (x >= 1) return x.toFixed(1) + ' g';
  return Math.round(x * 1000) + ' mg';
};
const clock = (h) => { const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };

function drawBoard(g, w, h, st) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#0c0f16'; rrect(g, 0, 0, w, h, 24); g.fill();
  const k = st.hours / 24;
  g.fillStyle = '#e8eef8'; g.font = 'bold 44px sans-serif'; g.fillText(`Waste so far: ${clock(st.hours)}`, 30, 62);
  // Wastes: bar = share of the day done, text = amount so far.
  const top = 88, rowH = 64, L = 300, R = w - 190;
  WASTES.forEach((ws, i) => {
    const y = top + i * rowH, hot = st.pick === 'all' || st.pick === ws.key;
    g.globalAlpha = hot ? 1 : 0.3;
    g.fillStyle = ws.col; g.font = 'bold 32px sans-serif'; g.fillText(ws.name.replace('Carbon dioxide', 'CO₂').replace('Salt in sweat', 'Sweat salt'), 30, y + 44);
    g.fillStyle = 'rgba(255,255,255,.1)'; rrect(g, L, y + 16, R - L, 36, 10); g.fill();
    g.fillStyle = ws.col; rrect(g, L, y + 16, Math.max(8, (R - L) * k), 36, 10); g.fill();
    g.fillStyle = '#ffffff'; g.font = 'bold 32px sans-serif'; g.fillText(fmtAmt(ws, k), R + 16, y + 45);
    g.globalAlpha = 1;
  });
  // Water in vs out, stacked (whole day).
  const y0 = top + WASTES.length * rowH + 52, x0 = 120, bw = w - x0 - 30, bh = 54;
  g.globalAlpha = st.pick === 'all' || st.pick === 'water' ? 1 : 0.4;
  g.fillStyle = '#e8eef8'; g.font = 'bold 34px sans-serif'; g.fillText('Water in a whole day (litres)', 30, y0);
  [['In', WATER.in], ['Out', WATER.out]].forEach(([lab, rows], j) => {
    const y = y0 + 22 + j * (bh + 62);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = 'bold 30px sans-serif'; g.fillText(lab, 30, y + 38);
    let x = x0;
    rows.forEach(([name, v, col], n) => {
      const ww = (bw * v) / 2.5; g.fillStyle = col; rrect(g, x, y, ww - 4, bh, 8); g.fill();
      g.fillStyle = '#0b0d12'; g.font = 'bold 26px sans-serif'; if (ww > 70) g.fillText(v.toFixed(1), x + 10, y + 37);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '24px sans-serif';
      const word = name.split(' (')[0].replace('Water in food', 'Food').replace('Made by your cells', 'Cells');
      if (ww > 64) g.fillText(word, Math.min(x + 4, w - 80), y + bh + 28);
      x += ww;
    });
  });
  g.globalAlpha = 1;
}

export default {
  id: 'wastes',
  short: 'The waste map',
  title: 'What you throw away every day',
  subtitle: 'Carbon dioxide, urea, bile pigment, salt and water, and the exit each one takes.',
  view: { pos: [-2.9, 9.8, 19], target: [-4.1, 9.4, 0] },
  learn: `<p>Every day your cells turn food and oxygen into energy, and that leaves <b>waste</b>. Each kind has its own way out.</p>
    <p><b>Carbon dioxide</b> is the biggest by far: about <b>1 kg a day</b> for an active adult. It leaves every cell, rides in your blood to the lungs and is simply breathed out. Most of the weight you lose when you slim down actually leaves this way, as carbon in your breath.</p>
    <p><b>Urea</b> carries the nitrogen from the protein you eat, about <b>20 to 35 g a day</b>. The liver makes it, the blood carries it (through the heart) to the kidneys, and they send it out in <b>urine</b>, with extra salt, acids and many medicines.</p>
    <p><b>Bilirubin</b> is the yellow pigment left when about <b>200 billion old red blood cells</b> are broken down each day. The liver puts it into <b>bile</b>, bile flows into the gut, and bacteria turn it brown: that is what colours <b>stool</b>. A little comes back and colours urine yellow.</p>
    <p><b>Sweat</b> is mostly for cooling, not cleaning, but it takes water and a little salt with it. And <b>water</b> leaves by all four exits: about <b>2.5 litres</b> in a cool day, and about the same comes in.</p>
    <p class="tip"><b>Try it:</b> run the day and watch the budget fill. Then pick one waste at a time and follow its path through the body.</p>`,
  terms: [
    { t: 'Carbon dioxide (CO₂)', d: 'The gas left when cells burn food for energy. Breathed out, about 1 kg a day.' },
    { t: 'Urea', d: 'A small, harmless molecule the liver makes from ammonia, so nitrogen can leave in urine.' },
    { t: 'Bilirubin', d: 'A yellow pigment made when old red blood cells are broken down; it leaves in bile.' },
    { t: 'Bile', d: 'A green-yellow juice from the liver that helps digest fat and carries bilirubin into the gut.' },
    { t: 'Stercobilin', d: 'The brown pigment gut bacteria make from bilirubin. It gives stool its colour.' },
  ],
  defaults: { pick: 'all', hours: 8, run: 1, labels: true },
  controls: [
    { key: 'pick', type: 'seg', label: 'Follow', options: PICK, fmt: (v) => (v === 'all' ? 'every waste at once' : WASTES.find((w) => w.key === v).route) },
    { key: 'hours', type: 'range', label: 'Time since midnight', min: 0, max: 24, step: 0.1, ends: ['00:00', '24:00'], fmt: (v) => clock(v) },
    { key: 'run', type: 'seg', label: 'Run the day', options: [{ v: 0, label: 'Pause' }, { v: 1, label: '1 h a second' }, { v: 3, label: '3 h a second' }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which waste leaves your body in the largest amount each day?', options: ['Urea', 'Carbon dioxide', 'Salt', 'Bilirubin'], answer: 1, why: 'About 1 kg of carbon dioxide a day, breathed out. Urea is about 20–35 g.' },
    { q: 'What gives stool its brown colour?', options: ['Blood', 'Pigment made from old red blood cells, sent out in bile', 'Undigested food', 'Salt'], answer: 1, why: 'The liver sends bilirubin into bile, and gut bacteria turn it into brown stercobilin.' },
    { q: 'Where is urea made?', options: ['In the kidneys', 'In the liver', 'In the bladder', 'In the lungs'], answer: 1, why: 'The liver makes it from ammonia. The kidneys only remove it from the blood.' },
  ],
  reel: [
    { ms: 5600, caption: 'Every day you breathe out about 1 kg of carbon dioxide, your biggest waste by far.', set: { pick: 'co2', hours: 0, run: 0, labels: false }, anim: { hours: [0, 24] }, view: { pos: [0.4, 12.6, 10], target: [0.2, 12.4, 0] }, spin: 0 },
    { ms: 5600, caption: 'Urea goes out in urine, and old red blood cells leave as bile pigment in stool.', set: { pick: 'all', hours: 0, run: 0, labels: false }, anim: { hours: [0, 24] }, view: { pos: [-3.6, 9.4, 17], target: [-4.8, 9.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage, { labels: false });
    root.add(body.root);
    body.setBladder(200);
    const dim = (g, on) => g.traverse((o) => { if (o.material && 'opacity' in o.material) { o.material.userData.op0 ??= o.material.opacity; o.material.transparent = true; o.material.opacity = on ? o.material.userData.op0 : o.material.userData.op0 * 0.25; } });

    // ---- routes, each a path with moving dots
    const heart = [0.25, 12.55, 0.35];
    const R = {
      co2: { pts: [[0.9, 5.5, 0.1], [0.75, 8.6, 0], [-0.25, 10.3, -0.35], [-0.28, 12.2, 0.2], heart, [0.8, 13.1, 0], [0.15, 13.95, 0.08], [0, 15.3, 0.25], [0, 16.0, 0.6], [0, 16.05, 0.95], [0, 16.3, 2.4]], col: 0x9db4ff, n: 26 },
      urea: { pts: [P.liver, [-0.3, 12.2, 0.1], heart, [0.15, 12.7, -0.2], [0.12, 12.0, -0.45], [0.1, 10.92, -0.46], [0.66, 10.86, -0.52], [0.68, 10.8, -0.5], [0.52, 9.7, -0.38], [0.4, 9.0, 0.02], [0.2, 8.98, 0.25], ...URETHRA_F.slice(1), [0, 7.6, 0.55]], col: 0xffd166, n: 26 },
      bili: { pts: [[-0.6, 11.9, 0.3], [-0.5, 11.55, 0.5], [-0.35, 11.3, 0.4], [-0.18, 11.05, 0.45], [0, 10.4, 0.45], [-0.6, 9.8, 0.4], ...COLON, [0, 7.8, -0.5]], col: 0x6ee7a8, n: 30 },
    };
    const streams = {};
    const dotGeo = new THREE.SphereGeometry(0.075, 10, 8);
    for (const [key, r] of Object.entries(R)) {
      const pts = smoothPts(r.pts, 160), path = pathOf(pts);
      const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.02, 6, false), M.glow(r.col, { transparent: true, opacity: 0.45 }));
      const m = new THREE.InstancedMesh(dotGeo, M.glow(key === 'bili' ? 0xffffff : r.col), r.n); m.frustumCulled = false;
      root.add(line, m);
      streams[key] = { path, line, m, n: r.n, col: new THREE.Color(r.col) };
    }
    // Bilirubin turns from yellow-green (bile) to brown (stercobilin) once it reaches the colon.
    const biliCol = [new THREE.Color(0x6ee7a8), new THREE.Color(0xa0703a)];
    // Sweat beads on the skin.
    const SP = skinPoints(140);
    const sweat = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshPhysicalMaterial({ color: 0xbfefff, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.9, emissive: 0x2a6a80, emissiveIntensity: 0.6 }), SP.length);
    sweat.frustumCulled = false; root.add(sweat);
    // Water: little drops leaving from each exit (breath vapour, urine, skin and stool).
    const exitsW = [[0, 16.05, 1.0], [0, 8.4, 0.5], [2.6, 12.0, 0.4], [-2.6, 12.0, 0.4], [0, 8.4, -0.5]];
    const wdrops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 10, 8), M.glow(0x8ef0ff), 30); wdrops.frustumCulled = false; root.add(wdrops);

    const labs = {
      co2: tint(stage.label('CO₂ out in every breath', [1.9, 16.6, 1.8], root), 'blue'),
      urea: tint(stage.label('Urea: liver → blood → kidneys → urine', [-3.4, 8.3, 0.5], root), 'gold'),
      bili: tint(stage.label('Bilirubin: liver → bile → gut → stool', [-3.4, 10.2, 0.5], root), 'good'),
      salt: tint(stage.label('Sweat: water, a little salt', [2.3, 13.3, 0.4], root), 'skin'),
      water: tint(stage.label('Water leaves by all four exits', [2.2, 15.4, 0.4], root), 'cyan'),
    };

    const st = { hours: 8, pick: 'all' };
    const ct = canvasTexture(900, 760, (g, w, h) => drawBoard(g, w, h, st));
    const bd = board(ct, 9.6, 8.1); bd.position.set(-9.4, 5.4, 0); bd.rotation.y = 0.12; root.add(bd);

    const _o = new THREE.Object3D(), _p = new THREE.Vector3(), _c = new THREE.Color();
    let t = 0, acc = 0, lastPick = null;
    const fit = fitNarrow(stage, { pos: [0, 10.8, 16], target: [0, 10.4, 0] });
    return compactReadout(stage, {
      update(dt, s, time) {
        dt = Math.max(0, dt); t += dt;
        if (s.run && !inReel()) { s.hours += dt * s.run; if (s.hours > 24) s.hours = 0; }
        const on = (k) => s.pick === 'all' || s.pick === k;
        if (s.pick !== lastPick) {
          lastPick = s.pick;
          dim(body.G.lungs, on('co2') || on('water')); dim(body.G.liver, on('urea') || on('bili')); dim(body.G.colon, on('bili') || on('water'));
          dim(body.G.urinary, on('urea') || on('water'));
        }
        for (const [key, sm] of Object.entries(streams)) {
          const vis = on(key); sm.line.visible = vis; sm.m.visible = vis;
          if (!vis) continue;
          for (let i = 0; i < sm.n; i++) {
            const u = (i / sm.n + t * (key === 'co2' ? 0.09 : 0.06)) % 1;
            sm.path.at(u, _p); _o.position.copy(_p); _o.scale.setScalar(key === 'co2' && u > 0.9 ? 1 + (u - 0.9) * 12 : 1); _o.updateMatrix(); sm.m.setMatrixAt(i, _o.matrix);
            if (key === 'bili') { _c.copy(biliCol[0]).lerp(biliCol[1], clamp((u - 0.3) / 0.35, 0, 1)); sm.m.setColorAt(i, _c); }
          }
          sm.m.instanceMatrix.needsUpdate = true; if (sm.m.instanceColor) sm.m.instanceColor.needsUpdate = true;
        }
        // Sweat beads grow and dry in turn.
        sweat.visible = on('salt') || on('water');
        if (sweat.visible) {
          SP.forEach((p, i) => { const ph = (t * 0.35 + rnd(i + 3)) % 1; _o.position.set(...p); _o.scale.setScalar(0.3 + 1.2 * Math.sin(ph * Math.PI)); _o.updateMatrix(); sweat.setMatrixAt(i, _o.matrix); });
          sweat.instanceMatrix.needsUpdate = true;
        }
        // Water drops at every exit.
        wdrops.visible = on('water');
        if (wdrops.visible) {
          for (let i = 0; i < 30; i++) {
            const e = exitsW[i % 5], ph = (t * 0.5 + i / 30) % 1, dir = i % 5 === 0 ? [0, 0.4, 1] : i % 5 === 1 || i % 5 === 4 ? [0, -1, 0] : [Math.sign(e[0]) * 0.8, -0.3, 0.4];
            _o.position.set(e[0] + dir[0] * ph * 1.6, e[1] + dir[1] * ph * 1.6, e[2] + dir[2] * ph * 1.6); _o.scale.setScalar(1 - ph * 0.7); _o.updateMatrix(); wdrops.setMatrixAt(i, _o.matrix);
          }
          wdrops.instanceMatrix.needsUpdate = true;
        }
        body.stepUrine(dt, 0.6);
        acc += dt;
        if (acc > 0.12) { acc = 0; st.hours = s.hours; st.pick = s.pick; ct.redraw(); }
        const narrow = fit();
        Object.entries(labs).forEach(([k, l]) => { l.visible = s.labels && !inReel() && !narrow && on(k); });
        bd.visible = !narrow;
      },
      readout: (s) => {
        const k = s.hours / 24;
        if (s.pick === 'all') return `<div class="big">${clock(s.hours)}: a day of waste</div>
          ${WASTES.map((w) => `<div class="row"><span>${w.name}</span><b>${fmtAmt(w, k)}</b></div>`).join('')}
          <small>Amounts so far today, spread evenly over 24 hours. Pick one to follow its path.</small>`;
        const w = WASTES.find((x) => x.key === s.pick);
        const note = { co2: 'Resting all day you would make about 0.6 kg; moving about raises it. See LungsClear.', urea: 'Made in the liver from the nitrogen in protein. More protein, more urea. See KidneyClear.', bili: 'From about 200 billion worn-out red blood cells a day. See LiverClear.', salt: 'On a hot day sweat can carry 3 g of salt or more. Most salt you eat leaves in urine. See SkinClear.', water: 'Urine 1.5 L, skin 0.6 L, breath 0.3 L, stool 0.1 L on a cool day.' }[w.key];
        return `<div class="big">${w.name}</div>
          <div class="row"><span>Way out</span><b>${w.route}</b></div>
          <div class="row"><span>Per day</span><b>${w.amt}</b></div>
          <div class="row"><span>So far today (${clock(s.hours)})</span><b>${fmtAmt(w, k)}</b></div>
          <small>${note}</small>`;
      },
    });
  },
};
