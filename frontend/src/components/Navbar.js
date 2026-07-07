import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSun, FaMoon, FaGlobe, FaChevronDown } from 'react-icons/fa';
import { useApp } from '../contexts/AppContext';

const LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

// Sélecteur de langue compact 
export function LangSwitch({ language, changeLanguage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox" aria-expanded={open} aria-label="Langue"
        className="flex items-center gap-1.5 w-9 h-9 sm:w-auto sm:px-2.5 justify-center rounded-lg border transition hover:opacity-80"
        style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
      >
        <FaGlobe className="text-sm" />
        <span className="text-xs font-semibold uppercase hidden sm:inline">{language}</span>
        <FaChevronDown className="text-[10px] hidden sm:inline" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 w-36 rounded-xl glass shadow-lg overflow-hidden z-50"
        >
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                onClick={() => { changeLanguage(l.code); setOpen(false); }}
                role="option" aria-selected={language === l.code}
                className="w-full text-left px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: language === l.code ? 'var(--btn-primary)' : 'var(--text-color)', fontWeight: language === l.code ? 700 : 500 }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ThemeButton({ theme, toggleTheme }) {
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      className="w-9 h-9 rounded-lg border flex items-center justify-center transition hover:opacity-80"
      style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
    >
      {theme === 'dark' ? <FaSun /> : <FaMoon />}
    </button>
  );
}

const linkStyle = ({ isActive }) => ({
  color: isActive ? 'var(--btn-primary)' : 'var(--text-color)',
  fontWeight: isActive ? 700 : 500,
});

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, toggleTheme, language, changeLanguage } = useApp();

  return (
    <nav
      className="glass sticky top-0 z-50"
      style={{ borderBottom: '1px solid var(--border-color)' }}
      aria-label="Navigation principale"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg whitespace-nowrap" style={{ color: 'var(--text-color)' }}>
          <img src="/logo-stage-track.svg" alt="" className="w-9 h-9" />
          <span>StageTrack</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5 whitespace-nowrap">
          <NavLink to="/" end className="nav-link hidden sm:inline" style={linkStyle}>{t('common.home')}</NavLink>
          <NavLink to="/about" className="nav-link hidden sm:inline" style={linkStyle}>{t('navbar.about')}</NavLink>
          <NavLink to="/login" className="nav-link" style={linkStyle}>{t('navbar.login')}</NavLink>
          <button className="btn-primary text-sm" onClick={() => navigate('/register')}>{t('navbar.register')}</button>

          {/* Utilitaires regroupés à l'extrême droite */}
          <span className="w-px h-6 hidden sm:inline-block" style={{ background: 'var(--border-color)' }} />
          <LangSwitch language={language} changeLanguage={changeLanguage} />
          <ThemeButton theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    </nav>
  );
}
