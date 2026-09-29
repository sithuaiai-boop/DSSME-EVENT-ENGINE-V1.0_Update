/**
 * Direct SwissEphemeris-based Sthana Bala Diagnostic Calculator
 * Reproducing PyJHora V4.9.3 Sthana Bala Component by Component
 * Fixture: Chofu, Japan (2026-09-16 18:50:00 JST)
 */

import { calculateEphemerisSnapshot } from './astronomy/ephemeris.js';

// Planets Sun (0) to Saturn (6)
export const PLANET_NAMES = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as const;

// Deep Debilitation Points (PyJHora const.planet_deep_debilitation_longitudes)
// Derived from Exaltation [10, 33, 298, 165, 95, 357, 200] + 180
export const DEEP_DEBILITATION = [190.0, 213.0, 118.0, 345.0, 275.0, 177.0, 20.0];

// Sign rulers for 12 signs (0=Aries to 11=Pisces)
// Aries: Mars(2), Taurus: Venus(5), Gemini: Mercury(3), Cancer: Moon(1),
// Leo: Sun(0), Virgo: Mercury(3), Libra: Venus(5), Scorpio: Mars(2),
// Sagittarius: Jupiter(4), Capricorn: Saturn(6), Aquarius: Saturn(6), Pisces: Jupiter(4)
export const HOUSE_OWNERS = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];

// Moolatrikona Signs (PyJHora const.moola_trikona_of_planets)
// Sun: Leo(4), Moon: Taurus(1), Mars: Aries(0), Mercury: Virgo(5),
// Jupiter: Sagittarius(8), Venus: Libra(6), Saturn: Aquarius(10)
export const MOOLA_TRIKONA_SIGNS = [4, 1, 0, 5, 8, 6, 10];

// Natural Relationships (PyJHora const._friendly_planets, _neutral_planets, _enemy_planets)
export const NATURAL_FRIENDS: number[][] = [
  [1, 2, 4],       // Sun: Moon, Mars, Jupiter
  [0, 3],          // Moon: Sun, Mercury
  [0, 1, 4],       // Mars: Sun, Moon, Jupiter
  [0, 5],          // Mercury: Sun, Venus
  [0, 1, 2],       // Jupiter: Sun, Moon, Mars
  [3, 6],          // Venus: Mercury, Saturn
  [3, 5],          // Saturn: Mercury, Venus
];

export const NATURAL_NEUTRALS: number[][] = [
  [3],             // Sun: Mercury
  [2, 4, 5, 6],    // Moon: Mars, Jupiter, Venus, Saturn
  [5, 6],          // Mars: Venus, Saturn
  [2, 4, 6],       // Mercury: Mars, Jupiter, Saturn
  [6],             // Jupiter: Saturn
  [2, 4],          // Venus: Mars, Jupiter
  [4],             // Saturn: Jupiter
];

export const NATURAL_ENEMIES: number[][] = [
  [5, 6],          // Sun: Venus, Saturn
  [],              // Moon: None
  [3],             // Mars: Mercury
  [1],             // Mercury: Moon
  [3, 5],          // Jupiter: Mercury, Venus
  [0, 1],          // Venus: Sun, Moon
  [0, 1, 2],       // Saturn: Sun, Moon, Mars
];

// Odd signs (0, 2, 4, 6, 8, 10), Even signs (1, 3, 5, 7, 9, 11)
export const ODD_SIGNS = [0, 2, 4, 6, 8, 10];
export const EVEN_SIGNS = [1, 3, 5, 7, 9, 11];

// Divisional Chart factors for Saptavargaja (PyJHora const.sapthavargaja_factors)
export const SAPTHAVARGAJA_FACTORS = [1, 2, 3, 7, 9, 12, 30] as const;

/**
 * Compute the 7 Varga Sign Placements for a given sidereal longitude
 */
