import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaBuilding, FaEye, FaEyeSlash } from 'react-icons/fa';
import { api } from '../services/api';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '', secteur: '', ville: '', responsable: '', tel: '', adresse: '', site_web: '',
    email: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nom || !form.email || !form.password) { setError(t('auth.fillAllFields')); return; }
    if (form.password.length < 8) { setError(t('auth.passwordTooWeak')); return; }
    if (form.password !== form.confirmPassword) { setError(t('auth.passwordsNotMatch')); return; }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.auth.register(payload);
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.message || t('errors.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type = 'text', required = false) => (
    <div>
      <label className="block mb-1.5 text-sm font-medium" style={{ color: 'var(--text-color)' }}>
        {label}{required && ' *'}
      </label>
      <input name={name} type={type} value={form[name]} onChange={onChange} required={required}
        className="w-full p-2.5 border rounded-lg"
        style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10" style={{ background: 'transparent' }}>
      <div className="card w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--gradient-primary)' }}>
            <FaBuilding />
          </div>
          <div>
            <h1 className="text-2xl">{t('register.title')}</h1>
            <p className="text-sm" style={{ color: 'var(--muted-text)' }}>{t('register.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('nom', t('register.companyName'), 'text', true)}
          {field('secteur', t('register.sector'))}
          {field('ville', t('profile.ville'))}
          {field('responsable', t('register.manager'))}
          {field('tel', t('profile.tel'))}
          {field('site_web', t('register.website'), 'url')}
          <div className="sm:col-span-2">{field('adresse', t('profile.adresse'))}</div>
          {field('email', t('auth.email'), 'email', true)}

          <div>
            <label className="block mb-1.5 text-sm font-medium" style={{ color: 'var(--text-color)' }}>{t('auth.password')} *</label>
            <div className="relative">
              <input name="password" type={showPwd ? 'text' : 'password'} value={form.password} onChange={onChange} required
                autoComplete="new-password" className="w-full p-2.5 border rounded-lg pr-10"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-text)' }}>
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block mb-1.5 text-sm font-medium" style={{ color: 'var(--text-color)' }}>{t('auth.confirmPassword')} *</label>
            <input name="confirmPassword" type={showPwd ? 'text' : 'password'} value={form.confirmPassword} onChange={onChange} required
              autoComplete="new-password" className="w-full p-2.5 border rounded-lg"
              style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
          </div>

          {error && <div className="sm:col-span-2 text-sm text-center" style={{ color: '#ef4444' }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary sm:col-span-2 mt-1">
            {loading ? t('common.saving') : t('auth.register')}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'var(--muted-text)' }}>
          {t('auth.alreadyAccount')}{' '}
          <Link to="/login" className="font-semibold link-primary">{t('common.login')}</Link>
        </p>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--muted-text)' }}>
          {t('register.note')}
        </p>
      </div>
    </div>
  );
}
