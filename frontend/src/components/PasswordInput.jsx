import React, { useState } from 'react';

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);


export default function PasswordInput({ label, className = '', style, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && (
        <label className="block mb-2 w-full text-left" style={{ color: 'var(--text-color)' }}>{label}</label>
      )}
      <div className="relative">
        <input
          {...props}
          type={show ? 'text' : 'password'}
          className={`w-full p-2 border rounded pr-11 ${className}`}
          style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)', ...style }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ color: 'var(--muted-text)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {show ? <EyeOff /> : <EyeOpen />}
        </button>
      </div>
    </div>
  );
}
