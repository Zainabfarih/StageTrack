import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import DataTable from '../../components/DataTable';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

export default function StagesUniv() {
  const { t } = useTranslation();
  const toast = useToast();
  const universiteId = Number(localStorage.getItem('userId'));

  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encadrants, setencadrants] = useState([]);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [selected, setSelected] = useState('');

  const fetchStages = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.stages.list({ pageSize: 100 });
      setStages(res.data || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!universiteId) return;
    fetchStages();
    api.encadrantsUniv.byUniversite(universiteId).then(setencadrants).catch(() => setencadrants([]));
  }, [universiteId, fetchStages]);

  const openRow = (row) => { setViewing(row); setSelected(''); };

  const handleAssign = async () => {
    if (!selected) return;
    try {
      await api.encadrantStage.assign({ IdStage: viewing.id, id_encadrant_univ: Number(selected) });
      await fetchStages();
      setViewing(null);
      toast.success(t('supervisor.assigned', 'Encadrant affecté'));
    } catch (e) { toast.error(e.message); }
  };

  const STATUTS = ['ouvert', 'ferme', 'en_cours', 'termine'];
  const statutOptions = STATUTS.map((s) => ({ value: s, label: t(`internship.statuses.${s}`) }));

  const columns = [
    { key: 'titre', label: t('internship.subject'), sortable: true, searchable: true },
    { key: 'entreprise_nom', label: t('internship.company'), searchable: true },
    {
      key: 'statut', label: t('tasks.status'), filter: 'select', options: statutOptions,
      render: (row) => (row.statut ? t(`internship.statuses.${row.statut}`, row.statut) : '—'),
    },
    { key: 'encadrants_univ', label: t('navigation.supervisors'), render: (row) => row.encadrant_univ_nom || '—' },
  ];

  return (
    <>
      <UserNavbar userRole="ADMIN_UNIV" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto">
          <h1 className="text-xl mb-5" style={{ color: 'var(--btn-primary)' }}>{t('navigation.internships')}</h1>
          {error && <div className="mb-3 text-red-600">{error}</div>}
          {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
            <DataTable columns={columns} rows={stages} onRowClick={openRow} emptyLabel={t('internship.none')} />
          )}
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--btn-primary)' }}>{viewing.titre}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--muted-text)' }}>{viewing.entreprise_nom}</p>
            <label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{t('supervisor.assignUniv')}</label>
            <select className="w-full p-2 border rounded-lg mb-4"
              style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
              value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">{t('supervisor.select')}</option>
              {encadrants.map((enc) => <option key={enc.id} value={enc.id}>{enc.prenom} {enc.nom}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary text-sm" onClick={() => setViewing(null)}>{t('common.cancel')}</button>
              <button className="btn-primary text-sm" disabled={!selected} onClick={handleAssign}>{t('common.validate')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
