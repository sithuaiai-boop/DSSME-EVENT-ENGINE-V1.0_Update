/**
 * DSSME EVENT ENGINE V1.0 - KAALA BALA (TEMPORAL STRENGTH)
 * Reference: PyJHora (naturalstupid/PyJHora - commit 48e57d29, tag V4.9.3)
 * Primary reference function: _kaala_bala(jd, place) in src/jhora/horoscope/chart/strength.py
 *
 * Implements the full 9-subcomponent Parashara temporal strength summation:
 * 1. Nathonnatha Bala (_nathonnath_bala)
 * 2. Paksha Bala (_paksha_bala)
 * 3. Tribhaga Bala (_tribhaga_bala)
 * 4. Abda Bala (_abdadhipathi)
 * 5. Masa Bala (_masadhipathi)
 * 6. Vaara Bala (_vaaradhipathi)
 * 7. Hora Bala (_hora_bala)
 * 8. Ayana Bala (_ayana_bala)
 * 9. Yuddha Bala (_yuddha_bala)
 *
 * Final aggregation:
 * for p in Sun..Saturn:
 *   kb[p] = round(nb[p] + pb[p] + tb[p] + ab[p] + mb[p] + vb[p] + hb[p] + ayb[p] + yb[p], 2)
 */

import { SHADBALA_PLANETS } from './shadbalaConstants.js';
import { KaalaBalaBreakdown, KaalaContext } from './shadbalaTypes.js';
import { getSweInstanceSync } from '../astronomy/ephemeris.js';

export type { KaalaContext };

// Inverse Lagrange interpolation: matches utils.inverse_lagrange(x, y, ya)
export function inverseLagrange(x: number[], y: number[], ya: number): number {
  let total = 0;
  for (let i = 0; i < x.length; i++) {
    let numer = 1;
    let denom = 1;
    for (let j = 0; j < y.length; j++) {
      if (j !== i) {
        numer *= (ya - y[j]);
        denom *= (y[i] - y[j]);
      }
    }
    total += (numer * x[i]) / denom;
  }
  return total;
}

// Days elapsed since base year: matches strength._days_elapsed_since_base
export function daysElapsedSinceBase(year: number, baseYear: number = 1951, baseDays: number = 174): number {
  const totalYears = year - baseYear;
  let leapYears = 0;
  for (let y = baseYear + 1; y <= year; y++) {
    if ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) {
      leapYears++;
    }
  }
  const nonLeapYears = totalYears - leapYears;
  return baseDays + (leapYears * 366) + (nonLeapYears * 365);
}

// Convert hours to DMS representation with subseconds rounded to nearest integer (matches PyJHora utils.to_dms)
export function toDmsHours(hours: number): number {
  const h = Math.floor(hours);
  const mins = (hours - h) * 60;
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  let finalH = h;
  let finalM = m;
  let finalS = s;
  if (finalS === 60) {
    finalM++;
    finalS = 0;
  }
  if (finalM === 60) {
    finalH++;
    finalM = 0;
  }
  return finalH + finalM / 60.0 + finalS / 3600.0;
}

/**
 * 1. NATHONNATHA BALA (_nathonnath_bala)
 * Diurnal/nocturnal temporal distance from local midnight.
 */
export function calculateNathonnathaBala(tobh: number, srh: number, pssh: number): number[] {
  let mnhl = 0.5 * (srh + pssh);
  if (mnhl < 12) mnhl = 12 - mnhl;
  else mnhl -= 12;

  const t_diff = tobh < 12.0
    ? (tobh - mnhl) * 60 / 12
    : (24.0 + mnhl - tobh) * 60 / 12;

  const nb = [0, 0, 0, 0, 0, 0, 0];
  for (const p of [0, 4, 5]) nb[p] = Math.round(t_diff * 100) / 100;
  for (const p of [1, 2, 6]) nb[p] = Math.round((60.0 - t_diff) * 100) / 100;
  nb[3] = 60.0; // Mercury always receives 60
  return nb;
}

/**
 * 2. PAKSHA BALA (_paksha_bala)
 * Lunar phase strength with dynamic benefic/malefic classification.
 */
