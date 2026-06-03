import React from 'react';
import { ClockStyle, HandMotion, ClockSettings } from '../types';
import { Eye, EyeOff, Volume2, VolumeX, Moon, Layers, RotateCcw } from 'lucide-react';

interface SettingsPanelProps {
  settings: ClockSettings;
  onChangeSettings: (settings: ClockSettings) => void;
  enableTickSound: boolean;
  onToggleTickSound: () => void;
  onResetSettings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onChangeSettings,
  enableTickSound,
  onToggleTickSound,
  onResetSettings,
}) => {
  const updateStyle = (style: ClockStyle) => {
    onChangeSettings({ ...settings, style });
  };

  const updateMotion = (motion: HandMotion) => {
    onChangeSettings({ ...settings, motion });
  };

  const toggleSetting = (key: keyof Omit<ClockSettings, 'style' | 'motion' | 'selectedTimezone'>) => {
    onChangeSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const styles: { value: ClockStyle; label: string; desc: string }[] = [
    { value: 'bauhaus', label: 'Bauhaus', desc: 'Modern numbers, slender lines' },
    { value: 'minimalist', label: 'Minimal', desc: 'No numbers, ultimate clean' },
    { value: 'chronograph', label: 'Chronograph', desc: 'High-end split-second gauges' },
    { value: 'roman', label: 'Roman', desc: 'Vintage classic watch numerals' },
  ];

  const motions: { value: HandMotion; label: string; desc: string }[] = [
    { value: 'sweep', label: 'Sweep', desc: 'High-end dynamic gliding second' },
    { value: 'tick', label: 'Tick', desc: 'Deadbeat 1Hz traditional progression' },
    { value: 'spring', label: 'Spring', desc: 'Mechanical escapement spring-bounce' },
  ];

  return (
    <div className="bg-[#0d0d0d] rounded-3xl border border-[#c5a05915] p-6 shadow-2xl flex flex-col gap-6" id="settings-panel">
      
      {/* 1. Watch Dial Style Selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-[#c5a059]" />
          <h3 className="font-sans font-semibold text-sm text-[#e0e0e0] tracking-tight">Clock Style</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {styles.map((s) => (
            <button
              key={s.value}
              id={`style-btn-${s.value}`}
              onClick={() => updateStyle(s.value)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-18 cursor-pointer ${
                settings.style === s.value
                  ? 'border-[#c5a059] bg-[#c5a059] text-[#050505] shadow-[0_4px_15px_rgba(197,160,89,0.25)] font-medium'
                  : 'border-[#c5a059]/10 hover:border-[#c5a059]/30 bg-[#070707] hover:bg-[#111111] text-[#e0e0e0]/80 hover:text-white'
              }`}
            >
              <span className="font-sans font-medium text-xs leading-none">{s.label}</span>
              <span className={`text-[10px] leading-tight ${settings.style === s.value ? 'text-[#050505]/80 font-medium' : 'text-[#8a817c]'}`}>
                {s.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-zinc-900" />

      {/* 2. Escapement Hand Motion Selector */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-[#c5a059]" />
          <h3 className="font-sans font-semibold text-sm text-[#e0e0e0] tracking-tight">Hand Progression</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {motions.map((m) => (
            <button
              key={m.value}
              id={`motion-btn-${m.value}`}
              onClick={() => updateMotion(m.value)}
              className={`p-2.5 rounded-xl border text-center transition-all duration-200 flex flex-col justify-center gap-1.5 cursor-pointer ${
                settings.motion === m.value
                  ? 'border-[#c5a059] bg-[#c5a059] text-[#050505] shadow-[0_4px_15px_rgba(197,160,89,0.25)] font-semibold'
                  : 'border-[#c5a059]/10 hover:border-[#c5a059]/30 bg-[#070707] hover:bg-[#111111] text-[#e0e0e0]/80 hover:text-white'
              }`}
            >
              <span className="font-sans font-medium text-2xs leading-none block">{m.label}</span>
              <span className={`text-[9px] scale-[0.95] leading-tight block origin-center ${settings.motion === m.value ? 'text-[#050505]/75 font-semibold' : 'text-[#8a817c]'}`}>
                {m.value === 'sweep' ? 'Fluid' : m.value === 'tick' ? 'Exact' : 'Elastic'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-zinc-900" />

      {/* 3. Escapement Sound & Accessories Toggles */}
      <div>
        <h3 className="font-sans font-semibold text-sm text-[#e0e0e0] tracking-tight mb-3">Dial Complications & FX</h3>
        
        <div className="flex flex-col gap-2.5">
          {/* Tick Sound */}
          <button
            onClick={onToggleTickSound}
            id="sound-toggle-btn"
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              enableTickSound
                ? 'bg-[#c5a059]/10 border-[#c5a059]/40 text-[#c5a059]'
                : 'bg-[#070707] border-[#c5a059]/10 hover:border-[#c5a059]/30 text-[#e0e0e0]/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {enableTickSound ? <Volume2 className="w-4 h-4 text-[#c5a059] animate-pulse" /> : <VolumeX className="w-4 h-4 text-[#8a817c]" />}
              <div className="text-left">
                <p className="font-sans font-medium text-xs">Audio Feedback Tick</p>
                <p className="text-[10px] opacity-75 text-[#8a817c]">Wooden acoustic room synthesis</p>
              </div>
            </div>
            <span className="text-2xs font-mono uppercase font-semibold">
              {enableTickSound ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Show Numbers */}
          {settings.style !== 'minimalist' && (
            <button
              onClick={() => toggleSetting('showNumbers')}
              id="toggle-numbers-btn"
              className="flex items-center justify-between p-3 rounded-xl border border-[#c5a059]/10 bg-[#070707] hover:bg-[#111111] transition-all cursor-pointer text-[#e0e0e0]/85 text-xs text-left"
            >
              <div className="flex items-center gap-2.5">
                {settings.showNumbers ? <Eye className="w-4 h-4 text-[#c5a059]" /> : <EyeOff className="w-4 h-4 text-[#8a817c]" />}
                <span>Draw Dial Numerals</span>
              </div>
              <span className="text-2xs font-mono text-zinc-500 tracking-wider">
                {settings.showNumbers ? 'SHOW' : 'HIDE'}
              </span>
            </button>
          )}

          {/* Show Ticks */}
          <button
            onClick={() => toggleSetting('showTicks')}
            id="toggle-ticks-btn"
            className="flex items-center justify-between p-3 rounded-xl border border-[#c5a059]/10 bg-[#070707] hover:bg-[#111111] transition-all cursor-pointer text-[#e0e0e0]/85 text-xs text-left"
          >
            <div className="flex items-center gap-2.5">
              {settings.showTicks ? <Eye className="w-4 h-4 text-[#c5a059]" /> : <EyeOff className="w-4 h-4 text-[#8a817c]" />}
              <span>Hour & Minute Markers</span>
            </div>
            <span className="text-2xs font-mono text-zinc-500 tracking-wider">
              {settings.showTicks ? 'SHOW' : 'HIDE'}
            </span>
          </button>

          {/* Date Complication */}
          <button
            onClick={() => toggleSetting('showDateComplication')}
            id="toggle-date-btn"
            className="flex items-center justify-between p-3 rounded-xl border border-[#c5a059]/10 bg-[#070707] hover:bg-[#111111] transition-all cursor-pointer text-[#e0e0e0]/85 text-xs text-left"
          >
            <div className="flex items-center gap-2.5">
              {settings.showDateComplication ? <Eye className="w-4 h-4 text-[#c5a059]" /> : <EyeOff className="w-4 h-4 text-[#8a817c]" />}
              <span>3 Hour Calendar Complication</span>
            </div>
            <span className="text-2xs font-mono text-zinc-500 tracking-wider">
              {settings.showDateComplication ? 'SHOW' : 'HIDE'}
            </span>
          </button>

          {/* Digital Readout */}
          <button
            onClick={() => toggleSetting('showDigitalReadout')}
            id="toggle-digital-btn"
            className="flex items-center justify-between p-3 rounded-xl border border-[#c5a059]/10 bg-[#070707] hover:bg-[#111111] transition-all cursor-pointer text-[#e0e0e0]/85 text-xs text-left"
          >
            <div className="flex items-center gap-2.5">
              {settings.showDigitalReadout ? <Eye className="w-4 h-4 text-[#c5a059]" /> : <EyeOff className="w-4 h-4 text-[#8a817c]" />}
              <span>Digital Chrono Readout</span>
            </div>
            <span className="text-2xs font-mono text-zinc-500 tracking-wider">
              {settings.showDigitalReadout ? 'SHOW' : 'HIDE'}
            </span>
          </button>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={onResetSettings}
        id="reset-settings-btn"
        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-800 text-zinc-550 hover:text-[#c5a059] hover:border-[#c5a059]/40 bg-transparent hover:bg-[#c5a059]/5 text-xs font-medium tracking-tight cursor-pointer transition-all duration-200 mt-2"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to Default Setup
      </button>

    </div>
  );
};
