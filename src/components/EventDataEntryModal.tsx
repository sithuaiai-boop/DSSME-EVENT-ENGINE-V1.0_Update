/**
 * DSSME NATIVE CALCULATION ENGINE - Chart & Event Data Entry Dialog
 * Provides structured input capture for Date, Time, Geographic Coordinates,
 * and Timezone according to MASTER_PROMPT.md §6-§7.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  HelpCircle,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { EventProfile, EventType, CanonicalChart, DSSMEEventInput } from '../engine/types.js';
import {
  CANONICAL_PRESET_LOCATIONS,
  CountryLocation,
  formatDMS,
  parseDMSOrDecimal,
  formatTimezoneOffsetString,
  saveDefaultPlace,
  getSavedDefaultPlace,
} from '../engine/location/locationDatabase.js';
import { parseTimezoneOffset } from '../engine/astronomy/ephemeris.js';

interface EventDataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChartCreated: (profile: EventProfile, chart: CanonicalChart) => void;
  calculateChartFn: (input: DSSMEEventInput) => Promise<CanonicalChart>;
  initialDate?: string; // YYYY-MM-DD
  initialLocationIndex?: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const EventDataEntryModal: React.FC<EventDataEntryModalProps> = ({
  isOpen,
  onClose,
  onChartCreated,
  calculateChartFn,
  initialDate = '2026-09-25',
  initialLocationIndex = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'data' | 'notes'>('data');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Event Data Fields
  const [eventName, setEventName] = useState<string>('Vedic Benchmark Chart');
  const [eventType, setEventType] = useState<EventType>('General Event');

  // Date state (YYYY-MM-DD)
  const [dateStr, setDateStr] = useState<string>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Time state (HH:mm:ss local civil time)
  const [timeStr, setTimeStr] = useState<string>('12:00:00');

  // Selected Location from Canonical Preset
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(initialLocationIndex);

  // Manual Coordinates Override
  const [isManualOverride, setIsManualOverride] = useState<boolean>(false);
  const [manualLatitude, setManualLatitude] = useState<number>(CANONICAL_PRESET_LOCATIONS[0].latitude);
  const [manualLongitude, setManualLongitude] = useState<number>(CANONICAL_PRESET_LOCATIONS[0].longitude);
  const [manualTimezone, setManualTimezone] = useState<string>(CANONICAL_PRESET_LOCATIONS[0].timezone);
  const [manualCity, setManualCity] = useState<string>(CANONICAL_PRESET_LOCATIONS[0].city);
  const [manualCountry, setManualCountry] = useState<string>(CANONICAL_PRESET_LOCATIONS[0].country);

  // Notes tab
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  const activePreset = CANONICAL_PRESET_LOCATIONS[selectedPresetIndex] || CANONICAL_PRESET_LOCATIONS[0];

  const resolvedLatitude = isManualOverride ? manualLatitude : activePreset.latitude;
  const resolvedLongitude = isManualOverride ? manualLongitude : activePreset.longitude;
  const resolvedTimezone = isManualOverride ? manualTimezone : activePreset.timezone;
  const resolvedCity = isManualOverride ? manualCity : activePreset.city;
  const resolvedCountry = isManualOverride ? manualCountry : activePreset.country;

  // Load saved default place on initial mount if available
  useEffect(() => {
    const saved = getSavedDefaultPlace();
    if (saved && !isManualOverride) {
      const idx = CANONICAL_PRESET_LOCATIONS.findIndex((p) => p.city === saved.city && p.country === saved.country);
      if (idx !== -1) {
        setSelectedPresetIndex(idx);
      } else {
        setIsManualOverride(true);
        setManualCity(saved.city);
        setManualCountry(saved.country);
        setManualLatitude(saved.latitude);
        setManualLongitude(saved.longitude);
        setManualTimezone(saved.timezone);
      }
    }
  }, []);

  // Formatted date string "25 Sep 2026 (Fri)"
  const formattedDateDisplay = (() => {
    try {
      const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
      if (!y || !m || !d) return dateStr;
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      const dayName = DAY_NAMES[dateObj.getUTCDay()];
      const monthName = MONTH_NAMES[m - 1];
      return `${String(d).padStart(2, '0')} ${monthName} ${y} (${dayName})`;
    } catch {
      return dateStr;
    }
  })();

  // Save Default Place
  const handleSaveDefaultPlace = () => {
    saveDefaultPlace({
      country: resolvedCountry,
      city: resolvedCity,
      latitude: resolvedLatitude,
      longitude: resolvedLongitude,
      timezone: resolvedTimezone,
      timezoneOffset: parseTimezoneOffset(resolvedTimezone),
      abbreviation: resolvedCity.slice(0, 3).toUpperCase(),
    });
    setSuccessToast(`Saved ${resolvedCity}, ${resolvedCountry} as default place`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Create Chart Execution Pipeline
  const handleCreateChart = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (!eventName.trim()) {
        throw new Error('Event Name is required.');
      }
      if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error('Valid date in format YYYY-MM-DD is required.');
      }
      if (!timeStr || !timeStr.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        throw new Error('Valid time in format HH:mm:ss is required.');
      }
      if (resolvedLatitude < -90 || resolvedLatitude > 90) {
        throw new Error('Latitude must be between -90° and +90°.');
      }
      if (resolvedLongitude < -180 || resolvedLongitude > 180) {
        throw new Error('Longitude must be between -180° and +180°.');
      }
      if (!resolvedTimezone) {
        throw new Error('Valid timezone offset string is required.');
      }

      // Format time with seconds
      const parts = timeStr.split(':');
      const normalizedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${(parts[2] || '00').padStart(2, '0')}`;

      const eventProfile: EventProfile = {
        eventId: `EVT-${dateStr.replace(/-/g, '')}-${Date.now().toString(36)}`,
        eventName: eventName.trim(),
        eventType,
        localDate: dateStr,
        localTime: normalizedTime,
        timezone: resolvedTimezone,
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        country: resolvedCountry,
        city: resolvedCity,
        ayanamsa: 'Lahiri',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const input: DSSMEEventInput = {
        datetime: `${dateStr} ${normalizedTime}`,
        timezone: resolvedTimezone,
        location: {
          latitude: resolvedLatitude,
          longitude: resolvedLongitude,
          city: resolvedCity,
          country: resolvedCountry,
        },
        ayanamsa: 'Lahiri',
      };

      const calculatedChart = await calculateChartFn(input);
      onChartCreated(eventProfile, calculatedChart);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to calculate chart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl text-neutral-100 flex flex-col max-h-[90vh]"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-neutral-100">
              New Vedic Chart Data Entry (Native 16-Block Engine)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              title="Help & Info"
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-neutral-800 px-5 pt-2 bg-neutral-950/30 gap-4">
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Chart / Event Data
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Notes & Metadata
          </button>
        </div>

        {/* Help Banner */}
        {showHelp && (
          <div className="bg-amber-950/30 border-b border-amber-800/40 p-3 text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Calculates complete 16 active blocks natively using Swiss Ephemeris / WASM & Lahiri Ayanamsa.
              Coordinates and timezone offsets are strictly validated per MASTER_PROMPT.md.
            </p>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'data' ? (
            <div className="space-y-4">
              {/* Event Name & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Chart / Event Name</label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
                    placeholder="e.g. Tokyo Benchmark Chart"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
                  >
                    <option value="General Event">General Event</option>
                    <option value="Prashna">Prashna (Horary)</option>
                    <option value="Event Chart">Event Chart</option>
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">{formattedDateDisplay}</span>
                </div>
                <div>
                  <label className="block text-neutral-400 font-medium mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Time (HH:mm:ss Local Civil Time)
                  </label>
                  <input
                    type="text"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    placeholder="12:00:00"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 font-mono focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Location Presets & Coordinates */}
              <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    Location & Geographic Coordinates
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isManualOverride}
                      onChange={(e) => setIsManualOverride(e.target.checked)}
                      className="rounded border-neutral-700 bg-neutral-800 text-amber-400 focus:ring-0"
                    />
                    Manual coordinate override
                  </label>
                </div>

                {!isManualOverride ? (
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">Select Preset City</label>
                    <select
                      value={selectedPresetIndex}
                      onChange={(e) => setSelectedPresetIndex(parseInt(e.target.value, 10))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 focus:outline-hidden focus:border-amber-400"
                    >
                      {CANONICAL_PRESET_LOCATIONS.map((loc, idx) => (
                        <option key={idx} value={idx}>
                          {loc.city}, {loc.country} ({loc.timezone}, {loc.latitude > 0 ? `${loc.latitude}°N` : `${Math.abs(loc.latitude)}°S`}, {loc.longitude > 0 ? `${loc.longitude}°E` : `${Math.abs(loc.longitude)}°W`})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-0.5">City</label>
                      <input
                        type="text"
                        value={manualCity}
                        onChange={(e) => setManualCity(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-0.5">Country</label>
                      <input
                        type="text"
                        value={manualCountry}
                        onChange={(e) => setManualCountry(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-0.5">Latitude (°N/S)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={manualLatitude}
                        onChange={(e) => setManualLatitude(parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-[11px] mb-0.5">Longitude (°E/W)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={manualLongitude}
                        onChange={(e) => setManualLongitude(parseFloat(e.target.value) || 0)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100 font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-neutral-400 text-[11px] mb-0.5">Timezone Offset (e.g. +06:30, +09:00)</label>
                      <input
                        type="text"
                        value={manualTimezone}
                        onChange={(e) => setManualTimezone(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Resolved details card */}
                <div className="text-[11px] text-neutral-400 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80">
                  <div className="flex gap-4">
                    <span>
                      <strong className="text-neutral-300">Lat:</strong> {formatDMS(resolvedLatitude, true)}
                    </span>
                    <span>
                      <strong className="text-neutral-300">Lon:</strong> {formatDMS(resolvedLongitude, false)}
                    </span>
                    <span>
                      <strong className="text-neutral-300">TZ:</strong> {resolvedTimezone} (UTC {parseTimezoneOffset(resolvedTimezone) >= 0 ? `+${parseTimezoneOffset(resolvedTimezone)}` : parseTimezoneOffset(resolvedTimezone)}h)
                    </span>
                  </div>
                  <button
                    onClick={handleSaveDefaultPlace}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Bookmark className="w-3 h-3" />
                    Save as default place
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-neutral-400 font-medium">Notes & Chart Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="Add any observations, benchmark fixture reference, or research notes..."
                className="w-full bg-neutral-800 border border-neutral-700 rounded p-3 text-neutral-100 text-xs focus:outline-hidden focus:border-amber-400"
              />
            </div>
          )}

          {/* Success Toast / Error Message */}
          {successToast && (
            <div className="p-2 bg-emerald-950/50 border border-emerald-800/50 rounded text-emerald-300 text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              {successToast}
            </div>
          )}
          {errorMessage && (
            <div className="p-2 bg-rose-950/50 border border-rose-800/50 rounded text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              {errorMessage}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800 bg-neutral-950/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateChart}
              disabled={isSubmitting}
              className="px-5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? 'Calculating 16 Blocks...' : 'Calculate Chart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