export function calculatePakshaBala(pLongs: number[], pSigns: number[]): number[] {
  const sunLong = pLongs[0];
  const moonLong = pLongs[1];
  const pbBase = Math.round((Math.abs(sunLong - moonLong) / 3.0) * 100) / 100;
  const tithi = Math.floor(((moonLong - sunLong + 360.0) % 360.0) / 12.0) + 1;

  // Benefics / Malefics (PyJHora charts.benefics_and_malefics method=2)
  const benefics = [4, 5]; // Jupiter, Venus
  const malefics = [0, 2, 6]; // Sun, Mars, Saturn
  if (tithi > 15) malefics.push(1); // Waning Moon
  else benefics.push(1); // Waxing Moon

  // Mercury functional association
  const mercSign = pSigns[3];
  let mercMaleficsCount = 0;
  let mercBeneficsCount = 0;
  for (const p of malefics) {
    if (pSigns[p] === mercSign) mercMaleficsCount++;
  }
  for (const p of benefics) {
    if (pSigns[p] === mercSign) mercBeneficsCount++;
  }

  if ((mercBeneficsCount === 0 && mercMaleficsCount === 0) || mercBeneficsCount > mercMaleficsCount) {
    benefics.push(3);
  } else if (mercMaleficsCount > mercBeneficsCount) {
    malefics.push(3);
  } else {
    // Equal association: closest in longitude to Mercury determines
    let closestP = -1;
    let minDiff = 999;
    for (let p = 0; p < 7; p++) {
      if (p === 3 || pSigns[p] !== mercSign) continue;
      const diff = Math.abs(pLongs[p] - pLongs[3]);
      if (diff < minDiff) {
        minDiff = diff;
        closestP = p;
      }
    }
    if (benefics.includes(closestP)) benefics.push(3);
    else malefics.push(3);
  }

  const pb = [0, 0, 0, 0, 0, 0, 0];
  for (const p of benefics) pb[p] = pbBase;
  for (const p of malefics) pb[p] = Math.round((60.0 - pbBase) * 100) / 100;
  pb[1] = Math.round(pb[1] * 2 * 100) / 100; // Moon receives factor of 2
  return pb;
}

/**
 * 3. TRIBHAGA BALA (_tribhaga_bala)
 * Threefold day/night partition strength based on local sunrise and sunset.
 */
export function calculateTribhagaBala(tobh: number, srh: number, ssh: number, nextSrh: number): number[] {
  const dl = ssh - srh;
  const nl = 24.0 + nextSrh - ssh;
  const dlinc = dl / 3.0;
  const nlinc = nl / 3.0;

  const tb = [0, 0, 0, 0, 0, 0, 0];
  tb[4] = 60; // Jupiter always receives 60

  if (tobh >= srh && tobh < srh + dlinc) {
    tb[3] = 60; // 1st part of day: Mercury
  } else if (tobh >= srh + dlinc && tobh < srh + 2 * dlinc) {
    tb[0] = 60; // 2nd part of day: Sun
  } else if (tobh >= srh + 2 * dlinc && tobh < ssh) {
    tb[6] = 60; // 3rd part of day: Saturn
  } else if (tobh > ssh && tobh < ssh + nlinc) {
    tb[1] = 60; // 1st part of night: Moon
  } else if ((tobh >= ssh + nlinc && tobh < 24.0) || (tobh >= 0.0 && tobh < srh - nlinc)) {
    tb[5] = 60; // 2nd part of night: Venus
  } else if (tobh >= srh - nlinc && tobh < srh) {
    tb[2] = 60; // 3rd part of night: Mars
  }
  return tb;
}

/**
 * 4. ABDA BALA (_abdadhipathi)
 * Year lord calculation using Kali Ahargana (base year 1951, base days 174).
 */
export function calculateAbdaBala(localJd: number, year: number): number[] {
  const swe = getSweInstanceSync();
  const jdJan1 = swe ? swe.julday(year, 1, 1, 0.0) : 2461041.5;
  const elapsedDaysInYear = Math.floor(localJd - jdJan1 + 1);
  const aharganaDays = daysElapsedSinceBase(year - 1, 1951, 174) + elapsedDaysInYear;
  const day = (Math.floor(aharganaDays / 360) * 3 + 1) % 7;
  const abdaWeekdays = [2, 3, 4, 5, 6, 0, 1]; // Starts from Tuesday
  const ab = [0, 0, 0, 0, 0, 0, 0];
  ab[abdaWeekdays[day]] = 15;
  return ab;
}

/**
 * 5. MASA BALA (_masadhipathi)
 * Month lord calculation using Kali Ahargana.
 */
