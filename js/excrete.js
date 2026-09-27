// ExcretionClear's shared models: a ghosted, clearly stylised human figure with the urinary tract
// inside it (kidneys, ureters, bladder, urethra, the aorta and inferior vena cava that feed the
// kidneys) and the other organs that get rid of waste highlighted: the lungs (carbon dioxide and
// water vapour), the liver and gallbladder (bile, carrying bilirubin into the gut), the large
// intestine (stool) and the skin (sweat). Plus the numbers the chapters share.
//
// Orientation: we face the person (anterior view), as in an anatomy atlas, so their RIGHT is on
// YOUR LEFT. Axes: +x = the person's left, +y = up, +z = forwards (towards you). One model unit is
// 10 cm, so the figure is about 1.75 m tall with the feet on the floor (y = 0). Same frame as
// CirculationClear and DigestionClear, so organs sit in the same places.
// Placement follows standard anatomy (Gray's Anatomy, 42nd ed.; NIDDK "The Urinary Tract & How It
// Works"; StatPearls "Anatomy, Abdomen and Pelvis: Bladder" and "…: Ureter"):
//  - the kidneys lie against the back wall of the abdomen at about T12–L3, the right one 1–2 cm
//    lower because of the liver; upper poles tilt towards the spine;
//  - each ureter, about 25–30 cm long and 3–4 mm wide, runs down from the renal pelvis in front of
//    the psoas muscle, crosses the iliac vessels at the pelvic brim and enters the back of the
//    bladder at an angle (which acts as a one-way valve);
//  - the bladder sits in the pelvis just behind the pubic bone; empty it is flat and below the pubic
//    bone's top, and as it fills it rises into the lower belly. Adult capacity about 400–600 mL;
//  - the urethra: about 4 cm in women, running down and slightly forwards; about 18–20 cm in men,
//    passing through the prostate just under the bladder (StatPearls "Anatomy, Abdomen and Pelvis,
//    Urethra"). Drawn schematically, not to scale in the male case;
//  - the rectum lies behind the bladder; the colon frames the belly (up the right side, across,
//    down the left side, the S-shaped sigmoid, then the rectum).
// Tube thicknesses are exaggerated so they can be seen; positions are to scale.
import { THREE, M, clamp, lerp, smooth } from './kit.js';

// ---------------------------------------------------------------- shared numbers
// Daily water budget of a typical adult in a temperate climate (Tortora & Derrickson, Principles
// of Anatomy and Physiology, 16th ed., fig. 27.2): in 2,500 mL = drinks 1,600 + food 700 +
// metabolic water 200; out 2,500 mL = kidneys 1,500 + skin 600 (insensible loss plus a little
// sweat) + lungs 300 + gut (stool) 100.
// Guyton & Hall, Textbook of Medical Physiology, 14th ed., table 25-1, gives the same pattern
// (2,300 mL a day) and how it shifts: hot weather sweat 1,400 mL, urine 1,200; prolonged heavy
// exercise sweat 5,000 mL, lungs 650, urine 500.
export const WATER = {
  in: [['Drinks', 1.6, '#8ef0ff'], ['Water in food', 0.7, '#6ee7a8'], ['Made by your cells', 0.2, '#c9a7ff']],
  out: [['Urine (kidneys)', 1.5, '#ffd166'], ['Skin (sweat, evaporation)', 0.6, '#ffb38a'], ['Breath (lungs)', 0.3, '#9db4ff'], ['Stool (gut)', 0.1, '#c49a6c']],
};
// The wastes, per day, for a typical adult:
//  - CO2: NASA's crew planning value is about 1.0 kg a day for an active adult (NASA "Life Support
//    Baseline Values and Assumptions Document", NASA/TP-2015-218570/REV2, 2022: 1.04 kg per crew
//    member per day). Resting all day, 200 mL/min (Guyton & Hall ch. 41) × 1,440 min = 288 L ×
//    1.98 g/L ≈ 0.57 kg.
//  - Urea: about 20–35 g a day on an ordinary diet; it carries 80–90% of the nitrogen we excrete
//    (NIH StatPearls "Physiology, Urea Cycle"; Guyton & Hall ch. 71). Our model: protein × 16%
//    nitrogen × 85% as urea ÷ 0.467 g N per g urea (see urea.js).
//  - Bilirubin: about 250–350 mg a day, mostly from old red blood cells (Guyton & Hall ch. 71); it
//    leaves in bile and is turned by gut bacteria into stercobilin (which colours stool brown); a
//    little is absorbed and leaves in urine as urobilin (which helps colour urine yellow).
//  - Sweat: sodium about 20–80 mmol/L (Baker, Sports Med 47 suppl 1, 2017); at 40 mmol/L, 0.1 L of
//    sweat carries about 0.25 g of salt. Most of the salt you eat leaves in urine instead.
//  - Stool: about 100–200 g a day, about three quarters water (Rose et al., Crit Rev Food Sci Nutr
//    55:1604, 2015: median 128 g/day).
export const WASTES = [
  { key: 'co2', name: 'Carbon dioxide', route: 'Lungs, in your breath', amt: '≈ 1 kg', perDay: 1000, unit: 'g', col: '#9db4ff', box: 'LungsClear' },
  { key: 'urea', name: 'Urea', route: 'Kidneys, in urine', amt: '20–35 g', perDay: 25, unit: 'g', col: '#ffd166', box: 'KidneyClear' },
  { key: 'bili', name: 'Bilirubin', route: 'Liver → bile → stool', amt: '≈ 0.3 g', perDay: 0.3, unit: 'g', col: '#6ee7a8', box: 'LiverClear' },
  { key: 'salt', name: 'Salt in sweat', route: 'Skin, in sweat', amt: '≈ 0.25 g (cool day)', perDay: 0.25, unit: 'g', col: '#ffb38a', box: 'SkinClear' },
  { key: 'water', name: 'Water', route: 'All four exits', amt: '≈ 2.5 L', perDay: 2500, unit: 'mL', col: '#8ef0ff', box: '' },
];

