// Chapter 5: balancing water with the weather. On a hot day or during exercise more water leaves as
// sweat, so the kidneys make less, darker urine; on a cold day almost nothing is sweated and more
// leaves as urine. ADH from the pituitary does the steering (KidneyClear has the details).
// The model, per day, for a 60 kg adult:
//  - In: drinks (slider) + water in food 0.7 L + water made by the cells 0.25 L, plus about 0.1 L
//    more per hour of hard exercise (Tortora & Derrickson fig. 27.2; Guyton & Hall table 25-1).
//  - Out: evaporation through skin 0.35 L; breath 0.35 L, a little less in hot humid air and more
//    in cold dry air, plus about 0.1 L per hour of hard exercise; stool 0.1 L (Guyton & Hall table
//    25-1: normal 350/350/100; hot weather lungs 250; prolonged heavy exercise lungs 650).
//  - Sweat at rest: about 0.1 L/day in cool air, about 1.4 L/day in hot weather (Guyton & Hall
//    table 25-1); we place the cool value at 18 °C and the hot one at 35 °C, linear between and
//    rising a little beyond (a teaching fit, not a measurement). Sweat during exercise: about
//    0.5–2 L per hour depending on heat and effort (ACSM position stand "Exercise and fluid
//    replacement", Med Sci Sports Exerc 39:377, 2007); we use 0.6 L/h at 20 °C plus 0.05 L/h per
//    °C, limited to 0.3–1.8 L/h.
//  - Urine is what is left over, but never less than about 0.5 L a day: the day's waste solutes,
//    about 600 mOsm, need water, and the kidneys can concentrate urine to at most about
//    1,200 mOsm/L (Guyton & Hall ch. 29). If the budget can't cover that, the body runs short:
//    dehydration. Urine concentration = 600 mOsm ÷ urine volume, which sets its colour.
//  - Body water about 60% of body weight in young adults (Guyton & Hall ch. 25): 36 L at 60 kg.
//    Losing 2% of body weight in water already hurts performance (ACSM 2007).
//  - ADH (vasopressin) release rises steeply once blood osmolality passes about 280–290 mOsm/kg;
//    shown here only as low / medium / high from the urine concentration.
import { THREE, M, canvasTexture, clamp, lerp } from '../kit.js';
import { makeBody, tint, fitNarrow, compactReadout, inReel, board, rrect, skinPoints, rnd, URETHRA_F, URINE_CHART, URINE_WORDS, urineStep } from '../excrete.js';

export function waterDay(T, exMin, drink) {
  const h = exMin / 60;
  const food = 0.7, metab = 0.25 + 0.1 * h;
  const sweatRest = T <= 18 ? 0.1 : T <= 35 ? 0.1 + (1.3 * (T - 18)) / 17 : 1.4 + 0.12 * (T - 35);
  const sweatEx = h * clamp(0.6 + 0.05 * (T - 20), 0.3, 1.8);
  const skin = 0.35;
  const breath = 0.35 + 0.1 * h - 0.1 * clamp((T - 25) / 10, 0, 1) + 0.05 * clamp((15 - T) / 10, 0, 1);
  const stool = 0.1;
  const inTotal = drink + food + metab;
  const others = skin + sweatRest + sweatEx + breath + stool;
  let urine = inTotal - others, short = 0;
  if (urine < 0.5) { short = 0.5 - urine; urine = 0.5; }
  const osm = clamp(600 / urine, 50, 1200);
  return { drink, food, metab, inTotal, sweat: sweatRest + sweatEx, skin, breath, stool, urine, short, osm, lossPct: (short / 36) * 100 };
}
const PRESETS = [
  { label: 'Winter morning, Delhi', set: { temp: 8, ex: 0, drink: 1.6 } },
  { label: 'May afternoon, Chennai', set: { temp: 38, ex: 0, drink: 1.8 } },
  { label: 'Cricket practice in May', set: { temp: 36, ex: 120, drink: 1.8 } },
  { label: 'Same, drinking more', set: { temp: 36, ex: 120, drink: 5.2 } },
];