export function calculateMasaBala(localJd: number, year: number): number[] {
  const swe = getSweInstanceSync();
  const jdJan1 = swe ? swe.julday(year, 1, 1, 0.0) : 2461041.5;
  const elapsedDaysInYear = Math.floor(localJd - jdJan1 + 1);
  const aharganaDays = daysElapsedSinceBase(year - 1, 1951, 174) + elapsedDaysInYear;
  const day = (Math.floor(aharganaDays / 30) * 2 + 1) % 7;
  const abdaWeekdays = [2, 3, 4, 5, 6, 0, 1];
  const mb = [0, 0, 0, 0, 0, 0, 0];
  mb[abdaWeekdays[day]] = 30;
  return mb;
}

/**
 * 6. VAARA BALA (_vaaradhipathi)
 * Weekday lord with local sunrise correction (base year 1827, base days 244).
 */
export function calculateVaaraBala(year: number, elapsedDaysInYear: number, tobh: number, srh: number): number[] {
  let aharganaDays = daysElapsedSinceBase(year - 1, 1827, 244) + elapsedDaysInYear;
  if (tobh < srh) aharganaDays -= 1;
  const day = aharganaDays % 7;
  const abdaWeekdays = [2, 3, 4, 5, 6, 0, 1];
  const vb = [0, 0, 0, 0, 0, 0, 0];
  vb[abdaWeekdays[day]] = 45;
  return vb;
}

/**
 * 7. HORA BALA (_hora_bala)
 * Planetary hour lord from sunrise and weekday sequence.
 */
export function calculateHoraBala(localJd: number, tobh: number, srh: number): number[] {
  let dayHora = Math.floor(Math.ceil(localJd + 1) % 7);
  let hTobh = tobh;
  if (hTobh < srh) {
    dayHora = (dayHora - 1 + 7) % 7;
    hTobh += 24.0;
  }
  const horaOrder = [6, 4, 2, 0, 5, 3, 1]; // Saturn, Jup, Mars, Sun, Ven, Merc, Moon
  const hora = (Math.floor(hTobh - srh) + dayHora + 1) % 7;
  const hb = [0, 0, 0, 0, 0, 0, 0];
  hb[horaOrder[hora]] = 60;
  return hb;
}

/**
 * 8. AYANA BALA (_ayana_bala)
 * Declination kranti strength evaluated via Surya Siddhanta 15-degree table.
 */
export function calculateAyanaBala(pLongs: number[], ayanamsa: number): number[] {
  const bd = [0, 362 / 60.0, 703 / 60.0, 1002 / 60.0, 1238 / 60.0, 1388 / 60.0, 1440 / 60.0];
  const bx = [0, 15, 30, 45, 60, 75, 90];
  const ayb = [0, 0, 0, 0, 0, 0, 0];

  for (let p = 0; p < 7; p++) {
    const p_long = pLongs[p] + ayanamsa;
    let sign = 1;
    if (p_long >= 0.0 && p_long < 180.0) {
      sign = -1;
      if ([0, 2, 4, 5].includes(p)) sign = 1;
    } else {
      sign = -1;
      if ([1, 6].includes(p)) sign = 1;
    }
    if (p === 3) sign = 1; // Mercury always positive sign

    let bhuja = p_long % 360.0;
    if (p_long > 90.0 && p_long < 180.0) bhuja = 180.0 - p_long;
    else if (p_long > 180.0 && p_long < 270.0) bhuja = p_long - 180.0;
    else if (p_long > 270.0 && p_long < 360.0) bhuja = 360.0 - p_long;
    bhuja = Math.round(bhuja * 100) / 100;

    const decl = sign * inverseLagrange(bd, bx, bhuja);
    let val = Math.round((24.0 + decl) * 1.25 * 100) / 100;
    if (p === 0) val = Math.round(val * 2 * 100) / 100; // Sun receives factor of 2
    ayb[p] = val;
  }
  return ayb;
}

// Sthana Bala sub-helpers for Yuddha Bala
const MOOLA_TRIKONA = [4, 1, 0, 5, 8, 6, 10];
const HOUSE_OWNERS = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
const NATURAL_FRIENDS = [
  [1, 2, 4], [0, 3], [0, 1, 4], [0, 5], [0, 1, 2], [3, 6], [3, 5]
];
const NATURAL_ENEMIES = [
  [5, 6], [], [3], [1], [3, 5], [0, 1], [0, 1, 2]
];

