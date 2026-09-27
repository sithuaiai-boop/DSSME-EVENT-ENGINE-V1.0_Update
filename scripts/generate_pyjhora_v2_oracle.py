#!/usr/bin/env python3
"""
================================================================================
DSSME SHADBALA ORACLE GENERATOR V2 (INDEPENDENT PYJHORA RUNNER)
================================================================================
PRIMARY SOURCE OF TRUTH:
  Repository: https://github.com/naturalstupid/PyJHora
  Version: 5.0
  Commit: 48e57d29b47a3143519910a24866758116467485
  Source File: src/jhora/horoscope/chart/strength.py
  Source SHA-256: 43b4a1c2fd0374b94aa9fb2b5b5bfd6283a8ca6c72fba466a89d8d29407aa278
  Entry Point: shad_bala(jd, place)

INDEPENDENCE FIREWALL CONTRACT:
  - This generator imports and executes ACTUAL PyJHora directly via Python.
  - Zero DSSME code, zero hardcoded synthetic formulas, zero approximation fallbacks.
  - If PyJHora cannot execute or fails, it exits with ORACLE STATUS = BLOCKED.
================================================================================
"""

import sys
import os
import json
import hashlib
import datetime
import platform

# Ensure PyJHora is on Python path
PYJHORA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vendor', 'pyjhora', 'src'))
if not os.path.exists(PYJHORA_PATH):
    # Try alternate location
    PYJHORA_PATH = '/app/applet/vendor/pyjhora/src'

if not os.path.exists(PYJHORA_PATH):
    print("ORACLE STATUS = BLOCKED: PyJHora source path not found at", PYJHORA_PATH)
    sys.exit(1)

sys.path.insert(0, PYJHORA_PATH)

try:
    import swisseph as swe
    from jhora.panchanga import drik
    from jhora import utils, const
    from jhora.horoscope.chart import strength, charts
except Exception as e:
    print(f"ORACLE STATUS = BLOCKED: Failed to import PyJHora: {e}")
    sys.exit(1)

REPO_URL = "https://github.com/naturalstupid/PyJHora"
REPO_VERSION = "5.0"
PINNED_COMMIT = "48e57d29b47a3143519910a24866758116467485"
SOURCE_FILE = "src/jhora/horoscope/chart/strength.py"
SOURCE_SHA256 = "43b4a1c2fd0374b94aa9fb2b5b5bfd6283a8ca6c72fba466a89d8d29407aa278"

PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

