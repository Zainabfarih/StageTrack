import React from 'react';
import { motion } from 'framer-motion';

// En-tête de profil 
export function ProfileHeader({ initials, title, subtitle, chip, actions }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="card p-0 overflow-hidden mb-6">
      <div className="h-24" style={{ background: 'var(--gradient-primary)' }} />
      <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0"
          style={{ background: 'var(--gradient-primary)', border: '4px solid var(--card-solid)' }}>
          {initials}
        </div>
        <div className="flex-1 sm:pb-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>{title}</h1>
            {chip && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--muted-bg)', color: 'var(--btn-primary)' }}>{chip}</span>
            )}
          </div>
          {subtitle && <div className="text-sm mt-0.5" style={{ color: 'var(--muted-text)' }}>{subtitle}</div>}
        </div>
        {actions && <div className="flex gap-2 sm:pb-1">{actions}</div>}
      </div>
    </motion.div>
  );
}

// Section avec titre
export function Section({ title, children, className = '' }) {
  return (
    <div className={`card mb-6 ${className}`}>
      {title && <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--muted-text)' }}>{title}</h2>}
      {children}
    </div>
  );
}

// Champ d'info 
export function InfoField({ label, value, editing, name, onChange, type = 'text', options, placeholder }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-text)' }}>{label}</div>
      {editing ? (
        options ? (
          <select name={name} value={value || ''} onChange={onChange} className="w-full p-2 border rounded-lg"
            style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
            <option value="">—</option>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ) : (
          <input name={name} type={type} value={value || ''} onChange={onChange} placeholder={placeholder}
            className="w-full p-2 border rounded-lg"
            style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
        )
      ) : (
        <div className="font-medium" style={{ color: 'var(--text-color)' }}>{value || '—'}</div>
      )}
    </div>
  );
}
