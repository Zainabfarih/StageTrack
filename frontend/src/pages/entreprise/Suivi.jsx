import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import SuiviStages from '../../components/SuiviStages';
import { api } from '../../services/api';

export default function SuiviEntreprise() {
  const { t } = useTranslation();
  const entrepriseId = Number(localStorage.getItem('userId'));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await api.affectation.byEntreprise(entrepriseId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [entrepriseId]);

  useEffect(() => { if (entrepriseId) load(); }, [entrepriseId, load]);

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto">
          <h1 className="text-xl mb-5" style={{ color: 'var(--btn-primary)' }}>{t('tracking.title', 'Suivi des stages')}</h1>
          {error && <div className="mb-3 text-red-600">{error}</div>}
          {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
            <SuiviStages rows={rows} variant="entreprise" />
          )}
        </div>
      </div>
    </>
  );
}
