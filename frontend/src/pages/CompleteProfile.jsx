import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const roleToDashboard = {
  ETUDIANT: '/etudiant/dashboard',
  ADMIN_ENTREPRISE: '/entreprise/dashboard',
  ADMIN_UNIV: '/admin/dashboard',
  ENCADRANT_UNIV: '/encadrant-univ/dashboard',
  ENCADRANT_ENTREPRISE: '/encadrant-entr/dashboard',
};

// Champs à compléter selon le rôle (seuls entreprise et étudiant arrivent ici)
const FIELDS_BY_ROLE = {
  ADMIN_ENTREPRISE: [
    { name: 'nom', label: "Nom de l'entreprise", type: 'text', required: true },
    { name: 'secteur', label: 'Secteur', type: 'text', required: true },
    { name: 'ville', label: 'Ville', type: 'text', required: true },
    { name: 'adresse', label: 'Adresse', type: 'text' },
    { name: 'tel', label: 'Téléphone', type: 'text' },
    { name: 'responsable', label: 'Responsable', type: 'text' },
    { name: 'site_web', label: 'Site web', type: 'url' },
  ],
  ETUDIANT: [
    { name: 'niveau', label: 'Niveau', type: 'text', required: true },
    { name: 'filiere', label: 'Filière', type: 'text', required: true },
    { name: 'tel', label: 'Téléphone', type: 'text' },
    { name: 'ville', label: 'Ville', type: 'text' },
    { name: 'date_naissance', label: 'Date de naissance', type: 'date' },
    { name: 'sexe', label: 'Sexe', type: 'select', options: [['H', 'Homme'], ['F', 'Femme']] },
  ],
};

export default function CompleteProfile() {
  const { t } = useTranslation();
  const role = localStorage.getItem('role') || 'ADMIN_ENTREPRISE';
  const fields = FIELDS_BY_ROLE[role] || [];
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.completeProfile({ ...formData, role });
      localStorage.setItem('profile_completed', 'true');
      navigate(roleToDashboard[role] || '/');
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in" style={{ background: 'var(--bg-color)' }}>
      <div className="card w-full max-w-lg p-8 flex flex-col gap-6">
        <img src="/logo-stage-track.svg" alt="Logo" className="w-14 h-14 mx-auto mb-2" />
        <h1 className="h1 text-center mb-2">{t('profile.complete', 'Compléter votre profil')}</h1>
        <p className="text-center text-sm" style={{ color: 'var(--muted-text)' }}>
          {t('profile.completeHint', 'Renseignez ces informations pour accéder à toutes les fonctionnalités.')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block mb-2 text-left" style={{ color: 'var(--text-color)' }}>{field.label}</label>
              {field.type === 'select' ? (
                <select name={field.name} value={formData[field.name] || ''} onChange={handleChange}
                  className="w-full p-2 border rounded"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                  <option value="">—</option>
                  {field.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : (
                <input type={field.type} name={field.name} value={formData[field.name] || ''} onChange={handleChange}
                  required={field.required} className="w-full p-2 border rounded"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
              )}
            </div>
          ))}
          {error && <div className="text-sm text-center" style={{ color: '#ef4444' }}>{error}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('common.saving', 'Enregistrement...') : t('profile.complete', 'Compléter le profil')}
          </button>
        </form>
      </div>
    </div>
  );
}