export function getVargaSigns(lon: number): Record<number, number> {
  const normLon = (lon % 360 + 360) % 360;
  const rasiSign = Math.floor(normLon / 30);
  const deg = normLon % 30;

  // D1 (Rasi)
  const d1 = rasiSign;

  // D2 (Hora - Traditional Parasara Method 2: Leo & Cancer only)
  let d2 = 3; // Moon's Hora (Cancer)
  const l2 = Math.floor(deg / 15.0);
  if ((ODD_SIGNS.includes(rasiSign) && l2 === 0) || (EVEN_SIGNS.includes(rasiSign) && l2 === 1)) {
    d2 = 4; // Sun's Hora (Leo)
  }

  // D3 (Drekkana - Traditional Parasara)
  const l3 = Math.floor(deg / 10.0);
  const d3 = (rasiSign + l3 * 4) % 12;

  // D7 (Saptamsha - Traditional Parasara)
  const l7 = Math.floor(deg / (30.0 / 7.0));
  let d7 = (rasiSign + l7) % 12;
  if (EVEN_SIGNS.includes(rasiSign)) {
    d7 = (rasiSign + 6 + l7) % 12; // Start from 7th house (offset +6)
  }

  // D9 (Navamsha - Traditional Parasara)
  const l9 = Math.floor(deg / (30.0 / 9.0));
  let d9Seed = 0;
  if ([0, 4, 8].includes(rasiSign)) d9Seed = 0;       // Fire signs -> Aries
  else if ([1, 5, 9].includes(rasiSign)) d9Seed = 9;  // Earth signs -> Capricorn
  else if ([2, 6, 10].includes(rasiSign)) d9Seed = 6; // Air signs -> Libra
  else if ([3, 7, 11].includes(rasiSign)) d9Seed = 3; // Water signs -> Cancer
  const d9 = (d9Seed + l9) % 12;

  // D12 (Dwadasamsha - Traditional Parasara)
  const l12 = Math.floor(deg / 2.5);
  const d12 = (rasiSign + l12) % 12;

  // D30 (Trimsamsha - Traditional Parasara)
  let d30 = rasiSign;
  if (ODD_SIGNS.includes(rasiSign)) {
    if (deg < 5.0) d30 = 0;       // Aries (Mars)
    else if (deg < 10.0) d30 = 10; // Aquarius (Saturn)
    else if (deg < 18.0) d30 = 8;  // Sagittarius (Jupiter)
    else if (deg < 25.0) d30 = 2;  // Gemini (Mercury)
    else d30 = 6;                  // Libra (Venus)
  } else {
    if (deg < 5.0) d30 = 1;        // Taurus (Venus)
    else if (deg < 12.0) d30 = 5;  // Virgo (Mercury)
    else if (deg < 20.0) d30 = 11; // Pisces (Jupiter)
    else if (deg < 25.0) d30 = 9;  // Capricorn (Saturn)
    else d30 = 7;                  // Scorpio (Mars)
  }

  return { 1: d1, 2: d2, 3: d3, 7: d7, 9: d9, 12: d12, 30: d30 };
}

/**
 * Compound Relationship (Panchadha Maitri) Calculator
 * Based on PyJHora house._get_compound_relationships_of_planets
 */
export function computeCompoundRelationships(rasiSigns: number[]): number[][] {
  // Temporary friends: placed in 2nd, 3rd, 4th, 10th, 11th, 12th houses from planet (offsets: 1, 2, 3, 9, 10, 11)
  const tempFriendOffsets = [1, 2, 3, 9, 10, 11];
  const cr: number[][] = Array.from({ length: 7 }, () => Array(7).fill(2)); // default neutral

  for (let p = 0; p < 7; p++) {
    const pSign = rasiSigns[p];
    for (let p1 = 0; p1 < 7; p1++) {
      if (p === p1) continue;
      const p1Sign = rasiSigns[p1];
      const relHouse = (p1Sign - pSign + 12) % 12;
      const isTempFriend = tempFriendOffsets.includes(relHouse);

      const isNatFriend = NATURAL_FRIENDS[p].includes(p1);
      const isNatNeutral = NATURAL_NEUTRALS[p].includes(p1);
      const isNatEnemy = NATURAL_ENEMIES[p].includes(p1);

      if (isNatFriend && isTempFriend) {
        cr[p][p1] = 4; // Adhi Mitra (Great Friend) -> 22.5
      } else if ((isNatFriend && !isTempFriend) || (isNatEnemy && isTempFriend)) {
        cr[p][p1] = 2; // Sama (Neutral) -> 7.5
      } else if (isNatNeutral && isTempFriend) {
        cr[p][p1] = 3; // Mitra (Friend) -> 15.0
      } else if (isNatNeutral && !isTempFriend) {
        cr[p][p1] = 1; // Shatru (Enemy) -> 3.75
      } else if (isNatEnemy && !isTempFriend) {
        cr[p][p1] = 0; // Adhi Shatru (Great Enemy) -> 1.875
      }
    }
  }
  return cr;
}

