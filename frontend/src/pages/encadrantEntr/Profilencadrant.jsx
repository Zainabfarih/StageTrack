import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { ProfileHeader, Section, InfoField } from '../../components/ProfileShell';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

const FIELDS = ['nom', 'prenom', 'mail', 'tel', 'poste', 'specialite'];

export default function Profilencadrant() {
  const { t } = useTranslation();
  const toast = useToast();
  const userId = Number(localStorage.getItem('userId'));
  const [data, setData] = useState(null);
  const [form, setForm] = useState({});
  const [edit, setEdit] = useState(false);
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    try {
      const p = await api.auth.profile();
      setData(p);
      setForm(Object.fromEntries(FIELDS.map((k) => [k, p[k] ?? ''])));
    } catch { toast.error(t('errors.loadError', 'Erreur de chargement')); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const body = { ...form };
      if (password) body.mot_de_passe = password;
      await api.encadrantsEntr.update(userId, body);
      toast.success(t('profile.updated', 'Profil mis à jour !'));
      setEdit(false); setPassword('');
      await load();
    } catch (e) { toast.error(e.message); }
  };

  if (!data) return <div className="ml-24 p-8" style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</div>;

  return (
    <>
      <UserNavbar userRole="ENCADRANT_ENTREPRISE" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="max-w-3xl mx-auto">
          <ProfileHeader
            initials={`${data.prenom?.[0] || ''}${data.nom?.[0] || ''}`}
            title={`${data.prenom} ${data.nom}`}
            subtitle={data.mail}
            chip={data.poste || t('roles.companySupervisor', 'Encadrant entreprise')}
            actions={!edit
              ? <button className="btn-primary text-sm" onClick={() => setEdit(true)}>{t('common.edit', 'Modifier')}</button>
              : (<>
                  <button className="btn-primary text-sm" onClick={handleSave}>{t('common.save', 'Enregistrer')}</button>
                  <button className="btn-secondary text-sm" onClick={() => { setEdit(false); setPassword(''); load(); }}>{t('common.cancel', 'Annuler')}</button>
                </>)}
          />
          <Section title={t('profile.personalInfo', 'Informations personnelles')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {FIELDS.map((f) => (
                <InfoField key={f} label={t(`profile.${f}`, f)} value={form[f]} editing={edit} name={f}
                  onChange={handleChange} type={f === 'mail' ? 'email' : 'text'} />
              ))}
            </div>
          </Section>
          {edit && (
            <Section title={t('settings.changePassword', 'Changer le mot de passe')}>
              <InfoField label={t('auth.newPassword', 'Nouveau mot de passe')} value={password} editing name="password"
                type="password" placeholder={t('profile.leaveEmpty', 'Laisser vide pour ne pas changer')}
                onChange={(e) => setPassword(e.target.value)} />
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
