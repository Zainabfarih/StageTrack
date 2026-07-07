import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { ProfileHeader, Section, InfoField } from '../../components/ProfileShell';
import { useToast } from '../../contexts/ToastContext';
import { api, clearToken } from '../../services/api';

const FIELDS = [
  ['nom', 'Nom'], ['type_etablissement', 'Type'], ['responsable', 'Responsable'],
  ['adresse', 'Adresse'], ['ville', 'Ville'], ['tel', 'Téléphone'], ['mail', 'Email'],
];

export default function ProfilUniv() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [etab, setEtab] = useState(null);
  const [userId, setUserId] = useState(null);
  const [form, setForm] = useState({});
  const [edit, setEdit] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    api.auth.profile().then((p) => setUserId(p.id)).catch(() => { clearToken(); navigate('/login'); });
  }, [navigate]);

  const load = useCallback(async (id) => {
    const data = await api.etablissements.get(id);
    setEtab(data);
    setForm({ ...data });
  }, []);

  useEffect(() => { if (userId) load(userId); }, [userId, load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const body = Object.fromEntries(FIELDS.map(([n]) => [n, form[n]]));
      if (password) body.mot_de_passe = password;
      await api.etablissements.update(userId, body);
      toast.success(t('profile.updated', 'Profil mis à jour !'));
      setEdit(false); setPassword('');
      await load(userId);
    } catch (e) { toast.error(e.message); }
  };

  if (!etab) return <div className="ml-24 p-8" style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</div>;

  return (
    <>
      <UserNavbar userRole="ADMIN_UNIV" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="max-w-3xl mx-auto">
          <ProfileHeader
            initials={etab.nom?.slice(0, 2).toUpperCase()}
            title={etab.nom}
            subtitle={etab.mail}
            chip={etab.type_etablissement || t('roles.admin', 'Administration')}
            actions={!edit
              ? <button className="btn-primary text-sm" onClick={() => setEdit(true)}>{t('common.edit', 'Modifier')}</button>
              : (<>
                  <button className="btn-primary text-sm" onClick={handleSave}>{t('common.save', 'Enregistrer')}</button>
                  <button className="btn-secondary text-sm" onClick={() => { setEdit(false); setPassword(''); load(userId); }}>{t('common.cancel', 'Annuler')}</button>
                </>)}
          />
          <Section title={t('profile.institution', 'Établissement')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {FIELDS.map(([name, label]) => (
                <InfoField key={name} label={label} value={form[name]} editing={edit} name={name}
                  onChange={handleChange} type={name === 'mail' ? 'email' : 'text'} />
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
