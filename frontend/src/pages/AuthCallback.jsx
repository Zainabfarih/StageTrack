import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../services/api';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params       = new URLSearchParams(window.location.search);
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const role         = params.get('role');
    const userId       = params.get('userId');

    if (!accessToken || !role) {
      navigate('/login?error=oauth_failed');
      return;
    }

    setToken(accessToken);
    localStorage.setItem('token',                 accessToken);
    localStorage.setItem('refreshToken',          refreshToken || '');
    localStorage.setItem('role',                  role);
    if (userId) localStorage.setItem('userId',    userId);
    localStorage.setItem('profile_completed',     'false');
    localStorage.setItem('needs_password_change', 'false');

    navigate('/complete-profile');
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span>Connexion en cours…</span>
      </div>
    </div>
  );
}
