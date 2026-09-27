/**
 * DSSME EVENT ENGINE V1.0 - CHESTA BALA (MOTIONAL STRENGTH)
 * Source: PyJHora (strength.py lines 1169-1186, _cheshta_bala_new with use_epoch_table=True)
 * Reference Epoch: Ujjain 1900-01-01 00:00:00 (JD = 2415020.5, Lon = 76.0 deg)
 * Rules: Sun & Moon = 0.0 virupas
 * Formula for Mars, Mercury, Jupiter, Venus, Saturn:
 *   mean_long = get_planet_mean_longitude_using_epoch_table(jdLocal, lon, year, p_id)
 *   seegrocha = sun_mean_long (or planet mean long for inferior planets Mercury & Venus)
 *   ave_long = 0.5 * (true_long + mean_long)
 *   reduced_chesta_kendra = abs(seegrocha - ave_long)
 *   cb[p_id] = round(reduced_chesta_kendra / 3.0, 2)
 */

import { PlanetState } from '../types.js';
import { SHADBALA_PLANETS, STANDARD_PLANETARY_SPEEDS } from './shadbalaConstants.js';
import { getSweInstanceSync } from '../astronomy/ephemeris.js';

export interface ChestaBalaContext {
  julianDay?: number;
  latitude?: number;
  longitude?: number;
  timezoneOffset?: number;
  datetime?: string;
  timeStr?: string;
}

const _PLACE_EPOCH_LON = 76.0;
const _EPOCH_YEAR = 1900;
const _JD_EPOCH = 2415020.5;

const planet_mean_positions_at_epoch_ujjain_1900 = [257.4568, -1, 270.22, 164, 220.04, 328.51, 236.74];
const planet_speed_at_epoch_ujjain_1900 = [0.9856, -1, 0.524, 4.0923, 0.0831, 1.60215, 0.033439];
const planet_correction_factors_per_year_since_epoch: [number, number, number][] = [
  [1, 0, 0],
  [1, 0, 0],
  [1, 0, 0],
  [1, 6.67, -0.00133],
  [-1, 3.3, 0.0067],
  [-1, 5, 0.0001],
  [1, 5, 0.001],
];

function planet_longitude_correction(planet_index: number, years_since_epoch: number): number {
  const f = planet_correction_factors_per_year_since_epoch[planet_index];
  return f[0] * (f[1] + f[2] * years_since_epoch);
}

