import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { useToast } from '../../contexts/ToastContext';
import { api, API_ORIGIN } from '../../services/api';

export default function EncadrantEntrDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const userId = Number(localStorage.getItem('userId'));

  const [stages, setStages] = useState([]);
  const [selectedEtudiant, setSelectedEtudiant] = useState(null);
  const [selectedAff, setSelectedAff] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const affectations = await api.encadrantStage.byencadrant('entr', userId);
        const map = new Map();
        affectations.forEach((a) => {
          if (!map.has(a.id_stage)) map.set(a.id_stage, { id_stage: a.id_stage, titre: a.stage_titre, etudiants: [] });
          map.get(a.id_stage).etudiants.push({ id: a.id_etudiant, nom: a.etudiant_nom, prenom: a.etudiant_prenom, aff: a });
        });
        setStages([...map.values()]);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) load();
  }, [userId]);

  const openEtudiant = async (id, aff) => {
    setSelectedAff(aff || null);
    setNoteInput(aff?.note_encadrant_entr ?? '');
    try { setSelectedEtudiant(await api.etudiants.get(id)); } catch (e) { setError(e.message); }
  };

  const handleNote = async () => {
    if (!selectedAff) return;
    try {
      const r = await api.affectation.setNoteEntr(selectedAff.id, noteInput);
      setSelectedAff({ ...selectedAff, note_encadrant_entr: r.affectation?.note_encadrant_entr ?? noteInput });
      toast.success(t('tracking.saved', 'Note enregistrée'));
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <UserNavbar userRole="ENCADRANT_ENTREPRISE" />
      <div className="ml-24 p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>{t('navigation.dashboard', 'Tableau de bord')}</h1>
        {error && <div className="mb-4 p-3 rounded" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text-color)' }}>{t('internship.list', 'Stages encadrés')}</h2>
              </div>
              {isLoading ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('common.loading', 'Chargement...')}</div>
                : stages.length === 0 ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('internship.none', 'Aucun stage')}</div>
                : stages.map((s) => (
                  <div key={s.id_stage} className="p-4" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                    <h3 className="font-medium mb-2">{s.titre}</h3>
                    <div className="flex flex-wrap gap-2">
                      {s.etudiants.map((e) => (
                        <button key={e.id} onClick={() => openEtudiant(e.id, e.aff)}
                          className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--input-bg)', color: 'var(--btn-primary)' }}>
                          {e.prenom} {e.nom}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="card p-6 h-full">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('interns.details', 'Détails du stagiaire')}</h2>
              {selectedEtudiant ? (
                <div style={{ color: 'var(--text-color)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <p><b>{t('profile.nom', 'Nom')} :</b> {selectedEtudiant.nom} {selectedEtudiant.prenom}</p>
                    <p><b>Email :</b> {selectedEtudiant.mail}</p>
                    <p><b>{t('profile.filiere', 'Filière')} :</b> {selectedEtudiant.filiere || '—'}</p>
                    <p><b>{t('profile.niveau', 'Niveau')} :</b> {selectedEtudiant.niveau || '—'}</p>
                    <p><b>{t('profile.tel', 'Téléphone')} :</b> {selectedEtudiant.tel || '—'}</p>
                  </div>
                  <div className="flex gap-3">
                    {selectedEtudiant.cv_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selectedEtudiant.cv_pdf}`} target="_blank" rel="noopener noreferrer">CV</a>}
                    {selectedEtudiant.lm_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selectedEtudiant.lm_pdf}`} target="_blank" rel="noopener noreferrer">{t('profile.coverLetter', 'Lettre de motivation')}</a>}
                    {selectedAff?.rapport_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selectedAff.rapport_pdf}`} target="_blank" rel="noopener noreferrer">{t('tracking.report', 'Rapport')}</a>}
                  </div>

                  {selectedAff && (
                    <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <h3 className="font-semibold mb-2">{t('tracking.noteEntr', 'Note encadrant entreprise')} (/20)</h3>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="20" step="0.01" className="border rounded px-2 py-1 w-28"
                          style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                          value={noteInput} onChange={(e) => setNoteInput(e.target.value)} />
                        <button className="btn-primary px-3 py-1" onClick={handleNote}>{t('tracking.rate', 'Noter')}</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : <p style={{ color: 'var(--muted-text)' }}>{t('interns.select', 'Sélectionnez un stagiaire')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
