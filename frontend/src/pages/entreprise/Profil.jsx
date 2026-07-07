import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { ProfileHeader, Section, InfoField } from '../../components/ProfileShell';
import { useToast } from '../../contexts/ToastContext';
import { api, clearToken } from '../../services/api';

const FIELDS = [
  ['nom', 'companyName'], ['mail', null], ['secteur', 'sector'], ['ville', null],
  ['tel', null], ['responsable', 'manager'], ['site_web', 'website'], ['adresse', null],
];

export default function EntrepriseProfil() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [entreprise, setEntreprise] = useState(null);
  const [userId, setUserId] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [password, setPassword] = useState('');

  useEffect(() => {
    api.auth.profile().then((p) => setUserId(p.id)).catch(() => { clearToken(); navigate('/login'); });
  }, [navigate]);

  const load = useCallback(async (id) => {
    const data = await api.entreprises.get(id);
    setEntreprise(data);
    setForm({ ...data });
  }, []);

  useEffect(() => { if (userId) load(userId); }, [userId, load]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    try {
      const body = { ...form };
      if (password) body.mot_de_passe = password;
      await api.entreprises.update(userId, body);
      toast.success(t('profile.updated', 'Profil mis à jour !'));
      setEdit(false); setPassword('');
      await load(userId);
    } catch (e) { toast.error(e.message); }
  };

  const labelFor = (name, key) => key ? t(`register.${key}`, name) : t(`profile.${name}`, name);

  if (!entreprise) return <div className="ml-24 p-8" style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</div>;

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="max-w-3xl mx-auto">
          <ProfileHeader
            initials={entreprise.nom?.slice(0, 2).toUpperCase()}
            title={entreprise.nom}
            subtitle={entreprise.mail}
            chip={entreprise.secteur || t('roles.company', 'Entreprise')}
            actions={!edit
              ? <button className="btn-primary text-sm" onClick={() => setEdit(true)}>{t('common.edit', 'Modifier')}</button>
              : (<>
                  <button className="btn-primary text-sm" onClick={handleSave}>{t('common.save', 'Enregistrer')}</button>
                  <button className="btn-secondary text-sm" onClick={() => { setEdit(false); setPassword(''); load(userId); }}>{t('common.cancel', 'Annuler')}</button>
                </>)}
          />

          <Section title={t('register.title', 'Informations de l\'entreprise')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              {FIELDS.map(([name, key]) => (
                <InfoField key={name} label={labelFor(name, key)} value={form[name]}
                  editing={edit} name={name} onChange={handleChange} type={name === 'mail' ? 'email' : name === 'site_web' ? 'url' : 'text'} />
              ))}
            </div>
          </Section>

          {edit && (
            <Section title={t('settings.changePassword', 'Changer le mot de passe')}>
              <InfoField label={t('auth.newPassword', 'Nouveau mot de passe')} value={password} editing
                name="password" type="password" placeholder={t('profile.leaveEmpty', 'Laisser vide pour ne pas changer')}
                onChange={(e) => setPassword(e.target.value)} />
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
