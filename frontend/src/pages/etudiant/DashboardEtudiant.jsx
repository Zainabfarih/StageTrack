import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/format';
import { api } from '../../services/api';

export default function DashboardEtudiant() {
  const { t } = useTranslation();
  const toast = useToast();
  const [orderedStages, setOrderedStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [affectation, setAffectation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [niveau, setNiveau] = useState(null);
  const [wishesDeadline, setWishesDeadline] = useState(null);
  const [desiste, setDesiste] = useState(false);
  const [overIndex, setOverIndex] = useState(null);
  const dragIndexRef = useRef(null);

  const etudiantId = Number(localStorage.getItem('userId')) || null;

  useEffect(() => {
    async function loadStages() {
      setLoading(true);
      try {
        const me = etudiantId ? await api.etudiants.get(etudiantId) : null;
        const niv = me?.niveau;
        setNiveau(niv || null);
        if (!niv) {
          setOrderedStages([]);
        } else {
          const data = await api.stages.list({ pageSize: 100, niveau: niv });
          setOrderedStages(data.data || []);
        }
        try {
          const dls = await api.stages.deadlines();
          const mine = Array.isArray(dls) ? dls.find((d) => d.niveau === niv) : null;
          setWishesDeadline(mine && mine.date_limite ? mine.date_limite : null);
        } catch { /* ignore */ }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadStages();
  }, [etudiantId]);

  useEffect(() => {
    if (!etudiantId) return;
    async function loadAffectation() {
      try {
        const rows = await api.etudiantStage.byEtudiant(etudiantId);
        setAffectation(rows && rows.length ? rows[0] : null);
      } catch {
        setAffectation(null);
      }
    }
    loadAffectation();
    api.affectation.status().then(setStatus).catch(() => {});
    api.etudiants.get(etudiantId).then((e) => setDesiste(!!e.a_desiste)).catch(() => {});
  }, [etudiantId]);

  const handleDesist = async () => {
    if (!window.confirm(t('assignment.withdrawConfirm', 'Confirmer le désistement ?'))) return;
    try {
      await api.affectation.desister(etudiantId);
      setDesiste(true);
      toast.success(t('assignment.withdrawn', 'Vous vous êtes désisté(e)'));
      const rows = await api.etudiantStage.byEtudiant(etudiantId);
      setAffectation(rows && rows.length ? rows[0] : null);
    } catch (e) { toast.error(e.message); }
  };

  const onDragStart = (i) => { dragIndexRef.current = i; };
  const onDropAt = (j) => {
    const i = dragIndexRef.current;
    dragIndexRef.current = null;
    setOverIndex(null);
    if (i === null || i === j) return;
    setOrderedStages((prev) => {
      const items = [...prev];
      const [moved] = items.splice(i, 1);
      items.splice(j, 0, moved);
      return items;
    });
  };

  const handleSaveVoeux = async () => {
    setSaving(true);
    try {
      const existing = await api.voeux.byEtudiant(etudiantId);
      const errors = [];
      for (let idx = 0; idx < orderedStages.length; idx++) {
        const stage = orderedStages[idx];
        const found = existing.find((c) => c.id_stage === stage.id);
        try {
          if (found) {
            await api.voeux.update(found.id, idx + 1);
          } else {
            await api.voeux.create({ id_etudiant: etudiantId, id_stage: stage.id, rang: idx + 1 });
          }
        } catch (e) {
          errors.push(`${stage.titre}: ${e.message}`);
        }
      }
      if (errors.length === 0) toast.success(t('dashboard.rankSaved', 'Vœux enregistrés'));
      else toast.error(errors.join(' | '));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deadlinePassed = wishesDeadline && new Date() > new Date(wishesDeadline);

  return (
    <>
      <UserNavbar userRole="ETUDIANT" />
      <div className="ml-24 p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--btn-primary)' }}>
          {t('dashboard.welcomeStudent', 'Bienvenue')}
        </h1>

        {error && <div className="mb-4" style={{ color: '#ef4444' }}>{error}</div>}

        {selectedStage && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="card p-8 w-full max-w-lg relative">
              <button className="absolute top-2 right-2 text-xl" onClick={() => setSelectedStage(null)}>✕</button>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>{selectedStage.titre}</h2>
              <p style={{ color: 'var(--text-color)' }}>{selectedStage.description}</p>
              <p><strong>{t('internship.requirements', 'Compétences')} :</strong> {selectedStage.competences_requises}</p>
              <p><strong>{t('internship.startDate', 'Début')} :</strong> {formatDate(selectedStage.date_debut)}</p>
              <p><strong>{t('internship.endDate', 'Fin')} :</strong> {formatDate(selectedStage.date_fin)}</p>
              <p><strong>{t('internship.company', 'Entreprise')} :</strong> {selectedStage.entreprise_nom}</p>
            </div>
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
            {t('dashboard.rankInstructions', 'Classez les stages par ordre de préférence')}
          </h2>
          {wishesDeadline && (
            <div className="mb-4 text-sm" style={{ color: deadlinePassed ? '#dc2626' : 'var(--muted-text)' }}>
              {deadlinePassed
                ? t('assignment.deadlinePassed', 'Date limite dépassée — modification des vœux impossible')
                : `${t('assignment.wishesDeadline', 'Date limite de classement des vœux')} : ${new Date(wishesDeadline).toLocaleDateString()}`}
            </div>
          )}
          {loading ? (
            <p style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</p>
          ) : orderedStages.length === 0 ? (
            <p style={{ color: 'var(--muted-text)' }}>{niveau ? t('dashboard.noOffers', 'Aucune offre') : t('dashboard.noLevel', 'Aucun niveau défini pour votre compte.')}</p>
          ) : (
            <ul className="space-y-2">
              {orderedStages.map((stage, index) => (
                <li
                  key={stage.id}
                  draggable={!deadlinePassed}
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(index); }}
                  onDragLeave={() => setOverIndex((v) => (v === index ? null : v))}
                  onDrop={() => onDropAt(index)}
                  onDragEnd={() => setOverIndex(null)}
                  className="p-4 rounded shadow flex justify-between items-center select-none"
                  style={{
                    background: overIndex === index ? 'var(--btn-primary)' : 'var(--input-bg)',
                    color: overIndex === index ? '#fff' : 'var(--text-color)',
                    border: '1px solid var(--border-color)',
                    cursor: deadlinePassed ? 'default' : 'grab',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {!deadlinePassed && <span aria-hidden style={{ color: overIndex === index ? '#fff' : 'var(--muted-text)', fontSize: 18, lineHeight: 1 }}>⠿</span>}
                    <span className="font-bold mr-2">#{index + 1}</span>
                    <span>{stage.titre}</span>
                    <span className="ml-2" style={{ color: overIndex === index ? '#e5e7eb' : 'var(--muted-text)' }}>({stage.entreprise_nom || '—'})</span>
                  </div>
                  <button className="underline text-sm" draggable={false}
                    onClick={() => setSelectedStage(stage)}
                    style={{ color: overIndex === index ? '#fff' : 'var(--btn-primary)' }}>
                    {t('common.viewDetails', 'Détails')}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button className="btn-primary mt-6" onClick={handleSaveVoeux} disabled={saving || loading || deadlinePassed}>
            {saving ? t('common.saving', 'Enregistrement...') : t('common.saveRanking', 'Enregistrer mes vœux')}
          </button>
        </div>

        <div className="card p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>
            {t('dashboard.assignedInternship', 'Stage affecté')}
          </h2>
          {affectation ? (
            <div style={{ color: 'var(--text-color)' }}>
              <p><strong>{t('internship.subject', 'Sujet')} :</strong> {affectation.stage_titre}</p>
              <p><strong>{t('internship.company', 'Entreprise')} :</strong> {affectation.entreprise_nom}</p>
              <p><strong>{t('dashboard.univSupervisor', 'Encadrant université')} :</strong> {affectation.encadrant_univ_nom || '—'}</p>
              <p><strong>{t('dashboard.companySupervisor', 'Encadrant entreprise')} :</strong> {affectation.encadrant_entr_nom || '—'}</p>

              {desiste ? (
                <p className="mt-3 font-medium" style={{ color: '#dc2626' }}>{t('assignment.withdrawn', 'Vous vous êtes désisté(e)')}</p>
              ) : status?.[niveau]?.phase === 'desistement' && (
                <div className="mt-4">
                  <button className="px-4 py-2 rounded text-white" style={{ background: '#dc2626' }} onClick={handleDesist}>
                    {t('assignment.withdraw', 'Se désister')}
                  </button>
                  {status[niveau].deadline && (
                    <span className="ml-3 text-sm" style={{ color: 'var(--muted-text)' }}>
                      {t('assignment.desistUntil', 'Désistement possible jusqu\'au')} {new Date(status[niveau].deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            desiste
              ? <p style={{ color: '#dc2626' }}>{t('assignment.withdrawn', 'Vous vous êtes désisté(e)')}</p>
              : <p style={{ color: 'var(--muted-text)' }}>{t('dashboard.noAssignedInternship', 'Aucun stage affecté')}</p>
          )}
        </div>
      </div>
    </>
  );
}
