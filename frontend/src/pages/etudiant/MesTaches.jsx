import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { api } from '../../services/api';

const STATUT_LABELS = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  terminee: 'Terminée',
};

export default function MesTaches() {
  const { t } = useTranslation();
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const id = Number(localStorage.getItem('userId'));

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg('');
      try {
        const data = await api.taches.byEtudiant(id);
        setTaches(data || []);
        if (!data || !data.length) setMsg(t('tasks.none', 'Aucune tâche à afficher.'));
      } catch (e) {
        setMsg(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id, t]);

  const handleToggle = async (tache) => {
    setMsg('');
    try {
      if (tache.statut === 'terminee') {
        await api.taches.update(tache.id, { statut: 'en_cours' });
      } else {
        await api.taches.markDone(tache.id);
      }
      const data = await api.taches.byEtudiant(id);
      setTaches(data || []);
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <>
      <UserNavbar userRole="ETUDIANT" />
      <div className="ml-24 p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--btn-primary)' }}>
          {t('navigation.tasks', 'Mes Tâches')}
        </h1>
        {msg && <div className="mb-3" style={{ color: 'var(--muted-text)' }}>{msg}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</p>
        ) : taches.length === 0 ? (
          <p style={{ color: 'var(--text-color)' }}>{t('tasks.none', 'Aucune tâche à afficher.')}</p>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr style={{ background: 'var(--btn-primary)', color: '#fff' }}>
                  <th className="px-4 py-3 text-left">{t('tasks.title', 'Tâche')}</th>
                  <th className="px-4 py-3 text-left">{t('tasks.deadline', 'Échéance')}</th>
                  <th className="px-4 py-3 text-left">{t('tasks.status', 'Statut')}</th>
                  <th className="px-4 py-3 text-left">{t('common.action', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {taches.map((tk) => (
                  <tr key={tk.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                    <td className="px-4 py-3 font-medium">{tk.titre}</td>
                    <td className="px-4 py-3">{tk.date_echeance ? new Date(tk.date_echeance).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">{STATUT_LABELS[tk.statut] || tk.statut}</td>
                    <td className="px-4 py-3">
                      <button
                        className="px-3 py-1 rounded text-white"
                        style={{ background: tk.statut === 'terminee' ? '#16a34a' : '#64748b' }}
                        onClick={() => handleToggle(tk)}
                      >
                        {tk.statut === 'terminee' ? t('tasks.markUndone', 'Rouvrir') : t('tasks.markDone', 'Terminer')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