// ---------------------------------------------------------------- colours and label helpers
export const C = { kidney: 0xa8453a, urine: 0xf4c430, bladder: 0xe9a3a8, ureter: 0xe7b85c, lung: 0xf2a7b6, liver: 0x8a3a2e, bile: 0x5bbf6a, colon: 0xc79a6a, skin: 0xd9a47e, red: 0xff3b4a, blue: 0x4f7bff, co2: 0x9db4ff, sweat: 0x8ef0ff, prostate: 0xc98fa6 };
const TINT = { red: '#ff8a8a', blue: '#9db4ff', side: '#8ef0ff', gold: '#ffd166', good: '#6ee7a8', purple: '#c9a7ff', pink: '#ff9fc0', brown: '#e0b080', skin: '#ffb38a', urine: '#ffd166', cyan: '#8ef0ff' };
export function tint(l, cls) { const c = TINT[cls]; if (c) { l.element.style.borderColor = c; l.element.style.color = c; } return l; }
export function sideLabels(stage, parent, y, x, z = 1.2) {
  return [tint(stage.label('← Their right', [-x, y, z], parent), 'side'), tint(stage.label('Their left →', [x, y, z], parent), 'side')];
}
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage the readout covers the upper left: re-centre once, unless orbited.
export function fitNarrow(stage, view) {
  let done = false;
  return () => {
    const narrow = stage.host.clientWidth < 560;
    if (narrow && !done && !stage.moved && !inReel()) { stage.setView(view.pos, view.target, 0.01); done = true; }
    return narrow;
  };
}
// On phones keep only the readout's headline and two rows.
export function compactReadout(stage, api) {
  const full = api.readout;
  if (!full) return api;
  api.readout = (s) => {
    const html = full(s);
    if (stage.host.clientWidth >= 560 || !html) return html;
    let rows = 0;
    return html.replace(/<small>[\s\S]*?<\/small>/g, '').replace(/<div class="row">[\s\S]*?<\/div>/g, (m) => (++rows <= 2 ? m : ''));
  };
  return api;
}
// A flat board carrying a canvas chart.
export function board(ct, w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ct.tex, alphaTest: 0.5, toneMapped: false, side: THREE.DoubleSide }));
}
export function rrect(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const tissue = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.4, ...o });
export const ghostMat = (c, op = 0.2) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: op, roughness: 0.6, depthWrite: false });