function drawBoard(g, w, h, d) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#0c0f16'; rrect(g, 0, 0, w, h, 24); g.fill();
  g.fillStyle = '#e8eef8'; g.font = 'bold 42px sans-serif'; g.fillText('Water today (litres)', 30, 60);
  const L = 120, bw = w - L - 40, max = Math.max(2.6, d.inTotal + d.short) * 1.04, bh = 64;
  const rowsIn = [['Drinks', d.drink, '#8ef0ff'], ['Food', d.food, '#6ee7a8'], ['Cells', d.metab, '#c9a7ff']];
  const rowsOut = [['Urine', d.urine, URINE_CHART[urineStep(d.osm)]], ['Sweat', d.sweat, '#ffb38a'], ['Skin', d.skin, '#e0b090'], ['Breath', d.breath, '#9db4ff'], ['Stool', d.stool, '#c49a6c']];
  [['In', rowsIn, 92], ['Out', rowsOut, 246]].forEach(([lab, rows, y]) => {
    g.fillStyle = 'rgba(255,255,255,.88)'; g.font = 'bold 32px sans-serif'; g.fillText(lab, 30, y + 43);
    let x = L;
    rows.forEach(([name, v, col]) => {
      const ww = (bw * v) / max; if (ww < 1) return;
      g.fillStyle = col; rrect(g, x, y, Math.max(2, ww - 4), bh, 8); g.fill();
      if (ww > 84) { g.fillStyle = '#0b0d12'; g.font = 'bold 24px sans-serif'; g.fillText(name, x + 8, y + 28); g.font = 'bold 24px sans-serif'; g.fillText(v.toFixed(1), x + 8, y + 55); }
      x += ww;
    });
    if (lab === 'In') { g.fillStyle = 'rgba(255,255,255,.8)'; g.font = 'bold 28px sans-serif'; g.fillText(d.inTotal.toFixed(1), Math.min(w - 70, x + 10), y + 43); }
  });
  g.fillStyle = d.short > 0.01 ? '#ff8a8a' : 'rgba(255,255,255,.65)'; g.font = 'bold 28px sans-serif';
  g.fillText(d.short > 0.01 ? `Short by ${d.short.toFixed(1)} L: drying out` : 'In and out balance', 30, 368);
  // Urine colour chart.
  const y0 = 426, sw = (w - 60) / 8, step = urineStep(d.osm);
  g.fillStyle = '#e8eef8'; g.font = 'bold 34px sans-serif'; g.fillText('Urine colour guide', 30, y0);
  URINE_CHART.forEach((c, i) => { g.fillStyle = c; rrect(g, 30 + i * sw, y0 + 20, sw - 8, 70, 10); g.fill(); });
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; rrect(g, 30 + step * sw - 4, y0 + 16, sw, 78, 12); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '26px sans-serif';
  g.fillText('well hydrated', 30, y0 + 126); g.fillText('drink more', w - 170, y0 + 126);
}