/**
 * Saptavargaja Bala Points Table (PyJHora const sb_fac)
 * 4 (Adhi Mitra) -> 22.5
 * 3 (Mitra)      -> 15.0
 * 2 (Sama)       -> 7.5
 * 1 (Shatru)     -> 3.75
 * 0 (Adhi Shatru)-> 1.875
 */
export const SAPTA_FACTORS: Record<number, number> = {
  4: 22.5,
  3: 15.0,
  2: 7.5,
  1: 3.75,
  0: 1.875,
};

/**
 * Main Direct Sthana Calculator Function
 */
export async function calculateSthanaDebug(
  datetimeStr = '2026-09-16 18:50:00',
  lat = 35.6528,
  lon = 139.5447,
  tz = 9.0
) {
  const snap = await calculateEphemerisSnapshot(datetimeStr, lat, lon, tz);

  const pLongs = PLANET_NAMES.map((name) => snap.planets[name].longitude);
  const ascLon = snap.lagnaLongitude;
  const ascSign = Math.floor(ascLon / 30);

  // 1. Uchcha Bala
  // PyJHora: pd = (p_long + 360 - deb) % 360; if (pd > 180) pd = 360 - pd;
  // Saravali: pd / 3.0; PVR: pd / 180.0 * 20.0
  const uchchaSaravali: number[] = [];
  const uchchaPVR: number[] = [];
  for (let i = 0; i < 7; i++) {
    let pd = (pLongs[i] + 360.0 - DEEP_DEBILITATION[i]) % 360.0;
    if (pd > 180.0) pd = 360.0 - pd;
    uchchaSaravali.push(Math.round((pd / 3.0) * 100) / 100);
    uchchaPVR.push(Math.round(((pd / 180.0) * 20.0) * 100) / 100);
  }

  // 2. Varga Placements for all 7 planets
  const vargas = pLongs.map((lon) => getVargaSigns(lon));
  const rasiSigns = vargas.map((v) => v[1]);

  // Compound Relationships on Rasi Chart
  const cr = computeCompoundRelationships(rasiSigns);

  // Saptavargaja Bala Calculation
  const saptaScores: number[] = [];
  const saptaBreakdown: number[][] = []; // [planet][varga]

  for (let p = 0; p < 7; p++) {
    let pTotal = 0;
    const pVargaScores: number[] = [];
    for (const dcf of SAPTHAVARGAJA_FACTORS) {
      const h = vargas[p][dcf];
      const owner = HOUSE_OWNERS[h];

      let score = 0;
      if (h === MOOLA_TRIKONA_SIGNS[p] && dcf === 1) {
        score = 45.0; // Moolatrikona in D1
      } else if (owner === p) {
        score = 30.0; // Swakshetra (Own sign)
      } else {
        const rel = cr[p][owner];
        score = SAPTA_FACTORS[rel] ?? 7.5;
      }
      pTotal += score;
      pVargaScores.push(score);
    }
    saptaScores.push(Math.round(pTotal * 100) / 100);
    saptaBreakdown.push(pVargaScores);
  }

  // 3. Ojayugama Bala
  // Moon & Venus prefer even signs in D1 & D9 (+15 each)
  // Sun, Mars, Mercury, Jupiter, Saturn prefer odd signs in D1 & D9 (+15 each)
  const ojayugamaScores: number[] = [];
  for (let p = 0; p < 7; p++) {
    const rh = vargas[p][1]; // D1 sign
    const nh = vargas[p][9]; // D9 sign
    let score = 0;
    if (p === 1 || p === 5) {
      // Moon, Venus (prefer even)
      if (EVEN_SIGNS.includes(rh)) score += 15.0;
      if (EVEN_SIGNS.includes(nh)) score += 15.0;
    } else {
      // Sun, Mars, Merc, Jup, Sat (prefer odd)
      if (ODD_SIGNS.includes(rh)) score += 15.0;
      if (ODD_SIGNS.includes(nh)) score += 15.0;
    }
    ojayugamaScores.push(score);
  }

  // 4. Kendra Bala
  // PyJHora: Kendras (1, 4, 7, 10 from Lagna) = 60, Panapharas (2, 5, 8, 11) = 30, Apoklimas (3, 6, 9, 12) = 15
  const kendraScores: number[] = [];
  for (let p = 0; p < 7; p++) {
    const h = vargas[p][1];
    const rel = (h - ascSign + 12) % 12; // 0-indexed relative house
    if ([0, 3, 6, 9].includes(rel)) {
      kendraScores.push(60.0);
    } else if ([1, 4, 7, 10].includes(rel)) {
      kendraScores.push(30.0);
    } else {
      kendraScores.push(15.0);
    }
  }

  // 5. Dreshkona Bala
  // PyJHora const.dreshkon_bala_list = [(0,2,4), (3,6), (1,5)]
  // pd = int(long // 10.0)
  const dreshkonScores: number[] = [];
  for (let p = 0; p < 7; p++) {
    const deg = pLongs[p] % 30.0;
    const dec = Math.floor(deg / 10.0);
    let score = 0;
    if (dec === 0 && [0, 2, 4].includes(p)) score = 15.0; // 0-10 deg: Sun, Mars, Jup
    else if (dec === 1 && [3, 6].includes(p)) score = 15.0; // 10-20 deg: Merc, Sat
    else if (dec === 2 && [1, 5].includes(p)) score = 15.0; // 20-30 deg: Moon, Ven
    dreshkonScores.push(score);
  }

  // 6. Sthana Totals
  const sthanaTotalsSaravali = PLANET_NAMES.map((_, i) => {
    return Math.round((uchchaSaravali[i] + saptaScores[i] + ojayugamaScores[i] + kendraScores[i] + dreshkonScores[i]) * 100) / 100;
  });

  const sthanaTotalsPVR = PLANET_NAMES.map((_, i) => {
    return Math.round((uchchaPVR[i] + saptaScores[i] + ojayugamaScores[i] + kendraScores[i] + dreshkonScores[i]) * 100) / 100;
  });

  return {
    input: { datetimeStr, lat, lon, tz },
    ascendant: { longitude: ascLon, sign: ascSign },
    planetLongitudes: pLongs,
    vargas,
    compoundRelationships: cr,
    uchchaSaravali,
    uchchaPVR,
    saptaScores,
    saptaBreakdown,
    ojayugamaScores,
    kendraScores,
    dreshkonScores,
    sthanaTotalsSaravali,
    sthanaTotalsPVR,
  };
}