FIXTURES_INPUT = [
    {
        "id": "PYJHORA_SB_001",
        "name": "Normal Daytime Chart",
        "date": "2026-03-21",
        "time": "12:00:00",
        "timezone_offset": 9.0,
        "latitude": 35.6895,
        "longitude": 139.6917,
        "location_name": "Tokyo, Japan",
        "purpose": "F01 — normal daytime chart"
    },
    {
        "id": "PYJHORA_SB_002",
        "name": "Normal Nighttime Chart",
        "date": "2026-10-15",
        "time": "23:30:00",
        "timezone_offset": 0.0,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_name": "London, UK",
        "purpose": "F02 — normal nighttime chart"
    },
    {
        "id": "PYJHORA_SB_003",
        "name": "Waxing Moon Chart",
        "date": "2026-05-18",
        "time": "14:00:00",
        "timezone_offset": -4.0,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_name": "New York, USA",
        "purpose": "F03 — waxing Moon"
    },
    {
        "id": "PYJHORA_SB_004",
        "name": "Waning Moon Chart",
        "date": "2026-11-03",
        "time": "04:00:00",
        "timezone_offset": 1.0,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "location_name": "Paris, France",
        "purpose": "F04 — waning Moon"
    },
    {
        "id": "PYJHORA_SB_005",
        "name": "Retrograde Planet Chart",
        "date": "2026-07-20",
        "time": "18:00:00",
        "timezone_offset": 10.0,
        "latitude": -33.8688,
        "longitude": 151.2093,
        "location_name": "Sydney, Australia",
        "purpose": "F05 — retrograde planet"
    },
    {
        "id": "PYJHORA_SB_006",
        "name": "High Latitude North",
        "date": "2026-06-21",
        "time": "00:00:00",
        "timezone_offset": 0.0,
        "latitude": 64.1466,
        "longitude": -21.9426,
        "location_name": "Reykjavik, Iceland",
        "purpose": "F06 — high latitude northern summer solstice"
    },
    {
        "id": "PYJHORA_SB_007",
        "name": "High Latitude South",
        "date": "2026-12-21",
        "time": "12:00:00",
        "timezone_offset": -3.0,
        "latitude": -53.1638,
        "longitude": -70.9171,
        "location_name": "Punta Arenas, Chile",
        "purpose": "F07 — high latitude southern summer solstice"
    },
    {
        "id": "PYJHORA_SB_008",
        "name": "Equatorial Chart",
        "date": "2026-09-23",
        "time": "06:00:00",
        "timezone_offset": 8.0,
        "latitude": 1.3521,
        "longitude": 103.8198,
        "location_name": "Singapore",
        "purpose": "F08 — equatorial sunrise chart"
    },
    {
        "id": "PYJHORA_SB_009",
        "name": "Planetary War Chart",
        "date": "2026-02-14",
        "time": "20:00:00",
        "timezone_offset": 2.0,
        "latitude": 30.0444,
        "longitude": 31.2357,
        "location_name": "Cairo, Egypt",
        "purpose": "F09 — planetary war evaluation"
    },
    {
        "id": "PYJHORA_SB_010",
        "name": "Combustion Chart",
        "date": "2026-04-10",
        "time": "11:30:00",
        "timezone_offset": 5.5,
        "latitude": 28.6139,
        "longitude": 77.2090,
        "location_name": "Delhi, India",
        "purpose": "F10 — solar combustion condition"
    },
    {
        "id": "PYJHORA_SB_011",
        "name": "Chofu Master Benchmark Chart",
        "date": "2026-09-16",
        "time": "18:50:00",
        "timezone_offset": 9.0,
        "latitude": 35.6528,
        "longitude": 139.5447,
        "location_name": "Chofu, Japan",
        "purpose": "F11 — primary DSSME live benchmark chart"
    },
    {
        "id": "PYJHORA_SB_012",
        "name": "VPJain Classical Benchmark Chart",
        "date": "1981-09-13",
        "time": "01:30:00",
        "timezone_offset": 5.5,
        "latitude": 28.6500,
        "longitude": 77.2167,
        "location_name": "Delhi, India",
        "purpose": "F12 — VP Jain classical textbook test case from pvr_tests.py"
    },
    {
        "id": "PYJHORA_SB_013",
        "name": "BVRaman Classical Benchmark Chart",
        "date": "1912-08-08",
        "time": "19:35:00",
        "timezone_offset": 5.5,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "location_name": "Bangalore, India",
        "purpose": "F13 — BV Raman natal chart classical test case"
    },
    {
        "id": "PYJHORA_SB_014",
        "name": "Sun Exaltation Aries",
        "date": "2026-04-20",
        "time": "08:00:00",
        "timezone_offset": 5.5,
        "latitude": 23.1765,
        "longitude": 75.7885,
        "location_name": "Ujjain, India",
        "purpose": "F14 — Sun near deep exaltation (10 deg Aries)"
    },
    {
        "id": "PYJHORA_SB_015",
        "name": "Saturn Retrograde Aquarius",
        "date": "2026-08-15",
        "time": "21:00:00",
        "timezone_offset": 2.0,
        "latitude": 52.5200,
        "longitude": 13.4050,
        "location_name": "Berlin, Germany",
        "purpose": "F15 — Saturn retrograde motional test"
    },
    {
        "id": "PYJHORA_SB_016",
        "name": "Solar Eclipse New Moon",
        "date": "2026-02-17",
        "time": "12:00:00",
        "timezone_offset": 12.0,
        "latitude": -18.1416,
        "longitude": 178.4419,
        "location_name": "Suva, Fiji",
        "purpose": "F16 — Amavasya solar conjunction (minimum Moon light)"
    },
    {
        "id": "PYJHORA_SB_017",
        "name": "Full Moon Lunar Eclipse",
        "date": "2026-03-03",
        "time": "20:30:00",
        "timezone_offset": -8.0,
        "latitude": 34.0522,
        "longitude": -118.2437,
        "location_name": "Los Angeles, USA",
        "purpose": "F17 — Purnima lunar maximum illumination"
    },
    {
        "id": "PYJHORA_SB_018",
        "name": "Stationary Transition Chart",
        "date": "2026-10-28",
        "time": "15:45:00",
        "timezone_offset": -4.0,
        "latitude": 43.6532,
        "longitude": -79.3832,
        "location_name": "Toronto, Canada",
        "purpose": "F18 — planetary station turning direct/retrograde"
    }
]

