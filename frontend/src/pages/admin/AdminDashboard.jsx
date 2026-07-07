import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBriefcase, FaUserGraduate, FaBuilding, FaCheckCircle, FaDoorOpen } from 'react-icons/fa';
import UserNavbar from '../../components/UserNavbar';
import { DonutChart, BarChart, StatCard, PALETTE } from '../../components/Charts';
import { getToken } from '../../services/api';

const API_URL = 'http://localhost:5000';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const opts = { method: 'GET', headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } };
    Promise.all([
      fetch(`${API_URL}/api/stages/stage/stats`, opts).then((r) => r.json()),
      fetch(`${API_URL}/api/etudiants`, opts).then((r) => r.json()),
      fetch(`${API_URL}/api/entreprises`, opts).then((r) => r.json()),
    ])
      .then(([stagesRes, studentsRes, companiesRes]) => {
        setStats(Array.isArray(stagesRes) ? stagesRes : []);
        setStudents(studentsRes.data ?? studentsRes ?? []);
        setCompanies(companiesRes.data ?? companiesRes ?? []);
      })
      .catch(() => setError(t('errors.loadError')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalStages = stats.reduce((s, i) => s + (Number(i.count) || 0), 0);
  const totalOuverts = stats.reduce((s, i) => s + Number(i.ouverts || 0), 0);
  const totalTermines = stats.reduce((s, i) => s + Number(i.termines || 0), 0);
  const autres = Math.max(0, totalStages - totalOuverts - totalTermines);

  const statutData = [
    { label: t('dashboard.openInternships', 'Stages ouverts'), value: totalOuverts, color: '#22c55e' },
    { label: t('dashboard.finishedInternships', 'Stages terminés'), value: totalTermines, color: '#8b5cf6' },
    { label: t('common.other', 'Autres'), value: autres, color: '#6366f1' },
  ];

  const domaineData = stats.map((s, i) => ({
    label: s.domaine || t('common.noData', 'N/A'),
    value: Number(s.count) || 0,
    color: PALETTE[i % PALETTE.length],
  }));

  const niveauData = ['1A', '2A', '3A'].map((n, i) => ({
    label: n,
    value: students.filter((e) => e.niveau === n).length,
    color: PALETTE[i],
  }));

  if (loading) {
    return (
      <>
        <UserNavbar userRole="ADMIN_UNIV" />
        <div className="ml-24 p-8 flex items-center justify-center min-h-screen">
          <p style={{ color: 'var(--text-color)' }}>{t('dashboard.loading', 'Chargement...')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <UserNavbar userRole="ADMIN_UNIV" />
      <div className="ml-24 p-6 md:p-8 min-h-screen" style={{ background: 'var(--bg-color)' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>{t('dashboard.stats', "Statistiques de l'établissement")}</h1>
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <StatCard icon={<FaBriefcase />} value={totalStages} label={t('dashboard.totalInternships', 'Stages')} accent="#6366f1" />
          <StatCard icon={<FaDoorOpen />} value={totalOuverts} label={t('dashboard.openInternships', 'Ouverts')} accent="#22c55e" />
          <StatCard icon={<FaCheckCircle />} value={totalTermines} label={t('dashboard.finishedInternships', 'Terminés')} accent="#8b5cf6" />
          <StatCard icon={<FaUserGraduate />} value={students.length} label={t('dashboard.totalStudents', 'Étudiants')} accent="#f59e0b" />
          <StatCard icon={<FaBuilding />} value={companies.length} label={t('dashboard.totalCompanies', 'Entreprises')} accent="#ec4899" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('dashboard.byStatus', 'Répartition par statut')}</h2>
            <DonutChart data={statutData} centerLabel={totalStages} />
          </div>
          <div className="card">
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('students.title', 'Étudiants')} — {t('internship.level', 'Niveau')}</h2>
            <DonutChart data={niveauData} centerLabel={students.length} />
          </div>
          <div className="card lg:col-span-2">
            <h2 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('dashboard.byDomain', 'Répartition par domaine')}</h2>
            {domaineData.length ? <BarChart data={domaineData} /> : <div style={{ color: 'var(--muted-text)' }}>{t('dashboard.noStats', 'Aucune statistique')}</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
