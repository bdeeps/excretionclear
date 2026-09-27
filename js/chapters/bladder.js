// Chapter 4: the bladder and how you control it. A close-up bladder (1 model unit = 1 cm) fills from
// the ureters; stretch sensors in its wall report to the spinal cord and brain; the brain holds the
// "go" signal and keeps the outer sphincter shut until you choose to go.
// Physiology (Guyton & Hall, 14th ed., ch. 26; StatPearls "Physiology, Bladder" and "Physiology,
// Micturition"; Fowler, Griffiths & de Groat, "The neural control of micturition", Nat Rev Neurosci
// 9:453, 2008; International Continence Society terminology):
//  - adult capacity about 400–600 mL; the first desire to void usually comes at about 150–300 mL
//    (about 40% of capacity), a strong desire nearer 75–90% of capacity;
//  - while filling, the detrusor muscle relaxes (the bladder is very compliant), so pressure stays
//    low, about 5–10 cmH2O, until it is nearly full; during voiding the detrusor squeezes to about
//    20–40 cmH2O in women and 40–60 in men;
//  - two sphincters: the internal (smooth muscle at the bladder neck, not under your control) and
//    the external (skeletal muscle around the urethra, which you can squeeze);
//  - stretch signals travel on pelvic nerves to the sacral cord (S2–S4) and up to the brainstem's
//    pontine micturition centre; the prefrontal cortex decides when it is safe and "holds" the
//    brainstem. When you decide to go, the external sphincter relaxes, the detrusor contracts and
//    the internal sphincter opens (parasympathetic, pelvic nerve); the pudendal nerve (S2–S4)
//    keeps the external sphincter shut while you hold on;
//  - peak flow in a healthy adult about 20–25 mL/s (lower in children and older men);
//  - babies void by reflex; daytime control usually comes between about 2 and 4 years, night-time
//    control later; about 15% of 5-year-olds still wet the bed (NHS "Bedwetting in children";
//    NICE CG111);
//  - children's bladder capacity by age (Koff, J Urol 130:117, 1983): (age in years + 2) × 30 mL,
//    so about 120 mL at 2 and 270 mL at 7;
//  - urine production about 1 mL/min (60 mL/h) in an adult; about 0.5–1 L a day in young children.
// Why you go more:
//  - cold: blood vessels in the skin narrow, pushing blood to the core; the body senses extra
//    volume and makes more urine ("cold-induced diuresis"; Castellani & Young, Compr Physiol 2016);
//  - coffee: caffeine is a mild diuretic for a few hours, strongest in people who don't usually
//    drink it (Maughan & Griffin, J Hum Nutr Diet 16:411, 2003), and the drink adds fluid too;
//  - nerves: stress and fear make the brain more alert to bladder signals, so you feel the urge
//    earlier, even though no more urine is made.
// The rate multipliers (cold 1.5×, coffee 1.8×) and the earlier urge when nervous (60%) are
// teaching values that show the direction, not measurements.
import { THREE, M, canvasTexture, clamp, lerp, smooth } from '../kit.js';
import { tint, fitNarrow, compactReadout, inReel, board, rrect, pathOf, smoothPts, tubeAlong, tissue, rnd } from '../excrete.js';

const WHO = {
  toddler: { label: 'Toddler (2)', cap: 120, rate: 25, q: 8, control: false },
  child: { label: 'Child (7)', cap: 270, rate: 40, q: 15, control: true },
  adult: { label: 'Adult', cap: 500, rate: 60, q: 22, control: true },
};
const SIT = {
  normal: { label: 'Normal day', rate: 1, urge: 1 },
  cold: { label: 'Cold', rate: 1.5, urge: 1 },
  coffee: { label: 'After coffee', rate: 1.8, urge: 1 },
  nervous: { label: 'Nervous', rate: 1, urge: 0.6 },
};
const cmR = (mL) => Math.cbrt((3 * Math.max(15, mL)) / (4 * Math.PI));   // radius in cm of a sphere

