export interface TimeZoneItem {
  id: string; // e.g. "America/New_York" or "local"
  label: string; // e.g. "New York"
  city: string;
  country: string;
  flag: string; // emoji flag helper
}

export const TIMEZONES: TimeZoneItem[] = [
  { id: 'local', label: 'Local Time', city: 'Home', country: 'Local', flag: '📍' },
  { id: 'UTC', label: 'UTC', city: 'Coordinated Universal', country: 'Global', flag: '🌐' },
  { id: 'America/New_York', label: 'New York', city: 'New York', country: 'United States', flag: '🇺🇸' },
  { id: 'America/Los_Angeles', label: 'Los Angeles', city: 'Los Angeles', country: 'United States', flag: '🇺🇸' },
  { id: 'Europe/London', label: 'London', city: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { id: 'Europe/Paris', label: 'Paris', city: 'Paris', country: 'France', flag: '🇫🇷' },
  { id: 'Africa/Cairo', label: 'Cairo', city: 'Cairo', country: 'Egypt', flag: '🇪🇬' },
  { id: 'Asia/Dubai', label: 'Dubai', city: 'Dubai', country: 'United Arab Emirates', flag: '🇦🇪' },
  { id: 'Asia/Kolkata', label: 'Mumbai', city: 'Mumbai', country: 'India', flag: '🇮🇳' },
  { id: 'Asia/Singapore', label: 'Singapore', city: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { id: 'Asia/Tokyo', label: 'Tokyo', city: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { id: 'Australia/Sydney', label: 'Sydney', city: 'Sydney', country: 'Australia', flag: '🇦🇺' },
];

export const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
export const ARABIC_NUMERALS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export function getTimeInTimezone(timezoneId: string): { date: Date; label: string; offsetString: string } {
  const now = new Date();
  if (timezoneId === 'local') {
    const offsetMin = -now.getTimezoneOffset();
    const offsetHrs = Math.floor(Math.abs(offsetMin) / 60);
    const offsetMins = Math.abs(offsetMin) % 60;
    const sign = offsetMin >= 0 ? '+' : '-';
    const formattedOffset = `UTC${sign}${String(offsetHrs).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
    return { date: now, label: 'Local Time', offsetString: formattedOffset };
  }

  try {
    // We format the date parts using the provided timezone ID
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    
    const parts = formatter.formatToParts(now);
    const getPartValue = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    
    const year = getPartValue('year');
    const month = getPartValue('month') - 1; // 0-indexed month
    const day = getPartValue('day');
    const hour = getPartValue('hour');
    const minute = getPartValue('minute');
    const second = getPartValue('second');
    const millisecond = now.getMilliseconds(); // standard millisecond matching
    
    const tzDate = new Date(year, month, day, hour, minute, second, millisecond);

    // Get time zone offset string (e.g. UTC+01:00)
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezoneId,
      timeZoneName: 'longOffset',
    });
    const tzOffsetPart = tzFormatter.formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';
    
    return {
      date: tzDate,
      label: timezoneId.split('/').pop()?.replace('_', ' ') || timezoneId,
      offsetString: tzOffsetPart.replace('GMT', 'UTC'),
    };
  } catch (e) {
    return { date: now, label: 'Local Time', offsetString: 'UTC+00:00' };
  }
}
