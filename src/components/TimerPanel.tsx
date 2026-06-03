import React from 'react';
import { Play, Pause, RotateCcw, AlertTriangle, Disc } from 'lucide-react';

interface TimerPanelProps {
  isActive: boolean;
  isSetting: boolean;
  totalSeconds: number; // Duration chosen
  remainingSeconds: number; // Counting down
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelectPreset: (minutes: number) => void;
  onToggleSettingMode: () => void;
}

export const TimerPanel: React.FC<TimerPanelProps> = ({
  isActive,
  isSetting,
  totalSeconds,
  remainingSeconds,
  onStart,
  onPause,
  onReset,
  onSelectPreset,
  onToggleSettingMode,
}) => {
  const formatTimerTime = (secondsCount: number) => {
    const mins = Math.floor(secondsCount / 60);
    const secs = Math.floor(secondsCount % 60);
    return {
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
    };
  };

  const formatted = formatTimerTime(remainingSeconds || totalSeconds);
  const isUrgent = remainingSeconds > 0 && remainingSeconds <= 10;

  const presets = [1, 5, 10, 15, 25, 45]; // minutes

  return (
    <div className="bg-[#0d0d0d] rounded-3xl border border-[#c5a05915] p-6 shadow-2xl flex flex-col gap-5" id="timer-panel">
      
      {/* 1. Large High-Contrast Digital Display */}
      <div 
        className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 ${
          isUrgent 
            ? 'bg-[#22070b]/70 border-rose-900/40 text-rose-350 animate-pulse shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]' 
            : isActive 
            ? 'bg-[#07130b]/60 border-emerald-900/30 text-[#e0e0e0]' 
            : 'bg-[#080808] border-[#c5a059]/10 text-[#e0e0e0] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]'
        }`}
      >
        <span className={`font-mono text-2xs uppercase tracking-widest font-bold mb-1 ${isUrgent ? 'text-rose-500' : 'text-zinc-500'}`}>
          {isUrgent ? 'CRITICAL METRIC OVERFLOW' : isActive ? 'TIMER RUNNING' : 'COUNTDOWN TIMER SETUP'}
        </span>
        
        <div className="flex items-baseline font-mono text-4xl font-semibold tracking-tight">
          <span>{formatted.minutes}</span>
          <span className={`${isUrgent ? 'text-rose-450' : 'text-zinc-700'} px-0.5`}>:</span>
          <span className={isUrgent ? 'text-rose-500' : ''}>{formatted.seconds}</span>
        </div>

        {/* Dynamic Warning Indicator */}
        {isUrgent && (
          <div className="flex items-center gap-1 mt-1 text-rose-500 text-[10px] font-mono animate-bounce font-medium">
            <AlertTriangle className="w-3 h-3" />
            WIND DOWN UNDERWAY
          </div>
        )}
      </div>

      {/* 2. Direct Drag and Click toggle */}
      <button
        onClick={onToggleSettingMode}
        id="toggle-timer-setting-btn"
        disabled={isActive}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold tracking-tight transition-all cursor-pointer ${
          isSetting
            ? 'bg-[#c5a059] border-[#c5a059] text-[#050505] shadow-lg shadow-[#c5a059]/20 font-bold'
            : 'bg-[#070707] border-[#c5a059]/15 hover:border-[#cca05a]/30 text-[#e0e0e0]/85 disabled:opacity-20'
        }`}
      >
        <Disc className={`w-3.5 h-3.5 ${isSetting ? 'animate-spin' : ''}`} />
        {isSetting ? 'Lock Dial & Ready Timer' : 'Drag Dial to Calibrate'}
      </button>

      {/* 3. Floating Presets */}
      <div>
        <div className="flex items-center justify-between mb-2 select-none">
          <span className="font-sans font-semibold text-xs text-[#e0e0e0]">Minutes Quick Calibration</span>
          <span className="font-mono text-[9px] text-zinc-500">Preset Dial Gears</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {presets.map((min) => (
            <button
              key={min}
              id={`preset-btn-${min}`}
              disabled={isActive || isSetting}
              onClick={() => onSelectPreset(min)}
              className="py-1.5 px-1 bg-[#070707] border border-[#c5a059]/10 hover:border-[#c5a059]/30 disabled:opacity-20 disabled:pointer-events-none hover:bg-[#111111] text-[#e0e0e0]/85 text-2xs font-semibold rounded-lg font-mono text-center cursor-pointer transition-all"
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      <hr className="border-zinc-900" />

      {/* 4. Controls */}
      <div className="flex gap-3 justify-center">
        {/* Reset / Clear Button */}
        <button
          onClick={onReset}
          id="timer-reset-btn"
          disabled={totalSeconds === 0 && remainingSeconds === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#c5a059]/15 bg-transparent hover:bg-[#111111] text-[#e0e0e0]/80 font-sans font-medium text-xs tracking-tight transition-all active:scale-[0.98] cursor-pointer disabled:opacity-20 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Caliber
        </button>

        {/* Play / Pause Toggle */}
        {isActive ? (
          <button
            onClick={onPause}
            id="timer-pause-btn"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1a1a1a] border border-zinc-850 hover:bg-[#252525] text-white font-sans font-semibold text-xs tracking-tight transition-all active:scale-[0.99] cursor-pointer shadow-sm"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        ) : (
          <button
            onClick={onStart}
            id="timer-start-btn"
            disabled={totalSeconds <= 0 || isSetting}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#c5a059] hover:bg-[#cca05a] text-[#050505] font-sans font-bold text-xs tracking-tight transition-all active:scale-[0.99] cursor-pointer disabled:opacity-45 disabled:pointer-events-none shadow-lg shadow-[#c5a059]/10"
          >
            <Play className="w-3.5 h-3.5" />
            Engage
          </button>
        )}
      </div>

      <div className="bg-[#080808] rounded-xl p-3 border border-[#c5a059]/10 text-[10px] text-zinc-400 font-mono select-none">
        🥚 <span className="font-semibold text-[#c5a059]">Analogue kitchen wedge:</span> When engaged, the watch face displays an organic gold segment illustrating running progress.
      </div>
    </div>
  );
};
