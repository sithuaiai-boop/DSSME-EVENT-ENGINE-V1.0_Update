/**
 * Canonical Global City Location Database & Coordinate Utilities
 * Standardized coordinates for Vedic chart calculations.
 */

export interface CountryLocation {
  city: string;
  country: string;
  latitude: number; // Decimal degrees (North positive)
  longitude: number; // Decimal degrees (East positive)
  timezone: string; // e.g. "+06:30", "+09:00", "+05:30"
  timezoneOffset: number; // in hours, e.g. 6.5, 9.0, 5.5
  abbreviation: string;
}

export const CANONICAL_PRESET_LOCATIONS: CountryLocation[] = [
  {
    city: 'Yangon',
    country: 'Myanmar',
    latitude: 16.8661,
    longitude: 96.1951,
    timezone: '+06:30',
    timezoneOffset: 6.5,
    abbreviation: 'YGN',
  },
  {
    city: 'Mandalay',
    country: 'Myanmar',
    latitude: 21.9588,
    longitude: 96.0891,
    timezone: '+06:30',
    timezoneOffset: 6.5,
    abbreviation: 'MDY',
  },
  {
    city: 'Tokyo / Chofu',
    country: 'Japan',
    latitude: 35.6528,
    longitude: 139.5447,
    timezone: '+09:00',
    timezoneOffset: 9.0,
    abbreviation: 'TYO',
  },
  {
    city: 'New Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.209,
    timezone: '+05:30',
    timezoneOffset: 5.5,
    abbreviation: 'DEL',
  },
  {
    city: 'Bangkok',
    country: 'Thailand',
    latitude: 13.7563,
    longitude: 100.5018,
    timezone: '+07:00',
    timezoneOffset: 7.0,
    abbreviation: 'BKK',
  },
  {
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: '+08:00',
    timezoneOffset: 8.0,
    abbreviation: 'SIN',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: '+00:00',
    timezoneOffset: 0.0,
    abbreviation: 'LON',
  },
  {
    city: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: '-05:00',
    timezoneOffset: -5.0,
    abbreviation: 'NYC',
  },
  {
    city: 'Berlin',
    country: 'Germany',
    latitude: 52.52,
    longitude: 13.405,
    timezone: '+01:00',
    timezoneOffset: 1.0,
    abbreviation: 'BER',
  },
  {
    city: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    timezone: '+01:00',
    timezoneOffset: 1.0,
    abbreviation: 'PAR',
  },
  {
    city: 'Honolulu',
    country: 'United States',
    latitude: 21.3069,
    longitude: -157.8583,
    timezone: '-10:00',
    timezoneOffset: -10.0,
    abbreviation: 'HNL',
  },
];

export const CANONICAL_COUNTRIES = Array.from(
  new Set(CANONICAL_PRESET_LOCATIONS.map((l) => l.country))
).sort();

export function formatDMS(decimal: number, isLatitude: boolean): string {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);

  let dir = '';
  if (isLatitude) {
    dir = decimal >= 0 ? 'N' : 'S';
  } else {
    dir = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}° ${String(minutes).padStart(2, '0')}' ${String(seconds).padStart(2, '0')}" ${dir}`;
}

export function parseDMSOrDecimal(input: string, isLatitude: boolean): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Check if standard decimal
  const num = parseFloat(trimmed);
  if (!isNaN(num) && !trimmed.includes('°') && !trimmed.includes("'")) {
    return num;
  }

  // Parse DMS e.g. 16° 51' 58" N or 16 51 58 N
  const match = trimmed.match(/^(\d+)[°\s]+(\d+)?['\s]*(\d+(?:\.\d+)?)?["\s]*([NSEWnsew])?$/);
  if (match) {
    const deg = parseFloat(match[1]) || 0;
    const min = parseFloat(match[2]) || 0;
    const sec = parseFloat(match[3]) || 0;
    const dir = (match[4] || '').toUpperCase();

    let val = deg + min / 60 + sec / 3600;
    if (dir === 'S' || dir === 'W') {
      val = -val;
    } else if (!dir) {
      if (isLatitude && val > 90) return null;
      if (!isLatitude && val > 180) return null;
    }
    return val;
  }

  return isNaN(num) ? null : num;
}

export function formatTimezoneOffsetString(offsetHours: number): string {
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function saveDefaultPlace(place: CountryLocation): void {
  try {
    localStorage.setItem('dssme_default_place', JSON.stringify(place));
  } catch (e) {
    // Ignore in non-browser or storage-restricted envs
  }
}

export function getSavedDefaultPlace(): CountryLocation | null {
  try {
    const raw = localStorage.getItem('dssme_default_place');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Fallback
  }
  return null;
}
