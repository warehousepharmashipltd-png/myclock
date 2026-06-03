let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTickSound(isTock: boolean = false) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Audio design for mechanical click/tick sound
    // Woodblock-like high frequency transient
    osc.type = 'triangle';
    
    // Tock (major tick e.g. on full seconds / 5-second marks) vs normal tick
    const baseFreq = isTock ? 850 : 1200;
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    // pitch slide down for a wooden click
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.015);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isTock ? 1200 : 2000, ctx.currentTime);
    filter.Q.setValueAtTime(4, ctx.currentTime);

    // Envelope
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    // Fail silently if browser blocks audio
  }
}

export function playAlarmSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Double-beep alarm sound
    const playBeep = (delay: number, duration: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.02);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    };

    // Synthesize classic dynamic dual-tone mechanical ding-ding!
    playBeep(0, 0.15, 2000);
    playBeep(0.2, 0.15, 2000);
  } catch (e) {
    // Fail silently
  }
}
