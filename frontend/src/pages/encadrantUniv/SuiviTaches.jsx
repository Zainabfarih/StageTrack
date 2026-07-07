import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { api } from '../../services/api';

const STATUT_LABELS = { a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée' };

export default function SuiviTachesUniv() {
  const { t } = useTranslation();
  const userId = Number(localStorage.getItem('userId'));

  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [taches, setTaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStages() {
      setIsLoading(true);
      try {
        const affectations = await api.encadrantStage.byencadrant('univ', userId);
        const map = new Map();
        affectations.forEach((a) => {
          if (!map.has(a.id_stage)) map.set(a.id_stage, { id_stage: a.id_stage, titre: a.stage_titre, etudiant: `${a.etudiant_prenom} ${a.etudiant_nom}` });
        });
        setStages([...map.values()]);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) loadStages();
  }, [userId]);

  const selectStage = async (stage) => {
    setSelectedStage(stage);
    try { setTaches(await api.taches.byStage(stage.id_stage)); } catch { setTaches([]); }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <UserNavbar userRole="ENCADRANT_UNIV" />
      <div className="ml-24 p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>{t('tasks.tracking', 'Suivi des tâches')}</h1>
        {error && <div className="mb-4 p-3 rounded" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text-color)' }}>{t('internship.list', 'Stages encadrés')}</h2>
              </div>
              {isLoading ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('common.loading', 'Chargement...')}</div>
                : stages.length === 0 ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('internship.none', 'Aucun stage')}</div>
                : stages.map((s) => (
                  <div key={s.id_stage} onClick={() => selectStage(s)} className="p-4 cursor-pointer"
                    style={{ borderTop: '1px solid var(--border-color)', background: selectedStage?.id_stage === s.id_stage ? 'var(--input-bg)' : 'transparent', color: 'var(--text-color)' }}>
                    <div className="font-medium">{s.titre}</div>
                    <div className="text-sm" style={{ color: 'var(--muted-text)' }}>{s.etudiant}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-8">
            <div className="card p-6">
              {selectedStage ? (
                <>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{selectedStage.titre}</h2>
                  {taches.length === 0 ? <p style={{ color: 'var(--muted-text)' }}>{t('tasks.none', 'Aucune tâche')}</p>
                    : (
                      <table className="min-w-full">
                        <thead>
                          <tr style={{ background: 'var(--btn-primary)', color: '#fff' }}>
                            <th className="text-left py-2 px-3">{t('tasks.title', 'Tâche')}</th>
                            <th className="text-left py-2 px-3">{t('tasks.deadline', 'Échéance')}</th>
                            <th className="text-left py-2 px-3">{t('tasks.status', 'Statut')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {taches.map((tk) => (
                            <tr key={tk.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                              <td className="py-3 px-3">{tk.titre}</td>
                              <td className="py-3 px-3">{tk.date_echeance ? new Date(tk.date_echeance).toLocaleDateString() : '—'}</td>
                              <td className="py-3 px-3">{STATUT_LABELS[tk.statut] || tk.statut}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                </>
              ) : <p style={{ color: 'var(--muted-text)' }}>{t('tasks.selectStage', 'Sélectionnez un stage')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
