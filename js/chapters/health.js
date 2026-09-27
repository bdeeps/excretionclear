// Chapter 6: when the excretory system has trouble, and how to look after it. A ghosted body shows
// where each problem happens; a close-up shows what it looks like. Always "see a doctor": general
// facts only, never diagnosis or dosing advice.
// Sources:
//  - UTI: NIDDK "Bladder Infection (UTI) in Adults": about half of all women get a bladder
//    infection in their lifetime, about a quarter of them again; men under 50 rarely do; the
//    female urethra is short and close to the anus. Signs: burning when passing urine, needing to
//    go often, cloudy or smelly urine; fever or back pain can mean the kidneys are involved.
//  - Kidney stones: about 1 in 10 people get one (NIDDK "Kidney Stones"); low urine volume is a
//    major risk, so they are more common in hot, dry places. KidneyClear covers them in depth.
//  - Diarrhoea and dehydration: WHO fact sheet "Diarrhoeal disease" (2024): the third leading cause
//    of death in children under 5, about 443,832 child deaths a year; treated with low-osmolarity
//    ORS and a 10–14 day course of zinc for children. WHO/UNICEF low-osmolarity ORS (2002) per
//    litre: sodium 75 mmol, chloride 65, glucose 75, potassium 20, citrate 10; total 245 mOsm/L.
//    Glucose and sodium are absorbed together by the gut (SGLT1), and water follows.
//  - Bedwetting: NIDDK "Bladder Control Problems & Bedwetting in Children": about 1 in 6 children
//    at 5, 1 in 10 at 7, 1–2 in 100 at 15. Usually outgrown; not the child's fault.
//  - Prostate enlargement (BPH): NIDDK: 5–6% of men aged 40–64 and 29–33% of those 65 and older
//    have it; weak or interrupted stream, going often at night, trouble starting or emptying.
//    The narrowing-to-flow link (flow falls steeply as the channel narrows) is qualitative here.
//  - Dialysis: when kidneys fail, a machine or the lining of the belly filters the blood
//    (NIDDK; KidneyClear chapter "Keeping kidneys healthy").
import { THREE, M, clamp, lerp } from '../kit.js';
import { makeBody, tint, fitNarrow, compactReadout, inReel, tissue, tubeAlong, smoothPts, rnd, P, URETER_L } from '../excrete.js';

const COND = {
  uti: { label: 'UTI', title: 'Urinary tract infection (UTI)' },
  stone: { label: 'Kidney stone', title: 'Kidney stones' },
  dehyd: { label: 'Dehydration, ORS', title: 'Dehydration and ORS' },
  bed: { label: 'Bedwetting', title: 'Bedwetting' },
  prostate: { label: 'Prostate', title: 'An enlarged prostate' },
  dialysis: { label: 'Dialysis', title: 'When kidneys fail: dialysis' },
};
const IN = [-8.4, 6.0, 0];              // where the close-up sits

