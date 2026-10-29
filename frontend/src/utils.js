export const fmtDur = (m) => {
  m = Math.max(0, Math.round(m || 0));
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h}h ${String(r).padStart(2, '0')}m` : `${r}m`;
};
export const fmtDate = (d) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');
// value for <input type="datetime-local">
export const toLocalInput = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
