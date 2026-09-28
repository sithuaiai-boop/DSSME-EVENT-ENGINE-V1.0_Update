#!/usr/bin/env python3
"""
================================================================================
DSSME SHADBALA ORACLE GENERATOR V2 (INDEPENDENT PYJHORA RUNNER)
================================================================================
PRIMARY SOURCE OF TRUTH:
  Repository: https://github.com/naturalstupid/PyJHora
  Version: 5.0 (Tag: V4.9.3)
  Commit: 48e57d29b47a3143519910a24866758116467485
  Source File: src/jhora/horoscope/chart/strength.py
  Source SHA-256: 43b4a1c2fd0374b94aa9fb2b5b5bfd6283a8ca6c72fba466a89d8d29407aa278
  Entry Point: shad_bala(jd, place) and _kaala_bala(jd, place)

INDEPENDENCE FIREWALL CONTRACT:
  - This generator imports and executes ACTUAL PyJHora directly via Python.
  - Zero DSSME code, zero hardcoded synthetic formulas, zero approximation fallbacks.
  - Zero imports from src/engine/**.
================================================================================
"""

import sys
import os
import json
import hashlib
import platform

# Ensure PyJHora is on Python path
PYJHORA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vendor', 'pyjhora', 'src'))
if not os.path.exists(PYJHORA_PATH):
    PYJHORA_PATH = '/app/applet/vendor/pyjhora/src'

if not os.path.exists(PYJHORA_PATH):
    print("ORACLE STATUS = BLOCKED: PyJHora source path not found at", PYJHORA_PATH)
    sys.exit(1)

sys.path.insert(0, PYJHORA_PATH)

try:
    import swisseph as swe
    from jhora.panchanga import drik
    from jhora import utils, const
    from jhora.horoscope.chart import strength
except Exception as e:
    print(f"ORACLE STATUS = BLOCKED: Failed to import PyJHora: {e}")
    sys.exit(1)

REPO_URL = "https://github.com/naturalstupid/PyJHora"
REPO_VERSION = "5.0"
PINNED_COMMIT = "48e57d29b47a3143519910a24866758116467485"
PINNED_TAG = "V4.9.3"
SOURCE_FILE = "src/jhora/horoscope/chart/strength.py"
SOURCE_SHA256 = "43b4a1c2fd0374b94aa9fb2b5b5bfd6283a8ca6c72fba466a89d8d29407aa278"

PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

# 5 Canonical Benchmark Fixtures (Identical to pyjhora_oracle_v2_independent.json)
FIXTURES_INPUT = [
    {
        "fixture_id": "PYJHORA_V2_001",
        "name": "Chofu Japan (existing DSSME regression chart)",
        "input": {
            "date": "2026-09-16",
            "time": "18:50:00",
            "timezone_offset": 9.0,
            "latitude": 35.6528,
            "longitude": 139.5447,
            "location_name": "Chofu, Japan",
            "ayanamsa": "LAHIRI (jhora default config)"
        }
    },
    {
        "fixture_id": "PYJHORA_V2_002",
        "name": "Yangon Myanmar PM (strong Kendra claim fixture)",
        "input": {
            "date": "2026-09-16",
            "time": "18:50:00",
            "timezone_offset": 6.5,
            "latitude": 16.8661,
            "longitude": 96.1951,
            "location_name": "Yangon, Myanmar",
            "ayanamsa": "LAHIRI (jhora default config)"
        }
    },
    {
        "fixture_id": "PYJHORA_V2_003",
        "name": "Berlin Germany (Dreshkon boundary claim fixture)",
        "input": {
            "date": "2026-09-16",
            "time": "18:50:00",
            "timezone_offset": 2.0,
            "latitude": 52.52,
            "longitude": 13.405,
            "location_name": "Berlin, Germany",
            "ayanamsa": "LAHIRI (jhora default config)"
        }
    },
    {
        "fixture_id": "PYJHORA_V2_004",
        "name": "Honolulu USA (Bhava-Madhya cusp claim fixture)",
        "input": {
            "date": "2026-09-16",
            "time": "18:50:00",
            "timezone_offset": -10.0,
            "latitude": 21.3069,
            "longitude": -157.8583,
            "location_name": "Honolulu, Hawaii, USA",
            "ayanamsa": "LAHIRI (jhora default config)"
        }
    },
    {
        "fixture_id": "PYJHORA_V2_005",
        "name": "Paris France (waning Moon claim fixture)",
        "input": {
            "date": "2026-09-16",
            "time": "18:50:00",
            "timezone_offset": 2.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "location_name": "Paris, France",
            "ayanamsa": "LAHIRI (jhora default config)"
        }
    }
]

