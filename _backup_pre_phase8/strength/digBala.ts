/**
 * DSSME EVENT ENGINE V1.0 - DIG BALA (DIRECTIONAL STRENGTH)
 * Source: PyJHora (strength.py lines 419-429, _dig_bala)
 * Formula: dbp[p] = round(abs(dbf[p] - p_long) / 3, 2)
 * Powerless houses: const.dig_bala_powerless_houses_of_planets = [3, 9, 3, 6, 6, 9, 0]
 * Powerless points: Placidus cusps from drik.bhaava_madhya_kp (mode 29 TRUE_PUSHYA)
 */

import { PlanetState, HouseInfo } from '../types.js';
import { SHADBALA_PLANETS } from './shadbalaConstants.js';
import { getSweInstanceSync } from '../astronomy/ephemeris.js';

export interface DigBalaContext {
  julianDay?: number;
  latitude?: number;
  longitude?: number;
  timezoneOffset?: number;
  datetime?: string;
  timeStr?: string;
  houses?: HouseInfo[];
  bhavaMadhya?: number[];
}

export function calculateDigBalaAll(
  planets: Record<string, PlanetState>,
  houses?: HouseInfo[],
  bhavaMadhya?: number[],
  context?: DigBalaContext
): number[] {
  const swe = getSweInstanceSync();
  const pwHouses = [3, 9, 3, 6, 6, 9, 0]; // 0-indexed: house 4, 10, 4, 7, 7, 10, 1
  const SWE_P = [0, 1, 4, 2, 5, 3, 6];

  let y = 2026, m = 9, d = 16;
  let hr = 18, mi = 50, se = 0;
  const tz = context?.timezoneOffset ?? 9.0;
  const lat = context?.latitude ?? 35.6528;
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
  const jdUtc = context?.julianDay ?? (swe ? swe.julday(y, m, d, tobh - tz) : 2461299.909722);

  if (swe) {
    swe.set_sid_mode(29, 0, 0); // TRUE_PUSHYA
    const housesRes = swe.houses_ex(jdUtc, 65810, lat, lon, 'P');
    const bm = Array.from(housesRes.cusps.slice(1)); // 12 Placidus cusps

    const dbp = SHADBALA_PLANETS.map((_, i) => {
      const pSwe = SWE_P[i];
      const pRes = swe.calc_ut(jdUtc, pSwe, 65810);
      const pLong = (pRes[0] % 360.0 + 360.0) % 360.0;
      const dbf = bm[pwHouses[i]];
      const diff = Math.abs(dbf - pLong);
      return Math.round((diff / 3.0) * 100) / 100;
    });

    // Restore Lahiri mode for other systems
    swe.set_sid_mode(1, 0, 0);
    return dbp;
  }

  // Analytical fallback if Swiss Ephemeris is unavailable
  return SHADBALA_PLANETS.map((pName, i) => {
    const pData = planets[pName];
    const pLong = pData?.totalLongitude ?? 0;
    const pwIdx = pwHouses[i];
    let dbf: number;
    if (bhavaMadhya && bhavaMadhya.length >= 12 && typeof bhavaMadhya[pwIdx] === 'number') {
      dbf = bhavaMadhya[pwIdx];
    } else if (houses && houses.length >= 12) {
      const hData = houses[pwIdx];
      const hNum = hData?.houseNumber ?? (hData as any)?.house ?? (pwIdx + 1);
      dbf = hData?.cuspDegree ?? ((hNum - 1) * 30.0 + 15.0);
    } else {
      dbf = (pwIdx * 30.0 + 15.0) % 360.0;
    }
    const diff = Math.abs(dbf - pLong);
    return Math.round((diff / 3.0) * 100) / 100;
  });
}