export default {
  id: 'weather',
  short: 'Hot day, cold day',
  title: 'Sweat or urine: balancing with the weather',
  subtitle: 'The same water has to leave somehow. Heat sends it out through the skin; cold sends it to the bladder.',
  view: { pos: [-2.9, 9.8, 19], target: [-4.1, 9.4, 0] },
  learn: `<p>Your body keeps its water almost constant, so what goes out must match what comes in. The exits share the job, and the <b>weather</b> decides the split.</p>
    <p>On a <b>hot day</b> the skin sweats to cool you, and sweat can take <b>1.5 litres</b> or more. On the cricket field in May it can be more than <b>1 litre an hour</b>. The kidneys respond by saving water: the brain's <b>pituitary gland</b> releases <b>ADH</b> (antidiuretic hormone), which tells the kidneys to put more water back into the blood. Urine becomes small and <b>dark</b>. How ADH works inside the kidney is in KidneyClear.</p>
    <p>On a <b>cold day</b> you hardly sweat. ADH falls, and the spare water leaves as plenty of <b>pale urine</b>. Cold also shifts blood from the skin to the core, which makes the kidneys pass even more.</p>
    <p>There is a limit. The day's waste needs at least about <b>half a litre</b> of urine to carry it, because kidneys can only concentrate urine so far. If sweat takes more than you drink, the body starts to <b>dry out</b>. Your <b>urine colour</b> is a handy guide: pale straw is good; dark yellow or amber means drink more. (Some vitamins and foods change the colour too.)</p>
    <p class="tip"><b>Try it:</b> press the presets from a Delhi winter to cricket practice in May. Watch sweat and urine swap sizes and the colour change. Then drink more.</p>`,
  terms: [
    { t: 'Water balance', d: 'Keeping the water that comes in each day equal to the water that goes out.' },
    { t: 'ADH', d: 'Antidiuretic hormone (vasopressin), from the pituitary. It tells the kidneys to keep water.' },
    { t: 'Insensible loss', d: 'Water lost without noticing, by evaporation from skin and in breath: about 0.7 L a day.' },
    { t: 'Dehydration', d: 'Losing more water than you take in, so the body runs short.' },
    { t: 'Concentrated urine', d: 'Urine with little water for its waste: darker, made when ADH is high.' },
  ],
  defaults: { temp: 24, ex: 0, drink: 1.6, labels: true },
  controls: [
    { key: 'temp', type: 'range', label: 'Air temperature', min: 5, max: 42, step: 0.5, ends: ['5 °C', '42 °C'], fmt: (v) => v.toFixed(0) + ' °C' },
    { key: 'ex', type: 'range', label: 'Hard exercise today', min: 0, max: 180, step: 5, ends: ['none', '3 hours'], fmt: (v) => (v ? v + ' min' : 'none') },
    { key: 'drink', type: 'range', label: 'What you drink', min: 0.5, max: 6, step: 0.1, ends: ['0.5 L', '6 L'], fmt: (v) => v.toFixed(1) + ' L a day' },
    { key: 'preset', type: 'buttons', label: 'Try a day', items: PRESETS.map((p) => ({ label: p.label, act: (s) => Object.assign(s, p.set) })) },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'On a very hot day your urine is darker because…', options: ['You ate something yellow', 'Sweat takes more water, so ADH makes the kidneys keep water', 'The kidneys stop working', 'Heat colours it'], answer: 1, why: 'With more water leaving as sweat, ADH rises and the kidneys make less, more concentrated urine.' },
    { q: 'What does ADH tell the kidneys?', options: ['Make more urine', 'Keep more water', 'Make urea', 'Stop filtering'], answer: 1, why: 'Antidiuretic hormone means “against making urine”: it helps the kidneys put water back into the blood.' },
    { q: 'Why is there a minimum amount of urine each day?', options: ['The bladder must be exercised', 'The day’s waste needs some water to carry it, and urine can only get so concentrated', 'There isn’t one', 'To keep the ureters wet'], answer: 1, why: 'The kidneys can concentrate urine only about four times more than blood, so the waste needs at least about half a litre.' },
  ],
  reel: [
    { ms: 5600, caption: 'On a cold day you barely sweat, so extra water leaves as plenty of pale urine.', set: { temp: 8, ex: 0, drink: 1.6, labels: false }, view: { pos: [-3.6, 9.4, 17], target: [-4.8, 9.0, 0] }, spin: 0 },
    { ms: 6000, caption: 'In the heat, sweat takes the water, ADH rises and urine turns small and dark.', set: { ex: 90, drink: 1.8, labels: false }, anim: { temp: [8, 38] }, view: { pos: [-3.6, 9.4, 17], target: [-4.8, 9.0, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage, { labels: false });
    root.add(body.root);
    [body.G.liver, body.G.colon].forEach((g) => g.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0.18; } }));
    const SP = skinPoints(220);
    const sweat = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshPhysicalMaterial({ color: 0xbfefff, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.9, emissive: 0x2a6a80, emissiveIntensity: 0.7 }), SP.length);
    sweat.frustumCulled = false; root.add(sweat);
    const breath = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: 0.35, depthWrite: false }), 18);
    breath.frustumCulled = false; root.add(breath);
    const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf4c430 }), 20);
    drops.frustumCulled = false; root.add(drops);
    const endU = URETHRA_F.at(-1);
    const labs = {
      sweat: tint(stage.label('', [2.4, 13.2, 0.4], root), 'skin'),
      urine: tint(stage.label('', [2.2, 8.2, 0.5], root), 'urine'),
      breath: tint(stage.label('', [1.8, 16.9, 1.2], root), 'blue'),
      adh: tint(stage.label('', [2.5, 15.8, 0.3], root), 'purple'),
    };
    const pit = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), M.glow(0xc9a7ff)); pit.position.set(0, 16.2, 0.2); root.add(pit);
    let d = waterDay(24, 0, 1.6), key = '';
    const ct = canvasTexture(900, 580, (g, w, h) => drawBoard(g, w, h, d));
    const bd = board(ct, 9.6, 6.19); bd.position.set(-9.4, 5.2, 0); bd.rotation.y = 0.12; root.add(bd);
    const skin0 = body.skinMat.color.clone(), hot = new THREE.Color(0xff7a5a), cold = new THREE.Color(0x9ab8ff);
    const _o = new THREE.Object3D();
    let t = 0;
    const fit = fitNarrow(stage, { pos: [0, 10.8, 16], target: [0, 10.4, 0] });
    return compactReadout(stage, {
      update(dt, s) {
        dt = Math.max(0, dt); t += dt;
        const k2 = `${s.temp}|${s.ex}|${s.drink}`;
        if (k2 !== key) { key = k2; d = waterDay(s.temp, s.ex, s.drink); ct.redraw(); body.urineMat.color.set(URINE_CHART[urineStep(d.osm)]); }
        // Skin flushes in the heat and pales in the cold.
        body.skinMat.color.copy(skin0);
        if (s.temp > 28) body.skinMat.color.lerp(hot, clamp((s.temp - 28) / 12, 0, 0.6));
        if (s.temp < 15) body.skinMat.color.lerp(cold, clamp((15 - s.temp) / 10, 0, 0.6));
        body.skinMat.emissiveIntensity = s.temp > 30 ? 0.1 : 0;
        // Sweat beads: how many show depends on the sweat rate.
        const nSweat = Math.round(SP.length * clamp(d.sweat / 4, 0.02, 1));
        SP.forEach((p, i) => { const ph = (t * 0.4 + rnd(i + 3)) % 1; _o.position.set(...p); _o.scale.setScalar(i < nSweat ? 0.4 + 1.1 * Math.sin(ph * Math.PI) : 0.001); _o.updateMatrix(); sweat.setMatrixAt(i, _o.matrix); });
        sweat.instanceMatrix.needsUpdate = true;
        // Breath: visible vapour when it is cold.
        breath.material.opacity = s.temp < 12 ? 0.45 : 0.14;
        for (let i = 0; i < 18; i++) { const ph = (t * 0.35 + i / 18) % 1; _o.position.set(Math.sin(i * 2.1) * 0.25 * ph, 16.05 + ph * 0.8, 0.95 + ph * 2.0); _o.scale.setScalar(0.5 + ph * 2.5); _o.updateMatrix(); breath.setMatrixAt(i, _o.matrix); }
        breath.instanceMatrix.needsUpdate = true;
        // Urine drops: more of them when more urine is made.
        drops.material.color.set(URINE_CHART[urineStep(d.osm)]);
        const nD = Math.round(20 * clamp(d.urine / 3, 0.1, 1));
        for (let i = 0; i < 20; i++) { const ph = (t * 0.7 + i / 20) % 1; _o.position.set(endU[0], endU[1] - ph * 1.8, endU[2] + ph * 0.3); _o.scale.setScalar(i < nD ? 1 : 0.001); _o.updateMatrix(); drops.setMatrixAt(i, _o.matrix); }
        drops.instanceMatrix.needsUpdate = true;
        body.setBladder(lerp(150, 380, clamp(d.urine / 3, 0, 1)));
        body.stepUrine(dt, clamp(d.urine / 1.5, 0.3, 2));
        const adh = d.osm > 800 ? 'high' : d.osm > 350 ? 'medium' : 'low';
        pit.scale.setScalar(adh === 'high' ? 2.2 + 0.4 * Math.sin(t * 6) : adh === 'medium' ? 1.5 : 1);
        labs.sweat.element.innerHTML = `Sweat: ${d.sweat.toFixed(1)} L`;
        labs.urine.element.innerHTML = `Urine: ${d.urine.toFixed(1)} L, ${URINE_WORDS[urineStep(d.osm)]}`;
        labs.breath.element.innerHTML = `Breath: ${d.breath.toFixed(2)} L`;
        labs.adh.element.innerHTML = `ADH: ${adh}`;
        const narrow = fit();
        Object.values(labs).forEach((l) => { l.visible = s.labels && !inReel() && !narrow; });
        bd.visible = !narrow;
      },
      readout: (s) => {
        const adh = d.osm > 800 ? 'high: keep water' : d.osm > 350 ? 'medium' : 'low: let water go';
        return `<div class="big">${d.short > 0.01 ? 'Drying out: drink more' : d.urine > d.sweat ? 'Most water leaves as urine' : 'Most water leaves as sweat'}</div>
          <div class="row"><span>Sweat today</span><b>${d.sweat.toFixed(1)} L</b></div>
          <div class="row"><span>Urine today</span><b>${d.urine.toFixed(1)} L · ${URINE_WORDS[urineStep(d.osm)]}</b></div>
          <div class="row"><span>ADH from the pituitary</span><b>${adh}</b></div>
          <div class="row"><span>Water in · out</span><b>${d.inTotal.toFixed(1)} L · ${(d.inTotal + d.short).toFixed(1)} L</b></div>
          <small>${d.short > 0.01 ? `Short by ${d.short.toFixed(1)} L, about ${(d.short / 60 * 100).toFixed(1)}% of a 60 kg body. Thirst is the signal: drink water, and ORS if you are also losing salt.` : 'Urine can’t get much darker than amber: its waste needs at least about 0.5 L a day.'}</small>`;
      },
    });
  },
};