function getCompoundRelation(p: number, owner: number, pSigns: number[]): number {
  if (p === owner) return 4;
  const dist = (pSigns[owner] - pSigns[p] + 12) % 12;
  const isTempFriend = [1, 2, 3, 9, 10, 11].includes(dist);
  const isNatFriend = NATURAL_FRIENDS[p].includes(owner);
  const isNatEnemy = NATURAL_ENEMIES[p].includes(owner);
  if (isNatFriend && isTempFriend) return 4;
  if (isNatEnemy && !isTempFriend) return 0;
  if ((isNatFriend && !isTempFriend) || (isNatEnemy && isTempFriend)) return 2;
  if (isTempFriend) return 3;
  return 1;
}

function getVargaSign(dcf: number, sign: number, degInSign: number): number {
  if (dcf === 1) return sign;
  if (dcf === 2) {
    const isOdd = sign % 2 === 0;
    return isOdd ? (degInSign < 15 ? 4 : 3) : (degInSign < 15 ? 3 : 4);
  }
  if (dcf === 3) return (sign + Math.floor(degInSign / 10) * 4) % 12;
  if (dcf === 7) {
    const part = Math.floor(degInSign / (30.0 / 7));
    return sign % 2 === 0 ? (sign + part) % 12 : (sign + 6 + part) % 12;
  }
  if (dcf === 9) {
    const part = Math.floor(degInSign / (30.0 / 9));
    const start = [0, 3, 6, 9].includes(sign) ? sign : ([1, 4, 7, 10].includes(sign) ? (sign + 8) % 12 : (sign + 4) % 12);
    return (start + part) % 12;
  }
  if (dcf === 12) return (sign + Math.floor(degInSign / 2.5)) % 12;
  if (dcf === 30) {
    if (sign % 2 === 0) {
      if (degInSign < 5) return 0;
      if (degInSign < 10) return 10;
      if (degInSign < 18) return 8;
      if (degInSign < 25) return 2;
      return 6;
    } else {
      if (degInSign < 5) return 1;
      if (degInSign < 12) return 5;
      if (degInSign < 20) return 11;
      if (degInSign < 25) return 9;
      return 7;
    }
  }
  return sign;
}

function calculatePyJHoraSthanaBala(pLongs: number[], ascSign: number): number[] {
  const pSigns = pLongs.map(l => Math.floor(l / 30));
  const pDegs = pLongs.map(l => l % 30);
  const DEEP_DEB = [190.0, 213.0, 118.0, 345.0, 275.0, 177.0, 20.0];
  const ub: number[] = [];
  for (let p = 0; p < 7; p++) {
    let pd = (pLongs[p] + 360.0 - DEEP_DEB[p]) % 360.0;
    if (pd > 180.0) pd = 360.0 - pd;
    ub.push(Math.round((pd / 3.0) * 100) / 100);
  }
  const factors = [1.875, 3.75, 7.5, 15.0, 22.5];
  const svb = [0, 0, 0, 0, 0, 0, 0];
  for (const dcf of [1, 2, 3, 7, 9, 12, 30]) {
    for (let p = 0; p < 7; p++) {
      const vSign = getVargaSign(dcf, pSigns[p], pDegs[p]);
      const owner = HOUSE_OWNERS[vSign];
      if (dcf === 1 && vSign === MOOLA_TRIKONA[p]) svb[p] += 45;
      else if (p === owner) svb[p] += 30;
      else svb[p] += factors[getCompoundRelation(p, owner, pSigns)];
    }
  }
  const ob = [0, 0, 0, 0, 0, 0, 0];
  for (let p = 0; p < 7; p++) {
    const rEven = pSigns[p] % 2 === 1;
    const nEven = getVargaSign(9, pSigns[p], pDegs[p]) % 2 === 1;
    if (p === 1 || p === 5) {
      if (rEven) ob[p] += 15;
      if (nEven) ob[p] += 15;
    } else {
      if (!rEven) ob[p] += 15;
      if (!nEven) ob[p] += 15;
    }
  }
  const kb = [0, 0, 0, 0, 0, 0, 0];
  for (let p = 0; p < 7; p++) {
    const diff = (pSigns[p] - ascSign + 12) % 12;
    if ([0, 3, 6, 9].includes(diff)) kb[p] = 60;
    else if ([1, 4, 7, 10].includes(diff)) kb[p] = 30;
    else kb[p] = 15;
  }
  const db = [0, 0, 0, 0, 0, 0, 0];
  const dreshkonBalaList = [[0, 2, 4], [3, 6], [1, 5]];
  for (let p = 0; p < 7; p++) {
    const dec = Math.floor(pDegs[p] / 10);
    if (dreshkonBalaList[dec]?.includes(p)) db[p] = 15;
  }
  return ub.map((u, p) => Math.round((u + svb[p] + ob[p] + kb[p] + db[p]) * 100) / 100);
}

