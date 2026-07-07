import React from 'react';

// Palette cohérente avec le thème
export const PALETTE = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

/*
  Donut chart 100% SVG (aucune dépendance).
  data: [{ label, value, color }]
*/
export function DonutChart({ data = [], size = 180, thickness = 22, centerLabel }) {
  const clean = data.filter((d) => Number(d.value) > 0);
  const total = clean.reduce((s, d) => s + Number(d.value), 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={thickness} />
          {total > 0 && clean.map((d, i) => {
            const len = (Number(d.value) / total) * C;
            const seg = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color || PALETTE[i % PALETTE.length]} strokeWidth={thickness}
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return seg;
          })}
        </g>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="24" fontWeight="700" fill="var(--text-color)">
          {centerLabel ?? total}
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-color)' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color || PALETTE[i % PALETTE.length], display: 'inline-block' }} />
            <span>{d.label}</span>
            <span style={{ color: 'var(--muted-text)' }}>· {d.value}{total > 0 ? ` (${Math.round((Number(d.value) / total) * 100)}%)` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/*
  Bar chart horizontal.
  data: [{ label, value, color }]
*/
export function BarChart({ data = [], color = 'var(--btn-primary)' }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  if (!data.length) return <div className="text-sm" style={{ color: 'var(--muted-text)' }}>—</div>;
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1" style={{ color: 'var(--text-color)' }}>
            <span className="truncate pr-2">{d.label}</span>
            <span style={{ color: 'var(--muted-text)' }}>{d.value}</span>
          </div>
          <div style={{ background: 'var(--muted-bg)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${(Number(d.value) / max) * 100}%`, background: d.color || color, height: 10, borderRadius: 6, transition: 'width .4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Carte statistique compacte
export function StatCard({ icon, value, label, accent = 'var(--btn-primary)' }) {
  return (
    <div className="card flex items-center gap-4" style={{ borderLeft: `6px solid ${accent}` }}>
      {icon && <span style={{ color: accent, fontSize: 26 }}>{icon}</span>}
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>{value}</div>
        <div className="text-sm" style={{ color: 'var(--muted-text)' }}>{label}</div>
      </div>
    </div>
  );
}