def generate_oracle():
    fixtures_out = []

    for fix in FIXTURES_INPUT:
        inp = fix["input"]
        y, m, d = map(int, inp["date"].split("-"))
        hr, mn, se = map(int, inp["time"].split(":"))
        dob = drik.Date(y, m, d)
        tob = (hr, mn, se)
        lat = inp["latitude"]
        lon = inp["longitude"]
        tz = inp["timezone_offset"]
        loc = inp["location_name"]

        place = drik.Place(loc, lat, lon, tz)
        jd = utils.julian_day_number(dob, tob)

        # 1. Primary Shadbala from PyJHora
        sb_result = strength.shad_bala(jd, place)
        stb, kb, dgb, cb, nb, dkb, sb_sum, sb_rupa, sb_strength = sb_result

        # 2. Nine Kaala Bala subcomponents directly from PyJHora helpers
        nb_comp = strength._nathonnath_bala(jd, place)
        pb_comp = strength._paksha_bala(jd, place)
        tb_comp = strength._tribhaga_bala(jd, place)
        ab_comp = strength._abdadhipathi(jd, place)
        mb_comp = strength._masadhipathi(jd, place)
        vb_comp = strength._vaaradhipathi(jd, place)
        hb_comp = strength._hora_bala(jd, place)
        ayb_comp = strength._ayana_bala(jd, place)
        yb_comp = strength._yuddha_bala(jd, place)

        planets_dict = {}
        for i in range(7):
            p = PLANET_NAMES[i]
            planets_dict[p] = {
                "sthana": round(float(stb[i]), 2),
                "kaala": round(float(kb[i]), 2),
                "dig": round(float(dgb[i]), 2),
                "chesta": round(float(cb[i]), 2),
                "naisargika": round(float(nb[i]), 2),
                "drik": round(float(dkb[i]), 2),
                "total_virupas": round(float(sb_sum[i]), 2),
                "rupa": round(float(sb_rupa[i]), 2),
                "strength_ratio": round(float(sb_strength[i]), 2),
                "kaala_breakdown": {
                    "nathonnatha": round(float(nb_comp[i]), 2),
                    "paksha": round(float(pb_comp[i]), 2),
                    "tribhaga": round(float(tb_comp[i]), 2),
                    "abda": round(float(ab_comp[i]), 2),
                    "masa": round(float(mb_comp[i]), 2),
                    "vaara": round(float(vb_comp[i]), 2),
                    "hora": round(float(hb_comp[i]), 2),
                    "ayana": round(float(ayb_comp[i]), 2),
                    "yuddha": round(float(yb_comp[i]), 2),
                    "total": round(float(kb[i]), 2)
                }
            }

        fixtures_out.append({
            "fixture_id": fix["fixture_id"],
            "name": fix["name"],
            "input": inp,
            "julianDay": jd,
            "planets": planets_dict
        })

    oracle_data = {
        "oracleStatus": "INDEPENDENT_PYJHORA",
        "repository": REPO_URL,
        "resolved_commit_full_sha": PINNED_COMMIT,
        "resolved_commit_tag": PINNED_TAG,
        "source_file": SOURCE_FILE,
        "source_sha256": SOURCE_SHA256,
        "entry_point": "shad_bala",
        "independence_contract": "Generated exclusively via PyJHora Python execution. Zero imports from DSSME src/engine/** tree.",
        "fixtures": fixtures_out
    }

    out_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'tests', 'oracle', 'pyjhora-v2', 'pyjhora_oracle_v2_independent.json'))
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(oracle_data, f, indent=2)

    print(f"SUCCESS: Generated independent PyJHora oracle at {out_file}")
    with open(out_file, 'rb') as f:
        h = hashlib.sha256(f.read()).hexdigest()
    print(f"ORACLE SHA256: {h}")

if __name__ == '__main__':
    generate_oracle()
