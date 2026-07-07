import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PasswordInput from '../components/PasswordInput';
import { api, setToken, setRefreshToken } from '../services/api';

const roleToDashboard = {
  ETUDIANT:             '/etudiant/dashboard',
  ADMIN_ENTREPRISE:     '/entreprise/dashboard',
  ADMIN_UNIV:           '/admin/dashboard',
  ENCADRANT_UNIV:       '/encadrant-univ/dashboard',
  ENCADRANT_ENTREPRISE: '/encadrant-entr/dashboard',
};

const BACKEND_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError(t('auth.fillAllFields')); return; }

    try {
      const data = await api.auth.login(email, password);

      setToken(data.accessToken);
      setRefreshToken(data.refreshToken || '');
      localStorage.setItem('role', data.role);
      localStorage.setItem('userId', String(data.id));
      if (data.uuid) localStorage.setItem('userUuid', data.uuid);
      const profileCompleted = data.profileCompleted ?? data.profile?.profile_completed ?? false;
      const needsPwd = data.needsPasswordChange ?? data.profile?.needs_password_change ?? false;
      localStorage.setItem('profile_completed', String(profileCompleted));
      localStorage.setItem('needs_password_change', String(needsPwd));

      if (needsPwd) { navigate('/change-password'); return; }
      if (!profileCompleted) { navigate('/complete-profile'); return; }

      navigate(roleToDashboard[data.role] || '/');
    } catch (err) {
      setError(err.message || t('auth.invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ background: 'var(--bg-color)' }}>
      <div className="card w-full max-w-md p-8 flex flex-col gap-6">
        <img src="/logo-stage-track.svg" alt="Logo" className="w-14 h-14 mx-auto mb-2" />
        <h1 className="h1 text-center mb-2">{t('common.login')}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-2 w-full text-left" style={{ color: 'var(--text-color)' }}>
              {t('auth.email')}
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
              required
            />
          </div>

          <div>
            <label className="block mb-2 w-full text-left" style={{ color: 'var(--text-color)' }}>
              {t('auth.password')}
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: 'var(--btn-primary)' }}>
              {t('auth.forgotPassword', 'Mot de passe oublié ?')}
            </Link>
          </div>

          {error && <div className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</div>}

          <button type="submit" className="btn-primary w-full">{t('auth.login')}</button>
        </form>

        {/* ─── Séparateur ─── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          <span className="text-sm" style={{ color: 'var(--muted-text)' }}>{t('common.or')}</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
        </div>

        <div className="text-center text-sm mt-2" style={{ color: 'var(--text-color)' }}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--btn-primary)' }}>
            {t('common.register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