// Urine colour from its concentration (osmolality, mOsm/kg). Pale straw when dilute, amber when
// concentrated: the 8-step urine colour chart of Armstrong et al. (Int J Sport Nutr 4:265, 1994)
// tracks specific gravity and osmolality; steps 1–3 go with good hydration (roughly < 600 mOsm/kg),
// 7–8 with dehydration (> ~900). Our 8 swatches are an approximation of that printed chart.
export const URINE_CHART = ['#fbf6d0', '#f7ee9c', '#f3e27a', '#eed15a', '#e3b83e', '#d49a2c', '#c07c22', '#a4601c'];
export function urineStep(osm) { return clamp(Math.round(((osm - 100) / (1200 - 100)) * 7), 0, 7); }
export const urineColor = (osm) => URINE_CHART[urineStep(osm)];
export const URINE_WORDS = ['very pale', 'pale straw', 'straw', 'pale yellow', 'yellow', 'dark yellow', 'amber', 'dark amber'];

// ---------------------------------------------------------------- geometry helpers
export const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(...p));
// A polyline sampled by arc length, so things travel along it at a steady speed.
export function pathOf(points) {
  const Pt = points.map(V);
  const L = [0];
  for (let i = 1; i < Pt.length; i++) L.push(L[i - 1] + Pt[i].distanceTo(Pt[i - 1]));
  const total = Math.max(1e-6, L[L.length - 1]);
  return {
    points: Pt, total,
    at(u, out = new THREE.Vector3()) {
      const d = clamp(u, 0, 1) * total;
      let lo = 0, hi = L.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= d) lo = m; else hi = m; }
      const k = (d - L[lo]) / Math.max(1e-9, L[hi] - L[lo]);
      return out.copy(Pt[lo]).lerp(Pt[hi], k);
    },
  };
}
export const smoothPts = (pts, n = 60) => new THREE.CatmullRomCurve3(pts.map(V), false, 'centripetal').getPoints(n);
export function tubeAlong(pts, r, mat, seg = 60, radial = 10) {
  const curve = new THREE.CatmullRomCurve3(pts.map(V), false, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, radial, false), mat);
}
export function capsule(a, b, r, mat) {
  const A = V(a), B = V(b), len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}
export function blob(r, pos, mat, seg = 32) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), mat);
  m.scale.set(...r); m.position.set(...pos);
  return m;
}
// A bean: a sphere with a dent (the hilum) on one side. side = +1 dents towards +x.
export function beanGeometry(side = 1) {
  const g = new THREE.SphereGeometry(1, 40, 28), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const toward = v.x * side;
    if (toward > 0) v.x -= side * 0.5 * toward * Math.exp(-(v.y * v.y) / 0.18) * (1 - 0.3 * Math.abs(v.z));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
// An arrow made of a tube along points with a cone at the end.
export function flowArrow(pts, color, r = 0.05) {
  const g = new THREE.Group(), mat = M.glow(color, { transparent: true, opacity: 0.9 });
  const P = pts.map(V);
  g.add(tubeAlong(P, r, mat, 40, 8));
  const a = P.at(-2), b = P.at(-1);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 3, r * 7, 14), mat);
  cone.position.copy(b); cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.add(cone); g.mat = mat;
  return g;
}

