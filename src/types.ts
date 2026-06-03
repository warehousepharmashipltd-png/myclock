export type AppMode = 'clock' | 'stopwatch' | 'timer';

export interface TimezoneOption {
  value: string;
  label: string;
  offset: number; // in hours from UTC
  city: string;
}

export type ClockStyle = 'bauhaus' | 'minimalist' | 'chronograph' | 'roman';

export type HandMotion = 'sweep' | 'tick' | 'spring';

export interface ClockSettings {
  style: ClockStyle;
  motion: HandMotion;
  showNumbers: boolean;
  showTicks: boolean;
  showDateComplication: boolean;
  showDigitalReadout: boolean;
  selectedTimezone: string;
}
