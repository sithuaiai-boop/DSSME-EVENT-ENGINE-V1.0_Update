import React from 'react';
import { CanonicalChart } from '../engine/types.js';

interface MoonPhaseCardProps {
  chart: CanonicalChart;
}

/**
 * Calculates SVG path for the illuminated portion of the Moon given the elongation angle in degrees.
 * Elongation is 0° at New Moon (Amavasya), 90° at First Quarter, 180° at Full Moon (Purnima), 270° at Third Quarter.
 */
export function getMoonPhaseSvgPath(cx: number, cy: number, r: number, elongationDeg: number): string {
  const theta = ((elongationDeg % 360) + 360) % 360;

  // New Moon: virtually no illumination
  if (theta < 1.0 || theta > 359.0) {
    return '';
  }

  // Full Moon: entire disk illuminated
  if (Math.abs(theta - 180.0) < 1.0) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }

  const rad = (theta * Math.PI) / 180;
  const cos = Math.cos(rad);
  const rx = Math.max(0.1, r * Math.abs(cos));

  if (theta < 180) {
    // Waxing (Shukla Paksha): Light is on the right
    // Outer arc: right semi-circle from top (cx, cy-r) to bottom (cx, cy+r)
    // Terminator: arc back from bottom to top
    const sweep = theta < 90 ? 0 : 1;
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`;
  } else {
    // Waning (Krishna Paksha): Light is on the left
    // Outer arc: left semi-circle from top (cx, cy-r) to bottom (cx, cy+r)
    // Terminator: arc back from bottom to top
    const sweep = theta < 270 ? 1 : 0;
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 ${sweep} ${cx} ${cy - r} Z`;
  }
}

/**
 * Deterministic Moon Phase Name based on astronomical elongation
 */
export function getMoonPhaseName(elongationDeg: number): {
  westernName: string;
  vedicPhase: string;
  iconSymbol: string;
} {
  const theta = ((elongationDeg % 360) + 360) % 360;

  if (theta >= 354 || theta < 6) {
    return { westernName: 'New Moon', vedicPhase: 'Amavasya', iconSymbol: '🌑' };
  } else if (theta >= 6 && theta < 84) {
    return { westernName: 'Waxing Crescent', vedicPhase: 'Shukla Paksha Crescent', iconSymbol: '🌒' };
  } else if (theta >= 84 && theta < 96) {
    return { westernName: 'First Quarter', vedicPhase: 'Shukla Ashtami', iconSymbol: '🌓' };
  } else if (theta >= 96 && theta < 174) {
    return { westernName: 'Waxing Gibbous', vedicPhase: 'Shukla Paksha Gibbous', iconSymbol: '🌔' };
  } else if (theta >= 174 && theta < 186) {
    return { westernName: 'Full Moon', vedicPhase: 'Purnima', iconSymbol: '🌕' };
  } else if (theta >= 186 && theta < 264) {
    return { westernName: 'Waning Gibbous', vedicPhase: 'Krishna Paksha Gibbous', iconSymbol: '🌖' };
  } else if (theta >= 264 && theta < 276) {
    return { westernName: 'Third Quarter', vedicPhase: 'Krishna Ashtami', iconSymbol: '🌗' };
  } else {
    return { westernName: 'Waning Crescent', vedicPhase: 'Krishna Paksha Crescent', iconSymbol: '🌘' };
  }
}

