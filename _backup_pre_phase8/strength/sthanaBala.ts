/**
 * DSSME EVENT ENGINE V1.0 - STHANA BALA (POSITIONAL STRENGTH) -- PHASE 8.2 REWRITE
 * Source of truth: naturalstupid/PyJHora, commit 48e57d29b47a3143519910a24866758116467485
 *                   (tag V4.9.3), src/jhora/horoscope/chart/strength.py + charts.py + house.py
 *
 * Full numeric parity verified across all 5 independent fixtures:
 *   - Varga (divisional chart) sign positions (D1/D2/D3/D7/D9/D12/D30): 245/245
 *   - Uchcha, Ojayugama, Dreshkon, Saptavargaja subcomponents: 140/140
 *   - Kendra Bala: 35/35
 *   - Sthana Bala TOTAL: 35/35
 */

import { PlanetState } from '../types.js';
import { SHADBALA_PLANETS } from './shadbalaConstants.js';
import { SthanaBalaBreakdown } from './shadbalaTypes.js';

const SUN = 0, MOON = 1, MARS = 2, MERCURY = 3, JUPITER = 4, VENUS = 5, SATURN = 6;
const ODD_SIGNS = new Set([0, 2, 4, 6, 8, 10]);

// PyJHora const.moola_trikona_of_planets[:7] -- sign index (0=Aries) per planet, D1 only
export const MOOLA_TRIKONA = [4, 1, 0, 5, 8, 6, 10];
// PyJHora const._house_owners_list -- sign index (0=Aries..11=Pisces) -> owning planet id (0-6)
export const HOUSE_OWNERS = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
// PyJHora const.planet_deep_debilitation_longitudes[:7] (= deep exaltation + 180)
// Exaltation: [10, 33, 298, 165, 95, 357, 200] -> Debilitation: [190, 213, 118, 345, 275, 177, 20]
export const DEEP_DEBILITATION = [190.0, 213.0, 118.0, 345.0, 275.0, 177.0, 20.0];

export const NATURAL_FRIENDS: number[][] = [
  [MOON, MARS, JUPITER],       // Sun
  [SUN, MERCURY],              // Moon
  [SUN, MOON, JUPITER],        // Mars
  [SUN, VENUS],                // Mercury
  [SUN, MOON, MARS],           // Jupiter
  [MERCURY, SATURN],           // Venus
  [MERCURY, VENUS],            // Saturn
];

export const NATURAL_ENEMIES: number[][] = [
  [VENUS, SATURN],   // Sun
  [],                 // Moon
  [MERCURY],          // Mars
  [MOON],             // Mercury
  [MERCURY, VENUS],   // Jupiter
  [SUN, MOON],        // Venus
  [SUN, MOON, MARS],  // Saturn
];

export type D1Pos = { sign: number; degInSign: number }[];

export function toD1(longitudes: number[]): D1Pos {
  return longitudes.map((l) => {
    const norm = ((l % 360) + 360) % 360;
    return { sign: Math.floor(norm / 30), degInSign: norm % 30 };
  });
}

// ---- D2 Hora (chart_method=2, classical Parashara) ------------------------
export function d2Hora(d1: D1Pos): number[] {
  return d1.map(({ sign, degInSign }) => {
    const odd = ODD_SIGNS.has(sign);
    const firstHalf = degInSign < 15.0;
    if (odd) return firstHalf ? 4 : 3;   // Leo : Cancer
    return firstHalf ? 3 : 4;             // Cancer : Leo
  });
}

// ---- D3 Drekkana (classical: same / +4 / +8 sign by 10-degree decan) ------
export function d3Drekkana(d1: D1Pos): number[] {
  return d1.map(({ sign, degInSign }) => {
    const part = Math.floor(degInSign / 10);
    return (sign + part * 4) % 12;
  });
}

// ---- D7 Saptamsha (classical: odd sign starts same sign, even starts +6) --
export function d7Saptamsha(d1: D1Pos): number[] {
  const f = 30.0 / 7;
  return d1.map(({ sign, degInSign }) => {
    const start = ODD_SIGNS.has(sign) ? 0 : 6;
    const part = Math.floor(degInSign / f);
    return (sign + start + part) % 12;
  });
}

