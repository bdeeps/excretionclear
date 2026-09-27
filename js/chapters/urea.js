// Chapter 3: from protein to urea. Protein is split into amino acids; the liver strips off their
// nitrogen as ammonia (deamination) and, in the urea cycle, joins two nitrogens and a carbon into
// one urea molecule, which the blood carries to the kidneys.
// Biochemistry (Lehninger Principles of Biochemistry, 8th ed., ch. 18; StatPearls "Biochemistry,
// Urea Cycle"; Guyton & Hall, 14th ed., ch. 70–71):
//  - NH3 + CO2 (as bicarbonate) → carbamoyl phosphate in the mitochondrion (enzyme CPS I);
//    carbamoyl phosphate + ornithine → citrulline (still in the mitochondrion); citrulline moves
//    to the cytosol, takes the SECOND nitrogen from aspartate → argininosuccinate, which splits
//    into arginine + fumarate; arginase cuts arginine into urea + ornithine, and ornithine goes
//    back into the mitochondrion. Cost: 3 ATP (4 high-energy phosphate bonds) per urea.
//  - Urea CO(NH2)2, molar mass 60.06 g/mol, 46.7% nitrogen by mass. Protein is about 16% nitrogen.
//    On an ordinary diet urea carries about 80–90% of the nitrogen excreted (the rest: creatinine,
//    uric acid, ammonium, stool). Our model: urea (g/day) = protein × 0.16 × 0.85 ÷ 0.467, so 80 g
//    of protein → about 23 g urea (20–35 g/day is the usual range).
//  - Blood urea at steady state = production ÷ urea clearance. Urea clearance ≈ 60–70 mL/min
//    (about half of the 125 mL/min GFR, because about half the filtered urea is reabsorbed;
//    Guyton & Hall ch. 27). 23.3 g/day = 388 mmol/day; 65 mL/min = 93.6 L/day → 4.1 mmol/L,
//    inside the normal range of about 2.5–7.8 mmol/L (NHS / UK lab reference range).
//  - Ammonia: normal blood level below about 50 µmol/L in adults (StatPearls "Hyperammonemia");
//    above about 100 µmol/L it causes confusion, sleepiness and brain swelling. When the liver
//    fails, ammonia builds up (hepatic encephalopathy). The "liver failing" rise here is a
//    teaching model of the direction, not a prediction.
//  - Water needed to flush out 1 g of nitrogen: about 500 mL as ammonia, about 50 mL as urea
//    (Wikipedia "Metabolic waste", after Schmidt-Nielsen, Animal Physiology, 5th ed., ch. 9);
//    uric acid is so insoluble it leaves as a paste with only a few mL.
//  - Bony fish are ammonotelic (ammonia out through the gills); birds and reptiles are uricotelic;
//    mammals, amphibian adults and sharks are ureotelic (Schmidt-Nielsen).
import { THREE, M, clamp, lerp } from '../kit.js';
import { tint, fitNarrow, compactReadout, inReel, pathOf, smoothPts, beanGeometry, tissue, tubeAlong, rnd } from '../excrete.js';

const ANIMALS = {
  human: { label: 'People', waste: 'Urea', water: 50, where: 'urine, from the kidneys' },
  fish: { label: 'Fish', waste: 'Ammonia', water: 500, where: 'straight out through the gills' },
  bird: { label: 'Birds', waste: 'Uric acid', water: 5, where: 'a white paste, with the droppings' },
};
export const ureaPerDay = (protein) => (protein * 0.16 * 0.85) / 0.467;
const bloodUrea = (protein) => ((ureaPerDay(protein) / 60.06) * 1000) / (0.065 * 1440);   // mmol/L