// ---------------------------------------------------------------- positions
export const P = {
  kidL: [0.9, 10.85, -0.56], kidR: [-0.9, 10.7, -0.56],
  hilumL: [0.68, 10.8, -0.5], hilumR: [-0.68, 10.65, -0.5],
  neck: [0, 8.78, 0.36],                         // bladder neck (the outlet); the bladder grows up from here
  lungL: [1.05, 13.15, -0.12], lungR: [-1.05, 13.15, -0.12],
  liver: [-0.62, 11.85, 0.12], gall: [-0.5, 11.5, 0.5], nose: [0, 16.45, 0.95], mouth: [0, 16.05, 0.86],
  anus: [0, 8.45, -0.42], brain: [0, 16.6, 0.02],
};
export const URETER_L = [P.hilumL, [0.62, 10.35, -0.46], [0.52, 9.7, -0.38], [0.48, 9.3, -0.22], [0.4, 9.0, 0.02], [0.22, 8.98, 0.2]];
export const URETER_R = [P.hilumR, [-0.62, 10.2, -0.46], [-0.52, 9.65, -0.38], [-0.48, 9.3, -0.22], [-0.4, 9.0, 0.02], [-0.22, 8.98, 0.2]];
export const URETHRA_F = [P.neck, [0, 8.62, 0.4], [0, 8.42, 0.46]];                          // about 4 cm
export const URETHRA_M = [P.neck, [0, 8.6, 0.37], [0, 8.42, 0.44], [0, 8.34, 0.62], [0, 8.22, 0.8]];   // schematic
export const COLON = [[-0.8, 9.45, 0.3], [-0.95, 10.1, 0.25], [-0.98, 10.8, 0.22], [-0.82, 11.2, 0.32], [-0.35, 10.9, 0.6], [0.3, 10.9, 0.6], [0.88, 11.35, 0.25], [1.0, 10.6, 0.2], [0.98, 9.8, 0.2], [0.72, 9.25, 0.38], [0.3, 9.25, 0.35], [0.05, 9.1, -0.05], [0, 8.8, -0.35], [0, 8.5, -0.42]];
export const TRACHEA = [[0, 15.3, 0.25], [0, 14.6, 0.2], [0, 13.95, 0.08]];
export const bladderRadius = (mL) => Math.cbrt((3 * Math.max(20, mL)) / (4 * Math.PI)) / 10;   // model units (10 cm)

// ---------------------------------------------------------------- the figure
// A calm, clearly stylised figure standing in a relaxed A-pose, built from capsules and lathes.
export const TORSO = [[15.1, 0.02], [15.0, 0.55], [14.75, 1.45], [14.35, 1.8], [13.6, 1.72], [12.4, 1.55], [11.3, 1.32], [10.4, 1.35], [9.6, 1.55], [9.0, 1.5], [8.55, 1.05], [8.4, 0.02]];
export function torsoR(y) {
  for (let i = 0; i < TORSO.length - 1; i++) { const [y0, r0] = TORSO[i], [y1, r1] = TORSO[i + 1]; if (y <= y0 && y >= y1) return lerp(r0, r1, (y0 - y) / (y0 - y1)); }
  return 0;
}
export function makeFigure(mat) {
  const g = new THREE.Group();
  g.add(blob([0.78, 1.0, 0.88], [0, 16.45, 0.05], mat));
  g.add(capsule([0, 14.9, -0.02], [0, 15.6, 0.0], 0.38, mat));
  const torsoG = new THREE.LatheGeometry(TORSO.map(([y, r]) => new THREE.Vector2(r, y)), 48);
  torsoG.scale(1, 1, 0.6); torsoG.computeVertexNormals();
  g.add(new THREE.Mesh(torsoG, mat));
  for (const sx of [1, -1]) {
    g.add(capsule([sx * 1.85, 14.35, 0], [sx * 2.2, 11.8, 0.05], 0.36, mat));
    g.add(capsule([sx * 2.2, 11.8, 0.05], [sx * 2.45, 9.45, 0.1], 0.29, mat));
    g.add(blob([0.24, 0.48, 0.13], [sx * 2.56, 8.72, 0.08], mat));
    g.add(capsule([sx * 0.78, 9.0, 0], [sx * 0.95, 4.8, 0], 0.6, mat));
    g.add(capsule([sx * 0.95, 4.8, 0], [sx * 0.97, 0.75, -0.05], 0.44, mat));
    g.add(blob([0.34, 0.2, 0.62], [sx * 1.0, 0.24, 0.35], mat));
  }
  return g;
}
// Points on the skin surface (for sweat beads): torso, arms, forehead and legs, front-facing.
export function skinPoints(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r0 = rnd(i * 3 + 1), r1 = rnd(i * 3 + 2), r2 = rnd(i * 3 + 3), part = rnd(i * 7 + 5);
    if (part < 0.5) {                          // torso front half
      const y = lerp(9.2, 14.4, r0), a = lerp(-1.2, 1.2, r1), R = torsoR(y) + 0.03;
      out.push([Math.sin(a) * R, y, Math.cos(a) * R * 0.6 + 0.02]);
    } else if (part < 0.72) {                  // arms
      const sx = r2 < 0.5 ? -1 : 1, k = r0, a0 = [sx * 1.85, 14.35, 0], a1 = [sx * 2.45, 9.45, 0.1];
      const p = [lerp(a0[0], a1[0], k), lerp(a0[1], a1[1], k), lerp(a0[2], a1[2], k)], rr = lerp(0.38, 0.31, k), a = lerp(-1.3, 1.3, r1);
      out.push([p[0] + Math.sin(a) * rr, p[1], p[2] + Math.cos(a) * rr]);
    } else if (part < 0.8) {                   // forehead and face
      const a = lerp(-0.9, 0.9, r1), y = lerp(16.4, 17.1, r0);
      out.push([Math.sin(a) * 0.8, y, 0.05 + Math.cos(a) * 0.9]);
    } else {                                   // thighs
      const sx = r2 < 0.5 ? -1 : 1, y = lerp(5.0, 8.8, r0), a = lerp(-1.2, 1.2, r1), x0 = sx * lerp(0.95, 0.8, (y - 5) / 3.8);
      out.push([x0 + Math.sin(a) * 0.63, y, Math.cos(a) * 0.63]);
    }
  }
  return out;
}

