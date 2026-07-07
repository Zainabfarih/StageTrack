import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  // Fallback no-op si utilisé hors provider 
  return ctx || { success: () => {}, error: () => {}, info: () => {} };
}

const STYLES = {
  success: { bg: '#ecfdf5', border: '#22c55e', color: '#065f46', icon: '✓' },
  error: { bg: '#fef2f2', border: '#ef4444', color: '#991b1b', icon: '✕' },
  info: { bg: '#eff6ff', border: '#3b82f6', color: '#1e40af', icon: 'ℹ' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback((type, message) => {
    if (!message) return;
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message: String(message) }]);
    setTimeout(() => remove(id), 3800);
  }, [remove]);

  const api = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
        {toasts.map((toast) => {
          const s = STYLES[toast.type] || STYLES.info;
          return (
            <div key={toast.id} onClick={() => remove(toast.id)} role="alert"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
                background: s.bg, color: s.color, borderLeft: `4px solid ${s.border}`,
                padding: '12px 14px', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,.12)',
                fontSize: 14, animation: 'fadeIn .2s ease',
              }}>
              <span style={{ fontWeight: 700 }}>{s.icon}</span>
              <span>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
