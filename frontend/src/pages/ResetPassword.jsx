import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PasswordInput from '../components/PasswordInput';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

export default function ResetPassword() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) { setError(t('auth.invalidResetLink', 'Lien de réinitialisation invalide ou expiré.')); return; }
    if (newPassword.length < 8) { setError(t('auth.passwordTooShort', 'Le mot de passe doit contenir au moins 8 caractères')); return; }
    if (newPassword !== confirmPassword) { setError(t('auth.passwordMismatch', 'Les mots de passe ne correspondent pas')); return; }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword);
      toast.success(t('settings.passwordChanged', 'Mot de passe réinitialisé avec succès'));
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ background: 'var(--bg-color)' }}>
      <div className="card w-full max-w-md p-8 flex flex-col gap-6">
        <img src="/logo-stage-track.svg" alt="Logo" className="w-14 h-14 mx-auto mb-2" />
        <h1 className="h1 text-center mb-1">{t('auth.resetPassword', 'Réinitialiser le mot de passe')}</h1>

        {!token && (
          <div className="text-center text-sm" style={{ color: '#ef4444' }}>
            {t('auth.invalidResetLink', 'Lien de réinitialisation invalide ou expiré.')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput label={t('auth.newPassword', 'Nouveau mot de passe')} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" required />
          <PasswordInput label={t('auth.confirmPassword', 'Confirmer le mot de passe')} value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />

          {error && <div className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('common.loading', 'Chargement...') : t('auth.resetPassword', 'Réinitialiser le mot de passe')}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--btn-primary)' }}>
            ← {t('common.login', 'Connexion')}
          </Link>
        </div>
      </div>
    </div>
  );
}
