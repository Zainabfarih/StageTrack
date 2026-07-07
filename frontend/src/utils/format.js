// Formatage de date homogène dans toute l'application : yyyy-MM-dd
export const formatDate = (d) => {
  if (!d) return '—';
  const s = String(d);
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? s : dt.toISOString().slice(0, 10);
};

// Valeur pour un <input type="date"> : yyyy-MM-dd ou '' si vide
export const toDateInput = (d) => {
  if (!d) return '';
  const f = formatDate(d);
  return f === '—' ? '' : f;
};
