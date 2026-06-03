import React from 'react';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';

interface StopwatchLap {
  id: string;
  lapIndex: number;
  lapDurationSec: number; // Duration of this specific lap in seconds
  totalDurationSec: number; // Total elapsed time at standard lap moment
}

interface StopwatchPanelProps {
  isRunning: boolean;
  elapsedSeconds: number;
  laps: StopwatchLap[];
  onStart: () => void;
  onPause: () => void;
  onLap: () => void;
  onReset: () => void;
}

export const StopwatchPanel: React.FC<StopwatchPanelProps> = ({
  isRunning,
  elapsedSeconds,
  laps,
  onStart,
  onPause,
  onLap,
  onReset,
}) => {
  // Format elapsed time to readable high-fidelity chronograph layout
  const formatChronoTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 100);

    return {
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
      milliseconds: String(ms).padStart(2, '0'),
    };
  };

  const currentFormatted = formatChronoTime(elapsedSeconds);

  // Find extremes in lap records
  const getLapStreaks = () => {
    if (laps.length < 2) return { fastestId: '', slowestId: '' };
    let fastestId = laps[0].id;
    let slowestId = laps[0].id;
    let minDur = laps[0].lapDurationSec;
    let maxDur = laps[0].lapDurationSec;

    laps.forEach((lap) => {
      if (lap.lapDurationSec < minDur) {
        minDur = lap.lapDurationSec;
        fastestId = lap.id;
      }
      if (lap.lapDurationSec > maxDur) {
        maxDur = lap.lapDurationSec;
        slowestId = lap.id;
      }
    });

    return { fastestId, slowestId };
  };

  const { fastestId, slowestId } = getLapStreaks();

  return (
    <div className="bg-[#0d0d0d] rounded-3xl border border-[#c5a05915] p-6 shadow-2xl flex flex-col gap-6" id="stopwatch-panel">
      
      {/* 1. Large High-Contrast Digital Complication Tracker */}
      <div className="flex flex-col items-center justify-center py-4 bg-[#080808] rounded-2xl border border-[#c5a059]/10 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
        <span className="font-mono text-2xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
          CHRONOPHORE ACTIVE TIME
        </span>
        
        {/* Core Digital Display */}
        <div className="flex items-baseline font-mono text-4xl font-semibold tracking-tight text-[#e0e0e0] select-all">
          <span>{currentFormatted.minutes}</span>
          <span className="text-zinc-700 animate-pulse px-0.5">:</span>
          <span>{currentFormatted.seconds}</span>
          <span className="text-zinc-700 px-0.5">.</span>
          <span className="text-xl font-semibold text-[#c5a059] w-9 inline-block">
            {currentFormatted.milliseconds}
          </span>
        </div>
      </div>

      {/* 2. Tactile Floating Controls */}
      <div className="flex gap-3 justify-center">
        {/* Reset / Lap Secondary Button */}
        {isRunning ? (
          <button
            onClick={onLap}
            id="stopwatch-lap-btn"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#c5a059]/15 hover:bg-[#111111] font-sans font-medium text-xs text-[#e0e0e0]/85 tracking-tight cursor-pointer transition-all active:scale-[0.98]"
          >
            <Flag className="w-3.5 h-3.5 text-[#c5a059]" />
            Lap Split
          </button>
        ) : (
          <button
            onClick={onReset}
            id="stopwatch-reset-btn"
            disabled={elapsedSeconds === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#c5a059]/15 bg-transparent font-sans font-medium text-xs tracking-tight transition-all active:scale-[0.98] cursor-pointer disabled:opacity-20 text-[#e0e0e0]/75 hover:bg-[#111111] hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Caliber
          </button>
        )}

        {/* Play / Stop Primary Button */}
        {isRunning ? (
          <button
            onClick={onPause}
            id="stopwatch-pause-btn"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1a1a1a] border border-zinc-850 hover:bg-[#252525] text-white font-sans font-semibold text-xs tracking-tight transition-all active:scale-[0.99] cursor-pointer shadow-sm"
          >
            <Pause className="w-3.5 h-3.5 text-zinc-400" />
            Pause
          </button>
        ) : (
          <button
            onClick={onStart}
            id="stopwatch-start-btn"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#c5a059] hover:bg-[#cca05a] text-[#050505] font-sans font-bold text-xs tracking-tight transition-all active:scale-[0.99] cursor-pointer shadow-lg shadow-[#c5a059]/10"
          >
            <Play className="w-3.5 h-3.5" />
            Start Sweeping
          </button>
        )}
      </div>

      {/* 3. Laps Splitting View */}
      {laps.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-sans font-semibold text-xs text-[#e0e0e0]">Chronograph Split Logs</span>
            <span className="font-mono text-[9px] text-zinc-550">{laps.length} Splits Logged</span>
          </div>

          <div className="max-h-48 overflow-y-auto pr-1 flex flex-col gap-1.5 dynamic-scrollbar">
            {laps.slice().reverse().map((lap) => {
              const formattedLap = formatChronoTime(lap.lapDurationSec);
              const formattedTotal = formatChronoTime(lap.totalDurationSec);
              const isFastest = lap.id === fastestId;
              const isSlowest = lap.id === slowestId;

              let labelBadge = '';
              let badgeColor = '';
              if (isFastest) {
                labelBadge = 'FASTEST';
                badgeColor = 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
              } else if (isSlowest) {
                labelBadge = 'SLOWEST';
                badgeColor = 'bg-[#40121a]/40 text-[#ff607a] border-[#601a25]/30';
              }

              return (
                <div
                  key={lap.id}
                  id={`lap-item-${lap.id}`}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-900 bg-[#070707]/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs font-semibold text-zinc-500">
                      #{String(lap.lapIndex).padStart(2, '0')}
                    </span>
                    {labelBadge && (
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                        {labelBadge}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="font-mono text-[9px] text-zinc-550 block leading-tight">SPLIT</span>
                      <span className="font-mono text-xs font-medium text-[#c5a059] tracking-tighter">
                        +{formattedLap.minutes}:{formattedLap.seconds}.{formattedLap.milliseconds}
                      </span>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="font-mono text-[9px] text-zinc-550 block leading-tight">TOTAL</span>
                      <span className="font-mono text-xs font-semibold text-[#e0e0e0] tracking-tighter">
                        {formattedTotal.minutes}:{formattedTotal.seconds}.{formattedTotal.milliseconds}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
