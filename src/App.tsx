import React, { useState, useEffect, useRef } from 'react';
import { AppMode, ClockSettings, ClockStyle, HandMotion } from './types';
import { TIMEZONES, getTimeInTimezone } from './constants';
import { ClockFace } from './components/ClockFace';
import { SettingsPanel } from './components/SettingsPanel';
import { TimezoneSelector } from './components/TimezoneSelector';
import { StopwatchPanel } from './components/StopwatchPanel';
import { TimerPanel } from './components/TimerPanel';
import { playTickSound, playAlarmSound } from './utils/audio';
import { ShieldCheck, Info, Clock, Timer as TimerIcon, Trophy } from 'lucide-react';

interface StopwatchLap {
  id: string;
  lapIndex: number;
  lapDurationSec: number;
  totalDurationSec: number;
}

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('clock');
  const [enableTickSound, setEnableTickSound] = useState(false);
  const [isCalibratorConnected, setIsCalibratorConnected] = useState(true);

  // Modern Swiss-German high contrast layout settings
  const [settings, setSettings] = useState<ClockSettings>({
    style: 'bauhaus',
    motion: 'sweep',
    showNumbers: true,
    showTicks: true,
    showDateComplication: true,
    showDigitalReadout: true,
    selectedTimezone: 'local',
  });

  // Time state
  const [time, setTime] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

  const [liveFormattedTimeStr, setLiveFormattedTimeStr] = useState('');

  // --- STOPWATCH STATE ---
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0); // in seconds
  const [stopwatchLaps, setStopwatchLaps] = useState<StopwatchLap[]>([]);

  // Refs for stopwatch high-precision stopwatch calculations
  const stopwatchStartRef = useRef<number>(0);
  const stopwatchAccumulatedRef = useRef<number>(0);

  // --- TIMER STATE ---
  const [timerTotal, setTimerTotal] = useState(0); // target in seconds
  const [timerRemaining, setTimerRemaining] = useState(0); // remaining in seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const [isTimerSettingMode, setIsTimerSettingMode] = useState(false);
  const [isTimerFinished, setIsTimerFinished] = useState(false);

  // Refs for high-precision countdown
  const timerStartRef = useRef<number>(0);
  const timerAccumulatedRef = useRef<number>(0);

  // Loop/ticker references
  const requestRef = useRef<number>(0);
  const lastSoundSecondRef = useRef<number>(-1);

  // Reset all dial parameters back to classic styling
  const handleResetSettings = () => {
    setSettings({
      style: 'bauhaus',
      motion: 'sweep',
      showNumbers: true,
      showTicks: true,
      showDateComplication: true,
      showDigitalReadout: true,
      selectedTimezone: 'local',
    });
    setEnableTickSound(false);
  };

  // Synchronous ticking animation frame loop
  useEffect(() => {
    const tick = (timestamp: number) => {
      // 1. UPDATE MAIN TIME (dependending on timezone choice)
      const { date, label } = getTimeInTimezone(settings.selectedTimezone);
      const h = date.getHours();
      const m = date.getMinutes();
      const s = date.getSeconds();
      const ms = date.getMilliseconds();

      setTime({
        hours: h,
        minutes: m,
        seconds: s,
        milliseconds: ms,
      });

      // Simple formatted digital label
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setLiveFormattedTimeStr(timeStr);

      // 2. ESCAPEMENT TICK AUDIO SYNTHESIZER
      if (enableTickSound && activeMode === 'clock') {
        const floorSec = Math.floor(date.getTime() / 1000);
        if (floorSec !== lastSoundSecondRef.current) {
          lastSoundSecondRef.current = floorSec;
          // Play alternate tick/tock sound based on parity
          playTickSound(s % 2 === 0);
        }
      }

      // 3. STOPWATCH CALCULATIONS
      if (stopwatchRunning) {
        const now = performance.now();
        const delta = (now - stopwatchStartRef.current) / 1000;
        const currentElapsed = Math.min(3599.99, stopwatchAccumulatedRef.current + delta); // cap at 1 hour for dial bounds
        setStopwatchElapsed(currentElapsed);

        // Optional stopwatch tick sounds
        if (enableTickSound && activeMode === 'stopwatch') {
          const sFloor = Math.floor(currentElapsed);
          const sFractional = Math.floor((currentElapsed % 1) * 10);
          // High speed ticks for stopwatches (e.g. 5x progress) if custom, or steady 1Hz
          const secondsTracker = Math.floor(currentElapsed);
          if (secondsTracker !== lastSoundSecondRef.current) {
            lastSoundSecondRef.current = secondsTracker;
            playTickSound(secondsTracker % 2 === 0);
          }
        }
      }

      // 4. TIMER COUNTDOWN ACTIVE LOOP
      if (timerRunning) {
        const now = performance.now();
        const delta = (now - timerStartRef.current) / 1000;
        const remaining = Math.max(0, timerTotal - (timerAccumulatedRef.current + delta));
        setTimerRemaining(remaining);

        if (enableTickSound && activeMode === 'timer') {
          const sTracker = Math.floor(remaining);
          if (sTracker !== lastSoundSecondRef.current) {
            lastSoundSecondRef.current = sTracker;
            playTickSound(sTracker % 2 === 0);
          }
        }

        // Timer ends
        if (remaining <= 0) {
          setTimerRunning(false);
          setIsTimerFinished(true);
          playAlarmSound();

          // Double alarm ping
          const interval = setInterval(() => {
            playAlarmSound();
          }, 600);
          setTimeout(() => clearInterval(interval), 1900);
        }
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [settings.selectedTimezone, enableTickSound, activeMode, stopwatchRunning, timerRunning, timerTotal]);

  // --- STOPWATCH ACTIONS ---
  const handleStartStopwatch = () => {
    if (stopwatchRunning) return;
    stopwatchStartRef.current = performance.now();
    setStopwatchRunning(true);
  };

  const handlePauseStopwatch = () => {
    if (!stopwatchRunning) return;
    const now = performance.now();
    stopwatchAccumulatedRef.current += (now - stopwatchStartRef.current) / 1000;
    setStopwatchRunning(false);
  };

  const handleResetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchElapsed(0);
    stopwatchAccumulatedRef.current = 0;
    setStopwatchLaps([]);
  };

  const handleLapStopwatch = () => {
    const lapIndex = stopwatchLaps.length + 1;
    const totalDurationSec = stopwatchElapsed;

    // Lap split corresponds to elapsed difference since last split
    const previousTotal = stopwatchLaps.length > 0 ? stopwatchLaps[stopwatchLaps.length - 1].totalDurationSec : 0;
    const lapDurationSec = totalDurationSec - previousTotal;

    const newLap: StopwatchLap = {
      id: `lap-${Date.now()}-${lapIndex}`,
      lapIndex,
      lapDurationSec,
      totalDurationSec,
    };

    setStopwatchLaps([...stopwatchLaps, newLap]);
  };

  // --- TIMER ACTIONS ---
  const handleStartTimer = () => {
    if (timerRunning || timerRemaining <= 0) return;
    setIsTimerFinished(false);
    timerStartRef.current = performance.now();
    setTimerRunning(true);
  };

  const handlePauseTimer = () => {
    if (!timerRunning) return;
    const now = performance.now();
    timerAccumulatedRef.current += (now - timerStartRef.current) / 1000;
    setTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerTotal(0);
    setTimerRemaining(0);
    timerAccumulatedRef.current = 0;
    setIsTimerSettingMode(false);
    setIsTimerFinished(false);
  };

  const handleSelectTimerPreset = (minutes: number) => {
    handleResetTimer();
    const secs = minutes * 60;
    setTimerTotal(secs);
    setTimerRemaining(secs);
  };

  // Dial rotation sets remaining duration directly from minutes
  const handleSetTimerDurationFromDial = (minutes: number) => {
    const secs = minutes * 60;
    setTimerTotal(secs);
    setTimerRemaining(secs);
  };

  const handleToggleTimerSettingMode = () => {
    if (timerRunning) return;
    setIsTimerSettingMode(!isTimerSettingMode);
  };

  // --- RENDER HELPERS ---
  // Mode switcher trigger
  const renderModeHeader = () => {
    const modes: { id: AppMode; label: string; icon: React.ReactNode }[] = [
      { id: 'clock', label: 'Chronometer Clock', icon: <Clock className="w-3.5 h-3.5" /> },
      { id: 'stopwatch', label: 'Chronograph', icon: <Trophy className="w-3.5 h-3.5" /> },
      { id: 'timer', label: 'Countdown Timer', icon: <TimerIcon className="w-3.5 h-3.5" /> },
    ];

    return (
      <div className="flex bg-[#0d0d0d] p-1.5 rounded-2xl border border-[#c5a059]/15 w-full max-w-lg mb-6 shadow-[0_8px_30px_rgba(0,0,0,0.8)]" id="mode-switcher-bar">
        {modes.map((m) => {
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              id={`tab-btn-${m.id}`}
              onClick={() => {
                setActiveMode(m.id);
                // Pause timer setting state when navigating away
                setIsTimerSettingMode(false);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-sans text-2xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#c5a059] text-[#050505] shadow-md shadow-[#c5a059]/20 font-bold'
                  : 'text-[#8a817c] hover:text-[#e0e0e0] hover:bg-[#151515]/60'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          );
        })}
      </div>
    );
  };

  // Calculate hands parameters according to selected screen Mode
  const getClockFaceRenderArgs = () => {
    if (activeMode === 'stopwatch') {
      // Stopwatch displays total stopwatch hours/minutes/seconds/milliseconds!
      // In a chronograph, the second-hand sweeps milliseconds/seconds, minute-hand sweeps minutes.
      const mins = Math.floor(stopwatchElapsed / 60);
      const secs = Math.floor(stopwatchElapsed % 60);
      const ms = Math.floor((stopwatchElapsed % 1) * 1000);
      // Minutes dial has 60 segments. Hours we align matching local standard elapsed hours.
      const hrs = Math.floor(stopwatchElapsed / 3600);

      return {
        hours: hrs,
        minutes: mins,
        seconds: secs,
        milliseconds: ms,
        isStopwatchRunning: stopwatchRunning,
      };
    } else if (activeMode === 'timer') {
      // Timer remaining count display
      const currentValSec = timerRunning ? timerRemaining : timerTotal;
      const mins = Math.floor(currentValSec / 60);
      const secs = Math.floor(currentValSec % 60);
      const ms = 0; // standard ticking countdown

      return {
        hours: 0,
        minutes: mins,
        seconds: secs,
        milliseconds: ms,
        isStopwatchRunning: false,
      };
    } else {
      // Standard local/timezone clock time
      return {
        hours: time.hours,
        minutes: time.minutes,
        seconds: time.seconds,
        milliseconds: time.milliseconds,
        isStopwatchRunning: false,
      };
    }
  };

  const dialArgs = getClockFaceRenderArgs();

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#c5a059]/35 flex flex-col justify-between" id="app-viewport">
      
      {/* Dynamic Alert Banner for finished timer */}
      {isTimerFinished && (
        <div className="bg-rose-950 text-rose-200 border-b border-rose-800/40 py-3 px-4 text-center text-xs font-mono tracking-wide font-bold animate-pulse flex items-center justify-center gap-2 relative z-50 select-none shadow-md">
          🚨 COUNTDOWN CALIBRATION CONCLUDED! TAP RESET OR DISENGAGE ALERT.
          <button 
            onClick={handleResetTimer}
            id="dismiss-timer-banner-btn"
            className="ml-4 bg-[#c5a059] hover:bg-[#cca05a] active:bg-[#9a6e2a] text-[#050505] font-sans text-2xs uppercase tracking-wider py-1 px-3 rounded-lg font-bold transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Section */}
      <header className="border-b border-zinc-900 bg-[#0a0a0a]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-lg select-none">
        <div className="flex items-center gap-3">
          {/* Humble Watchmaking Escapement gear icon overlay */}
          <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 flex items-center justify-center border border-[#c5a059]/40">
            <span className="font-serif text-[#c5a059] text-sm font-black">P</span>
          </div>
          <div>
            <h1 className="font-serif font-medium text-sm tracking-[0.25em] text-[#c5a059] uppercase">
              PRÄZISION L'HORLOGE
            </h1>
            <p className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest leading-none mt-0.5 text-left">
              Glashütte Caliber • Studio Series
            </p>
          </div>
        </div>

        {/* Sync Calibration Health indicator */}
        <div className="flex items-center gap-2">
          <div className="bg-[#0f0f0f] border border-zinc-800/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-tight">
              Calibrated • Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* Mode Switcher Segments */}
        {renderModeHeader()}

        {/* Dashboard Grid split */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Dynamic Watch Face Block (LColumn) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center bg-[#0d0d0d] rounded-4xl border border-zinc-900/60 p-6 sm:p-10 shadow-2xl relative overflow-hidden min-h-[460px] md:min-h-[520px]">
            {/* Absolute background accent lines for instrument-lab aesthetic */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/20 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/10 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/10 to-transparent" />

            {/* Title / Timezone Tag */}
            <div className="absolute top-6 left-6 flex items-center gap-2 select-none">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[#c5a059]`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 bg-[#c5a059]`}></span>
              </span>
              <span className="font-serif italic text-[11px] text-[#c5a059] uppercase tracking-[0.1em] font-semibold">
                {activeMode === 'clock'
                  ? `Timezone: ${settings.selectedTimezone === 'local' ? '📍 Local Time' : TIMEZONES.find(t => t.id === settings.selectedTimezone)?.city || 'Global'}`
                  : activeMode === 'stopwatch'
                  ? 'High Frequency Lap Chrono'
                  : 'Pomodoro / Kitchen Timer'}
              </span>
            </div>

            {/* SVG Interactive ClockFace Renderer */}
            <ClockFace
              style={settings.style}
              motion={settings.motion}
              showNumbers={settings.showNumbers}
              showTicks={settings.showTicks}
              showDateComplication={settings.showDateComplication}
              showDigitalReadout={settings.showDigitalReadout}
              hours={dialArgs.hours}
              minutes={dialArgs.minutes}
              seconds={dialArgs.seconds}
              milliseconds={dialArgs.milliseconds}
              timerActive={timerRunning}
              timerTotal={timerTotal}
              timerRemaining={timerRemaining}
              isTimerSettingMode={isTimerSettingMode}
              onSetTimerDuration={handleSetTimerDurationFromDial}
              isStopwatchRunning={dialArgs.isStopwatchRunning}
            />

            {/* Secondary Digital Chrono Readout Overlay inside Card space */}
            {settings.showDigitalReadout && (
              <div className="mt-4 bg-[#080808] border border-[#c5a059]/15 rounded-xl px-5 py-2.5 font-mono text-center flex flex-col select-none shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                  MASTER DIGITAL TELEMETRY
                </span>
                <span className="text-sm font-semibold tracking-wider text-[#e0e0e0] mt-1 font-mono">
                  {activeMode === 'clock' && liveFormattedTimeStr}
                  {activeMode === 'stopwatch' && (
                    <>
                      {String(Math.floor(stopwatchElapsed / 60)).padStart(2, '0')}:
                      {String(Math.floor(stopwatchElapsed % 60)).padStart(2, '0')}.
                      <span className="text-[#c5a059] font-bold">
                        {String(Math.floor((stopwatchElapsed % 1) * 100)).padStart(2, '0')}
                      </span>
                    </>
                  )}
                  {activeMode === 'timer' && (
                    <>
                      {String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:
                      {String(Math.floor(timerRemaining % 60)).padStart(2, '0')}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Controls & Configuration Block (RColumn) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
            
            {/* Auxiliary Custom Controls relating to dynamic Mode */}
            {activeMode === 'clock' && (
              <TimezoneSelector
                selectedId={settings.selectedTimezone}
                onSelectTimezone={(id) => setSettings({ ...settings, selectedTimezone: id })}
                currentTime={new Date()}
              />
            )}

            {activeMode === 'stopwatch' && (
              <StopwatchPanel
                isRunning={stopwatchRunning}
                elapsedSeconds={stopwatchElapsed}
                laps={stopwatchLaps}
                onStart={handleStartStopwatch}
                onPause={handlePauseStopwatch}
                onLap={handleLapStopwatch}
                onReset={handleResetStopwatch}
              />
            )}

            {activeMode === 'timer' && (
              <TimerPanel
                isActive={timerRunning}
                isSetting={isTimerSettingMode}
                totalSeconds={timerTotal}
                remainingSeconds={timerRemaining}
                onStart={handleStartTimer}
                onPause={handlePauseTimer}
                onReset={handleResetTimer}
                onSelectPreset={handleSelectTimerPreset}
                onToggleSettingMode={handleToggleTimerSettingMode}
              />
            )}

            {/* Master Settings Control Board */}
            <SettingsPanel
              settings={settings}
              onChangeSettings={setSettings}
              enableTickSound={enableTickSound}
              onToggleTickSound={() => setEnableTickSound(!enableTickSound)}
              onResetSettings={handleResetSettings}
            />

          </div>

        </div>

      </main>

      {/* Bottom Footer Section */}
      <footer className="border-t border-zinc-900 bg-[#0d0d0d] py-6 mt-12 select-none">
        <div className="w-full max-w-7xl mx-auto px-6 text-center flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
            <Info className="w-3.5 h-3.5 text-[#c5a059]/65" />
            <span className="font-sans text-zinc-400">
              Designed as a premium vector instrumentation interface in accordance with Genève horological traditions.
            </span>
          </div>
          <p className="font-mono text-[9px] text-[#c5a059]/50 uppercase tracking-[0.2em] mt-1">
            © 2026 PRÄZISION WATCH CORP. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

    </div>
  );
}
