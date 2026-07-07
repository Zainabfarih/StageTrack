import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FaBullseye, FaUsers, FaShieldAlt, FaBolt, FaLinkedin } from 'react-icons/fa';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';

const LINKEDIN_URL = 'https://www.linkedin.com/in/zainab-farih';

export default function AboutUs() {
  const { t } = useTranslation();

  const points = [
    { icon: <FaBullseye />, key: 'mission' },
    { icon: <FaUsers />, key: 'collab' },
    { icon: <FaBolt />, key: 'auto' },
    { icon: <FaShieldAlt />, key: 'secure' },
  ];

  return (
    <div className="flex flex-col">
      {/* Intro (sans cadre) */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">{t('about.title')}</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="text-base md:text-lg" style={{ color: 'var(--muted-text)' }}>
          {t('about.description')}
        </motion.p>
      </section>

      {/* Points clés (bande teintée, lignes sans cadres) */}
      <section className="w-full py-24" style={{ background: 'var(--muted-bg)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-10">
          {points.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.08} className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'var(--gradient-primary)' }}>{p.icon}</div>
              <div>
                <h3 style={{ color: 'var(--text-color)' }}>{t(`about.points.${p.key}.title`)}</h3>
                <p className="text-sm mt-1.5" style={{ color: 'var(--muted-text)' }}>{t(`about.points.${p.key}.desc`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Développeuse (petit encart en fin) */}
      <section className="max-w-3xl mx-auto px-6 py-20 w-full">
        <Reveal className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: 'var(--gradient-primary)' }}>ZF</div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted-text)' }}>{t('about.developedBy')}</p>
            <h3 style={{ color: 'var(--text-color)' }}>Zainab Farih</h3>
            <p className="text-sm" style={{ color: 'var(--btn-primary)' }}>{t('about.role')}</p>
          </div>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 btn-secondary text-sm">
            <FaLinkedin /> LinkedIn
          </a>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