function drawChart(g, w, h, st) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#0c0f16'; rrect(g, 0, 0, w, h, 24); g.fill();
  g.fillStyle = '#e8eef8'; g.font = 'bold 36px sans-serif'; g.fillText('Bladder over the last 8 hours', 30, 50);
  g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '30px sans-serif'; g.fillText(`Trips to the toilet: ${st.trips}${st.accidents ? ` · accidents: ${st.accidents}` : ''}`, w - 470, 50);
  const L = 110, R = w - 30, T = 80, B = h - 50, cap = st.cap * 1.15;
  const Y = (v) => B - (v / cap) * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(L, T); g.lineTo(L, B); g.lineTo(R, B); g.stroke();
  const line = (v, col, txt) => { g.strokeStyle = col; g.lineWidth = 3; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(R, Y(v)); g.stroke(); g.setLineDash([]); g.fillStyle = col; g.font = 'bold 26px sans-serif'; g.fillText(txt, L + 14, Y(v) - 10); };
  line(st.cap, '#ff8a8a', `Full: about ${st.cap} mL`);
  line(st.urge1, '#ffd166', `First urge: about ${Math.round(st.urge1)} mL`);
  g.fillStyle = 'rgba(255,255,255,.65)'; g.font = '26px sans-serif';
  [0, st.cap].forEach((v) => g.fillText(String(v), 24, Y(v) + 9));
  g.fillText('8 h ago', L, B + 36); g.fillText('now', R - 50, B + 36);
  const pts = st.log; if (pts.length > 1) {
    g.strokeStyle = '#f4c430'; g.lineWidth = 6; g.beginPath(); let started = false;
    pts.forEach(([tm, v]) => { const x = R - ((st.now - tm) / 480) * (R - L); if (x < L) return; if (!started) { g.moveTo(x, Y(v)); started = true; } else g.lineTo(x, Y(v)); });
    g.stroke();
  }
}