export default {
  id: 'health',
  short: 'Keeping it healthy',
  title: 'When the exits have trouble',
  subtitle: 'Infections, stones, dehydration, bedwetting and the prostate, and when to see a doctor.',
  view: { pos: [-2.9, 9.8, 19], target: [-4.1, 9.4, 0] },
  learn: `<p>Most problems with the urinary tract are common and treatable, but they need the right help. This chapter explains them; it can't tell you what is happening in your own body. For that, <b>see a doctor</b>.</p>
    <p>A <b>urinary tract infection</b> (UTI) happens when bacteria climb up the urethra into the bladder. It stings or burns when you pass urine, and you need to go often. Because the female urethra is short, about <b>half of all women</b> get one at some point. Drinking enough water and not holding on for hours help. A doctor can test the urine and treat it; fever or back pain means see one quickly.</p>
    <p><b>Kidney stones</b> are crystals that grow when urine is too concentrated. About <b>1 in 10</b> people get one, more in hot places. They hurt badly when they move down the ureter (KidneyClear has the full story).</p>
    <p><b>Diarrhoea</b> can drain water and salt fast, and it still kills about <b>440,000</b> young children a year worldwide. The fix is cheap: <b>ORS</b>, oral rehydration salts, a mix of salt and sugar that the gut absorbs together, pulling water in with it. Mix a packet exactly as it says, and see a doctor if a child is very sleepy, not passing urine or can't drink.</p>
    <p><b>Bedwetting</b> is normal in young children: about <b>1 in 6</b> five-year-olds, and most grow out of it. In older men the <b>prostate</b> often grows and squeezes the urethra, making the stream weak. And when kidneys fail, <b>dialysis</b> can clean the blood instead (see KidneyClear).</p>
    <p class="tip"><b>Try it:</b> pick each problem to see where it happens and what it looks like up close.</p>`,
  terms: [
    { t: 'UTI', d: 'An infection of the urinary tract, usually the bladder, by bacteria that climb the urethra.' },
    { t: 'Kidney stone', d: 'A hard crystal that forms in the kidney when urine holds more than it can dissolve.' },
    { t: 'ORS', d: 'Oral rehydration salts: salt, sugar and a little potassium to mix with clean water. It treats dehydration.' },
    { t: 'Bedwetting', d: 'Passing urine in your sleep. Common in young children and usually outgrown.' },
    { t: 'BPH', d: 'Benign prostatic hyperplasia: a non-cancerous enlargement of the prostate in older men.' },
    { t: 'Dialysis', d: 'Cleaning the blood with a machine or the belly lining when the kidneys can’t.' },
  ],
  defaults: { cond: 'uti', labels: true },
  controls: [
    { key: 'cond', type: 'seg', label: 'Show', options: Object.entries(COND).map(([v, c]) => ({ v, label: c.label })), fmt: (v) => COND[v].title },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Why are bladder infections more common in women?', options: ['Women drink less', 'The female urethra is short, so bacteria reach the bladder more easily', 'Women have smaller kidneys', 'They aren’t'], answer: 1, why: 'The female urethra is about 4 cm long and close to the anus, a source of bacteria.' },
    { q: 'How does ORS help someone with diarrhoea?', options: ['It stops the diarrhoea at once', 'The gut absorbs its salt and sugar together, and water follows them in', 'It kills germs', 'It makes more urine'], answer: 1, why: 'Sodium and glucose are carried in together, and water follows by osmosis. That replaces what diarrhoea takes.' },
    { q: 'A 5-year-old still wets the bed sometimes. That is…', options: ['Very rare and serious', 'Common: about 1 in 6 five-year-olds do, and most outgrow it', 'Caused by laziness', 'A sign of kidney failure'], answer: 1, why: 'Night-time control comes later than daytime control. It is nobody’s fault; a doctor can help if it bothers the family.' },
  ],
  reel: [
    { ms: 5600, caption: 'About half of all women get a bladder infection at some point. Drink water, and see a doctor.', set: { cond: 'uti', labels: false }, view: { pos: [-3.4, 9.4, 17], target: [-4.4, 9.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage, { labels: false });
    root.add(body.root);
    body.setBladder(220);
    [body.G.lungs, body.G.liver].forEach((g) => g.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.15; } }));
    const mk = (pos, col = 0xffd166) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.7, depthWrite: false })); m.position.set(...pos); root.add(m); return m; };
    const mBladder = mk([0, 9.1, 0.6], 0xff5a6a), mUreter = mk([0.5, 9.7, -0.2]), mProst = mk([0, 8.6, 0.55], 0xc9a7ff), mKid = mk([0.95, 10.9, -0.2], 0xff9fc0), mGut = mk([0.05, 10.1, 0.75], 0x8ef0ff);
    const stoneInBody = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), tissue(0xe8d7a0)); stoneInBody.position.set(...URETER_L[2]); root.add(stoneInBody);

    // ---- close-ups
    const inset = new THREE.Group(); inset.position.set(...IN); root.add(inset);
    const pinkM = new THREE.MeshStandardMaterial({ color: 0xe9a3a8, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide });
    // UTI: bladder with a short (female) and a long (male) urethra side by side, bacteria climbing.
    const utiG = new THREE.Group(); inset.add(utiG);
    const bl = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 22), pinkM); bl.scale.y = 0.85; bl.position.y = 1.6; utiG.add(bl);
    const shortU = tubeAlong([[0, 0.35, 0], [0, -0.9, 0]], 0.18, new THREE.MeshStandardMaterial({ color: 0xd98a9a, transparent: true, opacity: 0.6 }), 8, 10); utiG.add(shortU);
    const bact = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), M.glow(0x7cff6a), 40); bact.frustumCulled = false; utiG.add(bact);
    // Stone: a piece of ureter with a spiky stone stuck in it.
    const stG = new THREE.Group(); inset.add(stG);
    stG.add(tubeAlong([[0, 3.2, 0], [0.2, 1, 0], [-0.1, -1.2, 0], [0, -3.2, 0]], 0.55, new THREE.MeshStandardMaterial({ color: 0xe7b85c, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide }), 40, 18));
    const sg = new THREE.IcosahedronGeometry(0.6, 1), sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const k = 1 + 0.35 * (rnd(i * 3) - 0.3); sp.setXYZ(i, sp.getX(i) * k, sp.getY(i) * k, sp.getZ(i) * k); } sg.computeVertexNormals();
    const stone = new THREE.Mesh(sg, tissue(0xe8d7a0, { roughness: 0.8, flatShading: true })); stone.position.set(0.1, 0.4, 0); stG.add(stone);
    // ORS: a glass filling with solution, salt and sugar grains dissolving.
    const orsG = new THREE.Group(); inset.add(orsG);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.05, 3.4, 40, 1, true), M.clear(0xdff4ff, 0.25)); orsG.add(glass);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.02, 1, 40), new THREE.MeshStandardMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.6, roughness: 0.1 })); orsG.add(liquid);
    const grains = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffffff }), 40); grains.frustumCulled = false; orsG.add(grains);
    const packet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.7, 0.12), tissue(0xff8a3a)); packet.position.set(2.4, 0.6, 0); packet.rotation.z = -0.4; orsG.add(packet);
    // Bedwetting: a crescent moon and a sleeping bladder.
    const bedG = new THREE.Group(); inset.add(bedG);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 22), M.glow(0xfff2b0)); moon.position.set(-0.6, 1.8, 0); bedG.add(moon);
    const moonCut = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 22), new THREE.MeshBasicMaterial({ color: 0x0b0e16 })); moonCut.position.set(-0.05, 2.2, 0.4); bedG.add(moonCut);
    const bed = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 1.8), tissue(0x6f86c9)); bed.position.set(0.3, -1.6, 0); bedG.add(bed);
    const pillow = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.8, 6, 12), tissue(0xf2f2f2)); pillow.rotation.z = Math.PI / 2; pillow.position.set(-1.2, -1.1, 0); bedG.add(pillow);
    // Prostate: a ring around the urethra that grows and squeezes it.
    const prG = new THREE.Group(); inset.add(prG);
    const prBl = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 22), pinkM); prBl.position.y = 2.2; prBl.scale.y = 0.8; prG.add(prBl);
    const prU = tubeAlong([[0, 1.1, 0], [0, -3.2, 0]], 0.16, new THREE.MeshStandardMaterial({ color: 0xd98a9a, transparent: true, opacity: 0.7 }), 10, 10); prG.add(prU);
    const pro = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.4, 16, 32), tissue(0xc98fa6, { transparent: true, opacity: 0.85 })); pro.rotation.x = Math.PI / 2; pro.position.y = 0.3; prG.add(pro);
    const prStream = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), M.glow(0xf4d040), 16); prStream.frustumCulled = false; prG.add(prStream);
    // Dialysis: a dialyser cylinder with blood in and out.
    const diG = new THREE.Group(); inset.add(diG);
    const dia = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4.2, 32), M.clear(0xe6f6ff, 0.35)); diG.add(dia);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const f = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.0, 6), new THREE.MeshStandardMaterial({ color: 0xc23a48 })); f.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4); diG.add(f); }
    diG.add(tubeAlong([[0, 2.1, 0], [0, 2.8, 0], [1.4, 3.3, 0], [2.6, 2.6, 0]], 0.1, new THREE.MeshStandardMaterial({ color: 0xc23a48 }), 20, 8));
    diG.add(tubeAlong([[0, -2.1, 0], [0, -2.8, 0], [1.4, -3.3, 0], [2.6, -2.6, 0]], 0.1, new THREE.MeshStandardMaterial({ color: 0x8a2a3a }), 20, 8));

    const insetL = tint(stage.label('', [0, -3.4, 0], inset), 'gold');
    const bodyL = tint(stage.label('', [1.2, 7.4, 0.8], root), 'pink');
    const _o = new THREE.Object3D();
    let t = 0, lastCond = null, fillK = 0;
    const fit = fitNarrow(stage, { pos: [0, 10.8, 16], target: [0, 10.4, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const c = s.cond, pulse = 0.55 + 0.45 * Math.sin(t * 4);
        if (c !== lastCond) { lastCond = c; fillK = 0; }
        body.setMale(c === 'prostate');
        mBladder.visible = c === 'uti' || c === 'bed'; mUreter.visible = c === 'stone'; mProst.visible = c === 'prostate'; mKid.visible = c === 'dialysis' || c === 'stone'; mGut.visible = c === 'dehyd';
        [mBladder, mUreter, mProst, mKid, mGut].forEach((m) => { m.scale.setScalar(0.8 + 0.5 * pulse); m.material.opacity = 0.35 + 0.45 * pulse; });
        stoneInBody.visible = c === 'stone';
        body.G.colon.visible = c === 'dehyd';
        utiG.visible = c === 'uti'; stG.visible = c === 'stone'; orsG.visible = c === 'dehyd'; bedG.visible = c === 'bed'; prG.visible = c === 'prostate'; diG.visible = c === 'dialysis';
        if (c === 'uti') {
          for (let i = 0; i < 40; i++) { const u = (t * 0.12 + rnd(i)) % 1; const inBl = u > 0.55; const a = rnd(i + 7) * 6.28, r = inBl ? 1.1 * Math.sqrt(rnd(i + 3)) : 0.1;
            _o.position.set(Math.cos(a) * r, inBl ? 1.6 + Math.sin(a * 1.7) * 0.8 * rnd(i + 9) : -0.9 + (u / 0.55) * 1.3, Math.sin(a) * r * 0.6 + 0.1); _o.rotation.set(0, 0, a + t); _o.scale.setScalar(1); _o.updateMatrix(); bact.setMatrixAt(i, _o.matrix); }
          bact.instanceMatrix.needsUpdate = true;
        }
        if (c === 'stone') { stone.rotation.y = t * 0.3; stG.rotation.y = Math.sin(t * 0.4) * 0.3; }
        if (c === 'dehyd') {
          fillK = Math.min(1, fillK + dt * 0.25);
          liquid.scale.y = Math.max(0.01, 3.0 * fillK); liquid.position.y = -1.7 + 1.5 * fillK;
          for (let i = 0; i < 40; i++) { const ph = clamp(fillK * 1.3 - rnd(i) * 0.3, 0, 1); _o.position.set((rnd(i + 5) - 0.5) * 1.6, 1.4 - ph * 2.8, (rnd(i + 9) - 0.5) * 1.2); _o.scale.setScalar(Math.max(0.001, 1 - ph)); _o.rotation.set(i, i * 2, 0); _o.updateMatrix(); grains.setMatrixAt(i, _o.matrix); }
          grains.instanceMatrix.needsUpdate = true;
        }
        if (c === 'bed') { moon.position.y = 1.8 + 0.1 * Math.sin(t); }
        if (c === 'prostate') {
          const k = 0.5 + 0.5 * Math.sin(t * 0.5);                  // young ↔ older
          pro.scale.setScalar(1 + 0.9 * k);
          const n = Math.round(16 * (1 - 0.8 * k));
          for (let i = 0; i < 16; i++) { const u = (t * (2.2 - 1.6 * k) + i / 16) % 1; _o.position.set(0, -3.2 - u * 2.2, u * 0.4); _o.scale.setScalar(i < n ? 1 : 0.001); _o.updateMatrix(); prStream.setMatrixAt(i, _o.matrix); }
          prStream.instanceMatrix.needsUpdate = true;
          insetL.userData.k = k;
        }
        if (c === 'dialysis') diG.rotation.y = t * 0.3;
        const on = s.labels && !inReel(), narrow = fit();
        insetL.element.innerHTML = {
          uti: 'Bacteria climb a short urethra into the bladder',
          stone: 'A stone stuck in the ureter: see KidneyClear',
          dehyd: 'ORS: salt and sugar carry water back in',
          bed: 'Night-time control comes later: it’s normal',
          prostate: insetL.userData.k > 0.5 ? 'Older: the prostate squeezes, the stream weakens' : 'Younger: a clear channel',
          dialysis: 'A dialyser filters blood when kidneys fail',
        }[c];
        bodyL.element.innerHTML = { uti: 'Infection in the bladder', stone: 'Forms in a kidney, hurts in the ureter', dehyd: 'Diarrhoea drains water and salt', bed: 'The bladder empties in sleep', prostate: 'The prostate, under the bladder', dialysis: 'Failed kidneys: dialysis' }[c];
        insetL.visible = on; bodyL.visible = on && !narrow;
        inset.visible = !narrow || inReel();
      },
      readout: (s) => {
        const c = s.cond;
        const rows = {
          uti: [['Women who get one', 'about 1 in 2, lifetime'], ['Signs', 'burning, going often, cloudy urine'], ['Helps', 'drink water, don’t hold on for hours'], ['Fever or back pain', 'see a doctor soon']],
          stone: [['People who get one', 'about 1 in 10'], ['Main risk', 'too little urine: hot days, too little water'], ['Pain', 'when it moves down the ureter'], ['More', 'see KidneyClear']],
          dehyd: [['Child deaths from diarrhoea', 'about 440,000 a year'], ['ORS per litre (WHO)', 'sodium, glucose 75 mmol each'], ['For children, doctors add', 'zinc for 10–14 days'], ['Danger signs', 'very sleepy, no urine, can’t drink']],
          bed: [['Children who wet the bed at 5', 'about 1 in 6'], ['At 7', 'about 1 in 10'], ['At 15', '1–2 in 100'], ['Is it their fault?', 'No. Most outgrow it']],
          prostate: [['Men 40–64 with BPH', '5–6%'], ['Men 65 and older', '29–33%'], ['Signs', 'weak stream, up at night to go'], ['What to do', 'see a doctor: it is treatable']],
          dialysis: [['When', 'kidneys work at under about 15%'], ['Haemodialysis', 'about 4 hours, 3 times a week'], ['Or', 'a kidney transplant'], ['More', 'see KidneyClear']],
        }[c];
        const note = { uti: 'Only a urine test can say for sure. See a doctor rather than guessing.', stone: 'Drinking enough to keep urine pale is the simplest way to lower the risk.', dehyd: 'Mix an ORS packet exactly as it says, with clean water. For a baby or a very ill child, see a doctor at once.', bed: 'If it starts again after months of dry nights, or comes with pain, see a doctor.', prostate: 'An enlarged prostate is not cancer, but only a doctor can check.', dialysis: 'One line here; KidneyClear shows how a dialyser works.' }[c];
        return `<div class="big">${COND[c].title}</div>
          ${rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}
          <small>${note}</small>`;
      },
    });
  },
};