// A little ball-and-stick molecule. atoms: [x, y, z, radius, colour]; bonds: [i, j].
function molecule(atoms, bonds, scale = 1) {
  const g = new THREE.Group();
  atoms.forEach(([x, y, z, r, c]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 20, 14), tissue(c, { emissive: c, emissiveIntensity: 0.15 })); m.position.set(x * scale, y * scale, z * scale); g.add(m); });
  const bm = tissue(0xdddddd);
  bonds.forEach(([i, j]) => { const a = new THREE.Vector3(...atoms[i].slice(0, 3)).multiplyScalar(scale), b = new THREE.Vector3(...atoms[j].slice(0, 3)).multiplyScalar(scale); const len = a.distanceTo(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, len, 8), bm); c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(c); });
  return g;
}
const Cc = 0x444a55, Oc = 0xff4a4a, Nc = 0x4f7bff, Hc = 0xf2f2f2;
const ureaMol = (s) => molecule([[0, 0.25, 0, 0.3, Cc], [0, 0.85, 0, 0.3, Oc], [-0.55, -0.1, 0, 0.28, Nc], [0.55, -0.1, 0, 0.28, Nc], [-1.0, 0.15, 0, 0.16, Hc], [-0.6, -0.6, 0, 0.16, Hc], [1.0, 0.15, 0, 0.16, Hc], [0.6, -0.6, 0, 0.16, Hc]], [[0, 1], [0, 2], [0, 3], [2, 4], [2, 5], [3, 6], [3, 7]], s);
const nh3Mol = (s) => molecule([[0, 0.1, 0, 0.3, Nc], [-0.5, -0.25, 0.2, 0.16, Hc], [0.5, -0.25, 0.2, 0.16, Hc], [0, -0.25, -0.5, 0.16, Hc]], [[0, 1], [0, 2], [0, 3]], s);

// Stations on the urea cycle (a ring in the liver cell).
const RING = { c: [1.2, 0.6, 0], R: 1.7 };
const ringAt = (a) => [RING.c[0] + RING.R * Math.cos(a), RING.c[1] + RING.R * Math.sin(a), 0];
const ST = [
  { name: 'Ornithine', a: 2.5, where: 'mito' },
  { name: 'Citrulline', a: 0.65, where: 'mito' },
  { name: 'Argininosuccinate', a: -0.9, where: 'cyto' },
  { name: 'Arginine', a: -2.3, where: 'cyto' },
];
const DEAM = [-2.3, 0.4, 0.2];                                  // where amino acids lose their nitrogen

