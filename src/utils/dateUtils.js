/**
 * Utility functions for authoritative Philippines Standard Time (PST / UTC+8) date & time formatting.
 * Guaranteed to produce accurate Philippine local time across all Android/iOS/Web environments.
 */

/**
 * Robust UTC timestamp parser that prevents local timezone skew on database timestamps.
 */
function parseToUTCDate(dateInput) {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateInput === 'string') {
    let s = dateInput.trim();
    if (!s) return null;

    // Pure numeric epoch ms string (e.g. "1791298800000")
    if (/^\d{11,}$/.test(s)) {
      const d = new Date(Number(s));
      return isNaN(d.getTime()) ? null : d;
    }

    // Explicit timezone specified (e.g. ends with 'Z' or '+08:00' or '-04:00')
    if (/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    // Standard SQL / ISO timestamp without timezone suffix (e.g. '2026-10-06 15:00:00' or '2026-10-06T15:00:00' or with milliseconds)
    // PostgreSQL / Prisma stores timestamps in UTC. When retrieved without 'Z', JS engines interpret it as local device time.
    // Explicitly treat timezone-less database timestamps as UTC:
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
      const d = new Date(s.replace(' ', 'T') + 'Z');
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Format any date input into Philippines Standard Time (UTC+8).
 * @param {string | number | Date} dateInput - Raw timestamp, ISO date string, or Date object
 * @param {'relative' | 'full' | 'time' | 'date' | 'dateTime'} formatType - Formatting mode
 * @returns {string} Formatted PHT string
 */
export function formatPHT(dateInput, formatType = 'relative') {
  const d = parseToUTCDate(dateInput);
  if (!d) return '—';

  // Calculate authoritative Philippines Time (UTC + 8 hours) using pure UTC getters
  const phtMillis = d.getTime() + (8 * 60 * 60 * 1000);
  const phtDate = new Date(phtMillis);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[phtDate.getUTCMonth()];
  const day = phtDate.getUTCDate();
  const year = phtDate.getUTCFullYear();

  let hours = phtDate.getUTCHours();
  const minutes = phtDate.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const timeStr = `${hours}:${minutes} ${ampm}`;

  if (formatType === 'time') return timeStr;
  if (formatType === 'date') return `${month} ${day}, ${year}`;
  if (formatType === 'dateTime') return `${month} ${day}, ${year} • ${timeStr}`;

  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));

  if (formatType === 'relative') {
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return `Yesterday, ${timeStr}`;
    return `${month} ${day}, ${timeStr}`;
  }

  // Default: 'full' (e.g. "Oct 6, 11:00 PM")
  return `${month} ${day}, ${timeStr}`;
}

/**
 * Convenience helper for relative PHT timestamp (e.g. "5m ago", "2h ago", "Yesterday, 3:30 PM")
 */
export function formatPHTRelative(dateInput) {
  return formatPHT(dateInput, 'relative');
}

/**
 * Convenience helper for PHT date and time (e.g. "Oct 6, 11:00 PM")
 */
export function formatPHTFull(dateInput) {
  return formatPHT(dateInput, 'full');
}