const ujjain_epoch_table_for_planets: Record<number, number[]>[] = [
  { // 0 Sun
    1: [0.9856, 98.5602, 265.6026, 136.0265],
    2: [1.9712, 197.1205, 171.2053, 272.0531],
    3: [2.9568, 295.6808, 76.808, 48.0796],
    4: [3.9424, 34.2411, 342.4106, 184.1062],
    5: [4.928, 132.8013, 248.0133, 320.1327],
    6: [5.9136, 231.3616, 153.6159, 96.1593],
    7: [6.8992, 329.9218, 59.2186, 232.1868],
    8: [7.8848, 68.4821, 324.8212, 8.2124],
    9: [8.8704, 167.0424, 230.4239, 144.2389],
  },
  {}, // 1 Moon
  { // 2 Mars
    1: [0.524, 52.4, 164.02, 200.19],
    2: [1.048, 104.8, 328.04, 40.39],
    3: [1.572, 157.21, 132.06, 240.58],
    4: [2.096, 209.61, 296.08, 80.78],
    5: [2.62, 262.01, 100.1, 280.97],
    6: [3.144, 314.41, 264.12, 121.16],
    7: [3.668, 6.81, 68.14, 321.36],
    8: [4.192, 59.22, 232.15, 161.55],
    9: [4.716, 111.62, 36.17, 1.74],
  },
  { // 3 Mercury
    1: [4.09, 40.92, 49.23, 132.32, 243.18],
    2: [8.18, 81.84, 98.46, 264.64, 126.36],
    3: [12.28, 122.77, 147.7, 36.95, 9.54],
    4: [16.37, 163.69, 196.93, 169.27, 252.72],
    5: [20.46, 204.62, 246.16, 301.59, 135.9],
    6: [24.55, 245.54, 295.39, 73.91, 19.08],
    7: [28.65, 286.46, 344.62, 206.23, 262.26],
    8: [32.74, 327.38, 33.85, 338.54, 145.44],
    9: [36.83, 8.31, 83.09, 110.86, 28.63],
  },
  { // 4 Jupiter
    1: [0.08, 0.83, 8.31, 83.1, 110.96],
    2: [0.17, 1.66, 16.62, 166.19, 221.93],
    3: [0.25, 2.49, 24.93, 249.29, 332.89],
    4: [0.33, 3.32, 33.24, 332.39, 83.85],
    5: [0.41, 4.15, 41.55, 55.48, 194.82],
    6: [0.5, 4.99, 49.86, 138.58, 305.78],
    7: [0.58, 5.82, 58.17, 221.67, 56.74],
    8: [0.66, 6.65, 66.48, 304.77, 167.71],
    9: [0.75, 7.48, 74.79, 27.87, 278.67],
  },
  { // 5 Venus
    1: [1.6, 16.02, 160.21, 162.15, 181.46],
    2: [3.2, 32.04, 320.43, 324.29, 2.93],
    3: [4.81, 48.06, 120.64, 126.44, 184.39],
    4: [6.41, 64.09, 280.86, 288.59, 5.86],
    5: [8.01, 80.11, 81.07, 90.73, 187.32],
    6: [9.61, 96.13, 241.29, 252.88, 8.78],
    7: [11.21, 112.15, 41.5, 55.02, 190.25],
    8: [12.82, 128.17, 201.72, 217.17, 11.71],
    9: [14.42, 144.19, 1.93, 19.32, 193.18],
  },
  { // 6 Saturn
    1: [0.03, 0.33, 3.34, 33.44, 334.39],
    2: [0.07, 0.67, 6.69, 66.88, 308.79],
    3: [0.1, 1.0, 10.03, 100.32, 283.18],
    4: [0.13, 1.34, 13.38, 133.76, 257.57],
    5: [0.17, 1.67, 16.72, 167.2, 231.97],
    6: [0.2, 2.01, 20.06, 200.64, 206.36],
    7: [0.23, 2.34, 23.41, 234.08, 180.75],
    8: [0.27, 2.68, 26.75, 267.51, 155.14],
    9: [0.3, 3.01, 30.1, 300.95, 129.54],
  },
];

function get_planet_mean_longitude(jdLocal: number, lon: number, year: number, planet_index: number): number {
  if (planet_index === 1) return 0.0;
  const days_from_epoch = jdLocal - _JD_EPOCH + (_PLACE_EPOCH_LON - lon) / 15.0 / 24.0;
  const planet_speed = planet_speed_at_epoch_ujjain_1900[planet_index];
  const years_since_epoch = year - _EPOCH_YEAR;
  const corr = planet_longitude_correction(planet_index, years_since_epoch);
  return (planet_mean_positions_at_epoch_ujjain_1900[planet_index] + days_from_epoch * planet_speed + corr) % 360.0;
}

