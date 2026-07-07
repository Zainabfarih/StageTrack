import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import DataTable from '../../components/DataTable';
import { InfoField } from '../../components/ProfileShell';
import { api } from '../../services/api';

const FILIERES = ['GL', 'BIA', 'SSE', '2IA', 'IDF', '2SCL', 'D2S', 'CSCC'];

export default function Stagiaires() {
  const { t } = useTranslation();
  const [stagiaires, setStagiaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const entrepriseId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    async function load() {
      setLoading(true); setError('');
      try {
        const stages = await api.stages.byEntreprise(entrepriseId);
        const ids = new Set();
        for (const stage of stages) {
          const affectations = await api.encadrantStage.byStage(stage.id);
          affectations.forEach((a) => ids.add(a.id_etudiant));
        }
        const data = await Promise.all([...ids].map((id) => api.etudiants.get(id)));
        setStagiaires(data);
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    }
    if (entrepriseId) load();
  }, [entrepriseId]);

  const columns = [
    { key: 'nom', label: t('profile.nom'), sortable: true, searchable: true },
    { key: 'prenom', label: t('profile.prenom'), sortable: true, searchable: true },
    { key: 'mail', label: t('auth.email'), searchable: true },
    { key: 'tel', label: t('profile.tel') },
    { key: 'filiere', label: t('profile.filiere'), filter: 'select', options: FILIERES },
  ];

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto">
          <h1 className="text-xl mb-5" style={{ color: 'var(--btn-primary)' }}>{t('navigation.interns')}</h1>
          {error && <div className="mb-3 text-red-600">{error}</div>}
          {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
            <DataTable columns={columns} rows={stagiaires} onRowClick={setViewing} emptyLabel={t('interns.none')} />
          )}
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'var(--gradient-primary)' }}>
                {(viewing.prenom?.[0] || '') + (viewing.nom?.[0] || '')}
              </div>
              <div>
                <div className="font-bold" style={{ color: 'var(--text-color)' }}>{viewing.prenom} {viewing.nom}</div>
                <div className="text-sm" style={{ color: 'var(--muted-text)' }}>{viewing.mail}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoField label={t('profile.tel')} value={viewing.tel} />
              <InfoField label={t('profile.filiere')} value={viewing.filiere} />
              <InfoField label={t('students.year')} value={viewing.niveau} />
              <InfoField label={t('profile.ville')} value={viewing.ville} />
            </div>
            <div className="mt-6 flex justify-end">
              <button className="btn-secondary text-sm" onClick={() => setViewing(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
