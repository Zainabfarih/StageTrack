import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      const msg = res?.message || t('auth.resetLinkSent', 'Un lien de réinitialisation a été envoyé à votre email.');
      setSent(true);
      setSentMsg(msg);
      toast.success(msg);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ background: 'var(--bg-color)' }}>
      <div className="card w-full max-w-md p-8 flex flex-col gap-6">
        <img src="/logo-stage-track.svg" alt="Logo" className="w-14 h-14 mx-auto mb-2" />
        <h1 className="h1 text-center mb-1">{t('auth.forgotPassword', 'Mot de passe oublié ?')}</h1>
        <p className="text-center text-sm" style={{ color: 'var(--muted-text)' }}>
          {t('auth.forgotSubtitle', 'Saisissez votre email : nous vous enverrons un lien pour réinitialiser votre mot de passe.')}
        </p>

        {sent ? (
          <div className="text-center text-sm" style={{ color: '#16a34a' }}>
            {sentMsg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block mb-2 w-full text-left" style={{ color: 'var(--text-color)' }}>{t('auth.email', 'Email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full p-2 border rounded"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? t('common.loading', 'Chargement...') : t('auth.sendResetLink', 'Envoyer le lien')}
            </button>
          </form>
        )}

        <div className="text-center text-sm" style={{ color: 'var(--text-color)' }}>
          <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--btn-primary)' }}>
            ← {t('common.login', 'Connexion')}
          </Link>
        </div>
      </div>
    </div>
  );
}
