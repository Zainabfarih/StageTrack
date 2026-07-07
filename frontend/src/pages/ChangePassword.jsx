import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PasswordInput from '../components/PasswordInput';
import { api } from '../services/api';

const roleToDashboard = {
  ETUDIANT: '/etudiant/dashboard',
  ADMIN_ENTREPRISE: '/entreprise/dashboard',
  ADMIN_UNIV: '/admin/dashboard',
  ENCADRANT_UNIV: '/encadrant-univ/dashboard',
  ENCADRANT_ENTREPRISE: '/encadrant-entr/dashboard',
};

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(t('auth.passwordTooShort', 'Le mot de passe doit contenir au moins 8 caractères'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'Les mots de passe ne correspondent pas'));
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword({ newPassword });
      localStorage.setItem('needs_password_change', 'false');

      const profileCompleted = localStorage.getItem('profile_completed') === 'true';
      if (!profileCompleted) { navigate('/complete-profile'); return; }
      const role = localStorage.getItem('role');
      navigate(roleToDashboard[role] || '/');
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center animate-fade-in"
      style={{ background: 'var(--bg-color)' }}
    >
      <div className="card w-full max-w-md p-8 flex flex-col gap-6">
        <img src="/logo-stage-track.svg" alt="Logo" className="w-14 h-14 mx-auto mb-2" />
        <h1 className="h1 text-center mb-1">
          {t('auth.changePasswordTitle', 'Changer votre mot de passe')}
        </h1>
        <p className="text-center text-sm" style={{ color: 'var(--muted-text)' }}>
          {t(
            'auth.changePasswordSubtitle',
            'Votre compte a été créé par un administrateur. Veuillez définir un nouveau mot de passe pour continuer.',
          )}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <PasswordInput
            label={t('auth.newPassword', 'Nouveau mot de passe')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <PasswordInput
            label={t('auth.confirmPassword', 'Confirmer le mot de passe')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && (
            <div className="text-sm text-center" style={{ color: '#ef4444' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading
              ? t('common.loading', 'Chargement...')
              : t('auth.confirmChange', 'Confirmer le changement')}
          </button>
        </form>
      </div>
    </div>
  );
}
