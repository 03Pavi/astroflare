import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';

dayjs.extend(dayOfYear);

const zodiacConfig = [
  { name: 'Aries', startDay: 80, endDay: 109 },
  { name: 'Taurus', startDay: 110, endDay: 140 },
  { name: 'Gemini', startDay: 141, endDay: 171 },
  { name: 'Cancer', startDay: 172, endDay: 203 },
  { name: 'Leo', startDay: 204, endDay: 234 },
  { name: 'Virgo', startDay: 235, endDay: 265 },
  { name: 'Libra', startDay: 266, endDay: 295 },
  { name: 'Scorpio', startDay: 296, endDay: 325 },
  { name: 'Sagittarius', startDay: 326, endDay: 355 },
  { name: 'Capricorn', startDay: 356, endDay: 19 },
  { name: 'Aquarius', startDay: 20, endDay: 49 },
  { name: 'Pisces', startDay: 50, endDay: 79 },
];

/**
 * Returns detailed today date information.
 */
export const getTodayHoroscopeDate = () => {
  const now = dayjs();
  return {
    day: now.format('D'),
    month: now.format('MMMM'),
    year: now.format('YYYY'),
    full: now.format('MMMM D, YYYY'),
    display: now.format('MMM D')
  };
};

/**
 * Calculates zodiac ranges, clamping future end dates to today.
 * Includes detailed day and month fields for each range boundary.
 */
export const getZodiacRangesTillToday = () => {
  const today = dayjs();
  const year = today.year();

  return zodiacConfig.map(sign => {
    let start = dayjs().year(year).dayOfYear(sign.startDay);

    // Handle signs that started at the end of the previous year
    if (start.isAfter(today.add(1, 'month'))) {
      start = start.subtract(1, 'year');
    }

    let end =
      sign.endDay < sign.startDay
        ? dayjs().year(start.year() + 1).dayOfYear(sign.endDay)
        : dayjs().year(start.year()).dayOfYear(sign.endDay);

    // ✅ Clamp future dates to today for "daily insight" context
    const isFuture = end.isAfter(today);
    if (isFuture) end = today;

    return {
      name: sign.name,
      formatted: `${start.format('MMM D')} - ${end.format('MMM D')}`,
      startDay: start.format('D'),
      startMonth: start.format('MMMM'),
      endDay: end.format('D'),
      endMonth: end.format('MMMM'),
      isCurrentDay: isFuture && today.isAfter(start)
    };
  });
};