// Chapter 1: the excretory system in a ghosted body. The urinary tract is the star (kidneys,
// ureters, bladder, urethra, with the aorta and vena cava that feed the kidneys), and the other
// organs that get rid of waste are highlighted: lungs, liver, large intestine and skin.
// Explode pulls the urinary tract to one side and the other exits to the other.
// Numbers:
//  - kidneys about 11–12 cm long, about 150 g each; renal blood flow about 1.1 L/min, about 20–25%
//    of the heart's output (NIDDK "Your Kidneys & How They Work"; Guyton & Hall, 14th ed., ch. 26);
//  - urine about 1–2 L a day (NIDDK); 1.5 L in a typical day (Tortora & Derrickson fig. 27.2);
//  - ureters about 25–30 cm long, 3–4 mm wide; waves of muscle (peristalsis) push urine down
//    1–5 times a minute (StatPearls "Anatomy, Abdomen and Pelvis: Ureter"; Guyton & Hall ch. 26);
//  - bladder capacity about 400–600 mL (StatPearls "Physiology, Bladder");
//  - urethra about 4 cm in women and about 18–20 cm in men (StatPearls "Anatomy, Abdomen and
//    Pelvis, Urethra").
import { THREE } from '../kit.js';
import { makeBody, sideLabels, fitNarrow, compactReadout, inReel } from '../excrete.js';
import { toast } from '../ui.js';