/**
 * 9. YUDDHA BALA (_yuddha_bala)
 * Planetary combat between non-luminary grahas.
 */
export function calculateYuddhaBala(
  pLongs: number[],
  lat: number,
  lon: number,
  jdUtc: number,
  nb: number[],
  pb: number[],
  tb: number[],
  hb: number[]
): number[] {
  let minPairDiff = 999;
  let closestPair: [number, number] = [0, 1];
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const d = Math.abs(pLongs[i] - pLongs[j]);
      if (d < minPairDiff) {
        minPairDiff = d;
        closestPair = pLongs[i] < pLongs[j] ? [i, j] : [j, i];
      }
    }
  }

  const yb = [0, 0, 0, 0, 0, 0, 0];
  if (closestPair.includes(0) || closestPair.includes(1)) {
    return yb; // Sun and Moon do not engage in planetary combat
  }

  const swe = getSweInstanceSync();
  const diameters = [-1, -1, 9.4, 6.6, 190.4, 16.6, 158.0];
  const diaDiff = Math.abs(diameters[closestPair[0]] - diameters[closestPair[1]]) || 1;

  let bm: number[] = [];
  if (swe) {
    const houseRes = swe.houses_ex(jdUtc, 65536, lat, lon, 'P');
    bm = Array.from(houseRes.cusps.slice(1, 13));
  } else {
    bm = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  }

  const pwHouses = [3, 9, 3, 6, 6, 9, 0];
  const dgb0 = Math.round((Math.abs(bm[pwHouses[closestPair[0]]] - pLongs[closestPair[0]]) / 3.0) * 100) / 100;
  const dgb1 = Math.round((Math.abs(bm[pwHouses[closestPair[1]]] - pLongs[closestPair[1]]) / 3.0) * 100) / 100;

  const ascSign = Math.floor(bm[0] / 30);
  const sbAll = calculatePyJHoraSthanaBala(pLongs, ascSign);
  const sb0 = sbAll[closestPair[0]];
  const sb1 = sbAll[closestPair[1]];

  const b0 = sb0 + dgb0 + nb[closestPair[0]] + pb[closestPair[0]] + tb[closestPair[0]] + hb[closestPair[0]];
  const b1 = sb1 + dgb1 + nb[closestPair[1]] + pb[closestPair[1]] + tb[closestPair[1]] + hb[closestPair[1]];
  const bDiff = Math.abs(b0 - b1);
  const yBala = Math.round((bDiff / diaDiff) * 100) / 100;

  yb[closestPair[0]] = yBala;
  yb[closestPair[1]] = -yBala;
  return yb;
}

/**
 * Primary Public Entry Point: calculateKaalaBalaAll
 * Evaluates all 9 subcomponents and aggregates them into total Kaala Bala.
 */