export default {
  id: 'bladder',
  short: 'Bladder and control',
  title: 'Hold on: the bladder and your brain',
  subtitle: 'A stretchy bag, two gates and a brain that says “not yet” until you are ready.',
  view: { pos: [2.0, 18.0, 37], target: [1.0, 17.4, 0] },
  learn: `<p>The <b>bladder</b> is a bag of smooth muscle called the <b>detrusor</b>. As urine trickles in from the ureters, the muscle relaxes and stretches, so the pressure inside stays low. An adult bladder holds about <b>400 to 600 mL</b>.</p>
    <p><b>Stretch sensors</b> in the wall report to the spinal cord and up to the brain. At about <b>150 to 300 mL</b> you feel the first urge. A reflex in the spinal cord and brainstem would empty the bladder right then, but your <b>brain holds the go signal</b> until you are somewhere suitable. Two gates help: the <b>internal sphincter</b>, a ring of smooth muscle at the bladder's neck that works on its own, and the <b>external sphincter</b>, a ring you can squeeze on purpose.</p>
    <p>When you decide to go, the brain lets go: the external sphincter relaxes, the detrusor squeezes and urine flows at about <b>20 mL a second</b>. <b>Babies</b> empty by reflex. Children learn to hold the signal, usually by day between about <b>2 and 4 years</b>, and at night a little later. Wetting the bed at 5 is common and normal.</p>
    <p>Why do you go more when it is <b>cold</b>? Blood leaves the chilly skin for the warm core, the body senses extra fluid and makes more urine. <b>Coffee</b> and tea contain caffeine, which makes the kidneys pass a bit more for a few hours. And when you are <b>nervous</b>, the brain listens harder to the bladder, so you feel the urge sooner even though there is no more urine.</p>
    <p class="tip"><b>Try it:</b> speed up time and watch the bladder fill, the sensors light up and the brain hold on. Try a toddler, then try cold, coffee and nerves.</p>`,
  terms: [
    { t: 'Detrusor', d: 'The smooth muscle wall of the bladder. It relaxes to fill and squeezes to empty.' },
    { t: 'Internal sphincter', d: 'A ring of smooth muscle at the bladder neck. It works automatically.' },
    { t: 'External sphincter', d: 'A ring of skeletal muscle around the urethra that you can squeeze on purpose.' },
    { t: 'Stretch receptor', d: 'A sensor in the bladder wall that fires faster as the bladder fills.' },
    { t: 'Micturition', d: 'The medical word for passing urine.' },
    { t: 'Diuresis', d: 'Making more urine than usual, as after coffee or in the cold.' },
  ],
  defaults: { who: 'adult', sit: 'normal', speed: 20, auto: true, labels: true },
  controls: [
    { key: 'who', type: 'seg', label: 'Whose bladder', options: Object.entries(WHO).map(([v, w]) => ({ v, label: w.label })), fmt: (v) => `holds about ${WHO[v].cap} mL` },
    { key: 'sit', type: 'seg', label: 'Situation', options: Object.entries(SIT).map(([v, w]) => ({ v, label: w.label })) },
    { key: 'speed', type: 'seg', label: 'Time', options: [{ v: 5, label: '5 min a second' }, { v: 20, label: '20 min a second' }, { v: 60, label: '1 h a second' }] },
    { key: 'auto', type: 'toggle', label: 'Go when the urge is strong', hint: 'Off: keep holding on and see what happens.' },
    { key: 'go', type: 'buttons', label: 'Choose', items: [{ label: 'Go to the toilet now', act: (s, inst) => inst.go?.() }] },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'At about what volume does an adult usually feel the first urge to go?', options: ['10–20 mL', '150–300 mL', '1–2 litres', 'Only when completely full'], answer: 1, why: 'The first urge usually comes at about 150–300 mL, well before the bladder is full at about 400–600 mL.' },
    { q: 'Which gate can you squeeze on purpose?', options: ['The internal sphincter', 'The external sphincter', 'The ureter', 'The kidney'], answer: 1, why: 'The external sphincter is skeletal muscle under your control. The internal one works automatically.' },
    { q: 'Why do you feel you need to go sooner when you are nervous?', options: ['Nerves make much more urine', 'The brain pays more attention to the bladder’s signals', 'The bladder shrinks', 'Coffee'], answer: 1, why: 'Stress makes you more alert to the stretch signals, so the urge arrives earlier.' },
  ],
  reel: [
    { ms: 5600, caption: 'As your bladder fills, stretch sensors tell the brain, and the brain says: not yet.', set: { who: 'adult', sit: 'normal', speed: 60, auto: true, labels: false }, view: { pos: [3, 18, 26], target: [2.5, 17, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 16; stage.root.add(root);   // lifted clear of the floor grid
    const L = (html, pos, cls, parent = root) => tint(stage.label(html, pos, parent), cls);
    const NECK = new THREE.Vector3(-2, -2, 0);

    // ---- bladder: detrusor wall, urine inside, stretch sensors
    const wallMat = new THREE.MeshPhysicalMaterial({ color: 0xe9a3a8, roughness: 0.4, transparent: true, opacity: 0.35, depthWrite: false, clearcoat: 0.6, side: THREE.DoubleSide, emissive: 0x401018, emissiveIntensity: 0.3 });
    const wall = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), wallMat);
    const urine = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), new THREE.MeshStandardMaterial({ color: 0xf4c430, roughness: 0.2, transparent: true, opacity: 0.8, emissive: 0x5a4000, emissiveIntensity: 0.4 }));
    // Muscle bands on the wall.
    const bands = new THREE.Group();
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 60), new THREE.MeshBasicMaterial({ color: 0xd06070, transparent: true, opacity: 0.5 })); b.rotation.y = (i / 6) * Math.PI; bands.add(b); }
    root.add(wall, urine, bands);
    const SENS = 16, sensGeo = new THREE.SphereGeometry(0.16, 10, 8);
    const sensors = new THREE.InstancedMesh(sensGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), SENS); sensors.frustumCulled = false; root.add(sensors);
    const sensDir = []; for (let i = 0; i < SENS; i++) { const a = rnd(i + 1) * Math.PI * 2, y = lerp(-0.2, 0.9, rnd(i + 30)); const r = Math.sqrt(1 - y * y); sensDir.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r * 0.6 + 0.4).normalize()); }
    // Ureters coming in from above and behind.
    const ureterMat = tissue(0xe7b85c);
    const ureterL = tubeAlong([[-8.5, 7.5, -2], [-7, 4.5, -2.2], [-5, 2.2, -1.5]], 0.25, ureterMat, 30, 10);
    const ureterR = tubeAlong([[4.5, 7.5, -2], [3, 4.5, -2.2], [1, 2.2, -1.5]], 0.25, ureterMat, 30, 10);
    root.add(ureterL, ureterR);
    // Neck, internal sphincter, urethra, external sphincter.
    const urethra = tubeAlong([[NECK.x, NECK.y + 0.3, 0], [NECK.x, NECK.y - 2, 0.1], [NECK.x, NECK.y - 4.2, 0.3]], 0.28, new THREE.MeshStandardMaterial({ color: 0xd98a9a, transparent: true, opacity: 0.55 }), 20, 12);
    root.add(urethra);
    const intS = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.22, 12, 32), tissue(0xd06a80, { emissive: 0x401018, emissiveIntensity: 0.5 }));
    intS.rotation.x = Math.PI / 2; intS.position.set(NECK.x, NECK.y - 0.3, 0.02); root.add(intS);
    const extS = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.3, 12, 32), tissue(0xc0303a, { emissive: 0x400808, emissiveIntensity: 0.5 }));
    extS.rotation.x = Math.PI / 2; extS.position.set(NECK.x, NECK.y - 2.4, 0.15); root.add(extS);
    const stream = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 10, 8), M.glow(0xf4d040), 24); stream.frustumCulled = false; root.add(stream);
    const trickle = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 8), M.glow(0xffe07a), 12); trickle.frustumCulled = false; root.add(trickle);
    const uPaths = [ureterL, ureterR].map((u) => pathOf(u.geometry.parameters.path.getPoints(30)));

    // ---- nerves: spinal cord (sacral S2–S4) up to the brainstem and cortex
    const CORD_X = 9.5;
    const cord = tubeAlong([[CORD_X, -5, -1], [CORD_X, 4, -1], [CORD_X, 10, -1], [CORD_X, 13, -1]], 0.45, tissue(0xf1e4d2, { transparent: true, opacity: 0.7 }), 40, 14);
    root.add(cord);
    const brain = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), tissue(0xf2b8c6, { transparent: true, opacity: 0.75 }));
    brain.scale.set(3.4, 2.5, 2.7); brain.position.set(CORD_X, 15.6, -1); root.add(brain);
    const pmc = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), M.glow(0xc9a7ff)); pmc.position.set(CORD_X, 13.4, 0.6); root.add(pmc);
    const cortex = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), M.glow(0x8ef0ff)); cortex.position.set(CORD_X - 1.3, 16.9, 1.8); root.add(cortex);
    const sacral = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), M.glow(0xffd166, { transparent: true, opacity: 0.6 })); sacral.position.set(CORD_X, -3.5, -0.5); root.add(sacral);
    const up = pathOf(smoothPts([[1.5, 0, 0.8], [5, -2.5, 0.6], [CORD_X - 0.5, -3.5, 0], [CORD_X - 0.5, 8, 0], [CORD_X - 0.3, 13.2, 0.5], [CORD_X - 1.2, 16.6, 1.7]], 80));
    const holdP = pathOf(smoothPts([[CORD_X - 1.3, 16.7, 1.8], [CORD_X + 0.4, 13.3, 0.6], [CORD_X + 0.5, 8, 0], [CORD_X + 0.4, -3.8, 0], [4, -5.3, 0.6], [NECK.x + 0.7, NECK.y - 2.4, 0.4]], 80));
    const goP = pathOf(smoothPts([[CORD_X, 13.3, 0.6], [CORD_X + 0.2, 8, 0.3], [CORD_X, -3.2, 0.3], [5, -1.5, 0.8], [1.5, 0.5, 1.2]], 80));
    const nerveMat = (c) => M.glow(c, { transparent: true, opacity: 0.35 });
    [[up, 0xffd166], [holdP, 0x6f9bff], [goP, 0x6ee7a8]].forEach(([p, c]) => root.add(tubeAlong(p.points, 0.07, nerveMat(c), 120, 6)));
    const pulses = { up: { p: up, col: 0xffd166, m: null }, hold: { p: holdP, col: 0x6f9bff }, go: { p: goP, col: 0x6ee7a8 } };
    for (const k of Object.values(pulses)) { k.m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.28, 10, 8), M.glow(k.col), 14); k.m.frustumCulled = false; root.add(k.m); }

    const labs = {
      det: L('Detrusor muscle: relaxed while filling', [-2, -0.3, 5.5], 'pink'),
      sens: L('Stretch sensors', [3.6, 3.2, 0.8], 'gold'),
      ure: L('Ureters bring urine', [-8.6, 3.6, -2], 'gold'),
      int: L('Internal sphincter: automatic', [-7.6, -2.3, 0], 'pink'),
      ext: L('External sphincter: you control it', [-8.2, -4.4, 0], 'red'),
      cord: L('Spinal cord (S2–S4)', [CORD_X + 3.4, -3.5, 0], 'cyan'),
      pmc: L('Brainstem: the “go” switch', [CORD_X + 5.2, 12.6, 0], 'purple'),
      ctx: L('Cortex: “not yet”', [CORD_X + 4.6, 17.4, 2], 'cyan'),
      upL: L('Stretch signal up', [CORD_X - 3.2, 8, 0], 'gold'),
      holdL: L('Hold signal down', [CORD_X + 3.6, 8, 0], 'blue'),
    };

    // ---- chart
    const st = { cap: 500, urge1: 200, log: [], now: 0, trips: 0, accidents: 0 };
    const ct = canvasTexture(1400, 380, (g, w, h) => drawChart(g, w, h, st));
    const bd = board(ct, 22, 5.97); bd.position.set(2.5, -12.4, 0); root.add(bd);

    // ---- state
    let vol = 80, phase = 'fill', voided = 0, simMin = 0, feel = 'nothing yet', lastWho = null, tLog = 0, t = 0, pdet = 5, flow = 0, lastSit = null;
    const _o = new THREE.Object3D(), _p = new THREE.Vector3(), cSens = new THREE.Color();
    const inst = { go() { if (phase === 'fill' && vol > 40) { phase = 'void'; st.trips++; } } };
    const fit = fitNarrow(stage, { pos: [3, 19.5, 34], target: [3, 19, 0] });
    Object.assign(inst, compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const w = WHO[s.who], sit = SIT[s.sit];
        if (s.who !== lastWho) { lastWho = s.who; vol = w.cap * 0.2; st.log = []; st.trips = 0; st.accidents = 0; phase = 'fill'; }
        if (s.sit !== lastSit) { lastSit = s.sit; }
        const urge1 = 0.4 * w.cap * sit.urge, strong = 0.85 * w.cap * sit.urge;
        const rateMin = (w.rate * sit.rate) / 60;                         // mL per minute of life
        // Time: filling runs at `speed` minutes of life per second; voiding is shown at 5× real time.
        const dMin = dt * s.speed;
        if (phase === 'fill') {
          simMin += dMin; vol += rateMin * dMin;
          if (!w.control && vol >= 0.9 * w.cap) { phase = 'void'; st.trips++; }
          else if (w.control && s.auto && vol >= strong) { phase = 'void'; st.trips++; }
          else if (w.control && vol >= w.cap * 1.05) { phase = 'void'; st.accidents++; }
          flow = 0;
        } else {
          simMin += dt * 5 / 60;
          flow = w.q * clamp(vol / 60, 0.25, 1);                         // mL/s, tapering at the end
          vol -= flow * dt * 5;
          if (vol <= 8) { vol = 8; phase = 'fill'; }
        }
        vol = Math.max(8, vol);
        // Pressure: very compliant while filling, then the detrusor squeezes.
        pdet = phase === 'void' ? (s.who === 'adult' ? 35 : 30) : 4 + 14 * Math.pow(clamp(vol / w.cap, 0, 1.2), 6);
        feel = phase === 'void' ? 'going' : vol < urge1 ? 'nothing yet' : vol < strong ? 'first urge' : vol < w.cap ? 'strong urge' : 'desperate';
        // Log for the chart (every 5 minutes of life).
        if (simMin - tLog > 4) { tLog = simMin; st.log.push([simMin, vol]); while (st.log.length && simMin - st.log[0][0] > 490) st.log.shift(); }
        st.cap = w.cap; st.urge1 = urge1; st.now = simMin;
        if ((t * 8 | 0) !== ((t - dt) * 8 | 0)) ct.redraw();
        // Geometry: the bladder grows up from its neck (1 unit = 1 cm).
        const r = cmR(vol), flat = lerp(0.62, 0.95, clamp(vol / 300, 0, 1));
        const squeeze = phase === 'void' ? 0.96 + 0.03 * Math.sin(t * 20) : 1;
        wall.scale.set(r * 1.1 * squeeze + 0.3, r * flat * squeeze + 0.3, r * 0.95 * squeeze + 0.3);
        wall.position.set(NECK.x, NECK.y + r * flat + 0.1, 0);
        urine.scale.set(r * 1.1, r * flat, r * 0.95); urine.position.copy(wall.position);
        bands.scale.copy(wall.scale); bands.position.copy(wall.position);
        wallMat.emissiveIntensity = phase === 'void' ? 0.9 : 0.3;
        const fire = clamp((vol - 0.15 * w.cap) / (0.85 * w.cap), 0, 1);
        sensDir.forEach((d, i) => { _o.position.set(wall.position.x + d.x * wall.scale.x, wall.position.y + d.y * wall.scale.y, wall.position.z + d.z * wall.scale.z); _o.scale.setScalar(0.6 + 0.9 * fire * (0.6 + 0.4 * Math.sin(t * 9 + i))); _o.updateMatrix(); sensors.setMatrixAt(i, _o.matrix); sensors.setColorAt(i, cSens.setHSL(0.15 - 0.15 * fire, 1, 0.5 + 0.2 * fire)); });
        sensors.instanceMatrix.needsUpdate = true; if (sensors.instanceColor) sensors.instanceColor.needsUpdate = true;
        // Sphincters: shut while filling; both open when you go.
        const open = phase === 'void';
        intS.scale.setScalar(open ? 1.35 : 1); extS.scale.setScalar(open ? 1.4 : 1);
        extS.material.emissiveIntensity = open ? 0.1 : 0.5 + (w.control && feel !== 'nothing yet' ? 0.4 * Math.sin(t * 6) + 0.3 : 0);
        // Ureter trickle, urine stream, nerve pulses.
        for (let i = 0; i < 12; i++) { const u = ((t * 0.35 * clamp(rateMin, 0.4, 2) + i / 6) % 1); uPaths[i % 2].at(u, _p); _o.position.copy(_p); _o.scale.setScalar(1); _o.updateMatrix(); trickle.setMatrixAt(i, _o.matrix); }
        trickle.instanceMatrix.needsUpdate = true;
        stream.visible = open;
        for (let i = 0; i < 24; i++) { const u = (t * 2.2 + i / 24) % 1; _o.position.set(NECK.x, NECK.y - 4.2 - u * 3.8, 0.3 + u * 0.8); _o.scale.setScalar(1 - u * 0.4); _o.updateMatrix(); stream.setMatrixAt(i, _o.matrix); }
        stream.instanceMatrix.needsUpdate = true;
        const rates = { up: 0.2 + 1.6 * fire, hold: w.control && !open && fire > 0.1 ? 0.3 + 0.9 * fire : 0, go: open ? 1.6 : 0 };
        for (const [k, pu] of Object.entries(pulses)) {
          const n = Math.round(rates[k] * 8);
          for (let i = 0; i < 14; i++) { const u = (t * 0.4 + i / Math.max(1, n)) % 1; pu.p.at(u, _p); _o.position.copy(_p); _o.scale.setScalar(i < n ? 1 : 0.001); _o.updateMatrix(); pu.m.setMatrixAt(i, _o.matrix); }
          pu.m.instanceMatrix.needsUpdate = true;
        }
        cortex.visible = w.control; cortex.scale.setScalar(1 + (rates.hold > 0 ? 0.25 * Math.sin(t * 6) : 0));
        pmc.scale.setScalar(open ? 1.5 : 1);
        const on = s.labels && !inReel(), narrow = fit();
        Object.values(labs).forEach((l) => { l.visible = on && !narrow; });
        labs.ctx.element.innerHTML = w.control ? 'Cortex: “not yet”' : 'Cortex: control not learned yet';
        labs.det.element.innerHTML = open ? 'Detrusor muscle: squeezing' : 'Detrusor muscle: relaxed while filling';
        labs.holdL.visible = labs.holdL.visible && w.control;
        bd.visible = !narrow;
      },
      readout: (s) => {
        const w = WHO[s.who];
        return `<div class="big">${phase === 'void' ? 'Going: ' + Math.round(flow) + ' mL a second' : Math.round(vol) + ' mL: ' + feel}</div>
          <div class="row"><span>Bladder holds about</span><b>${w.cap} mL</b></div>
          <div class="row"><span>Filling at</span><b>about ${Math.round(w.rate * SIT[s.sit].rate)} mL an hour</b></div>
          <div class="row"><span>Pressure inside</span><b>${Math.round(pdet)} cmH₂O</b></div>
          <div class="row"><span>Brain</span><b>${!w.control ? 'reflex only: goes by itself' : phase === 'void' ? 'go signal sent' : feel === 'nothing yet' ? 'nothing to report' : 'holding on'}</b></div>
          <small>${s.sit === 'nervous' ? 'Nerves: the urge comes sooner, but no more urine is made.' : s.sit === 'cold' ? 'Cold: blood moves to the core and the kidneys make more urine.' : s.sit === 'coffee' ? 'Coffee: caffeine makes the kidneys pass more for a few hours.' : 'Filling shown at ' + (s.speed >= 60 ? '1 hour' : s.speed + ' minutes') + ' a second; going shown 5× faster than life.'}</small>`;
      },
    }));
    return inst;
  },
};