export default {
  id: 'anatomy',
  short: 'Meet the system',
  title: 'Four ways out',
  subtitle: 'Urine, breath, sweat and stool: five organs share the job of getting rid of waste.',
  view: { pos: [-0.9, 12.0, 13], target: [-1.8, 11.2, 0] },
  learn: `<p>Every cell in you is busy, and busy cells make <b>waste</b>: carbon dioxide from burning food, nitrogen left over from protein, old red blood cells, extra salt and water. Getting rid of it is called <b>excretion</b>, and your body has <b>four ways out</b>, run by <b>five organs</b>. We are facing the person, so their <b>right</b> side is on <b>your left</b>.</p>
    <p>The best known is the <b>urinary tract</b>. Two <b>kidneys</b> high at the back clean the blood that the <b>aorta</b> brings them, about a litre every minute, and turn the waste into <b>urine</b>. Two thin tubes, the <b>ureters</b>, squeeze it down in little waves to the <b>bladder</b>, a stretchy bag low in the belly that holds about <b>400 to 600 mL</b>. When you go, it leaves through the <b>urethra</b>. In women the urethra is short, about <b>4 cm</b>; in men it is about <b>20 cm</b> long and passes through the <b>prostate</b> gland. How the kidneys filter is its own box: see KidneyClear.</p>
    <p>The others share the work. The <b>lungs</b> breathe out carbon dioxide and water vapour (LungsClear). The <b>liver</b> turns poisonous ammonia into urea and sends old-blood pigment out in <b>bile</b> (LiverClear). The <b>large intestine</b> carries that bile and the leftovers of food out as stool (IntestineClear). And the <b>skin</b> loses water and a little salt in <b>sweat</b> (SkinClear).</p>
    <p class="tip"><b>Try it:</b> take it apart to see the urinary tract on one side and the other exits on the other. Switch between the female and male urethra, and click an organ to find its own box.</p>`,
  terms: [
    { t: 'Excretion', d: 'Getting rid of waste that your own cells made, such as carbon dioxide, urea and extra salt.' },
    { t: 'Kidney', d: 'A fist-sized, bean-shaped organ that filters blood and makes urine. You have two.' },
    { t: 'Ureter', d: 'A thin muscular tube, about 25–30 cm long, that carries urine from a kidney to the bladder.' },
    { t: 'Bladder', d: 'A stretchy muscular bag that stores urine, about 400–600 mL in an adult.' },
    { t: 'Urethra', d: 'The tube that carries urine out of the bladder: about 4 cm in women, about 20 cm in men.' },
    { t: 'Prostate', d: 'A walnut-sized gland in men that wraps around the urethra just below the bladder.' },
  ],
  defaults: { explode: 0, xray: true, others: true, male: 'f', flow: true, labels: true },
  controls: [
    { key: 'explode', type: 'range', label: 'Take it apart', min: 0, max: 1, step: 0.01, ends: ['together', 'urinary | other exits'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'xray', type: 'toggle', label: 'X-ray: see through the skin' },
    { key: 'others', type: 'toggle', label: 'Show the other exits (lungs, liver, gut)' },
    { key: 'male', type: 'seg', label: 'Urethra', options: [{ v: 'f', label: 'Female' }, { v: 'm', label: 'Male' }], fmt: (v) => (v === 'm' ? 'about 20 cm, through the prostate' : 'about 4 cm') },
    { key: 'flow', type: 'toggle', label: 'Show urine moving' },
    { key: 'labels', type: 'toggle', label: 'Labels' },
  ],
  quiz: [
    { q: 'Which of these is NOT one of the body’s ways of getting rid of waste?', options: ['Breathing out', 'Sweating', 'Making urine', 'Pumping blood'], answer: 3, why: 'The heart moves blood around, but it doesn’t remove anything. The lungs, skin, kidneys and gut (with the liver) do.' },
    { q: 'What do the ureters do?', options: ['Store urine', 'Carry urine from the kidneys to the bladder', 'Carry blood to the kidneys', 'Make urine'], answer: 1, why: 'Each ureter is a thin muscular tube that squeezes urine down to the bladder in little waves.' },
    { q: 'Why is the urethra different in men and women?', options: ['It isn’t', 'It is about 4 cm in women and about 20 cm in men, passing through the prostate', 'Women have two', 'Men’s is shorter'], answer: 1, why: 'The short female urethra is one reason bladder infections are more common in women.' },
  ],
  reel: [
    { ms: 5400, caption: 'Your body gets rid of waste four ways: urine, breath, sweat and stool.', set: { explode: 0, xray: false, others: true, male: 'f', flow: true, labels: false }, view: { pos: [0.4, 10.6, 15], target: [0, 9.6, 0] }, spin: 0.5 },
    { ms: 5600, caption: 'The kidneys make urine, and the lungs, liver, gut and skin share the rest of the work.', set: { xray: true, others: true, flow: true, labels: false }, anim: { explode: [0, 1] }, view: { pos: [0, 10.2, 17], target: [0, 9.8, 0] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const body = makeBody(stage);
    root.add(body.root);
    const sides = sideLabels(stage, root, 7.2, 3.0, 1.4);
    const pk = body.pickables;
    Object.values(pk).flat().forEach((m) => stage.pickables.push(m));
    const LINKS = [
      [pk.kidney, 'The kidneys filter your blood. <a href="/kidneyclear/">Open KidneyClear</a> to see a nephron at work.'],
      [pk.lungs, 'The lungs breathe out carbon dioxide. <a href="/lungsclear/">Open LungsClear</a>.'],
      [pk.liver, 'The liver makes urea and bile. <a href="/liverclear/">Open LiverClear</a>.'],
      [pk.colon, 'The large intestine carries bile pigment and leftovers out. <a href="/intestineclear/">Open IntestineClear</a>.'],
    ];
    let xr = 1, t = 0, lastToast = -9, vol = 120, wide = false;
    const HOME = this.view, WIDE = { pos: [-0.4, 10.4, 16], target: [-1.2, 9.8, 0] };
    const fit = fitNarrow(stage, { pos: [0, 10.8, 16], target: [0, 10.4, 0] });
    return compactReadout(stage, {
      pick(o) {
        if (t - lastToast < 1) return;
        const hit = LINKS.find(([ms]) => ms.includes(o));
        if (hit) { lastToast = t; toast(hit[1]); }
      },
      update(dt, s, time) {
        dt = Math.max(0, dt); t = time;
        xr += ((s.xray ? 1 : 0) - xr) * Math.min(1, dt * 5);
        body.setXray(xr);
        body.setExplode(s.explode);
        // Taking it apart needs a wider view (unless the viewer has orbited or a reel is running).
        const w2 = s.explode > 0.05;
        if (w2 !== wide && !stage.moved && !inReel() && stage.host.clientWidth >= 560) { wide = w2; const v = w2 ? WIDE : HOME; stage.setView(v.pos, v.target, 0.8); }
        body.setOthers(s.others);
        body.setMale(s.male === 'm');
        // The bladder slowly fills and empties (shown far faster than life).
        if (s.flow) { body.stepUrine(dt); vol += dt * 30; if (vol > 420) vol = 90; }
        body.setBladder(vol);
        body.G.urinary.children.forEach((c) => { if (c.isInstancedMesh) c.visible = s.flow; });
        // Skin glows a little so it reads as an organ too.
        body.skinMat.emissiveIntensity = s.others ? 0.08 + 0.05 * Math.sin(time * 2) : 0;
        const narrow = fit();
        body.showLabels(s.labels && !inReel(), narrow);
        sides.forEach((l) => { l.visible = s.labels && !narrow && s.explode < 0.3; });
      },
      readout: (s) => `<div class="big">Four ways out</div>
        <div class="row"><span>Kidneys → urine</span><b>about 1.5 L a day</b></div>
        <div class="row"><span>Lungs → carbon dioxide</span><b>about 1 kg a day</b></div>
        <div class="row"><span>Liver → bile → stool</span><b>old-blood pigment</b></div>
        <div class="row"><span>Skin → sweat</span><b>water and a little salt</b></div>
        <small>${s.male === 'm' ? 'Male urethra: about 20 cm, through the prostate.' : 'Female urethra: about 4 cm, short and straight.'} Bladder holds about 400–600 mL.</small>`,
    });
  },
};
