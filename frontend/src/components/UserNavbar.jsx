import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FaUser, FaSignOutAlt, FaBriefcase, FaTachometerAlt,
  FaUsers, FaTasks, FaChartLine, FaComments, FaClipboardList,
} from 'react-icons/fa';
import { clearToken, getToken, api } from '../services/api';

const navConfig = {
  ETUDIANT: [
    { to: '/etudiant/dashboard', icon: <FaClipboardList />, labelKey: 'navigation.myWishes' },
    { to: '/etudiant/profil', icon: <FaUser />, labelKey: 'navigation.profile' },
    { to: '/etudiant/mes-taches', icon: <FaBriefcase />, labelKey: 'navigation.tasks' },
    { to: '/etudiant/chat', icon: <FaComments />, labelKey: 'navigation.chat' },
  ],
  ADMIN_ENTREPRISE: [
    { to: '/entreprise/dashboard', icon: <FaTachometerAlt />, labelKey: 'navigation.dashboard' },
    { to: '/entreprise/profil', icon: <FaUser />, labelKey: 'navigation.profile' },
    { to: '/entreprise/offres', icon: <FaClipboardList />, labelKey: 'navigation.offers' },
    { to: '/entreprise/stages', icon: <FaBriefcase />, labelKey: 'navigation.internships' },
    { to: '/entreprise/encadrants', icon: <FaUsers />, labelKey: 'navigation.supervisors' },
    { to: '/entreprise/stagiaires', icon: <FaUsers />, labelKey: 'navigation.interns' },
    { to: '/entreprise/suivi', icon: <FaChartLine />, labelKey: 'navigation.monitoring' },
    { to: '/entreprise/chat', icon: <FaComments />, labelKey: 'navigation.chat' },
  ],
  ADMIN_UNIV: [
    { to: '/admin/dashboard', icon: <FaTachometerAlt />, labelKey: 'navigation.dashboard' },
    { to: '/admin/profil', icon: <FaUser />, labelKey: 'navigation.profile' },
    { to: '/admin/etudiants', icon: <FaUsers />, labelKey: 'navigation.students' },
    { to: '/admin/entreprises', icon: <FaUsers />, labelKey: 'navigation.companies' },
    { to: '/admin/stages', icon: <FaBriefcase />, labelKey: 'navigation.internships' },
    { to: '/admin/encadrants', icon: <FaUsers />, labelKey: 'navigation.supervisors' },
    { to: '/admin/affectation', icon: <FaUsers />, labelKey: 'navigation.assignment' },
    { to: '/admin/chat', icon: <FaComments />, labelKey: 'navigation.chat' },
  ],
  ENCADRANT_UNIV: [
    { to: '/encadrant-univ/dashboard', icon: <FaTachometerAlt />, labelKey: 'navigation.dashboard' },
    { to: '/encadrant-univ/profil', icon: <FaUser />, labelKey: 'navigation.profile' },
    { to: '/encadrant-univ/suivi', icon: <FaBriefcase />, labelKey: 'navigation.monitoring' },
    { to: '/encadrant-univ/chat', icon: <FaComments />, labelKey: 'navigation.chat' },
  ],
  ENCADRANT_ENTREPRISE: [
    { to: '/encadrant-entr/dashboard', icon: <FaTachometerAlt />, labelKey: 'navigation.dashboard' },
    { to: '/encadrant-entr/profil', icon: <FaUser />, labelKey: 'navigation.profile' },
    { to: '/encadrant-entr/taches', icon: <FaTasks />, labelKey: 'navigation.tasks' },
    { to: '/encadrant-entr/suivi', icon: <FaChartLine />, labelKey: 'navigation.monitoring' },
    { to: '/encadrant-entr/chat', icon: <FaComments />, labelKey: 'navigation.chat' },
  ],
};

const roleLabels = {
  ETUDIANT: 'Étudiant', ADMIN_ENTREPRISE: 'Entreprise', ADMIN_UNIV: 'Administration',
  ENCADRANT_UNIV: 'Encadrant univ.', ENCADRANT_ENTREPRISE: 'Encadrant entr.',
};

export default function UserNavbar({ userRole }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const links = navConfig[userRole] || [];
  const handleLogout = () => { clearToken(); navigate('/'); };

  const [unread, setUnread] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await api.chat.unreadCount();
      setUnread(Number(res?.unread ?? res?.count ?? 0) || 0);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 15000);
    return () => clearInterval(id);
  }, [fetchUnread]);

  // Rafraîchir en changeant de page 
  useEffect(() => {
    const id = setTimeout(fetchUnread, 600);
    return () => clearTimeout(id);
  }, [location.pathname, fetchUnread]);

  return (
    <motion.aside
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group/sidebar h-screen flex flex-col py-5 fixed left-0 top-0 z-30 w-20 hover:w-64 transition-[width] duration-300 overflow-x-hidden overflow-y-auto"
      style={{ minWidth: 80, background: 'var(--card-solid)', borderRight: '1px solid var(--border-color)' }}
    >
      {/* Marque + rôle */}
      <Link to="/" className="flex items-center gap-3 px-5 mb-6 h-10">
        <img src="/logo-stage-track.svg" alt="StageTrack" className="w-9 h-9 flex-shrink-0" />
        <div className="hidden group-hover/sidebar:block whitespace-nowrap leading-tight">
          <div className="font-bold" style={{ color: 'var(--text-color)' }}>StageTrack</div>
          <div className="text-xs" style={{ color: 'var(--muted-text)' }}>{roleLabels[userRole] || ''}</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1 px-3">
        {links.map((item) => {
          const active = location.pathname === item.to;
          const isChat = item.labelKey === 'navigation.chat';
          const showBadge = isChat && unread > 0;
          return (
            <Link key={item.to} to={item.to}
              title={t(item.labelKey)}
              className="group/link flex items-center gap-3 px-3.5 h-11 rounded-xl transition-colors"
              style={{
                background: active ? 'var(--gradient-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--muted-text)',
              }}>
              <span className="relative text-lg flex-shrink-0 flex items-center justify-center w-6"
                style={{ color: active ? '#fff' : 'var(--btn-primary)' }}>
                {item.icon}
                {showBadge && (
                  <span style={{
                    position: 'absolute', top: -5, right: -7, minWidth: 16, height: 16, padding: '0 4px',
                    borderRadius: 9999, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                    boxShadow: '0 0 0 2px var(--card-solid)',
                  }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </span>
              <span className="text-sm font-medium hidden group-hover/sidebar:flex items-center gap-2 whitespace-nowrap">
                {t(item.labelKey)}
                {showBadge && (
                  <span style={{
                    minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9999, background: '#ef4444',
                    color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unread > 99 ? '99+' : unread}</span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="px-3 mt-2">
        <button onClick={handleLogout} title={t('navigation.disconnect')}
          className="flex items-center gap-3 px-3.5 h-11 rounded-xl w-full transition-colors hover:bg-red-500/10"
          style={{ color: '#ef4444' }}>
          <span className="text-lg flex-shrink-0 flex items-center justify-center w-6"><FaSignOutAlt /></span>
          <span className="text-sm font-medium hidden group-hover/sidebar:block whitespace-nowrap">{t('navigation.disconnect')}</span>
        </button>
      </div>
    </motion.aside>
  );
}
