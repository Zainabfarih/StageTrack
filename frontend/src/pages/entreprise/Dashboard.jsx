import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBriefcase, FaUsers, FaClipboardList } from 'react-icons/fa';
import UserNavbar from '../../components/UserNavbar';
import { DonutChart, BarChart, StatCard, PALETTE } from '../../components/Charts';
import { api } from '../../services/api';

const STATUT_COLORS = { ouvert: '#22c55e', en_cours: '#6366f1', ferme: '#f59e0b', termine: '#8b5cf6' };

export default function EntrepriseDashboard() {
  const { t } = useTranslation();
  const entrepriseId = Number(localStorage.getItem('userId'));
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOffers(await api.stages.byEntreprise(entrepriseId)); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [entrepriseId]);

  useEffect(() => { if (entrepriseId) load(); }, [entrepriseId, load]);

  const totalOffres = offers.length;
  const totalCandidatures = offers.reduce((s, o) => s + (Number(o.nombre_candidatures) || 0), 0);
  const totalPostes = offers.reduce((s, o) => s + (Number(o.nbr_postes) || 0), 0);

  const statutData = ['ouvert', 'en_cours', 'ferme', 'termine'].map((st) => ({
    label: t(`internship.statuses.${st}`, st),
    value: offers.filter((o) => o.statut === st).length,
    color: STATUT_COLORS[st],
  }));

  const candidaturesData = offers
    .map((o) => ({ label: o.titre, value: Number(o.nombre_candidatures) || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const typeData = ['pfe', 'pfa'].map((tp, i) => ({
    label: tp.toUpperCase(),
    value: offers.filter((o) => o.type_offre === tp).length,
    color: PALETTE[i],
  }));

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>{t('navigation.dashboard', 'Tableau de bord')}</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading', 'Chargement...')}</div> : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <StatCard icon={<FaClipboardList />} value={totalOffres} label={t('dashboard.totalOffers', 'Offres')} accent="#6366f1" />
              <StatCard icon={<FaUsers />} value={totalCandidatures} label={t('dashboard.totalApplications', 'Candidatures')} accent="#22c55e" />
              <StatCard icon={<FaBriefcase />} value={totalPostes} label={t('dashboard.totalPositions', 'Postes')} accent="#ec4899" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('dashboard.byStatus', 'Répartition par statut')}</h2>
                <DonutChart data={statutData} centerLabel={totalOffres} />
              </div>
              <div className="card">
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('internship.typeOffre', "Type d'offre")}</h2>
                <DonutChart data={typeData} centerLabel={totalOffres} />
              </div>
              <div className="card lg:col-span-2">
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('dashboard.candidaturesByOffer', 'Candidatures par offre')}</h2>
                <BarChart data={candidaturesData} color="#6366f1" />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