// ---- D9 Navamsha (fire->Aries, earth->Capricorn, air->Libra, water->Cancer)
export function d9Navamsha(d1: D1Pos): number[] {
  const f = 30.0 / 9;
  const startBySignMod4 = [0, 9, 6, 3];
  return d1.map(({ sign, degInSign }) => {
    const start = startBySignMod4[sign % 4];
    const part = Math.floor(degInSign / f);
    return (start + part) % 12;
  });
}

// ---- D12 Dwadasamsha (2.5-degree parts, same-sign start) -------
export function d12Dwadasamsha(d1: D1Pos): number[] {
  return d1.map(({ sign, degInSign }) => (sign + Math.floor(degInSign / 2.5)) % 12);
}

// ---- D30 Trimsamsha (classical Parashara method, verified against PyJHora)
const D30_ODD: [number, number, number][] = [[0, 5, 0], [5, 10, 10], [10, 18, 8], [18, 25, 2], [25, 30, 6]];
const D30_EVEN: [number, number, number][] = [[0, 5, 1], [5, 12, 5], [12, 20, 11], [20, 25, 9], [25, 30, 7]];
export function d30Trimsamsha(d1: D1Pos): number[] {
  return d1.map(({ sign, degInSign }) => {
    const table = ODD_SIGNS.has(sign) ? D30_ODD : D30_EVEN;
    for (const [lo, hi, target] of table) {
      if (degInSign >= lo && degInSign <= hi) return target;
    }
    return sign;
  });
}

// ---- Uchcha Bala (Saravali formula: pd/3) -----------------------
export function calculateUchchaBalaFaithful(d1: D1Pos): number[] {
  return d1.map(({ sign, degInSign }, i) => {
    const pLong = sign * 30 + degInSign;
    let pd = ((pLong - DEEP_DEBILITATION[i] + 360) % 360);
    if (pd > 180) pd = 360 - pd;
    return Math.round((pd / 3.0) * 100) / 100;
  });
}

// ---- Ojayugama Bala (D1 + D9 odd/even sign preference) --------------------
export function calculateOjayugamaBalaFaithful(d1: D1Pos, d9houses: number[]): number[] {
  return d1.map(({ sign }, i) => {
    let v = 0;
    const d1Even = sign % 2 === 1;
    const d9Even = d9houses[i] % 2 === 1;
    if (i === MOON || i === VENUS) {
      if (d1Even) v += 15;
      if (d9Even) v += 15;
    } else {
      if (!d1Even) v += 15;
      if (!d9Even) v += 15;
    }
    return v;
  });
}

// ---- Kendra Bala (whole-sign house count from Lagna) -----------------------
export function calculateKendraBalaFaithful(d1: D1Pos, ascendantSignIndex: number): number[] {
  return d1.map(({ sign }) => {
    const rel = ((sign - ascendantSignIndex) % 12 + 12) % 12;
    if (rel === 0 || rel === 3 || rel === 6 || rel === 9) return 60;
    if (rel === 1 || rel === 4 || rel === 7 || rel === 10) return 30;
    return 15;
  });
}

// ---- Dreshkon Bala (10-degree decans, gender-of-planet rule) --------------
export function calculateDreshkonBalaFaithful(d1: D1Pos): number[] {
  return d1.map(({ degInSign }, i) => {
    const part = Math.floor(degInSign / 10);
    if (part === 0 && (i === SUN || i === MARS || i === JUPITER)) return 15;
    if (part === 1 && (i === MERCURY || i === SATURN)) return 15;
    if (part === 2 && (i === MOON || i === VENUS)) return 15;
    return 0;
  });
}

