import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import SuiviStages from '../../components/SuiviStages';
import { useToast } from '../../contexts/ToastContext';
import { api, API_ORIGIN } from '../../services/api';

const NIVEAUX = ['1A', '2A', '3A'];

export default function Affectation() {
  const { t } = useTranslation();
  const toast = useToast();
  const [status, setStatus] = useState({});
  const [etudiants, setEtudiants] = useState([]);
  const [affectations, setAffectations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [voeux, setVoeux] = useState([]);
  const [affectation, setAffectation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scoreInput, setScoreInput] = useState('');
  const [deadlines, setDeadlines] = useState({});
  const [activeNiveau, setActiveNiveau] = useState('3A');

  const loadAll = useCallback(async () => {
    const [st, etu, dls, affs] = await Promise.all([
      api.affectation.status(),
      api.etudiants.list(),
      api.stages.deadlines().catch(() => []),
      api.affectation.list().catch(() => []),
    ]);
    setStatus(st || {});
    setEtudiants(etu.data || etu || []);
    const map = {};
    (dls || []).forEach((r) => { map[r.niveau] = r.date_limite ? String(r.date_limite).slice(0, 10) : ''; });
    setDeadlines(map);
    setAffectations(Array.isArray(affs) ? affs : []);
  }, []);

  useEffect(() => { loadAll().catch((e) => toast.error(e.message)); }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    Promise.all([
      api.etudiants.get(selected.id),
      api.etudiants.candidatures(selected.id),
      api.etudiantStage.byEtudiant(selected.id),
    ]).then(([etu, cands, aff]) => {
      setSelected(etu);
      setScoreInput(etu.score ?? '');
      setVoeux(cands || []);
      setAffectation(aff && aff[0] ? aff[0] : null);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '');

  const handleAuto = async (niveau) => {
    try {
      const res = await api.affectation.auto(niveau);
      toast.success(`${res.message} — ${res.affectees} ✓, ${res.non_affectees} ✗`);
      await loadAll();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleScoreSave = async () => {
    try {
      await api.etudiants.setScore(selected.id, scoreInput);
      toast.success(t('common.saved', 'Enregistré !'));
      setSelected({ ...selected, score: scoreInput });
      setEtudiants((prev) => prev.map((e) => (e.id === selected.id ? { ...e, score: scoreInput } : e)));
    } catch (e) { toast.error(e.message); }
  };

  const handleDeadlineSave = async (niveau) => {
    try {
      await api.stages.setDeadline(niveau, deadlines[niveau] || null);
      toast.success(`${niveau} — ${t('assignment.deadlineSet', 'Date limite enregistrée')}`);
    } catch (e) { toast.error(e.message); }
  };

  const statusLabel = (st) => {
    if (!st || st.phase === 'avant') return t('assignment.notStarted', 'Non lancée');
    if (st.phase === 'desistement') return `${t('assignment.desistUntil', 'Désistement jusqu\'au')} ${fmt(st.deadline)}`;
    return `${t('assignment.closed', 'Clôturée')} — ${fmt(st.deadline)}`;
  };

  // ════════ DÉTAIL ÉTUDIANT (scoring) ════════
  if (selected) {
    return (
      <>
        <UserNavbar userRole="ADMIN_UNIV" />
        <div className="ml-24 p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
          <div className="card p-8 max-w-5xl mx-auto">
            <button className="mb-4 px-4 py-2 rounded" style={{ background: 'var(--input-bg)', color: 'var(--text-color)' }} onClick={() => setSelected(null)}>
              ← {t('common.back', 'Retour')}
            </button>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--btn-primary)' }}>{selected.prenom} {selected.nom}</h2>
            {loading ? <p style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</p> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6" style={{ color: 'var(--text-color)' }}>
                  <div>
                    <p><b>{t('auth.email', 'Email')} :</b> {selected.mail}</p>
                    <p><b>{t('profile.filiere', 'Filière')} :</b> {selected.filiere}</p>
                    <p><b>{t('internship.level', 'Niveau')} :</b> {selected.niveau}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <b>{t('profile.score', 'Score')} :</b>
                      <input type="number" step="0.01" min="0" max="20" className="border rounded px-2 py-1 w-24"
                        style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                        value={scoreInput} onChange={(e) => setScoreInput(e.target.value)} />
                      <button className="btn-primary px-3 py-1" onClick={handleScoreSave}>{t('common.save', 'Enregistrer')}</button>
                    </div>
                    <p className="mt-2">
                      <b>CV :</b>{' '}
                      {selected.cv_pdf
                        ? <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selected.cv_pdf}`} target="_blank" rel="noopener noreferrer">{t('common.view', 'Voir')}</a>
                        : <span style={{ color: '#dc2626' }}>{t('common.none', 'Aucun fichier')}</span>}
                    </p>
                    <p>
                      <b>{t('profile.coverLetter', 'Lettre de motivation')} :</b>{' '}
                      {selected.lm_pdf
                        ? <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${selected.lm_pdf}`} target="_blank" rel="noopener noreferrer">{t('common.view', 'Voir')}</a>
                        : <span style={{ color: '#dc2626' }}>{t('common.none', 'Aucun fichier')}</span>}
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--btn-primary)' }}>{t('assignment.wishes', 'Vœux de stage')}</h3>
                <table className="w-full mb-6">
                  <thead>
                    <tr style={{ background: 'var(--btn-primary)', color: '#fff' }}>
                      <th className="px-4 py-2 text-left">{t('internship.subject', 'Stage')}</th>
                      <th className="px-4 py-2 text-left">{t('internship.company', 'Entreprise')}</th>
                      <th className="px-4 py-2 text-left">{t('assignment.rank', 'Rang')}</th>
                      <th className="px-4 py-2 text-left">{t('tasks.status', 'Statut')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voeux.slice().sort((a, b) => a.rang - b.rang).map((c) => (
                      <tr key={c.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                        <td className="px-4 py-2">{c.titre || c.stage_titre}</td>
                        <td className="px-4 py-2">{c.entreprise_nom}</td>
                        <td className="px-4 py-2">{c.rang}</td>
                        <td className="px-4 py-2">{c.statut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--btn-primary)' }}>{t('dashboard.assignedInternship', 'Stage affecté')}</h3>
                {affectation ? (
                  <div style={{ color: 'var(--text-color)' }}>
                    <p><b>{t('internship.subject', 'Sujet')} :</b> {affectation.stage_titre}</p>
                    <p><b>{t('internship.company', 'Entreprise')} :</b> {affectation.entreprise_nom}</p>
                  </div>
                ) : <p style={{ color: 'var(--muted-text)' }}>{t('dashboard.noAssignedInternship', 'Aucun stage affecté')}</p>}
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ════════ VUE PRINCIPALE ════════
  const tabBtn = (n) => ({
    background: activeNiveau === n ? 'var(--gradient-primary)' : 'transparent',
    color: activeNiveau === n ? '#fff' : 'var(--muted-text)',
    border: activeNiveau === n ? 'none' : '1px solid var(--border-color)',
  });

  const visibleEtudiants = etudiants.filter((e) => e.niveau === activeNiveau);
  const visibleAffectations = affectations.filter((a) => a.etudiant_niveau === activeNiveau);

  return (
    <>
      <UserNavbar userRole="ADMIN_UNIV" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--btn-primary)' }}>{t('assignment.title', 'Affectation des étudiants')}</h2>

          {/* Onglets de navigation par niveau */}
          <div className="flex gap-2 mb-5">
            {NIVEAUX.map((n) => (
              <button key={n} onClick={() => setActiveNiveau(n)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors" style={tabBtn(n)}>
                {n}
              </button>
            ))}
          </div>

          {/* Contenu du niveau actif : date limite + lancement + statut */}
          <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--muted-bg)' }}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{t('assignment.wishesDeadline', 'Date limite de classement des vœux')} ({activeNiveau}) :</label>
              <input type="date" value={deadlines[activeNiveau] || ''} onChange={(e) => setDeadlines((d) => ({ ...d, [activeNiveau]: e.target.value }))}
                className="border rounded px-2 py-1 text-sm"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
              <button className="btn-secondary text-sm px-3 py-1" onClick={() => handleDeadlineSave(activeNiveau)}>{t('assignment.setDeadline', 'Définir')}</button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm" style={{ color: 'var(--muted-text)' }}>{statusLabel(status[activeNiveau])}</span>
              <button className="btn-primary" onClick={() => handleAuto(activeNiveau)}>
                {t('assignment.runAuto', "Lancer l'affectation automatique")} {activeNiveau}
              </button>
            </div>
          </div>

          {/* Liste des étudiants du niveau actif (scoring) */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--btn-primary)', color: '#fff' }}>
                  <th className="px-4 py-3 text-left">{t('profile.nom', 'Nom')}</th>
                  <th className="px-4 py-3 text-left">{t('profile.prenom', 'Prénom')}</th>
                  <th className="px-4 py-3 text-left">{t('auth.email', 'Email')}</th>
                  <th className="px-4 py-3 text-left">{t('profile.filiere', 'Filière')}</th>
                  <th className="px-4 py-3 text-left">{t('profile.score', 'Score')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleEtudiants.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6" style={{ color: 'var(--muted-text)' }}>{t('students.none', 'Aucun étudiant')}</td></tr>
                )}
                {visibleEtudiants.map((e) => (
                  <tr key={e.id} className="cursor-pointer" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)', opacity: e.a_desiste ? 0.5 : 1 }} onClick={() => setSelected(e)}>
                    <td className="px-4 py-3">{e.nom}</td>
                    <td className="px-4 py-3">{e.prenom}</td>
                    <td className="px-4 py-3">{e.mail}</td>
                    <td className="px-4 py-3">{e.filiere}</td>
                    <td className="px-4 py-3">{e.score}{e.a_desiste ? ` · ${t('assignment.withdrawn', 'désisté')}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suivi des affectations du niveau actif */}
        <div className="card max-w-6xl mx-auto">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--btn-primary)' }}>{t('tracking.title', 'Suivi des stages')} — {activeNiveau}</h2>
          <SuiviStages rows={visibleAffectations} variant="admin" />
        </div>
      </div>
    </>
  );
}