def to_planet_dict(arr):
    return {PLANET_NAMES[i]: round(float(arr[i]), 2) for i in range(7)}

def generate_fixture(fix):
    y, m, d = map(int, fix["date"].split("-"))
    h, mn, s = map(int, fix["time"].split(":"))
    dob = drik.Date(y, m, d)
    tob = (h, mn, s)
    lat = fix["latitude"]
    lon = fix["longitude"]
    tz = fix["timezone_offset"]
    loc = fix["location_name"]

    place = drik.Place(loc, lat, lon, tz)
    jd = utils.julian_day_number(dob, tob)

    # Execute actual PyJHora entry point
    sb_result = strength.shad_bala(jd, place)
    if not sb_result or len(sb_result) < 9:
        raise ValueError(f"PyJHora shad_bala returned invalid result: {sb_result}")

    stb, kb, dgb, cb, nb, dkb, sb_sum, sb_rupa, sb_strength = sb_result

    # Sub-component breakdowns for complete mathematical auditing
    pp_sv = {}
    for dcf in const.sapthavargaja_factors:
        pp_sv[dcf] = charts.divisional_chart(jd, place, divisional_chart_factor=dcf)[:const._pp_count_upto_ketu]

    ub = strength._uchcha_bala(pp_sv[1])
    svb = strength._sapthavargaja_bala1(jd, place)
    ob = strength._ojayugama_bala(pp_sv[1], pp_sv[9])
    k_b = strength._kendra_bala(pp_sv[1])
    dreshb = strength._dreshkon_bala(pp_sv[1])

    # Kaala sub-components
    nath_b = strength._nathonnath_bala(jd, place)
    pak_b = strength._paksha_bala(jd, place)
    tri_b = strength._tribhaga_bala(jd, place)
    abd_b = strength._abdadhipathi(jd, place)
    mas_b = strength._masadhipathi(jd, place)
    vaa_b = strength._vaaradhipathi(jd, place)
    hor_b = strength._hora_bala(jd, place)
    ayan_b = strength._ayana_bala(jd, place)
    yud_b = strength._yuddha_bala(jd, place)

    fixture_data = {
        "schema_version": "2.0",
        "oracle_status": "ACTIVE_INDEPENDENT_GROUND_TRUTH",
        "fixture_id": fix["id"],
        "name": fix["name"],
        "purpose": fix["purpose"],
        "source": {
            "engine": "PyJHora",
            "repository": REPO_URL,
            "version": REPO_VERSION,
            "commit": PINNED_COMMIT,
            "source_file": SOURCE_FILE,
            "source_sha256": SOURCE_SHA256,
            "function": "shad_bala(jd, place)"
        },
        "input": {
            "date": fix["date"],
            "time": fix["time"],
            "timezone_offset": tz,
            "latitude": lat,
            "longitude": lon,
            "location_name": loc,
            "ayanamsa": "Lahiri",
            "julian_day": round(float(jd), 6)
        },
        "oracle": {
            "sthana": to_planet_dict(stb),
            "kaala": to_planet_dict(kb),
            "dig": to_planet_dict(dgb),
            "chesta": to_planet_dict(cb),
            "naisargika": to_planet_dict(nb),
            "drik": to_planet_dict(dkb),
            "total_virupas": to_planet_dict(sb_sum),
            "rupa": to_planet_dict(sb_rupa),
            "strength_ratio": to_planet_dict(sb_strength),
            "breakdowns": {
                "sthana": {
                    "uchcha": to_planet_dict(ub[:7]),
                    "saptavargaja": to_planet_dict(svb[:7]),
                    "ojayugama": to_planet_dict(ob[:7]),
                    "kendra": to_planet_dict(k_b[:7]),
                    "dreshkona": to_planet_dict(dreshb[:7])
                },
                "kaala": {
                    "nathonnatha": to_planet_dict(nath_b[:7]),
                    "paksha": to_planet_dict(pak_b[:7]),
                    "tribhaga": to_planet_dict(tri_b[:7]),
                    "abda": to_planet_dict(abd_b[:7]),
                    "masa": to_planet_dict(mas_b[:7]),
                    "vaara": to_planet_dict(vaa_b[:7]),
                    "hora": to_planet_dict(hor_b[:7]),
                    "ayana": to_planet_dict(ayan_b[:7]),
                    "yuddha": to_planet_dict(yud_b[:7])
                }
            }
        }
    }
    return fixture_data

