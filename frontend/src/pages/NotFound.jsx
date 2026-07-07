import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center animate-fade-in"
      style={{ background: 'var(--bg-color)' }}
    >
      <div className="card w-full max-w-md flex flex-col items-center p-10">
        <img src="/logo-stage-track.svg" alt="Logo StageTrack" className="w-16 h-16 mb-4" />
        <h1 className="h1 mb-2">404</h1>
        <p className="mb-4 text-center" style={{ color: 'var(--text-color)' }}>
          {t('errors.pageNotFound')}
        </p>
        <Link
          to="/"
          className="btn-primary"
          style={{ color: 'var(--btn-primary-text)' }}
        >
          {t('common.home')}
        </Link>
      </div>
    </div>
  );
}
