import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { FaEdit } from 'react-icons/fa';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

function Modal({ open, onClose, onValidate, selectedId, setSelectedId, allencadrants, t }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="card p-8 min-w-[350px] max-w-[90vw] relative">
        <button className="absolute top-2 right-3 text-xl font-bold" onClick={onClose}>×</button>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--btn-primary)' }}>
          <FaEdit /> {t('supervisor.assign', 'Affecter un encadrant')}
        </h2>
        <select className="w-full border rounded-lg px-3 py-2 mb-6"
          style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
          value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">{t('supervisor.select', 'Sélectionner un encadrant')}</option>
          {allencadrants.map((enc) => (
            <option key={enc.id} value={enc.id}>{enc.prenom} {enc.nom}</option>
          ))}
        </select>
        <div className="flex justify-center gap-4">
          <button className="btn-primary px-6 py-2" onClick={onValidate} disabled={!selectedId}>
            {t('common.validate', 'Valider')}
          </button>
          <button className="px-6 py-2 rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }} onClick={onClose}>
            {t('common.cancel', 'Annuler')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Stages() {
  const { t } = useTranslation();
  const toast = useToast();
  const entrepriseId = Number(localStorage.getItem('userId'));
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allencadrants, setAllencadrants] = useState([]);
  const [editStageId, setEditStageId] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStages = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await api.stages.byEntreprise(entrepriseId);
      const withDetails = await Promise.all(data.map(async (stage) => {
        const affectations = await api.encadrantStage.byStage(stage.id);
        return { ...stage, affectations };
      }));
      setStages(withDetails);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId]);

  useEffect(() => {
    if (!entrepriseId) return;
    fetchStages();
    api.encadrantsEntr.byEntreprise(entrepriseId).then(setAllencadrants).catch(() => {});
  }, [entrepriseId, fetchStages]);

  const openModal = (stageId) => { setEditStageId(stageId); setSelectedId(''); setModalOpen(true); };

  const handleValidate = async () => {
    if (!selectedId) return;
    try {
      await api.encadrantStage.assign({ IdStage: editStageId, id_encadrant_entr: Number(selectedId) });
      setModalOpen(false);
      setEditStageId(null);
      setSelectedId('');
      await fetchStages();
      toast.success(t('supervisor.assigned', 'Encadrant affecté'));
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    }
  };

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card p-8 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>
            {t('navigation.internships', 'Gestion des stages')}
          </h1>
          {error && <div className="mb-3" style={{ color: '#ef4444' }}>{error}</div>}
          {loading ? <div style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</div>
            : (
              <table className="min-w-full">
                <thead>
                  <tr style={{ background: 'var(--btn-primary)', color: '#fff' }}>
                    <th className="px-4 py-3 text-left">{t('internship.subject', 'Titre')}</th>
                    <th className="px-4 py-3 text-left">{t('navigation.supervisors', 'Encadrant(s)')}</th>
                    <th className="px-4 py-3 text-left">{t('navigation.interns', 'Stagiaire(s)')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage) => {
                    const stagiaires = stage.affectations.map((a) => `${a.etudiant_prenom} ${a.etudiant_nom}`);
                    return (
                      <tr key={stage.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                        <td className="px-4 py-4 font-medium">{stage.titre}</td>
                        <td className="px-4 py-4">
                          {stage.encadrant_entr_nom ? stage.encadrant_entr_nom : <span style={{ color: 'var(--muted-text)' }}>—</span>}
                          <button className="ml-2 text-sm underline" style={{ color: 'var(--btn-primary)' }} onClick={() => openModal(stage.id)}>
                            {t('supervisor.assign', 'Affecter')}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          {stagiaires.length ? stagiaires.join(', ') : <span style={{ color: 'var(--muted-text)' }}>{t('interns.none', 'Aucun')}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} onValidate={handleValidate}
        selectedId={selectedId} setSelectedId={setSelectedId} allencadrants={allencadrants} t={t} />
    </>
  );
}
