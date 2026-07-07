import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaUserGraduate, FaBuilding, FaChalkboardTeacher, FaUniversity,
  FaArrowRight, FaKey, FaListOl, FaCheckCircle,
  FaLayerGroup, FaClock, FaEye, FaTasks, FaCheck,
} from 'react-icons/fa';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';

export default function Home() {
  const { t } = useTranslation();

  const actors = [
    { icon: <FaUserGraduate />, key: 'student', color: '#4f46e5' },
    { icon: <FaBuilding />, key: 'company', color: '#0ea5e9' },
    { icon: <FaChalkboardTeacher />, key: 'supervisor', color: '#8b5cf6' },
    { icon: <FaUniversity />, key: 'admin', color: '#06b6d4' },
  ];
  const steps = [
    { icon: <FaKey />, key: 'step1' },
    { icon: <FaListOl />, key: 'step2' },
    { icon: <FaCheckCircle />, key: 'step3' },
  ];
  const whys = [
    { icon: <FaLayerGroup />, key: 'centralise' },
    { icon: <FaClock />, key: 'time' },
    { icon: <FaEye />, key: 'transparency' },
    { icon: <FaTasks />, key: 'tracking' },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero (sans cadre) ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 font-bold text-xl mb-6" style={{ color: 'var(--text-color)' }}>
          <img src="/logo-stage-track.svg" alt="StageTrack" className="w-9 h-9" /> StageTrack
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
          className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
          <span className="gradient-text">{t('home.title')}</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }}
          className="text-base md:text-lg max-w-2xl mx-auto mb-9" style={{ color: 'var(--muted-text)' }}>
          {t('home.subtitle')}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.18 }}
          className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register" className="btn-primary inline-flex items-center justify-center gap-2 min-w-[180px]">
            {t('home.getStarted')} <FaArrowRight className="text-sm" />
          </Link>
          <Link to="/login" className="btn-secondary inline-flex items-center justify-center min-w-[180px]">
            {t('auth.login')}
          </Link>
        </motion.div>
      </section>

      {/* ── Acteurs (sans cadre, juste icône + texte) ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24 w-full">
        <Reveal className="text-center mb-12">
          <h2 className="mb-2">{t('home.actorsTitle')}</h2>
          <p className="max-w-xl mx-auto" style={{ color: 'var(--muted-text)' }}>{t('home.actorsSubtitle')}</p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {actors.map((a, i) => (
            <Reveal key={a.key} delay={i * 0.08} className="text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg text-white mb-4 mx-auto sm:mx-0"
                style={{ background: a.color }}>{a.icon}</div>
              <h3 style={{ color: 'var(--text-color)' }}>{t(`home.features.${a.key}.title`)}</h3>
              <p className="text-sm mt-1.5" style={{ color: 'var(--muted-text)' }}>{t(`home.features.${a.key}.desc`)}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Comment ça marche (bande teintée pleine largeur, sans cadres) ── */}
      <section className="w-full py-24" style={{ background: 'var(--muted-bg)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <Reveal className="text-center mb-14"><h2>{t('home.how.title')}</h2></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative">
            {steps.map((s, i) => (
              <Reveal key={s.key} delay={i * 0.12} className="text-center px-2">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-xl text-white shadow-lg"
                  style={{ background: 'var(--gradient-primary)' }}>{s.icon}</div>
                <div className="text-xs font-bold mb-1" style={{ color: 'var(--btn-primary)' }}>{`ÉTAPE 0${i + 1}`}</div>
                <h3 style={{ color: 'var(--text-color)' }}>{t(`home.how.${s.key}.title`)}</h3>
                <p className="text-sm mt-1.5" style={{ color: 'var(--muted-text)' }}>{t(`home.how.${s.key}.desc`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section entreprises (split, attire les entreprises) ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--btn-primary)' }}>
            {t('home.company.badge')}
          </span>
          <h2 className="mt-2 mb-4">{t('home.company.title')}</h2>
          <p className="mb-6" style={{ color: 'var(--muted-text)' }}>{t('home.company.subtitle')}</p>
          <ul className="flex flex-col gap-3 mb-8">
            {['p1', 'p2', 'p3'].map((p) => (
              <li key={p} className="flex items-start gap-3" style={{ color: 'var(--text-color)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--gradient-primary)' }}><FaCheck /></span>
                {t(`home.company.${p}`)}
              </li>
            ))}
          </ul>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2">
            {t('home.company.cta')} <FaArrowRight className="text-sm" />
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card card-hover">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--gradient-primary)' }}>
                <FaBuilding />
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--text-color)' }}>{t('home.company.cardTitle')}</div>
                <div className="text-xs" style={{ color: 'var(--muted-text)' }}>{t('home.company.cardSub')}</div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { l: t('home.company.stat1'), c: '#4f46e5' },
                { l: t('home.company.stat2'), c: '#0ea5e9' },
                { l: t('home.company.stat3'), c: '#8b5cf6' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.c }} />
                  <span className="text-sm" style={{ color: 'var(--text-color)' }}>{row.l}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Pourquoi StageTrack (liste sans cadres) ── */}
      <section className="w-full py-24" style={{ background: 'var(--muted-bg)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14"><h2>{t('home.why.title')}</h2></Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
            {whys.map((w, i) => (
              <Reveal key={w.key} delay={i * 0.08} className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: 'var(--gradient-primary)' }}>{w.icon}</div>
                <div>
                  <h3 style={{ color: 'var(--text-color)' }}>{t(`home.why.${w.key}.title`)}</h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-text)' }}>{t(`home.why.${w.key}.desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 w-full">
        <Reveal>
          <div className="rounded-3xl p-12 text-center text-white" style={{ background: 'var(--gradient-primary)' }}>
            <h2 className="mb-3" style={{ color: '#fff' }}>{t('home.cta.title')}</h2>
            <p className="mb-8 opacity-90 max-w-xl mx-auto">{t('home.cta.subtitle')}</p>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-semibold bg-white"
              style={{ color: 'var(--btn-primary)' }}>
              {t('home.cta.button')} <FaArrowRight className="text-sm" />
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
