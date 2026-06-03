import React, { useState } from 'react';
import { TIMEZONES, TimeZoneItem, getTimeInTimezone } from '../constants';
import { Globe, Search, Navigation } from 'lucide-react';

interface TimezoneSelectorProps {
  selectedId: string;
  onSelectTimezone: (id: string) => void;
  // We can pass a standard ticker time to render all mini times in real-time!
  currentTime: Date;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  selectedId,
  onSelectTimezone,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTimezones = TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tz.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tz.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#0d0d0d] rounded-3xl border border-[#c5a05915] p-6 shadow-2xl flex flex-col gap-4" id="timezone-selector-card">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-[#c5a059] animate-[spin_8s_linear_infinite]" />
        <h3 className="font-sans font-semibold text-sm text-[#e0e0e0] tracking-tight">World Time Display</h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#c5a059]/70">
          <Search className="w-3.5 h-3.5" />
        </span>
        <input
          type="text"
          id="timezone-search"
          placeholder="Search world cities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#c5a059]/15 text-white placeholder-zinc-600 focus:outline-none focus:border-[#c5a059]/40 focus:ring-1 focus:ring-[#c5a059]/20 bg-[#070707] transition-all"
        />
      </div>

      {/* Timezone List with clean scrollbar */}
      <div className="max-h-56 overflow-y-auto pr-1 flex flex-col gap-1 dynamic-scrollbar">
        {filteredTimezones.length > 0 ? (
          filteredTimezones.map((tz) => {
            const isActive = selectedId === tz.id;
            // Get live formatted time representation for list preview
            const tzData = getTimeInTimezone(tz.id);
            const timeStr = tzData.date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <button
                key={tz.id}
                id={`tz-item-${tz.id}`}
                onClick={() => onSelectTimezone(tz.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#c5a059] border border-[#c5a059] text-[#050505] shadow-[0_4px_12px_rgba(197,160,89,0.2)] font-medium'
                    : 'bg-[#070707]/60 border border-transparent hover:bg-[#111111] text-[#e0e0e0]/85 hover:border-[#c5a059]/15'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm select-none">{tz.flag}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-sans font-medium text-xs leading-none">{tz.label}</span>
                      {tz.id === 'local' && (
                        <Navigation className="w-2.5 h-2.5 text-rose-500 shrink-0" fill="currentColor" />
                      )}
                    </div>
                    <span className={`text-[9px] mt-0.5 ${isActive ? 'text-[#050505]/70 font-semibold' : 'text-zinc-500'}`}>
                      {tz.city}, {tz.country} • {tzData.offsetString}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-0.5">
                  <span className="font-mono text-xs font-bold tracking-tighter leading-none">
                    {timeStr}
                  </span>
                  <span className={`text-[8px] font-mono select-none tracking-widest ${isActive ? 'text-[#050505]/60 font-bold' : 'text-zinc-500'}`}>
                    {tzData.offsetString}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-6 text-2xs text-zinc-650 font-mono">
            No matching city found
          </div>
        )}
      </div>

      <div className="bg-[#080808] rounded-2xl p-3 border border-[#c5a059]/10 text-[10px] text-zinc-400 leading-relaxed font-mono select-none">
        📍 <span className="font-semibold text-[#c5a059]">Chronoscope calibration:</span> Choose any city listed above and our master-escapement will instantly mesh gears to correspond with the targeted meridian.
      </div>
    </div>
  );
};
