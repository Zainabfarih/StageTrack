import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFilePdf, FaFileUpload, FaRegFile } from 'react-icons/fa';
import UserNavbar from '../../components/UserNavbar';
import { ProfileHeader, Section, InfoField } from '../../components/ProfileShell';
import { useToast } from '../../contexts/ToastContext';
import { api, API_ORIGIN } from '../../services/api';

const EDITABLE = ['nom', 'prenom', 'mail', 'date_naissance', 'sexe', 'adresse', 'ville', 'tel', 'niveau', 'filiere'];

export default function ProfilEtudiant() {
  const { t } = useTranslation();
  const toast = useToast();
  const id = Number(localStorage.getItem('userId'));

  const [etudiant, setEtudiant] = useState(null);
  const [affectation, setAffectation] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState('');

  const loadEtudiant = useCallback(async () => {
    const data = await api.etudiants.get(id);
    setEtudiant(data);
    setForm(Object.fromEntries(EDITABLE.map((k) => [k, data[k] ?? ''])));
  }, [id]);

  const loadAffectation = useCallback(async () => {
    try {
      const rows = await api.etudiantStage.byEtudiant(id);
      setAffectation(rows && rows.length ? rows[0] : null);
    } catch { setAffectation(null); }
  }, [id]);

  useEffect(() => { if (id) { loadEtudiant(); loadAffectation(); } }, [id, loadEtudiant, loadAffectation]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      await api.etudiants.update(id, form);
      toast.success(t('profile.updated', 'Profil mis à jour !'));
      setEdit(false);
      await loadEtudiant();
    } catch (e) { toast.error(e.message); }
  };

  const uploadFile = async (type, file) => {
    if (!file) return;
    setUploading(type);
    const fd = new FormData();
    fd.append('file', file);
    try {
      if (type === 'cv') await api.etudiants.uploadCv(id, fd);
      else if (type === 'lm') await api.etudiants.uploadLm(id, fd);
      else if (type === 'rapport') await api.etudiants.uploadRapport(id, fd);
      else if (type === 'convention') await api.etudiants.uploadConvention(id, fd);
      toast.success(t('profile.fileUploaded', 'Fichier téléversé !'));
      await loadEtudiant();
      await loadAffectation();
    } catch (e) { toast.error(e.message); }
    finally { setUploading(''); }
  };

  if (!etudiant) return <div className="ml-24 p-8" style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</div>;

  const docRow = (label, url, type) => (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--muted-bg)' }}>
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
        style={{ background: url ? 'var(--gradient-primary)' : 'var(--border-color)' }}>
        {url ? <FaFilePdf /> : <FaRegFile />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>{label}</div>
        {url
          ? <a href={`${API_ORIGIN}${url}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: 'var(--btn-primary)' }}>{t('common.view', 'Voir le document')}</a>
          : <div className="text-xs" style={{ color: 'var(--muted-text)' }}>{t('common.none', 'Aucun fichier')}</div>}
      </div>
      <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer inline-flex items-center gap-1.5 flex-shrink-0">
        <FaFileUpload /> {uploading === type ? t('common.saving', '...') : t('common.upload', 'Téléverser')}
        <input type="file" accept="application/pdf" className="hidden" disabled={uploading === type}
          onChange={(e) => { uploadFile(type, e.target.files[0]); e.target.value = ''; }} />
      </label>
    </div>
  );

  return (
    <>
      <UserNavbar userRole="ETUDIANT" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="max-w-3xl mx-auto">
          <ProfileHeader
            initials={`${etudiant.prenom?.[0] || ''}${etudiant.nom?.[0] || ''}`}
            title={`${etudiant.prenom} ${etudiant.nom}`}
            subtitle={etudiant.mail}
            chip={etudiant.filiere || t('roles.student', 'Étudiant')}
            actions={!edit
              ? <button className="btn-primary text-sm" onClick={() => setEdit(true)}>{t('common.edit', 'Modifier')}</button>
              : (<>
                  <button className="btn-primary text-sm" onClick={handleSave}>{t('common.save', 'Enregistrer')}</button>
                  <button className="btn-secondary text-sm" onClick={() => { setEdit(false); loadEtudiant(); }}>{t('common.cancel', 'Annuler')}</button>
                </>)}
          />

          <Section title={t('profile.personalInfo', 'Informations personnelles')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {EDITABLE.map((field) => (
                <InfoField key={field} label={t(`profile.${field}`, field)} value={form[field]}
                  editing={edit} name={field} onChange={handleChange}
                  type={field === 'date_naissance' ? 'date' : 'text'}
                  options={field === 'sexe' ? [['H', 'H'], ['F', 'F']] : undefined} />
              ))}
            </div>
          </Section>

          <Section title={t('profile.score', 'Score')}>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold gradient-text">{etudiant.score ?? '—'}</span>
              <span className="text-sm mb-1" style={{ color: 'var(--muted-text)' }}>/ 20</span>
            </div>
          </Section>

          <Section title={t('profile.documents', 'Documents')}>
            <div className="grid grid-cols-1 gap-3">
              {docRow('CV', etudiant.cv_pdf, 'cv')}
              {docRow(t('profile.coverLetter', 'Lettre de motivation'), etudiant.lm_pdf, 'lm')}
              {docRow(t('profile.report', 'Rapport'), affectation?.rapport_pdf, 'rapport')}
              {docRow(t('profile.convention', 'Convention'), affectation?.convention_pdf, 'convention')}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