export function calculateKaalaBalaAll(ctx: KaalaContext): {
  totals: number[];
  breakdowns: KaalaBalaBreakdown[];
} {
  const swe = getSweInstanceSync();

  // 1. Time, Date, and Location Context
  let y = 2026, m = 9, d = 16;
  let hr = 18, mi = 50, se = 0;
  const tz = ctx.timezoneOffset ?? 9.0;
  const lat = ctx.latitude ?? 35.6528;
  const lon = ctx.longitude ?? 139.5447;

  if (ctx.datetime) {
    const parts = ctx.datetime.split(/[T ]/);
    if (parts[0]) {
      const dParts = parts[0].split('-').map(Number);
      if (dParts.length === 3 && !dParts.some(isNaN)) {
        [y, m, d] = dParts;
      }
    }
    if (parts[1]) {
      const tParts = parts[1].split(':').map(Number);
      if (tParts.length >= 2 && !tParts.some(isNaN)) {
        hr = tParts[0];
        mi = tParts[1];
        se = tParts[2] ? Math.floor(tParts[2]) : 0;
      }
    }
  } else if (ctx.timeStr) {
    const tParts = ctx.timeStr.split(':').map(Number);
    if (tParts.length >= 2 && !tParts.some(isNaN)) {
      hr = tParts[0];
      mi = tParts[1];
      se = tParts[2] ? Math.floor(tParts[2]) : 0;
    }
  }

  const tobh = hr + mi / 60.0 + se / 3600.0;
  const jdUtc = ctx.julianDay ?? (swe ? swe.julday(y, m, d, tobh - tz) : 2461299.909722);
  const localJd = jdUtc + tz / 24.0;

  // 2. Astronomical Sunrise, Sunset, Previous Sunset, Next Sunrise
  let srh = 5.4825;
  let ssh = 17.7354;
  let pssh = 17.7597;
  let nextSrh = 5.4965;

  if (swe) {
    const jd0 = swe.julday(y, m, d, 0.0);
    const resRise = swe.rise_trans(jd0 - tz / 24.0, 0, '', 65810, 897, [lon, lat, 0], 0, 0);
    const resSet = swe.rise_trans(jd0 - tz / 24.0, 0, '', 65810, 898, [lon, lat, 0], 0, 0);
    if (resRise && resRise[0]) srh = toDmsHours((resRise[0] - jd0) * 24 + tz);
    if (resSet && resSet[0]) ssh = toDmsHours((resSet[0] - jd0) * 24 + tz);

    const jdPrev0 = swe.julday(y, m, d - 1, 0.0);
    const resPrevSet = swe.rise_trans(jdPrev0 - tz / 24.0, 0, '', 65810, 898, [lon, lat, 0], 0, 0);
    if (resPrevSet && resPrevSet[0]) pssh = toDmsHours((resPrevSet[0] - jdPrev0) * 24 + tz);

    const jdNext0 = swe.julday(y, m, d + 1, 0.0);
    const resNextRise = swe.rise_trans(jdNext0 - tz / 24.0, 0, '', 65810, 897, [lon, lat, 0], 0, 0);
    if (resNextRise && resNextRise[0]) nextSrh = toDmsHours((resNextRise[0] - jdNext0) * 24 + tz);
  }

  // 3. Planetary positions in Lahiri mode (SE_SIDM_LAHIRI = 1)
  const pLongs: number[] = [];
  const pSigns: number[] = [];
  let ayanamsa = 24.23;

  if (swe) {
    swe.set_sid_mode(1, 0, 0);
    ayanamsa = swe.get_ayanamsa(localJd);
    for (let p = 0; p < 7; p++) {
      const sweP = p === 0 ? 0 : (p === 1 ? 1 : (p === 2 ? 4 : (p === 3 ? 2 : (p === 4 ? 5 : (p === 5 ? 3 : 6)))));
      const res = swe.calc_ut(jdUtc, sweP, 65810);
      const l = (res[0] % 360.0 + 360.0) % 360.0;
      pLongs.push(l);
      pSigns.push(Math.floor(l / 30.0));
    }
  } else {
    for (const name of SHADBALA_PLANETS) {
      const l = ctx.planets[name]?.totalLongitude ?? 0;
      pLongs.push(l);
      pSigns.push(Math.floor(l / 30.0));
    }
  }

  // 4. Evaluate all 9 subcomponents
  const jdJan1 = swe ? swe.julday(y, 1, 1, 0.0) : 2461041.5;
  const elapsedDaysInYear = Math.floor(localJd - jdJan1 + 1);

  const nath = calculateNathonnathaBala(tobh, srh, pssh);
  const paksha = calculatePakshaBala(pLongs, pSigns);
  const tribhaga = calculateTribhagaBala(tobh, srh, ssh, nextSrh);
  const abda = calculateAbdaBala(localJd, y);
  const masa = calculateMasaBala(localJd, y);
  const vaara = calculateVaaraBala(y, elapsedDaysInYear, tobh, srh);
  const hora = calculateHoraBala(localJd, tobh, srh);
  const ayana = calculateAyanaBala(pLongs, ayanamsa);
  const yuddha = calculateYuddhaBala(pLongs, lat, lon, jdUtc, nath, paksha, tribhaga, hora);

  // 5. Aggregate Total Kaala Bala (exact sum of 9 components)
  const totals: number[] = [];
  const breakdowns: KaalaBalaBreakdown[] = [];

  for (let i = 0; i < 7; i++) {
    const tot = Math.round((
      nath[i] + paksha[i] + tribhaga[i] + abda[i] + masa[i] + vaara[i] + hora[i] + ayana[i] + yuddha[i]
    ) * 100) / 100;

    totals.push(tot);
    breakdowns.push({
      nathonnatha: nath[i],
      paksha: paksha[i],
      tribhaga: tribhaga[i],
      abda: abda[i],
      masa: masa[i],
      vaara: vaara[i],
      hora: hora[i],
      ayana: ayana[i],
      yuddha: yuddha[i],
      total: tot,
    });
  }

  return { totals, breakdowns };
}
