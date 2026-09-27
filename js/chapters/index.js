// The box and its chapters, in reading order.
import anatomy from './anatomy.js';
import wastes from './wastemap.js';
import urea from './urea.js';
import bladder from './bladder.js';
import weather from './weather.js';
import health from './health.js';

export const BOX = { slug: 'excretionclear', title: 'ExcretionClear' };
export const CHAPTERS = [anatomy, wastes, urea, bladder, weather, health];