function get_planet_mean_longitude_using_epoch_table(
  jdLocal: number,
  lon: number,
  year: number,
  planet_index: number
): number {
  if (planet_index === 1) return 0.0;
  const days_from_epoch = jdLocal - _JD_EPOCH + (_PLACE_EPOCH_LON - lon) / 15.0 / 24.0;
  const table = ujjain_epoch_table_for_planets[planet_index];
  const has_tens = table[1].length > 4;

  const digits = days_from_epoch.toString().split('.');
  const whole_days = Math.floor(days_from_epoch);
  const decimal_part = digits.length > 1 ? parseFloat('0.' + digits[1]) : 0;

  const ten_thousands = Math.floor(whole_days / 10000) % 10;
  const thousands = Math.floor(whole_days / 1000) % 10;
  const hundreds = Math.floor(whole_days / 100) % 10;
  const tens_and_units = whole_days % 100;
  const tens = Math.floor(whole_days / 10) % 10;
  const units = whole_days % 10;

  const val_ten_thousands = (table[ten_thousands] || [0, 0, 0, 0])[table[1].length - 1];
  const val_thousands = (table[thousands] || [0, 0, 0, 0])[table[1].length - 2];
  const val_hundreds = (table[hundreds] || [0, 0, 0, 0])[table[1].length - 3];

  let combined_units_value = 0;
  if (has_tens) {
    const val_tens = (table[tens] || [0, 0, 0, 0, 0])[1];
    const val_units = (table[units] || [0, 0, 0, 0])[0];
    combined_units_value = val_tens + val_units;
  } else {
    const units_row = Math.floor(tens_and_units / 10);
    const units_row_val = (table[units_row] || [0, 0, 0, 0])[0];
    combined_units_value = 10 * units_row_val;
  }

  const val_decimal = decimal_part * (table[1] || [0, 0, 0, 0])[0];
  let total_sum =
    val_ten_thousands +
    val_thousands +
    val_hundreds +
    combined_units_value +
    val_decimal +
    planet_mean_positions_at_epoch_ujjain_1900[planet_index];
  const years_since_epoch = year - _EPOCH_YEAR;
  total_sum += planet_longitude_correction(planet_index, years_since_epoch);
  return ((total_sum % 360.0) + 360.0) % 360.0;
}

export function calculateChestaBalaAll(
  planets: Record<string, PlanetState>,
  context?: ChestaBalaContext
): number[] {
  const swe = getSweInstanceSync();
  const SWE_P = [0, 1, 4, 2, 5, 3, 6];

  let y = 2026, m = 9, d = 16;
  let hr = 18, mi = 50, se = 0;
  const tz = context?.timezoneOffset ?? 9.0;
  const lon = context?.longitude ?? 139.5447;

  if (context?.datetime) {
    const parts = context.datetime.split(/[T ]/);
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
  } else if (context?.timeStr) {
    const tParts = context.timeStr.split(':').map(Number);
    if (tParts.length >= 2 && !tParts.some(isNaN)) {
      hr = tParts[0];
      mi = tParts[1];
      se = tParts[2] ? Math.floor(tParts[2]) : 0;
    }
  }

  const tobh = hr + mi / 60.0 + se / 3600.0;

  if (swe) {
    const jdLocal = swe.julday(y, m, d, tobh);
    const jdUtc = swe.julday(y, m, d, tobh - tz);

    swe.set_sid_mode(29, 0, 0); // TRUE_PUSHYA
    const sun_mean_long = get_planet_mean_longitude(jdLocal, lon, y, 0);

    const cb: number[] = [0, 0, 0, 0, 0, 0, 0];
    const targetPlanets = [2, 3, 4, 5, 6]; // Mars, Mercury, Jupiter, Venus, Saturn

    for (const p_id of targetPlanets) {
      let mean_long = get_planet_mean_longitude_using_epoch_table(jdLocal, lon, y, p_id);
      let seegrocha = sun_mean_long;
      if (p_id === 3 || p_id === 5) {
        seegrocha = mean_long;
        mean_long = sun_mean_long;
      }
      const sweIdx = SWE_P[p_id];
      const pRes = swe.calc_ut(jdUtc, sweIdx, 65810);
      const true_long = ((pRes[0] % 360.0) + 360.0) % 360.0;
      const ave_long = 0.5 * (true_long + mean_long);
      const reduced_chesta_kendra = Math.abs(seegrocha - ave_long);
      cb[p_id] = Math.round((reduced_chesta_kendra / 3.0) * 100) / 100;
    }

    // Restore standard Lahiri mode
    swe.set_sid_mode(1, 0, 0);
    return cb;
  }

  // Fallback if Swiss Ephemeris is unavailable
  return SHADBALA_PLANETS.map((pName, i) => {
    if (i === 0 || i === 1) return 0.0;
    const pData = planets[pName];
    if (pData?.retrograde) return 60.0;
    const spd = Math.abs(pData?.speed ?? STANDARD_PLANETARY_SPEEDS[i]);
    const stdSpd = STANDARD_PLANETARY_SPEEDS[i];
    const ratio = Math.min(spd / stdSpd, 1.0);
    return Math.round(ratio * 30.0 * 100) / 100;
  });
}