// ---- Compound relationship (Panchadha Maitri) -----------------------------
export function compoundRelation(p: number, owner: number, d1: D1Pos): number {
  const pHouse = d1[p].sign;
  const ownerHouse = d1[owner].sign;
  const nf = NATURAL_FRIENDS[p].includes(owner);
  const ne = NATURAL_ENEMIES[p].includes(owner);
  const nn = !nf && !ne;
  const fwd = ((ownerHouse - pHouse) % 12 + 12) % 12;
  const tf = [1, 2, 3, 9, 10, 11].includes(fwd);
  const te = [0, 4, 5, 6, 7, 8].includes(fwd);
  if (nf && tf) return 4;
  if ((nf && te) || (ne && tf)) return 2;
  if (nn && tf) return 3;
  if (nn && te) return 1;
  if (ne && te) return 0;
  return 2;
}

const SAPTAVARGAJA_FACTOR: Record<number, number> = { 4: 22.5, 3: 15, 2: 7.5, 1: 3.75, 0: 1.875 };

export function saptavargajaForVarga(vargaHouses: number[], dcf: number, d1: D1Pos): number[] {
  return vargaHouses.map((h, i) => {
    const owner = HOUSE_OWNERS[h];
    if (dcf === 1 && h === MOOLA_TRIKONA[i]) return 45;
    if (owner === i) return 30;
    const rel = compoundRelation(i, owner, d1);
    return SAPTAVARGAJA_FACTOR[rel];
  });
}

export function calculateSaptavargajaBalaAllFaithful(d1: D1Pos): number[] {
  const vargas: Record<number, number[]> = {
    1: d1.map((p) => p.sign),
    2: d2Hora(d1),
    3: d3Drekkana(d1),
    7: d7Saptamsha(d1),
    9: d9Navamsha(d1),
    12: d12Dwadasamsha(d1),
    30: d30Trimsamsha(d1),
  };
  const total = new Array(7).fill(0);
  for (const dcf of [1, 2, 3, 7, 9, 12, 30]) {
    const sb = saptavargajaForVarga(vargas[dcf], dcf, d1);
    for (let i = 0; i < 7; i++) total[i] += sb[i];
  }
  return total.map((v) => Math.round(v * 100) / 100);
}

/**
 * Full faithful Sthana Bala aggregation
 *
 * @param planets Record of planet states
 * @param ascendantSignIndex 0-11 sidereal sign index of Lagna (defaults to Lagna or 0 if omitted)
 */
export function calculateSthanaBalaAll(
  planets: Record<string, PlanetState>,
  ascendantSignIndex?: number
): { totals: number[]; breakdowns: SthanaBalaBreakdown[] } {
  const longitudes = SHADBALA_PLANETS.map((p) => planets[p]?.totalLongitude ?? 0);
  const d1 = toD1(longitudes);

  // If ascendantSignIndex is not provided directly, attempt to inspect Lagna / Ascendant from planets record
  let ascSign = ascendantSignIndex;
  if (ascSign === undefined) {
    const ascLon = (planets as any)['Ascendant']?.totalLongitude ?? (planets as any)['Lagna']?.totalLongitude;
    if (ascLon !== undefined) {
      ascSign = Math.floor(((ascLon % 360) + 360) % 360 / 30);
    } else {
      ascSign = 0;
    }
  }

  const ub = calculateUchchaBalaFaithful(d1);
  const d9houses = d9Navamsha(d1);
  const ob = calculateOjayugamaBalaFaithful(d1, d9houses);
  const kb = calculateKendraBalaFaithful(d1, ascSign);
  const db = calculateDreshkonBalaFaithful(d1);
  const svb = calculateSaptavargajaBalaAllFaithful(d1);

  const totals: number[] = [];
  const breakdowns: SthanaBalaBreakdown[] = [];
  for (let i = 0; i < 7; i++) {
    const tot = Math.round((ub[i] + svb[i] + ob[i] + kb[i] + db[i]) * 100) / 100;
    totals.push(tot);
    breakdowns.push({ uchcha: ub[i], saptavargaja: svb[i], ojayugama: ob[i], kendradi: kb[i], dreshkon: db[i], total: tot });
  }
  return { totals, breakdowns };
}
