import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { useToast } from '../../contexts/ToastContext';
import { api, API_ORIGIN } from '../../services/api';

export default function EncadrantUnivDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const userId = Number(localStorage.getItem('userId'));

  const [affectations, setAffectations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const rows = await api.encadrantStage.byencadrant('univ', userId);
      // Enrichir avec les infos complètes de l'étudiant
      const enriched = await Promise.all(rows.map(async (a) => {
        const etu = await api.etudiants.get(a.id_etudiant).catch(() => ({}));
        return { ...a, etudiant: etu };
      }));
      setAffectations(enriched);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (userId) load(); }, [userId, load]);

  useEffect(() => {
    if (selected) { setNoteInput(selected.note_encadrant_univ ?? ''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const handleRapportStatut = async (statut) => {
    try {
      await api.etudiantStage.setRapportStatut(selected.id, statut);
      setSelected({ ...selected, rapport_statut: statut });
      toast.success(t('common.updated', 'Mis à jour'));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleNote = async () => {
    try {
      const r = await api.affectation.setNoteUniv(selected.id, noteInput);
      setSelected({ ...selected, note_encadrant_univ: r.affectation?.note_encadrant_univ ?? noteInput, note_finale: r.affectation?.note_finale });
      toast.success(t('tracking.saved', 'Note enregistrée'));
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <UserNavbar userRole="ENCADRANT_UNIV" />
      <div className="ml-24 p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>{t('navigation.dashboard', 'Tableau de bord')}</h1>
        {error && <div className="mb-4 p-3 rounded" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text-color)' }}>{t('dashboard.supervisedInterns', 'Stagiaires encadrés')}</h2>
              </div>
              {isLoading ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('common.loading', 'Chargement...')}</div>
                : affectations.length === 0 ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('interns.none', 'Aucun stagiaire')}</div>
                : affectations.map((a) => (
                  <div key={a.id} onClick={() => setSelected(a)} className="p-4 cursor-pointer"
                    style={{ borderTop: '1px solid var(--border-color)', background: selected?.id === a.id ? 'var(--input-bg)' : 'transparent', color: 'var(--text-color)' }}>
                    <div className="font-medium">{a.etudiant_prenom} {a.etudiant_nom}</div>
                    <div className="text-sm" style={{ color: 'var(--muted-text)' }}>{a.stage_titre}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-7">
            <div className="card p-6 h-full">
              {selected ? (
                <div style={{ color: 'var(--text-color)' }}>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--btn-primary)' }}>{selected.etudiant?.prenom} {selected.etudiant?.nom}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <p><b>Email :</b> {selected.etudiant?.mail}</p>
                    <p><b>{t('profile.filiere', 'Filière')} :</b> {selected.etudiant?.filiere || '—'}</p>
                    <p><b>{t('profile.niveau', 'Niveau')} :</b> {selected.etudiant?.niveau || '—'}</p>
                    <p><b>{t('internship.subject', 'Stage')} :</b> {selected.stage_titre}</p>
                    <p><b>{t('internship.company', 'Entreprise')} :</b> {selected.entreprise_nom}</p>
                  </div>

                  <h3 className="font-semibold mb-2">{t('profile.documents', 'Documents')}</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {selected.etudiant?.cv_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selected.etudiant.cv_pdf}`} target="_blank" rel="noopener noreferrer">CV</a>}
                    {selected.etudiant?.lm_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selected.etudiant.lm_pdf}`} target="_blank" rel="noopener noreferrer">Lettre de motivation</a>}
                    {selected.convention_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selected.convention_pdf}`} target="_blank" rel="noopener noreferrer">{t('profile.convention', 'Convention')}</a>}
                    {selected.rapport_pdf && <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selected.rapport_pdf}`} target="_blank" rel="noopener noreferrer">{t('profile.report', 'Rapport')}</a>}
                  </div>

                  {selected.rapport_pdf && (
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--muted-text)' }}>{t('report.status', 'Statut rapport')} :</span>
                      <span className="font-medium">{selected.rapport_statut}</span>
                      <button className="px-3 py-1 rounded text-white" style={{ background: '#16a34a' }} onClick={() => handleRapportStatut('valide')}>{t('report.validate', 'Valider')}</button>
                      <button className="px-3 py-1 rounded text-white" style={{ background: '#dc2626' }} onClick={() => handleRapportStatut('rejete')}>{t('report.reject', 'Rejeter')}</button>
                    </div>
                  )}

                  <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <h3 className="font-semibold mb-2">{t('tracking.noteUniv', 'Note encadrant université')} (/20)</h3>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="20" step="0.01" className="border rounded px-2 py-1 w-28"
                        style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                        value={noteInput} onChange={(e) => setNoteInput(e.target.value)} />
                      <button className="btn-primary px-3 py-1" onClick={handleNote}>{t('tracking.rate', 'Noter')}</button>
                    </div>
                  </div>
                </div>
              ) : <p style={{ color: 'var(--muted-text)' }}>{t('interns.select', 'Sélectionnez un stagiaire')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
