import React, { useRef, useState, useEffect } from 'react';
import { ClockStyle, HandMotion } from '../types';
import { ROMAN_NUMERALS, ARABIC_NUMERALS } from '../constants';

interface ClockFaceProps {
  style: ClockStyle;
  motion: HandMotion;
  showNumbers: boolean;
  showTicks: boolean;
  showDateComplication: boolean;
  showDigitalReadout: boolean;
  // Current active time/value
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  // Timer specific
  timerActive: boolean;
  timerTotal: number; // in seconds
  timerRemaining: number; // in seconds
  onSetTimerDuration?: (minutes: number) => void;
  isTimerSettingMode: boolean;
  // Sweep/Tick reference
  isStopwatchRunning?: boolean;
}

export const ClockFace: React.FC<ClockFaceProps> = ({
  style,
  motion,
  showNumbers,
  showTicks,
  showDateComplication,
  showDigitalReadout,
  hours,
  minutes,
  seconds,
  milliseconds,
  timerActive,
  timerTotal,
  timerRemaining,
  onSetTimerDuration,
  isTimerSettingMode,
  isStopwatchRunning,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate angles for the hands
  const getHandAngles = () => {
    // For seconds
    let sAngle = seconds * 6;
    if (motion === 'sweep' || (isStopwatchRunning && motion === 'sweep')) {
      sAngle += milliseconds * 0.006;
    }

    // Minutes can progress smoothly
    const mAngle = minutes * 6 + seconds * 0.1;

    // Hours progress smoothly
    const hAngle = (hours % 12) * 30 + minutes * 0.5;

    // Special spring motion angle adjustment on second transition
    let displayedSAngle = sAngle;
    if (motion === 'spring' && !isStopwatchRunning) {
      // Create a deadbeat spring bounce. We calculate the progress of the current second.
      const factor = milliseconds / 1000;
      if (factor < 0.25) {
        // Bounce formula: overshoot then oscillate back
        const amplitude = 3; // degrees overshoot
        const frequency = 25; // speed of bounce
        const decay = Math.exp(-factor * 12);
        const bounce = amplitude * Math.sin(factor * frequency) * decay;
        displayedSAngle = (seconds * 6) + bounce;
      } else {
        displayedSAngle = seconds * 6;
      }
    }

    return {
      hourAngle: hAngle,
      minuteAngle: mAngle,
      secondAngle: displayedSAngle,
    };
  };

  const { hourAngle, minuteAngle, secondAngle } = getHandAngles();

  // Handle Dragging on the dial to set timer duration (0 to 60 mins)
  const handleDialInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!isTimerSettingMode || !onSetTimerDuration || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Math.atan2 returns from -PI to PI
    // We adjust it so 12 o'clock is 0, clockwise positive
    let angleRad = Math.atan2(dy, dx) + Math.PI / 2;
    if (angleRad < 0) {
      angleRad += 2 * Math.PI;
    }

    let deg = (angleRad * 180) / Math.PI;
    deg = (deg + 360) % 360;

    // Map deg to minutes (360 degrees = 60 minutes)
    // Round to the nearest minute, capping at 60
    let mins = Math.round(deg / 6);
    if (mins === 0 && deg > 340) {
      mins = 60;
    } else if (mins === 0 && deg < 15) {
      mins = 0;
    }
    
    // Safety cap
    mins = Math.max(0, Math.min(60, mins));
    onSetTimerDuration(mins);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isTimerSettingMode) return;
    setIsDragging(true);
    handleDialInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    handleDialInteraction(e);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isTimerSettingMode) return;
    setIsDragging(true);
    handleDialInteraction(e);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    handleDialInteraction(e);
  };

  // Generate ticks
  const renderTicks = () => {
    if (!showTicks) return null;

    const ticksList = [];
    // Major ticks (hours) and minor ticks (minutes)
    for (let i = 0; i < 60; i++) {
      const isHour = i % 5 === 0;
      const angle = i * 6; // 360 / 60 = 6 deg per tick

      let length = 8;
      let strokeWidth = 1;
      let strokeColor = 'stroke-[#4a4a4a]';
      
      // Chrono mode styling (finer ticks, subseconds ticks)
      if (style === 'chronograph') {
        if (isHour) {
          length = 15;
          strokeWidth = 2.5;
          strokeColor = 'stroke-[#c5a059]';
        } else {
          length = 8;
          strokeWidth = 1.2;
          strokeColor = 'stroke-zinc-600';
        }
      } else if (style === 'minimalist') {
        if (isHour) {
          length = 10;
          strokeWidth = 2;
          strokeColor = 'stroke-[#c5a059]';
        } else {
          continue; // No minute ticks for minimalist option
        }
      } else {
        // Bauhaus & Roman
        if (isHour) {
          length = 12;
          strokeWidth = 2;
          strokeColor = 'stroke-[#c5a059]';
        } else {
          length = 7;
          strokeWidth = 1;
          strokeColor = 'stroke-[#424242]';
        }
      }

      ticksList.push(
        <line
          key={`tick-${i}`}
          x1="200"
          y1={200 - 175 + length}
          x2="200"
          y2="200 - 175"
          className={`${strokeColor}`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          transform={`rotate(${angle}, 200, 200)`}
          id={`clock-tick-${i}`}
        />
      );

      // Chrono layout has tiny fractional ticks (1/5th seconds)
      if (style === 'chronograph' && !isHour) {
        for (let s = 1; s < 5; s++) {
          const subAngle = angle + s * 1.2; // 6 / 5 = 1.2 deg
          ticksList.push(
            <line
              key={`chrono-subtick-${i}-${s}`}
              x1="200"
              y1={200 - 175 + 4}
              x2="200"
              y2="200 - 175"
              className="stroke-zinc-800"
              strokeWidth={0.6}
              transform={`rotate(${subAngle}, 200, 200)`}
              id={`clock-chrono-tick-${i}-${s}`}
            />
          );
        }
      }
    }

    return ticksList;
  };

  // Generate Numerals
  const renderNumerals = () => {
    if (!showNumbers || style === 'minimalist') return null;

    const numeralValues = style === 'roman' ? ROMAN_NUMERALS : ARABIC_NUMERALS;
    const numeralsList = [];

    // Roman numerals are written straight-up or rotated. Watchfaces generally keep them straight-up.
    // Bauhaus style uses gorgeous clean sans-serif typography.
    for (let i = 0; i < 12; i++) {
      const angle = i * 30; // 360 / 12 = 30 deg
      const rad = ((angle - 90) * Math.PI) / 180;
      
      // Distance from center
      const r = style === 'chronograph' ? 134 : 142;

      const x = 200 + r * Math.cos(rad);
      const y = 200 + r * Math.sin(rad) + (style === 'roman' ? 7 : 5); // offset font height

      let fontClass = 'font-sans font-medium text-[#e0e0e0]';
      let fontSize = '18px';

      if (style === 'roman') {
        fontClass = 'font-serif font-light text-[#c5a059]/90';
        fontSize = '18px';
      } else if (style === 'bauhaus') {
        fontClass = 'font-sans font-extralight text-[#e0e0e0] tracking-tight';
        fontSize = '19px';
      } else if (style === 'chronograph') {
        fontClass = 'font-display font-medium text-[#c5a059]';
        fontSize = '16px';
      }

      // Highlight the 12 o'clock in chronological/bauhaus styles
      const isTwelve = i === 0;

      numeralsList.push(
        <text
          key={`numeral-${i}`}
          x={x}
          y={y}
          textAnchor="middle"
          className={`${fontClass} select-none`}
          style={{ fontSize, fill: isTwelve ? '#c5a059' : 'currentColor' }}
          id={`clock-numeral-${i}`}
        >
          {numeralValues[i]}
        </text>
      );
    }

    return numeralsList;
  };

  // Helper properties for visual timer sectors
  // Timer countdown sector drawn as an SVG slice wrapper
  const getTimerWedgePath = () => {
    let remainingMinutes = 0;
    if (isTimerSettingMode) {
      remainingMinutes = timerTotal / 60; // controlled via setting drag
    } else if (timerActive) {
      remainingMinutes = timerRemaining / 60;
    }

    if (remainingMinutes <= 0) return null;

    // Remaining minutes to degrees: 1 min = 6 degrees.
    const deg = Math.min(360, Math.max(0, remainingMinutes * 6));
    if (deg >= 360) {
      // Complete circle slice
      return (
        <circle
          cx="200"
          cy="200"
          r="165"
          className="fill-[#c5a059]/5 stroke-[#c5a059]/30"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      );
    }

    // Outer radius points
    const r = 165;
    // We start slice at 12 o'clock, which is top: (200, 200 - r) = (200, 35)
    // We end at angle 'deg' clockwise
    const rad = ((deg - 90) * Math.PI) / 180;
    const xEnd = 200 + r * Math.cos(rad);
    const yEnd = 200 + r * Math.sin(rad);

    // Large-arc flag is 1 if degrees > 180
    const largeArcFlag = deg > 180 ? 1 : 0;

    // SVG arc path from (200, 35) to (xEnd, yEnd)
    // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
    return (
      <path
        d={`M 200 200 L 200 ${200 - r} A ${r} ${r} 0 ${largeArcFlag} 1 ${xEnd} ${yEnd} Z`}
        className="fill-[#c5a059]/10 stroke-[#c5a059]/40"
        strokeWidth="1.5"
        strokeDashjoin="round"
      />
    );
  };

  // Mechanical Date Complication window (traditional mechanical white disc at 3 o'clock)
  const renderDateComplication = () => {
    if (!showDateComplication) return null;

    // Position at 3 o'clock (around x=305, y=200)
    // Show current local calendar day
    const dayOfMonth = new Date().getDate();
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

    return (
      <g id="date-complication" className="select-none">
        {/* Subtle physical border window cut-out of the watch dial */}
        <rect
          x="285"
          y="187"
          width="50"
          height="26"
          rx="3"
          className="fill-[#0d0d0d] stroke-[#c5a059]/30"
          strokeWidth="1.5"
        />
        {/* Inner shadowed pocket */}
        <rect
          x="287"
          y="189"
          width="46"
          height="22"
          rx="1"
          className="fill-[#050505]"
        />
        {/* Day name label */}
        <text
          x="298"
          y="204"
          className="font-mono text-[8px] font-bold text-center select-none tracking-tighter"
          fill="#8a817c"
        >
          {dayName}
        </text>
        {/* Day of month number */}
        <text
          x="320"
          y="205"
          className="font-mono text-xs font-semibold text-[#c5a059] text-center select-none"
        >
          {String(dayOfMonth).padStart(2, '0')}
        </text>
      </g>
    );
  };

  // Clean layout helper for Chronograph sub-dials (mini ticks for milliseconds count)
  const renderChronoSubdials = () => {
    if (style !== 'chronograph') return null;

    // Subdial 1: Elapsed seconds subdial at 6 o'clock (x=200, y=285)
    // Lets make it a beautiful 30s or 60ms count dial
    const ticks = [];
    const radius = 32;
    const sy = 285;
    const sx = 200;

    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const isSec = i % 3 === 0;
      const length = isSec ? 4 : 2;
      const color = isSec ? 'stroke-[#c5a059]/70' : 'stroke-zinc-800';
      
      ticks.push(
        <line
          key={`sub-tick-${i}`}
          x1={sx}
          y1={sy - radius + length}
          x2={sx}
          y2={sy - radius}
          className={`${color}`}
          strokeWidth="1"
          transform={`rotate(${angle}, ${sx}, ${sy})`}
        />
      );

      if (isSec && i > 0) {
        // sub dial numbers (15, 30, 45, 60 or custom value labels)
        const labels = ['0', '15', '30', '45'];
        const labelText = labels[i / 3];
        const rad = ((angle - 90) * Math.PI) / 180;
        const lx = sx + (radius - 10) * Math.cos(rad);
        const ly = sy + (radius - 10) * Math.sin(rad) + 3;
        
        ticks.push(
          <text
            key={`sub-label-${i}`}
            x={lx}
            y={ly}
            className="font-mono text-[6px] font-medium text-zinc-550"
            textAnchor="middle"
          >
            {labelText}
          </text>
        );
      }
    }

    // Hand rotation on the chrono subdial representing running milliseconds
    const handAngle = (milliseconds * 360) / 1000;

    return (
      <g id="chrono-subdial" className="select-none opacity-80">
        {/* Track circle */}
        <circle
          cx={sx}
          cy={sy}
          r={radius}
          className="fill-none stroke-zinc-800"
          strokeWidth="0.8"
        />
        {ticks}
        {/* Subdial core pin */}
        <circle cx={sx} cy={sy} r="2" className="fill-[#c5a059]" />
        {/* Mini sweeping pointer hand */}
        <line
          x1={sx}
          y1={sy}
          x2={sx}
          y2={sy - radius + 4}
          className="stroke-[#c5a059]"
          strokeWidth="1.2"
          strokeLinecap="round"
          transform={`rotate(${handAngle}, ${sx}, ${sy})`}
        />
      </g>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-2">
      {/* Outer physical clock casing shadow layer */}
      <div 
        className="w-full max-w-[340px] xs:max-w-[370px] sm:max-w-[420px] aspect-square rounded-full flex items-center justify-center bg-gradient-to-br from-[#1c1c1c] via-[#101010] to-[#070707] p-3 sm:p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),_0_0_80px_rgba(197,160,89,0.05)] border-[#c5a05933] border-[3.5px]"
        id="analog-clock-container"
      >
        {/* Inner bezel and dial face container */}
        <div className="w-full h-full rounded-full bg-[#050505] border border-zinc-900 relative flex items-center justify-center shadow-[inset_0_10px_35px_rgba(0,0,0,0.95)] overflow-hidden">
          
          <svg
            ref={svgRef}
            viewBox="0 0 400 400"
            className="w-full h-full select-none cursor-default"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUpOrLeave}
            id="watch-dial-svg"
          >
            <defs>
              {/* Soft gold gradient for luxury metallic hands accent */}
              <linearGradient id="gold-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#cca05a" />
                <stop offset="100%" stopColor="#9a6e2a" />
              </linearGradient>
              {/* Fine center hub radial shadow */}
              <radialGradient id="hub-shadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
              {/* Dial bezel inner shadow drop */}
              <radialGradient id="dial-gradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#151515" />
                <stop offset="85%" stopColor="#080808" />
                <stop offset="100%" stopColor="#030303" />
              </radialGradient>
            </defs>
 
            {/* Dial background with subtle physical gradient */}
            <circle cx="200" cy="200" r="182" fill="url(#dial-gradient)" />
            <circle cx="200" cy="200" r="182" className="fill-none stroke-[#c5a059]/20" strokeWidth="1.2" />
 
            {/* Visual timer segment sector */}
            {getTimerWedgePath()}
 
            {/* Date Complication window */}
            {renderDateComplication()}
 
            {/* Chrono subdials */}
            {renderChronoSubdials()}
 
            {/* Numbers & ticks */}
            {renderTicks()}
            {renderNumerals()}
 
            {/* --- CLOCK HANDS --- */}
 
            {/* 1. Hour Hand (Chunky elegant profile) */}
            <g transform={`rotate(${hourAngle}, 200, 200)`} id="hour-hand-group">
              {style === 'chronograph' ? (
                // Military-styled baton hand
                <path
                  d="M 197 220 L 197 105 L 203 105 L 203 220 Z"
                  className="fill-[#e5e0d8]"
                  filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.5))"
                />
              ) : style === 'bauhaus' ? (
                // Super thin minimal rod
                <line
                  x1="200"
                  y1="210"
                  x2="200"
                  y2="115"
                  className="stroke-[#e5e0d8]"
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.4))"
                />
              ) : style === 'roman' ? (
                // Vintage ornate pear shape / Breguet-style hand
                <g filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.5))" className="fill-[#c5a059]">
                  <path d="M 198 215 L 198 125 A 4 4 0 0 1 196 120 C 196 114 204 114 204 120 A 4 4 0 0 1 202 125 L 202 215 Z" />
                </g>
              ) : (
                // Minimalist - Clean tapered bar
                <path
                  d="M 197.5 210 L 198.5 110 L 201.5 110 L 202.5 210 Z"
                  className="fill-[#c5a059]"
                  filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.4))"
                />
              )}
            </g>
 
            {/* 2. Minute Hand (Sleek pointer) */}
            <g transform={`rotate(${minuteAngle}, 200, 200)`} id="minute-hand-group">
              {style === 'chronograph' ? (
                <path
                  d="M 198 220 L 198 62 L 202 62 L 202 220 Z"
                  className="fill-[#e5e0d8]"
                  filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.5))"
                />
              ) : style === 'bauhaus' ? (
                <line
                  x1="200"
                  y1="220"
                  x2="200"
                  y2="70"
                  className="stroke-[#e5e0d8]"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.4))"
                />
              ) : style === 'roman' ? (
                // Elegant long thin leaf shape
                <g filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.5))" className="fill-[#c5a560]">
                  <path d="M 199 220 L 199 85 A 3.5 3.5 0 0 1 197.5 80 C 197.5 75 202.5 75 202.5 80 A 3.5 3.5 0 0 1 201 85 L 201 220 Z" />
                </g>
              ) : (
                // Minimalist
                <path
                  d="M 198.5 220 L 199.2 65 L 200.8 65 L 201.5 220 Z"
                  className="fill-[#c5a560]"
                  filter="drop-shadow(0px 2.5px 3px rgba(0,0,0,0.4))"
                />
              )}
            </g>
 
            {/* 3. Second Hand - Antique Gold sweep center */}
            <g transform={`rotate(${secondAngle}, 200, 200)`} id="second-hand-group">
              <g filter="drop-shadow(0px 3px 3px rgba(0, 0, 0, 0.6))">
                {/* Long sweeping pointer line */}
                <line
                  x1="200"
                  y1="235"
                  x2="200"
                  y2="50"
                  className={isTimerSettingMode ? "stroke-rose-500" : "stroke-[#c5a059]"}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                
                {/* Custom circular tail balance (traditional luxury element) */}
                <circle
                  cx="200"
                  cy="225"
                  r="4.5"
                  fill="none"
                  className={isTimerSettingMode ? "stroke-rose-500" : "stroke-[#c5a059]"}
                  strokeWidth="1.5"
                />
 
                {/* Arrowhead / Dot on the second hand for chronograph */}
                {style === 'chronograph' && (
                  <circle
                    cx="200"
                    cy="65"
                    r="3.5"
                    className="fill-[#c5a059]"
                  />
                )}
              </g>
            </g>
 
            {/* 4. Center PIN & Polished Hub Cap (Adds depth and occlusion) */}
            <g id="center-hub-pin">
              {/* Hub Shadow */}
              <circle cx="200" cy="200" r="10" fill="url(#hub-shadow)" />
              {/* Luxury metal ring */}
              <circle cx="200" cy="200" r="8" className="fill-[#1b1b1b]" />
              {/* Inner accent core (adds high-end light reflective detail) */}
              <circle cx="199.5" cy="199.5" r="4.5" fill="url(#gold-metallic)" />
              <circle cx="200" cy="200" r="2" className="fill-[#050505]" />
            </g>
          </svg>
 
          {/* Visual overlays for interaction cues in Timer drag mode */}
          {isTimerSettingMode && (
            <div className="absolute inset-0 bg-[#c5a059]/5 rounded-full pointer-events-none flex flex-col items-center justify-center border border-[#c5a059]/15">
              <div className="bg-[#121212]/95 border border-[#c5a059]/20 px-3 py-1.5 rounded-full shadow-md text-[10px] font-sans font-medium uppercase tracking-wider text-[#c5a059] animate-pulse select-none">
                Drag dial to set duration
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Decorative text underneath: Sophisticated Dark Luxury Watch vibe */}
      <div className="mt-4 flex flex-col items-center tracking-wider select-none text-center">
        <span className="font-serif italic text-sm tracking-[0.25em] text-[#c5a059] uppercase font-semibold">
          {style === 'bauhaus'
            ? 'PRÄZISION'
            : style === 'roman'
            ? "L'HORLOGE DE GENÈVE"
            : style === 'minimalist'
            ? 'MONOLITH NOIR'
            : 'CHRONOGRAPHE ROYALE'}
        </span>
        <span className="font-mono text-[9px] text-zinc-500 mt-1 uppercase tracking-[0.15em]">
          Glashütte Caliber • Precision Escapement
        </span>
      </div>
    </div>
  );
};