// Self-executing runner for Chofu, Japan
if (import.meta.url === `file://${process.argv[1]}`) {
  calculateSthanaDebug().then((res) => {
    console.log('========================================================================================');
    console.log('DSSME DIRECT SWISSEPHEMERIS STHANA BALA DEBUGGER (CHOFU, JAPAN)');
    console.log('========================================================================================');
    console.log(`Lagna Longitude: ${res.ascendant.longitude.toFixed(4)}° (Sign: ${res.ascendant.sign})`);
    console.log('----------------------------------------------------------------------------------------');
    console.log('| Planet  | Sidereal Lon | Uchcha (Saravali) | Sapta  | Ojay  | Kendra | Dresh | Sthana Total |');
    console.log('----------------------------------------------------------------------------------------');
    for (let i = 0; i < 7; i++) {
      const p = PLANET_NAMES[i].padEnd(7, ' ');
      const lon = res.planetLongitudes[i].toFixed(2).padStart(12, ' ');
      const uch = res.uchchaSaravali[i].toFixed(2).padStart(17, ' ');
      const sap = res.saptaScores[i].toFixed(2).padStart(6, ' ');
      const oj = res.ojayugamaScores[i].toFixed(2).padStart(5, ' ');
      const ken = res.kendraScores[i].toFixed(2).padStart(6, ' ');
      const dre = res.dreshkonScores[i].toFixed(2).padStart(5, ' ');
      const tot = res.sthanaTotalsSaravali[i].toFixed(2).padStart(12, ' ');
      console.log(`| ${p} | ${lon} | ${uch} | ${sap} | ${oj} | ${ken} | ${dre} | ${tot} |`);
    }
    console.log('----------------------------------------------------------------------------------------');
    console.log('\nSaptavargaja Varga Breakdown (D1, D2, D3, D7, D9, D12, D30):');
    for (let i = 0; i < 7; i++) {
      const p = PLANET_NAMES[i].padEnd(7, ' ');
      const signs = [1, 2, 3, 7, 9, 12, 30].map(d => `D${d}:${res.vargas[i][d]}`).join(' ');
      const scores = res.saptaBreakdown[i].map(s => s.toFixed(1).padStart(5, ' ')).join(', ');
      console.log(`  ${p} Signs: [${signs}]`);
      console.log(`          Scores: [${scores}] => Total: ${res.saptaScores[i]}`);
    }
    console.log('========================================================================================');
  }).catch(console.error);
}
