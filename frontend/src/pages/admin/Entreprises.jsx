import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import DataTable from '../../components/DataTable';
import { formatDate } from '../../utils/format';
import { api } from '../../services/api';

export default function Entreprises() {
  const { t } = useTranslation();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [offres, setOffres] = useState([]);
  const [offresLoading, setOffresLoading] = useState(false);
  const [offreDetails, setOffreDetails] = useState(null);

  useEffect(() => {
    api.entreprises.list()
      .then((d) => setEntreprises(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openOffres = async (entreprise) => {
    setSelected(entreprise); setOffres([]); setOffresLoading(true);
    try { setOffres(await api.stages.byEntreprise(entreprise.id)); }
    catch (e) { setError(e.message); } finally { setOffresLoading(false); }
  };

  const fmtDate = (d) => formatDate(d);

  const STATUTS = ['ouvert', 'ferme', 'en_cours', 'termine'];
  const statutOptions = STATUTS.map((s) => ({ value: s, label: t(`internship.statuses.${s}`) }));

  const companyCols = [
    { key: 'nom', label: t('companies.name'), sortable: true, searchable: true },
    { key: 'mail', label: t('auth.email'), searchable: true },
    { key: 'tel', label: t('profile.tel') },
    { key: 'responsable', label: t('register.manager'), searchable: true },
    { key: 'secteur', label: t('register.sector'), filter: 'select', options: [...new Set(entreprises.map((e) => e.secteur).filter(Boolean))] },
  ];

  const offreCols = [
    { key: 'titre', label: t('internship.subject'), sortable: true, searchable: true },
    { key: 'type_offre', label: t('internship.typeOffre'), render: (row) => `${String(row.type_offre || '').toUpperCase()}${row.niveaux ? ` · ${row.niveaux}` : ''}` },
    { key: 'date_debut', label: t('internship.startDate'), sortable: true, render: (row) => fmtDate(row.date_debut) },
    { key: 'date_fin', label: t('internship.endDate'), sortable: true, render: (row) => fmtDate(row.date_fin) },
    {
      key: 'statut', label: t('tasks.status'), filter: 'select', options: statutOptions,
      render: (row) => (row.statut ? t(`internship.statuses.${row.statut}`, row.statut) : '—'),
    },
  ];

  return (
    <>
      <UserNavbar userRole="ADMIN_UNIV" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto">
          {!selected ? (
            <>
              <h1 className="text-xl mb-1" style={{ color: 'var(--btn-primary)' }}>{t('navigation.companies')}</h1>
              <p className="text-sm mb-5" style={{ color: 'var(--muted-text)' }}>{t('companies.hint')}</p>
              {error && <div className="mb-3 text-red-600">{error}</div>}
              {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
                <DataTable columns={companyCols} rows={entreprises} onRowClick={openOffres} emptyLabel={t('companies.none')} />
              )}
            </>
          ) : (
            <>
              <button className="btn-secondary text-sm mb-4" onClick={() => setSelected(null)}>← {t('common.back')}</button>
              <h2 className="text-xl mb-5" style={{ color: 'var(--btn-primary)' }}>{t('internship.offers')} — {selected.nom}</h2>
              {offresLoading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
                <DataTable columns={offreCols} rows={offres} onRowClick={setOffreDetails} emptyLabel={t('dashboard.noOffers')} />
              )}
            </>
          )}
        </div>
      </div>

      {offreDetails && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOffreDetails(null)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--btn-primary)' }}>{offreDetails.titre}</h2>
            <div className="text-sm mb-4" style={{ color: 'var(--muted-text)' }}>{offreDetails.domaine}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm" style={{ color: 'var(--text-color)' }}>
              <p><b>{t('internship.typeOffre', "Type d'offre")} :</b> {String(offreDetails.type_offre || '').toUpperCase()}</p>
              <p><b>{t('internship.targetLevels', 'Niveaux ciblés')} :</b> {offreDetails.niveaux || '—'}</p>
              <p><b>{t('internship.type', 'Type')} :</b> {offreDetails.type_stage || '—'}</p>
              <p><b>{t('internship.localization', 'Localisation')} :</b> {offreDetails.localisation || '—'}</p>
              <p><b>{t('internship.posts', 'Nombre de postes')} :</b> {offreDetails.nbr_postes ?? '—'}</p>
              <p><b>{t('tasks.status', 'Statut')} :</b> {t(`internship.statuses.${offreDetails.statut}`, offreDetails.statut)}</p>
              <p><b>{t('internship.startDate', 'Début')} :</b> {fmtDate(offreDetails.date_debut)}</p>
              <p><b>{t('internship.endDate', 'Fin')} :</b> {fmtDate(offreDetails.date_fin)}</p>
              <p><b>{t('internship.candidatures', 'Candidatures')} :</b> {offreDetails.nombre_candidatures ?? 0}</p>
            </div>
            <div className="mt-4 text-sm" style={{ color: 'var(--text-color)' }}>
              <p className="mb-1"><b>{t('internship.requirements', 'Compétences requises')} :</b></p>
              <p style={{ color: 'var(--muted-text)' }}>{offreDetails.competences_requises || '—'}</p>
              <p className="mt-3 mb-1"><b>{t('internship.description', 'Description')} :</b></p>
              <p style={{ color: 'var(--muted-text)' }}>{offreDetails.description || '—'}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="btn-secondary text-sm" onClick={() => setOffreDetails(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