export const MoonPhaseCard: React.FC<MoonPhaseCardProps> = ({ chart }) => {
  const sun = chart.PLANETS['Sun'];
  const moon = chart.PLANETS['Moon'];

  const sunLon = sun ? sun.totalLongitude : 0;
  const moonLon = moon ? moon.totalLongitude : 0;

  // Angular elongation from Sun to Moon [0, 360)
  const elongation = ((moonLon - sunLon) % 360 + 360) % 360;

  // Illumination fraction [0, 1]
  const illuminationFraction = (1 - Math.cos((elongation * Math.PI) / 180)) / 2;
  const illuminationPercent = Math.round(illuminationFraction * 1000) / 10;

  const phaseInfo = getMoonPhaseName(elongation);
  const pan = chart.PANCHANGA;
  const stress = chart.PHASE_STRESS;

  // SVG radius & center
  const cx = 50;
  const cy = 50;
  const r = 38;
  const litPath = getMoonPhaseSvgPath(cx, cy, r, elongation);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300"></span>
              Lunar Phase & Illumination
            </h3>
            <p className="text-xs text-slate-400">Chandra Kala • Mod-14 Visual</p>
          </div>
          <span className="text-lg" title={phaseInfo.westernName}>
            {phaseInfo.iconSymbol}
          </span>
        </div>

        {/* Moon Visualization Showcase */}
        <div className="flex flex-col items-center py-4">
          <div className="relative group">
            {/* Ambient moonlight glow */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-30 transition-opacity"
              style={{
                background:
                  illuminationPercent > 10
                    ? `radial-gradient(circle, rgba(254, 240, 138, 0.4) 0%, rgba(217, 119, 6, 0.1) 70%, transparent 100%)`
                    : 'transparent',
              }}
            />

            {/* SVG Moon Orb */}
            <svg
              viewBox="0 0 100 100"
              className="w-28 h-28 relative drop-shadow-[0_0_12px_rgba(251,191,36,0.15)]"
              aria-label={`Moon Phase: ${phaseInfo.westernName}, ${illuminationPercent}% illuminated`}
            >
              <defs>
                {/* Dark side gradient */}
                <radialGradient id="darkSideGradient" cx="40%" cy="40%" r="65%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="60%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </radialGradient>

                {/* Lit side lunar surface gradient */}
                <radialGradient id="litSideGradient" cx="45%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="55%" stopColor="#fef3c7" />
                  <stop offset="85%" stopColor="#fde68a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </radialGradient>

                {/* Clip path for the whole circular moon disk */}
                <clipPath id="moonDiskClip">
                  <circle cx={cx} cy={cy} r={r} />
                </clipPath>
              </defs>

              {/* 1. Base dark side of the moon disk */}
              <circle cx={cx} cy={cy} r={r} fill="url(#darkSideGradient)" />

              {/* Subtle dark crater textures (clipped to moon disk) */}
              <g clipPath="url(#moonDiskClip)" opacity="0.18">
                <circle cx={cx - 12} cy={cy - 10} r="9" fill="#334155" />
                <circle cx={cx + 10} cy={cy + 14} r="12" fill="#334155" />
                <circle cx={cx - 15} cy={cy + 12} r="7" fill="#334155" />
                <circle cx={cx + 14} cy={cy - 12} r="8" fill="#334155" />
                <circle cx={cx} cy={cy - 18} r="6" fill="#334155" />
                <circle cx={cx + 4} cy={cy} r="11" fill="#334155" />
              </g>

              {/* 2. Illuminated portion */}
              {litPath && (
                <path
                  d={litPath}
                  fill="url(#litSideGradient)"
                  clipPath="url(#moonDiskClip)"
                />
              )}

              {/* Subtle craters on lit side with soft blend */}
              {litPath && (
                <g clipPath="url(#moonDiskClip)" opacity="0.12" fill="#78350f">
                  <circle cx={cx - 12} cy={cy - 10} r="8" />
                  <circle cx={cx + 10} cy={cy + 14} r="10" />
                  <circle cx={cx - 15} cy={cy + 12} r="6" />
                  <circle cx={cx + 14} cy={cy - 12} r="7" />
                  <circle cx={cx} cy={cy - 18} r="5" />
                  <circle cx={cx + 4} cy={cy} r="9" />
                </g>
              )}

              {/* Outer boundary rim */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="#334155"
                strokeWidth="0.8"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* Phase Title & Illumination */}
          <div className="text-center mt-3">
            <div className="text-sm font-bold text-slate-100 flex items-center justify-center gap-1.5">
              <span>{phaseInfo.westernName}</span>
              <span className="text-xs text-amber-400 font-mono">({illuminationPercent}%)</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{phaseInfo.vedicPhase}</p>
          </div>

          {/* Illumination Progress Bar */}
          <div className="w-full max-w-[200px] mt-2.5">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, illuminationPercent)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1">
              <span>0% (New)</span>
              <span>100% (Full)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lunar Metrics List */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Tithi:</span>
          <span className="font-mono text-slate-200">
            {pan.tithi_name} ({pan.paksha})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Elongation:</span>
          <span className="font-mono text-amber-300 font-semibold">
            {elongation.toFixed(2)}°
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Moon Position:</span>
          <span className="font-mono text-cyan-300">
            {moon ? `${moon.sign} ${moon.degreeFormatted}` : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Proximity:</span>
          <span className="font-mono text-slate-300">
            {stress.full_moon_proximity_hrs <= stress.new_moon_proximity_hrs
              ? `${stress.full_moon_proximity_hrs}h to Full`
              : `${stress.new_moon_proximity_hrs}h to New`}
          </span>
        </div>
      </div>
    </div>
  );
};
