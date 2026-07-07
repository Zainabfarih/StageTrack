import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const SUPPORTED_LANGS = ['fr', 'en', 'ar'];

//  Normalise les codes langue 
const normalizeLang = (lang) => {
  if (!lang) return 'fr';
  const code = lang.split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.includes(code) ? code : 'fr';
};

export const AppProvider = ({ children }) => {
  // --- Theme ---
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('stagetrack-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // --- Language : source de vérité = i18n ---
  const [language, setLanguage] = useState(() =>
    normalizeLang(localStorage.getItem('i18nextLng') || i18n.language)
  );

  //  Appliquer le thème
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stagetrack-theme', theme);
  }, [theme]);

  
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      const normalized = normalizeLang(lng);
      setLanguage(normalized);
      document.documentElement.setAttribute('lang', normalized);
      document.documentElement.setAttribute('dir', normalized === 'ar' ? 'rtl' : 'ltr');
    };

    // Appliquer immédiatement
    handleLanguageChanged(i18n.language);

    //  S'abonner aux futurs changements de i18n
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, []);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  //  changeLanguage passe par i18n, qui émet 'languageChanged',
  
  const changeLanguage = (lang) => {
    const normalized = normalizeLang(lang);
    i18n.changeLanguage(normalized);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    language,
    changeLanguage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