export default {
  id: 'urea',
  short: 'Ammonia to urea',
  title: 'Turning poison into urea',
  subtitle: 'Protein leaves nitrogen behind as ammonia. The liver locks it safely into urea.',
  view: { pos: [0.8, 8.2, 21], target: [0.2, 7.3, 0] },
  learn: `<p>Protein is made of <b>amino acids</b>, and every amino acid carries <b>nitrogen</b>. Your body reuses most of them, but the extras are burned for energy or turned into sugar. First the liver pulls the nitrogen off, and it comes away as <b>ammonia</b> (NH₃).</p>
    <p>Ammonia is <b>toxic</b>. Even a little too much in the blood upsets the brain, causing confusion and sleepiness. So the liver never lets it pile up. In the <b>urea cycle</b>, a loop of reactions that starts inside the cell's <b>mitochondria</b>, it joins two nitrogens and one carbon into <b>urea</b>: small, harmless and easy to dissolve. It costs energy, about <b>3 ATP</b> per molecule, but it is worth it.</p>
    <p>The blood carries urea to the <b>kidneys</b>, which send it out in urine (see KidneyClear). More protein means more urea: about <b>20 to 35 g a day</b> on an ordinary diet. How the liver does its other cleaning is in LiverClear.</p>
    <p>Animals solve the same problem in different ways. <b>Fish</b> live in water, so they just let ammonia out through their gills: it needs about <b>500 mL of water</b> for every gram of nitrogen. <b>Birds</b> and reptiles make <b>uric acid</b>, which barely dissolves and leaves as a white paste, saving water and weight. We are in between: urea needs about <b>50 mL</b> of water per gram.</p>
    <p class="tip"><b>Try it:</b> raise the protein and watch the urea pile up. Switch to fish and birds. Then let the liver fail and watch the ammonia level climb.</p>`,
  terms: [
    { t: 'Amino acid', d: 'A building block of protein. Each carries at least one nitrogen atom.' },
    { t: 'Deamination', d: 'Pulling the nitrogen off an amino acid, which releases ammonia.' },
    { t: 'Ammonia (NH₃)', d: 'A small, toxic nitrogen compound. Normal blood levels are tiny, below about 50 µmol/L.' },
    { t: 'Urea cycle', d: 'A loop of reactions in liver cells that turns ammonia and carbon dioxide into urea.' },
    { t: 'Uric acid', d: 'The nitrogen waste of birds and reptiles; it barely dissolves, so it saves water.' },
  ],
  defaults: { protein: 80, animal: 'human', liver: true, labels: true },
  controls: [
    { key: 'protein', type: 'range', label: 'Protein eaten per day', min: 30, max: 150, step: 1, ends: ['30 g', '150 g'], fmt: (v) => Math.round(v) + ' g' },
    { key: 'animal', type: 'seg', label: 'Whose body', options: Object.entries(ANIMALS).map(([v, a]) => ({ v, label: a.label })), fmt: (v) => ANIMALS[v].waste + ': ' + ANIMALS[v].where },
    { key: 'liver', type: 'toggle', label: 'Liver working', hint: 'Switch it off to see why the urea cycle matters.' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Why does the liver turn ammonia into urea?', options: ['Urea tastes better', 'Ammonia is toxic; urea is much safer to carry in the blood', 'Urea is a food', 'Ammonia can’t dissolve'], answer: 1, why: 'Ammonia upsets the brain even at low levels. Urea is harmless enough to travel to the kidneys.' },
    { q: 'You eat much more protein. What happens to your urea?', options: ['It goes down', 'It goes up', 'It stays the same', 'It turns into uric acid'], answer: 1, why: 'The extra amino acids lose their nitrogen, and that nitrogen leaves as extra urea.' },
    { q: 'Why can fish get rid of plain ammonia?', options: ['They are immune to it', 'They live in water, which washes it away through their gills', 'They have bigger livers', 'They don’t eat protein'], answer: 1, why: 'Ammonia needs lots of water to stay safely dilute, and fish are surrounded by it.' },
  ],
  reel: [
    { ms: 5800, caption: 'Protein leaves toxic ammonia behind, and the liver locks it safely into urea.', set: { protein: 80, animal: 'human', liver: true, labels: false }, anim: { protein: [60, 140] }, view: { pos: [0.4, 6.4, 16.5], target: [0.4, 6.0, 0] }, spin: 0 },
    { ms: 5000, caption: 'Fish just wash ammonia out through their gills. Birds make a dry paste of uric acid.', set: { animal: 'fish', liver: true, labels: false }, anim: { animal: ['fish', 'bird'] }, view: { pos: [0.4, 6.4, 16.5], target: [0.4, 6.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); root.position.y = 6; stage.root.add(root);   // lift it clear of the floor grid
    const L = (html, pos, cls, parent = root) => tint(stage.label(html, pos, parent), cls);

    // ---- the gut: a protein chain being cut into amino acids
    const AA_COLS = [0xff8a5c, 0x6ee7a8, 0xc9a7ff, 0xffd166, 0x8ef0ff, 0xff9fc0];
    const chain = new THREE.Group(); chain.position.set(-8.6, 1.2, 0); root.add(chain);
    const beads = [];
    for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), tissue(AA_COLS[i % 6])); b.position.set(Math.sin(i * 0.9) * 0.5, 1.6 - i * 0.32, 0); chain.add(b); beads.push(b); }
    const gutLab = L('Protein → amino acids', [-8.6, 3.4, 0], 'purple');

    // ---- the liver cell, with a mitochondrion and the cycle
    const cell = new THREE.Mesh(new THREE.CapsuleGeometry(3.2, 3.0, 10, 32), new THREE.MeshStandardMaterial({ color: 0x9a4a3a, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }));
    cell.rotation.z = Math.PI / 2; cell.scale.set(1, 1, 0.35); cell.position.set(-0.3, 0.3, 0); root.add(cell);
    const cellEdge = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 80), M.glow(0xc9785f, { transparent: true, opacity: 0.6 }));
    cellEdge.scale.set(4.75, 3.25, 1); cellEdge.position.copy(cell.position); root.add(cellEdge);
    const mito = new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 2.6, 8, 24), new THREE.MeshStandardMaterial({ color: 0xff9a5c, transparent: true, opacity: 0.28, depthWrite: false }));
    mito.rotation.z = Math.PI / 2; mito.position.set(RING.c[0] + 0.05, RING.c[1] + 1.55, -0.2); root.add(mito);
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(RING.R, 0.06, 10, 100), M.glow(0xffd166, { transparent: true, opacity: 0.55 }));
    ringMesh.position.set(...RING.c); root.add(ringMesh);
    const stations = ST.map((st) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), tissue(0xffd166, { emissive: 0x805a00, emissiveIntensity: 0.6 })); m.position.set(...ringAt(st.a)); root.add(m); return m; });
    const stLabs = ST.map((st, i) => { const p = ringAt(st.a), dx = Math.cos(st.a) * 0.9, dy = Math.sin(st.a) * 0.55; return L(st.name, [p[0] + dx, p[1] + dy, 0.3], 'gold'); });
    const cellLab = L('Liver cell', [-4.4, -2.6, 0], 'pink');
    const mitoLab = L('Mitochondrion', [RING.c[0] + 2.9, RING.c[1] + 2.2, 0], 'skin');
    const deamLab = L('Nitrogen pulled off as NH₃', [DEAM[0] - 0.4, DEAM[1] - 1.0, 0.3], 'blue');
    const aspLab = L('Aspartate brings the 2nd N', [RING.c[0] + 3.4, RING.c[1] - 2.7, 0.3], 'blue');
    const cycLab = L('The urea cycle', [RING.c[0], RING.c[1], 0.3], 'gold');
    // Molecule close-ups.
    const nh3 = nh3Mol(0.55); nh3.position.set(-2.4, 2.4, 0.4); root.add(nh3);
    const urea = ureaMol(0.5); urea.position.set(-0.9, -2.0, 0.4); root.add(urea);
    const nh3Lab = L('NH₃: toxic', [-2.4, 3.15, 0.4], 'blue');
    const ureaLab = L('Urea: safe', [-0.9, -2.9, 0.4], 'gold');
    // Bird: a purine ring (uric acid) replaces the cycle.
    const purine = new THREE.Group(); purine.position.set(...RING.c); root.add(purine);
    const hexM = M.glow(0xf2f2f2);
    [[6, 0.8, -0.5], [5, 0.62, 0.9]].forEach(([n, r, x]) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 8, n), hexM); t.position.x = x; t.rotation.z = n === 6 ? Math.PI / 6 : Math.PI / 2; purine.add(t); });
    const purLab = L('Uric acid is made instead', [RING.c[0], RING.c[1] - 1.5, 0.3], 'cyan');

    // ---- the blood vessel and where the waste leaves
    const vesselPts = [[-3.2, -2.75, 0], [0.5, -3.9, 0], [4.5, -3.9, 0], [7.0, -3.3, 0], [8.1, -2.4, 0]];
    const vessel = tubeAlong(smoothPts(vesselPts, 40), 0.32, new THREE.MeshStandardMaterial({ color: 0xc23a48, transparent: true, opacity: 0.35, depthWrite: false }), 60, 16);
    root.add(vessel);
    const bloodLab = L('Blood', [3.0, -4.7, 0], 'red');
    const kidney = new THREE.Mesh(beanGeometry(-1), tissue(0xa8453a, { emissive: 0x3a0c08, emissiveIntensity: 0.5 })); kidney.scale.set(0.75, 1.3, 0.5); kidney.position.set(8.9, -1.8, 0); root.add(kidney);
    const ureter = tubeAlong([[8.35, -2.0, 0], [8.2, -3.4, 0], [8.4, -5.0, 0]], 0.08, tissue(0xe7b85c), 20, 8); root.add(ureter);
    const kidLab = L('Kidney → urine', [8.9, 0.0, 0], 'pink');
    // Fish: gill arches in water.
    const gills = new THREE.Group(); gills.position.set(8.9, -1.8, 0); root.add(gills);
    for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 30, Math.PI * 0.9), tissue(0xe0505a)); a.position.x = -0.4 + i * 0.3; a.rotation.z = -Math.PI * 0.45; gills.add(a); }
    const water = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5, 1.6), M.clear(0x3a8cff, 0.12)); water.position.set(9.6, -1.8, 0); root.add(water);
    const gillLab = L('Gills → the water', [8.9, 1.1, 0], 'cyan');
    // Bird: a small white heap of uric acid.
    const heap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), tissue(0xf4f1e8)); heap.position.set(8.4, -5.1, 0); root.add(heap);

    // ---- particles
    const pool = [];
    const kinds = {
      aa: { geo: new THREE.SphereGeometry(0.16, 12, 10), mat: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }), n: 40 },
      nh3: { geo: new THREE.SphereGeometry(0.12, 12, 10), mat: M.glow(0x6f9bff), n: 90 },
      urea: { geo: new THREE.SphereGeometry(0.14, 12, 10), mat: M.glow(0xffd166), n: 50 },
      uric: { geo: new THREE.BoxGeometry(0.18, 0.18, 0.18), mat: M.glow(0xf4f1e8), n: 50 },
      skel: { geo: new THREE.SphereGeometry(0.12, 10, 8), mat: new THREE.MeshStandardMaterial({ color: 0x9aa3b5, transparent: true, opacity: 0.7 }), n: 40 },
      tok: { geo: new THREE.SphereGeometry(0.13, 12, 10), mat: M.glow(0xffb547), n: 6 },
    };
    for (const k of Object.values(kinds)) { k.m = new THREE.InstancedMesh(k.geo, k.mat, k.n); k.m.frustumCulled = false; root.add(k.m); }
    const P2 = (pts) => pathOf(smoothPts(pts, 40));
    const paths = {
      aa: P2([[-8.3, -0.3, 0], [-6.6, -0.6, 0], [-4.4, -0.1, 0], DEAM]),
      skel: P2([DEAM, [-2.6, -0.8, 0], [-3.0, -1.8, 0]]),
      nh3cyc: P2([DEAM, [-1.2, 1.2, 0.1], ringAt(ST[0].a)]),
      urea: P2([ringAt(ST[3].a), [-0.3, -1.6, 0], [0.2, -3.7, 0], [4.5, -3.9, 0], [7.0, -3.3, 0], [8.2, -2.2, 0], [8.2, -3.4, 0], [8.4, -5.0, 0]]),
      nh3fish: P2([DEAM, [-1.0, -1.2, 0], [0.2, -3.7, 0], [4.5, -3.9, 0], [7.0, -3.3, 0], [8.6, -1.8, 0], [10.6, -0.5, 0.2]]),
      nh3bird: P2([DEAM, [-0.6, 0.9, 0.1], RING.c]),
      uric: P2([RING.c, [0.6, -1.6, 0], [0.2, -3.7, 0], [4.5, -3.9, 0], [7.0, -3.3, 0], [8.2, -2.2, 0], [8.2, -3.4, 0], [8.4, -4.8, 0]]),
      nh3blood: P2([DEAM, [-1.8, -1.6, 0], [0.2, -3.7, 0], [4.5, -3.9, 0], [7.0, -3.3, 0], [8.1, -2.4, 0]]),
    };
    const spawn = (kind, path, speed, col) => { if (pool.filter((p) => p.kind === kind).length >= kinds[kind].n) return; pool.push({ kind, path, u: 0, speed, col }); };
    const _o = new THREE.Object3D(), _p = new THREE.Vector3(), _c = new THREE.Color();

    let t = 0, acc = 0, ammonia = 30, blood = 4.1, spawnAcc = 0, n = 0;
    const fit = fitNarrow(stage, { pos: [0.4, 8.4, 24], target: [0.4, 8.0, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const an = s.animal, human = an === 'human', fish = an === 'fish', bird = an === 'bird';
        const liverOK = s.liver || !human;
        // The cycle and its stations belong to people (and other mammals).
        [ringMesh, ...stations, mito].forEach((m) => { m.visible = human; });
        purine.visible = bird; gills.visible = fish; water.visible = fish; heap.visible = bird;
        kidney.visible = !fish; ureter.visible = !fish;
        ringMesh.material.opacity = liverOK ? 0.55 : 0.15;
        // Amino acids arrive in proportion to the protein eaten.
        const rate = s.protein / 80 * 1.6;                 // amino acids per second on screen
        spawnAcc += dt * rate;
        while (spawnAcc > 1) { spawnAcc -= 1; n++; spawn('aa', paths.aa, 0.3, AA_COLS[n % 6]); }
        // Advance particles.
        for (let i = pool.length - 1; i >= 0; i--) {
          const p = pool[i];
          p.u += dt * p.speed / Math.max(1, p.path.total / 6);
          if (p.u < 1) continue;
          pool.splice(i, 1);
          if (p.kind === 'aa') {
            spawn('skel', paths.skel, 0.5);
            if (human) spawn('nh3', liverOK ? paths.nh3cyc : paths.nh3blood, 0.45);
            else if (fish) spawn('nh3', paths.nh3fish, 0.35);
            else spawn('nh3', paths.nh3bird, 0.5);
          } else if (p.kind === 'nh3' && human && p.path === paths.nh3cyc) spawn('urea', paths.urea, 0.3);
          else if (p.kind === 'nh3' && bird && p.path === paths.nh3bird && rnd(n + i) < 0.5) spawn('uric', paths.uric, 0.3);
        }
        // Draw particles.
        const counts = {};
        for (const k of Object.keys(kinds)) counts[k] = 0;
        pool.forEach((p) => {
          const k = kinds[p.kind], i = counts[p.kind]++;
          p.path.at(p.u, _p); _o.position.copy(_p); _o.rotation.set(t, t * 0.7, 0); _o.scale.setScalar(p.kind === 'skel' ? 1 - p.u * 0.8 : 1); _o.updateMatrix(); k.m.setMatrixAt(i, _o.matrix);
          if (p.kind === 'aa') { _c.set(p.col); k.m.setColorAt(i, _c); }
        });
        // Tokens riding round the cycle (clockwise: ornithine → citrulline → argininosuccinate → arginine).
        const tk = kinds.tok, cycSpeed = human && liverOK ? 0.6 * rate / 1.6 : 0;
        for (let i = 0; i < 6; i++) { const a = ST[0].a - (t * cycSpeed + (i / 6) * Math.PI * 2); _o.position.set(...ringAt(a)); _o.rotation.set(0, 0, 0); _o.scale.setScalar(human ? 1 : 0.001); _o.updateMatrix(); tk.m.setMatrixAt(i, _o.matrix); }
        counts.tok = 6;
        for (const [key, k] of Object.entries(kinds)) { k.m.count = counts[key]; k.m.instanceMatrix.needsUpdate = true; if (k.m.instanceColor) k.m.instanceColor.needsUpdate = true; }
        // Chain beads shimmer as they are cut.
        beads.forEach((b, i) => { b.position.x = Math.sin(i * 0.9 + t * 0.8) * 0.5; });
        nh3.rotation.y = t * 0.6; urea.rotation.y = t * 0.5;
        // Blood ammonia: stays low while the cycle runs; climbs when it doesn't (teaching model).
        const target = human ? (liverOK ? 30 : 30 + 2.2 * s.protein) : 30;
        ammonia += (target - ammonia) * Math.min(1, dt * 0.25);
        blood = bloodUrea(s.protein);
        const on = s.labels && !inReel(), narrow = fit();
        const show = (l, v) => { l.visible = on && v && !narrow; };
        stLabs.forEach((l) => show(l, human)); show(mitoLab, human); show(aspLab, human); show(cycLab, human);
        show(gutLab, true); show(cellLab, true); show(deamLab, true); show(nh3Lab, true); show(ureaLab, human); urea.visible = human;
        show(purLab, bird); show(bloodLab, true); show(kidLab, !fish); show(gillLab, fish);
        kidLab.element.innerHTML = bird ? 'Kidney → white paste' : 'Kidney → urine';
        acc += dt;
      },
      readout: (s) => {
        const a = ANIMALS[s.animal], N = s.protein * 0.16;
        if (s.animal !== 'human') return `<div class="big">${a.label}: ${a.waste.toLowerCase()}</div>
          <div class="row"><span>Nitrogen leaves as</span><b>${a.waste}</b></div>
          <div class="row"><span>Where it goes</span><b>${a.where}</b></div>
          <div class="row"><span>Water to flush 1 g of N</span><b>${a.water < 10 ? 'a few mL' : 'about ' + a.water + ' mL'}</b></div>
          <div class="row"><span>People, with urea</span><b>about 50 mL</b></div>
          <small>${s.animal === 'fish' ? 'Ammonia is toxic, but the sea or river dilutes it at once.' : 'Uric acid barely dissolves, so birds save water and weight for flying.'}</small>`;
        const bad = !s.liver;
        return `<div class="big">${bad ? 'Ammonia is building up' : Math.round(ureaPerDay(s.protein)) + ' g of urea a day'}</div>
          <div class="row"><span>Protein · its nitrogen</span><b>${Math.round(s.protein)} g · ${N.toFixed(1)} g</b></div>
          <div class="row"><span>Urea made per day</span><b>${bad ? 'very little' : Math.round(ureaPerDay(s.protein)) + ' g'}</b></div>
          <div class="row"><span>Urea in blood</span><b>${bad ? 'falling' : blood.toFixed(1) + ' mmol/L'}</b></div>
          <div class="row"><span>Ammonia in blood</span><b>${Math.round(ammonia)} µmol/L${ammonia > 100 ? ' · toxic' : ammonia > 50 ? ' · too high' : ''}</b></div>
          <small>${bad ? 'Without the urea cycle, ammonia reaches the brain. This is why liver failure causes confusion. Teaching model.' : 'Normal urea about 2.5–7.8 mmol/L; normal ammonia below about 50 µmol/L.'}</small>`;
      },
    });
  },
};
