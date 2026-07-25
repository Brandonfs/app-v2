const parseHourMinute = (value, fallback = '09:05') => {
  const source = String(value || fallback);
  const [h, m] = source.split(':').map((part) => Number(part));
  const hours = Number.isFinite(h) ? h : 9;
  const minutes = Number.isFinite(m) ? m : 5;
  return { hours, minutes };
};

const getTimePartsInTimezone = (date, timezone) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second')
  };
};

const minutesOfDayInTimezone = (date, timezone) => {
  const parts = getTimePartsInTimezone(date, timezone);
  return (parts.hour * 60) + parts.minute;
};

const isLateByThreshold = (date, threshold, timezone) => {
  const { hours, minutes } = parseHourMinute(threshold);
  const thresholdMinutes = (hours * 60) + minutes;
  return minutesOfDayInTimezone(date, timezone) > thresholdMinutes;
};

const formatDateTimeInTimezone = (dateValue, timezone) => {
  if (!dateValue) return '-';
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: timezone,
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date);
};

module.exports = {
  parseHourMinute,
  getTimePartsInTimezone,
  minutesOfDayInTimezone,
  isLateByThreshold,
  formatDateTimeInTimezone
};
