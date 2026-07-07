import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaMapMarkerAlt, FaLinkedin } from 'react-icons/fa';

const LINKEDIN_URL = 'https://www.linkedin.com/in/zainab-farih';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="glass mt-auto px-6 py-10" style={{ borderTop: '1px solid var(--border-color)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <h3 className="mb-5" style={{ color: 'var(--text-color)' }}>{t('footer.contact')}</h3>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm">
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 link-primary font-medium">
            <FaLinkedin /> ZAINAB FARIH | LinkedIn
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-8 pt-4 text-center text-sm"
        style={{ borderTop: '1px solid var(--border-color)', color: 'var(--muted-text)' }}>
        © {year} StageTrack. {t('footer.rights')}
      </div>
    </footer>
  );
}
