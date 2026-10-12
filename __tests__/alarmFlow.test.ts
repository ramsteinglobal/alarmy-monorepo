/**
 * @format
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { getMissionChain, missionChainTitle, type StoredAlarm } from '../src/storage/alarmStorage';
import {
  getAutoDismissMinutes,
  getMaxSnoozes,
  getSnoozeMinutes,
  getWakeCheckMinutes,
} from '../src/storage/alarmStorage';
import { dateKey, formatDuration, sleepDurationMinutes } from '../src/storage/sleepStorage';
import { darkColors, lightColors } from '../src/theme';
import { buildTriggers, nextFireForDraft, nextOccurrence, to24h } from '../src/utils/nextTrigger';
import { formatTimeUntil } from '../src/utils/time';

const base: StoredAlarm = {
  id: 'a1',
  time: '7:30',
  period: 'AM',
  days: 'Mon, Wed',
  dayNames: ['Mon', 'Wed'],
  sound: { id: 'classic', name: 'Classic Alarm' },
  mission: { id: 'math', title: 'Math Mission' },
  enabled: true,
};

const at = (y: number, mo: number, d: number, h: number, mi: number) =>
  new Date(y, mo, d, h, mi, 0, 0);

describe('to24h', () => {
  test('converts 12h clock correctly', () => {
    expect(to24h('7:30', 'AM')).toEqual({ hour: 7, minute: 30 });
    expect(to24h('7:30', 'PM')).toEqual({ hour: 19, minute: 30 });
    expect(to24h('12:00', 'AM')).toEqual({ hour: 0, minute: 0 });
    expect(to24h('12:00', 'PM')).toEqual({ hour: 12, minute: 0 });
  });
});

describe('nextOccurrence', () => {
  // Monday 2026-10-12 06:00 local.
  const monday6am = at(2026, 9, 12, 6, 0);

  test('one-time alarm later today stays today', () => {
    const next = nextOccurrence({ time: '7:30', period: 'AM' }, null, monday6am);
    expect(next.getDate()).toBe(12);
    expect(next.getHours()).toBe(7);
  });

  test('one-time alarm already passed rolls to tomorrow', () => {
    const next = nextOccurrence({ time: '5:00', period: 'AM' }, null, monday6am);
    expect(next.getDate()).toBe(13);
  });

  test('weekday later this week stays this week', () => {
    // Wednesday = 3.
    const next = nextOccurrence({ time: '7:30', period: 'AM' }, 3, monday6am);
    expect(next.getDate()).toBe(14);
  });

  test('same weekday already passed rolls +7 days', () => {
    // Monday 7:30 already passed at 06:00? No — 07:30 > 06:00 so today.
    const today = nextOccurrence({ time: '7:30', period: 'AM' }, 1, monday6am);
    expect(today.getDate()).toBe(12);
    // Monday 5:00 already passed -> next Monday.
    const nextWeek = nextOccurrence({ time: '5:00', period: 'AM' }, 1, monday6am);
    expect(nextWeek.getDate()).toBe(19);
  });
});

describe('buildTriggers', () => {
  const from = at(2026, 9, 12, 6, 0);

  test('no days -> single one-time trigger, never repeats', () => {
    const triggers = buildTriggers({ ...base, dayNames: [] }, from);
    expect(triggers).toHaveLength(1);
    expect(triggers[0].key).toBe('once');
    expect(triggers[0].repeat).toBe(false);
    expect(triggers[0].at.getTime()).toBeGreaterThan(from.getTime());
  });

  test('selected days -> one weekly trigger each, all in the future', () => {
    const triggers = buildTriggers(base, from);
    expect(triggers).toHaveLength(2);
    expect(triggers.map(t => t.key).sort()).toEqual(['Mon', 'Wed']);
    for (const t of triggers) {
      expect(t.repeat).toBe(true);
      expect(t.at.getTime()).toBeGreaterThan(from.getTime());
    }
  });

  test('unknown day names are ignored, never crash', () => {
    const triggers = buildTriggers({ ...base, dayNames: ['Funday', 'Mon'] }, from);
    expect(triggers.map(t => t.key)).toEqual(['Mon']);
  });
});

describe('mission chain helpers', () => {
  test('legacy alarm with single mission normalises to one-step chain', () => {
    expect(getMissionChain(base)).toEqual([base.mission]);
    expect(missionChainTitle(base)).toBe('Math Mission');
  });

  test('multi-mission alarm keeps order and short title', () => {
    const alarm: StoredAlarm = {
      ...base,
      missions: [
        { id: 'math', title: 'Math Mission' },
        { id: 'shake', title: 'Shake Mission' },
        { id: 'photo', title: 'Photo Mission' },
      ],
    };
    expect(getMissionChain(alarm).map(m => m.id)).toEqual(['math', 'shake', 'photo']);
    expect(missionChainTitle(alarm)).toBe('Math Mission + 2 more');
  });

  test('empty missions array falls back to primary mission', () => {
    expect(getMissionChain({ ...base, missions: [] })).toEqual([base.mission]);
  });
});

describe('snooze trigger keys', () => {
  test('snooze key never collides with weekly keys', () => {
    const keys = new Set(['once', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'snooze']);
    const ids = [...keys].map(k => `${base.id}:${k}`);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('theme palettes', () => {
  test('dark palette has every light key so themed screens never miss a color', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });
});

describe('sleep math', () => {
  test('overnight duration wraps past midnight', () => {
    expect(sleepDurationMinutes(11, 15, 'PM', 7, 0, 'AM')).toBe(7 * 60 + 45);
    expect(sleepDurationMinutes(10, 0, 'PM', 6, 30, 'AM')).toBe(8 * 60 + 30);
  });

  test('same-evening duration stays within the day', () => {
    expect(sleepDurationMinutes(9, 0, 'PM', 11, 30, 'PM')).toBe(150);
  });

  test('formatDuration reads naturally', () => {
    expect(formatDuration(465)).toBe('7h 45m');
    expect(formatDuration(60)).toBe('1h 00m');
  });

  test('dateKey is stable YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 9, 12))).toBe('2026-10-12');
  });
});

describe('countdown + draft preview + per-alarm defaults', () => {
  const now = new Date(2026, 9, 12, 6, 0, 0);

  test('formatTimeUntil reads naturally', () => {
    expect(formatTimeUntil(new Date(now.getTime() + 6 * 3600e3 + 20 * 60e3), now)).toBe(
      'in 6h 20m',
    );
    expect(formatTimeUntil(new Date(now.getTime() + 45 * 60e3), now)).toBe('in 45m');
    expect(formatTimeUntil(new Date(now.getTime() - 1000), now)).toBe('ringing now');
  });

  test('nextFireForDraft matches buildTriggers for saved alarms', () => {
    const draftAt = nextFireForDraft('7:30', 'AM', ['Mon', 'Wed'], now);
    const savedAt = buildTriggers({ ...base, dayNames: ['Mon', 'Wed'] }, now)[0].at;
    expect(draftAt.getTime()).toBe(savedAt.getTime());
    expect(nextFireForDraft('7:30', 'AM', [], now).getTime()).toBeGreaterThan(now.getTime());
  });

  test('per-alarm tuning falls back to safe defaults', () => {
    expect(getSnoozeMinutes({})).toBe(5);
    expect(getMaxSnoozes({})).toBe(3);
    expect(getAutoDismissMinutes({})).toBe(30);
    expect(getWakeCheckMinutes({})).toBe(10);
    expect(getSnoozeMinutes({ snoozeMinutes: 10 })).toBe(10);
    expect(getMaxSnoozes({ maxSnoozes: 0 })).toBe(0);
    expect(getAutoDismissMinutes({ autoDismissMinutes: 0 })).toBe(0);
    expect(getWakeCheckMinutes({ wakeCheckMinutes: 0 })).toBe(0);
  });

  test('all trigger keys (incl. snooze/backup/wake-check) stay unique per alarm', () => {
    const keys = [
      'once',
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'snooze',
      'backup',
      'wakecheck',
      'wakerering',
    ];
    const ids = keys.map(k => `${base.id}:${k}`);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