// ---------------------------------------------------------------- the body
// Build the whole body. Options: labels, male (urethra and prostate), others (lungs, liver, colon).
export function makeBody(stage, opts = {}) {
  const o = { labels: true, others: true, ...opts };
  const root = new THREE.Group();
  const G = {}; ['skin', 'urinary', 'vessels', 'lungs', 'liver', 'colon', 'faint'].forEach((k) => { G[k] = new THREE.Group(); root.add(G[k]); });
  G.urinary.add(G.vessels);

  // ---- skin
  const skinMat = new THREE.MeshStandardMaterial({ color: C.skin, transparent: true, opacity: 0.12, roughness: 0.65, depthWrite: false, side: THREE.DoubleSide, emissive: 0xff8a4a, emissiveIntensity: 0 });
  G.skin.add(makeFigure(skinMat));

  // ---- faint organs that are not part of the story (so the belly isn't empty)
  const faintStomach = blob([0.55, 0.42, 0.35], [0.55, 11.6, 0.35], ghostMat(0xe8b07a, 0.12)); faintStomach.rotation.z = 0.5;
  const faintSmall = blob([0.62, 0.5, 0.28], [0.02, 10.05, 0.35], ghostMat(0xe8b07a, 0.14));
  G.faint.add(faintStomach, faintSmall);

  // ---- kidneys (the stars)
  const kidMat = tissue(C.kidney, { emissive: 0x3a0c08, emissiveIntensity: 0.5 });
  const kidL = new THREE.Mesh(beanGeometry(-1), kidMat); kidL.scale.set(0.27, 0.56, 0.21); kidL.position.set(...P.kidL); kidL.rotation.z = 0.2;
  const kidR = new THREE.Mesh(beanGeometry(1), kidMat); kidR.scale.set(0.27, 0.56, 0.21); kidR.position.set(...P.kidR); kidR.rotation.z = -0.2;
  const adrenalMat = tissue(0xe0a040);
  const adL = blob([0.16, 0.1, 0.1], [0.82, 11.44, -0.54], adrenalMat), adR = blob([0.16, 0.1, 0.1], [-0.82, 11.3, -0.54], adrenalMat);
  G.urinary.add(kidL, kidR, adL, adR);

  // ---- vessels: aorta and IVC with the renal arteries and veins
  const vm = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: c, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
  const artM = vm(C.red), venM = vm(C.blue);
  G.vessels.add(tubeAlong([[0.12, 12.6, -0.45], [0.1, 11.5, -0.47], [0.08, 10.3, -0.4], [0.05, 9.35, -0.26]], 0.085, artM));
  G.vessels.add(tubeAlong([[-0.28, 12.2, -0.2], [-0.3, 11.5, -0.4], [-0.3, 10.3, -0.38], [-0.22, 9.35, -0.28]], 0.095, venM));
  G.vessels.add(tubeAlong([[0.1, 10.92, -0.46], [0.4, 10.9, -0.5], [0.66, 10.86, -0.52]], 0.04, artM, 12));
  G.vessels.add(tubeAlong([[0.1, 10.8, -0.46], [-0.4, 10.76, -0.5], [-0.66, 10.72, -0.52]], 0.04, artM, 12));
  G.vessels.add(tubeAlong([[-0.3, 10.72, -0.36], [0.2, 10.74, -0.38], [0.66, 10.72, -0.47]], 0.045, venM, 12));
  G.vessels.add(tubeAlong([[-0.3, 10.62, -0.38], [-0.5, 10.6, -0.46], [-0.66, 10.6, -0.48]], 0.045, venM, 12));

  // ---- ureters, bladder, urethra
  const ureterMat = tissue(C.ureter, { emissive: 0x3a2a00, emissiveIntensity: 0.4 });
  const ureterPaths = [URETER_L, URETER_R].map((pts) => smoothPts(pts, 50));
  ureterPaths.forEach((pts) => G.urinary.add(tubeAlong(pts, 0.03, ureterMat, 60, 8)));
  const bladderMat = new THREE.MeshPhysicalMaterial({ color: C.bladder, roughness: 0.35, transparent: true, opacity: 0.42, depthWrite: false, clearcoat: 0.6, side: THREE.DoubleSide });
  const bladder = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), bladderMat);
  const urineMat = new THREE.MeshStandardMaterial({ color: C.urine, roughness: 0.2, transparent: true, opacity: 0.85, emissive: 0x5a4000, emissiveIntensity: 0.4 });
  const urine = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 22), urineMat);
  G.urinary.add(bladder, urine);
  const urethraMat = tissue(0xd98a9a, { emissive: 0x301018, emissiveIntensity: 0.4 });
  const urethraF = tubeAlong(smoothPts(URETHRA_F, 20), 0.028, urethraMat, 20, 8);
  const urethraM = tubeAlong(smoothPts(URETHRA_M, 30), 0.028, urethraMat, 30, 8);
  const prostate = blob([0.2, 0.15, 0.17], [0, 8.6, 0.36], tissue(C.prostate, { transparent: true, opacity: 0.8 }));
  G.urinary.add(urethraF, urethraM, prostate);
  let vol = 250, male = false;
  const setBladder = (mL) => {
    vol = mL;
    const r = bladderRadius(mL), n = V(P.neck);
    // The bladder is flattened when nearly empty and rounds out as it fills.
    const flat = lerp(0.6, 0.92, clamp(mL / 450, 0, 1));
    bladder.scale.set(r * 1.12 + 0.03, r * flat + 0.03, r + 0.03);
    bladder.position.set(n.x, n.y + r * flat + 0.02, n.z - 0.02);
    urine.scale.set(r * 1.12, r * flat, r);
    urine.position.copy(bladder.position);
  };
  const setMale = (m) => { male = m; urethraF.visible = !m; urethraM.visible = m; prostate.visible = m; };
  setBladder(250); setMale(false);

  // ---- lungs and windpipe
  const lungMat = tissue(C.lung, { transparent: true, opacity: 0.55, depthWrite: false, emissive: 0x401018, emissiveIntensity: 0.3 });
  const lungL = blob([0.66, 1.1, 0.62], P.lungL, lungMat), lungR = blob([0.72, 1.12, 0.64], P.lungR, lungMat);
  const trachea = tubeAlong([...TRACHEA, [0.5, 13.6, -0.05]], 0.07, tissue(0xf1e4d2), 20, 8);
  const trachea2 = tubeAlong([TRACHEA[2], [-0.5, 13.6, -0.05]], 0.06, tissue(0xf1e4d2), 8, 8);
  G.lungs.add(lungL, lungR, trachea, trachea2);

  // ---- liver, gallbladder, bile duct
  const liverMat = tissue(C.liver, { emissive: 0x2a0806, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 });
  const liver = blob([0.98, 0.42, 0.62], P.liver, liverMat); liver.rotation.z = -0.18;
  const gall = blob([0.12, 0.2, 0.12], P.gall, tissue(C.bile, { emissive: 0x0a3010, emissiveIntensity: 0.5 })); gall.rotation.z = 0.5;
  const bileDuct = tubeAlong([[-0.45, 11.6, 0.3], [-0.35, 11.3, 0.4], [-0.18, 11.05, 0.45]], 0.025, tissue(C.bile), 16, 6);
  G.liver.add(liver, gall, bileDuct);

  // ---- large intestine
  const colonMat = tissue(C.colon, { transparent: true, opacity: 0.6, depthWrite: false, emissive: 0x2a1a08, emissiveIntensity: 0.3 });
  const colonPts = smoothPts(COLON, 120);
  const colon = tubeAlong(colonPts, 0.22, colonMat, 160, 14);
  G.colon.add(colon);

  // ---- urine flowing down the ureters: small drops in peristaltic groups
  const dropGeo = new THREE.SphereGeometry(0.035, 10, 8);
  const drops = new THREE.InstancedMesh(dropGeo, M.glow(0xffe07a), 24); drops.frustumCulled = false; G.urinary.add(drops);
  const upaths = ureterPaths.map((p) => pathOf(p));
  const _o = new THREE.Object3D(), _p = new THREE.Vector3();
  let ut = 0;
  const stepUrine = (dt, rate = 1) => {
    ut += dt * rate;
    for (let i = 0; i < 24; i++) {
      const side = i % 2, k = (i >> 1) % 4, wave = Math.floor((i >> 1) / 4);
      const u = ((ut * 0.25 + wave / 3 + side * 0.17) % 1) + k * 0.012;
      upaths[side].at(Math.min(1, u), _p); _o.position.copy(_p); _o.scale.setScalar(u > 0.98 ? 0.001 : 1); _o.updateMatrix(); drops.setMatrixAt(i, _o.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  };

  // ---- labels
  const labels = [], extra = [];
  const L = (html, pos, parent, cls = '', isExtra = false) => { const l = tint(stage.label(html, pos, parent), cls); labels.push(l); if (isExtra) extra.push(l); return l; };
  if (o.labels) {
    L('Kidneys: see KidneyClear', [2.9, 11.1, -0.4], G.urinary, 'pink');
    L('Ureters', [2.7, 10.1, -0.3], G.urinary, 'gold');
    L('Bladder', [2.6, 9.2, 0.5], G.urinary, 'gold');
    L('Urethra', [2.3, 8.35, 0.6], G.urinary, 'gold');
    L('Aorta · vena cava', [-3.3, 9.3, -0.3], G.vessels, 'red');
    L('Lungs: CO₂ and water out', [2.9, 14.0, 0], G.lungs, 'blue', true);
    L('Liver: bile, urea', [-3.4, 12.0, 0.3], G.liver, 'good', true);
    L('Large intestine: stool', [-3.4, 10.4, 0.3], G.colon, 'brown', true);
    L('Skin: sweat', [2.9, 12.9, 0.5], G.skin, 'skin', true);
  }

  const parts = [
    { g: G.urinary, off: [4.2, 0.2, 0] },
    { g: G.lungs, off: [-4.6, -1.5, 0] },
    { g: G.liver, off: [-4.6, -3.2, 0] },
    { g: G.colon, off: [-4.6, -4.4, 0] },
  ];
  const api = {
    root, G, kidL, kidR, bladder, urine, urineMat, bladderMat, lungL, lungR, liver, gall, colon, skinMat, prostate, labels, extra,
    pickables: { kidney: [kidL, kidR], lungs: [lungL, lungR], liver: [liver, gall], colon: [colon] },
    setBladder, setMale, stepUrine, get volume() { return vol; }, get male() { return male; },
    setXray(k) { skinMat.opacity = lerp(0.55, 0.07, k); },
    setExplode(k) { const e = smooth(k); parts.forEach((p) => p.g.position.set(p.off[0] * e, p.off[1] * e, p.off[2] * e)); G.faint.visible = e < 0.3; },
    // Dim everything except the urinary tract (k = 1: others fully dimmed).
    setOthers(on) { [G.lungs, G.liver, G.colon].forEach((g) => { g.visible = on; }); extra.forEach((l) => { l.userData.off = !on; }); },
    showLabels(on, narrow = false) { labels.forEach((l) => { l.visible = on && !narrow && !l.userData.off; }); },
  };
  api.setExplode(0); api.setXray(1); api.setOthers(o.others);
  return api;
}