def main():
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tests', 'oracle', 'pyjhora-v2'))
    os.makedirs(out_dir, exist_ok=True)

    print("=" * 70)
    print("EXECUTING REAL PYJHORA FOR 18 DIVERSE CANONICAL FIXTURES")
    print(f"Repository: {REPO_URL} (Commit: {PINNED_COMMIT})")
    print(f"Source file: {SOURCE_FILE} (SHA-256: {SOURCE_SHA256})")
    print("=" * 70)

    manifest_fixtures = []

    for fix in FIXTURES_INPUT:
        fid = fix["id"]
        print(f"Executing PyJHora for [{fid}] {fix['name']} ...", end=" ", flush=True)
        try:
            data = generate_fixture(fix)
            out_file = os.path.join(out_dir, f"{fid}.json")
            content = json.dumps(data, indent=2)
            with open(out_file, "w", encoding="utf-8") as f:
                f.write(content)

            sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
            manifest_fixtures.append({
                "fixture_id": fid,
                "name": fix["name"],
                "purpose": fix["purpose"],
                "location": fix["location_name"],
                "datetime": f"{fix['date']} {fix['time']}",
                "file": f"tests/oracle/pyjhora-v2/{fid}.json",
                "sha256": sha256
            })
            print(f"OK (SHA-256: {sha256[:12]}...)")
        except Exception as e:
            print(f"FAIL: {e}")
            print(f"ORACLE STATUS = BLOCKED: Failed while executing PyJHora on {fid}")
            sys.exit(1)

    manifest = {
        "oracle_system": "independent-pyjhora-oracle-v2",
        "oracle_status": "ACTIVE_INDEPENDENT_GROUND_TRUTH",
        "generator_script": "scripts/generate_pyjhora_v2_oracle.py",
        "repository": REPO_URL,
        "version": REPO_VERSION,
        "pinned_commit": PINNED_COMMIT,
        "source_file": SOURCE_FILE,
        "source_sha256": SOURCE_SHA256,
        "function": "shad_bala(jd, place)",
        "ayanamsa": "Lahiri",
        "planet_order": PLANET_NAMES,
        "rounding": {
            "components": 2,
            "total": 2,
            "rupa": 2,
            "strength": 2
        },
        "generation_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "environment": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "architecture": platform.machine()
        },
        "fixture_count": len(manifest_fixtures),
        "fixtures": manifest_fixtures
    }

    manifest_file = os.path.join(out_dir, "manifest.json")
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("=" * 70)
    print(f"SUCCESS: Generated {len(manifest_fixtures)} independent PyJHora fixtures!")
    print(f"Manifest written to: {manifest_file}")
    print("=" * 70)

if __name__ == "__main__":
    main()
