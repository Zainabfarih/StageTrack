import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, toDateInput } from '../../utils/format';
import { api } from '../../services/api';

export default function Offres() {
  const { t } = useTranslation();
  const toast = useToast();
  const entrepriseId = Number(localStorage.getItem('userId'));

  const initialForm = {
    titre: '', type_stage: 'Présentiel', type_offre: 'pfe', niveaux: ['3A'], date_debut: '', date_fin: '',
    domaine: '', localisation: '', competences_requises: '', description: '',
    nbr_postes: 1, id_entreprise: entrepriseId,
  };

  const [offers, setOffers] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  const STATUTS = { ouvert: t('internship.statuses.ouvert', 'Ouvert'), ferme: t('internship.statuses.ferme', 'Fermé'), en_cours: t('internship.statuses.en_cours', 'En cours'), termine: t('internship.statuses.termine', 'Terminé') };

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOffers(await api.stages.byEntreprise(entrepriseId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [entrepriseId]);

  useEffect(() => { if (entrepriseId) fetchOffers(); }, [entrepriseId, fetchOffers]);

  const openModal = (offer = null) => {
    setForm(offer
      ? { ...initialForm, ...offer, niveaux: offer.niveaux ? String(offer.niveaux).split(',') : [], date_debut: toDateInput(offer.date_debut), date_fin: toDateInput(offer.date_fin) }
      : { ...initialForm });
    setEditId(offer ? offer.id : null);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setForm(initialForm); setEditId(null); setError(''); };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const toggleNiveau = (n) => setForm((f) => {
    const set = new Set(f.niveaux || []);
    if (set.has(n)) set.delete(n); else set.add(n);
    return { ...f, niveaux: [...set] };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const niveaux = form.type_offre === 'pfe' ? '3A' : (form.niveaux || []).join(',');
      if (form.type_offre === 'pfa' && !niveaux) {
        setError(t('internship.targetLevels', 'Choisissez au moins un niveau (1A et/ou 2A)'));
        setLoading(false); return;
      }
      const payload = { ...form, id_entreprise: entrepriseId, niveaux };
      if (editId) await api.stages.update(editId, payload);
      else await api.stages.create(payload);
      toast.success(editId ? t('common.updated', 'Mis à jour') : t('common.created', 'Créé'));
      closeModal();
      fetchOffers();
    } catch (e2) {
      setError(e2.message);
      toast.error(e2.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('internship.deleteConfirm', 'Supprimer cette offre ?'))) return;
    try {
      await api.stages.remove(id);
      toast.success(t('common.deleted', 'Supprimé'));
      fetchOffers();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const filtered = offers.filter((o) =>
    o.titre?.toLowerCase().includes(search.toLowerCase()) ||
    o.domaine?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>
          {t('internship.offers', 'Offres de stage')}
        </h1>

        <div className="flex items-center mb-6 gap-2">
          <input
            type="text" placeholder={t('internship.searchPlaceholder', 'Rechercher...')}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 w-full max-w-xs rounded-lg border text-sm"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }} />
          <button className="btn-primary px-4 py-2" onClick={() => openModal()}>
            {t('internship.newOffer', 'Nouvelle offre')}
          </button>
        </div>

        {error && <div className="mb-4" style={{ color: '#ef4444' }}>{error}</div>}

        {loading ? <div style={{ color: 'var(--text-color)' }}>{t('common.loading', 'Chargement...')}</div>
          : filtered.length === 0 ? <div style={{ color: 'var(--muted-text)' }}>{t('dashboard.noOffers', 'Aucune offre')}</div>
          : (
            <div className="flex flex-col gap-4">
              {filtered.map((offer) => (
                <div key={offer.id} className="card p-6 cursor-pointer" onClick={() => setDetails(offer)}>
                  <h2 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>{offer.titre}</h2>
                  <div className="text-xs mb-2" style={{ color: 'var(--muted-text)' }}>{offer.domaine}</div>
                  <div className="text-sm" style={{ color: 'var(--text-color)' }}>
                    <p><b>{t('internship.typeOffre', "Type d'offre")} :</b> {String(offer.type_offre || '').toUpperCase()}{offer.niveaux ? ` · ${offer.niveaux}` : ''}</p>
                    <p><b>{t('internship.type', 'Type')} :</b> {offer.type_stage}</p>
                    <p><b>{t('internship.period', 'Période')} :</b> {formatDate(offer.date_debut)} → {formatDate(offer.date_fin)}</p>
                    <p><b>{t('tasks.status', 'Statut')} :</b> {STATUTS[offer.statut] || offer.statut}</p>
                    <p><b>{t('internship.candidatures', 'Candidatures')} :</b> {offer.nombre_candidatures ?? 0}</p>
                  </div>
                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-primary px-3 py-1" onClick={() => openModal(offer)}>{t('common.edit', 'Modifier')}</button>
                    <button className="px-3 py-1 rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                      onClick={() => handleDelete(offer.id)}>{t('common.delete', 'Supprimer')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
              {editId ? t('internship.editOffer', 'Modifier l\'offre') : t('internship.createOffer', 'Créer une offre')}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              {[['titre', t('internship.subject', 'Titre'), true],
                ['domaine', t('internship.domain', 'Domaine'), true],
                ['localisation', t('internship.localization', 'Localisation'), false],
                ['competences_requises', t('internship.requirements', 'Compétences'), false],
                ['description', t('internship.description', 'Description'), false]].map(([name, ph, req]) => (
                <input key={name} name={name} value={form[name] || ''} onChange={handleChange} placeholder={ph} required={req}
                  className="border rounded px-2 py-1"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
              ))}
              <select name="type_stage" value={form.type_stage} onChange={handleChange} className="border rounded px-2 py-1"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                <option value="Présentiel">{t('internship.onsite', 'Présentiel')}</option>
                <option value="À distance">{t('internship.remote', 'À distance')}</option>
                <option value="Hybride">Hybride</option>
              </select>
              <select name="type_offre" value={form.type_offre}
                onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, type_offre: v, niveaux: v === 'pfe' ? ['3A'] : [] })); }}
                className="border rounded px-2 py-1"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                <option value="pfe">PFE (3A)</option>
                <option value="pfa">PFA (1A / 2A)</option>
              </select>
              {form.type_offre === 'pfa' && (
                <div className="flex items-center gap-4 text-sm py-1" style={{ color: 'var(--text-color)' }}>
                  <span>{t('internship.targetLevels', 'Niveaux ciblés')} :</span>
                  {['1A', '2A'].map((n) => (
                    <label key={n} className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={(form.niveaux || []).includes(n)} onChange={() => toggleNiveau(n)} /> {n}
                    </label>
                  ))}
                </div>
              )}
              <input type="number" min="1" name="nbr_postes" value={form.nbr_postes} onChange={handleChange}
                placeholder={t('internship.posts', 'Nombre de postes')} className="border rounded px-2 py-1"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
              <label className="text-sm" style={{ color: 'var(--text-color)' }}>{t('internship.startDate', 'Début')}
                <input type="date" name="date_debut" value={form.date_debut || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full mt-1"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} /></label>
              <label className="text-sm" style={{ color: 'var(--text-color)' }}>{t('internship.endDate', 'Fin')}
                <input type="date" name="date_fin" value={form.date_fin || ''} onChange={handleChange} className="border rounded px-2 py-1 w-full mt-1"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} /></label>
              <div className="flex gap-2 mt-2">
                <button type="submit" className="btn-primary px-3 py-1" disabled={loading}>
                  {editId ? t('common.save', 'Enregistrer') : t('common.create', 'Créer')}
                </button>
                <button type="button" className="px-3 py-1 rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }} onClick={closeModal}>
                  {t('common.cancel', 'Annuler')}
                </button>
              </div>
            </form>
            {error && <div className="mt-2" style={{ color: '#ef4444' }}>{error}</div>}
          </div>
        </div>
      )}

      {details && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4" onClick={() => setDetails(null)}>
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--btn-primary)' }}>{details.titre}</h2>
            <div className="text-sm mb-4" style={{ color: 'var(--muted-text)' }}>{details.domaine}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm" style={{ color: 'var(--text-color)' }}>
              <p><b>{t('internship.typeOffre', "Type d'offre")} :</b> {String(details.type_offre || '').toUpperCase()}</p>
              <p><b>{t('internship.targetLevels', 'Niveaux ciblés')} :</b> {details.niveaux || '—'}</p>
              <p><b>{t('internship.type', 'Type')} :</b> {details.type_stage || '—'}</p>
              <p><b>{t('internship.localization', 'Localisation')} :</b> {details.localisation || '—'}</p>
              <p><b>{t('internship.posts', 'Nombre de postes')} :</b> {details.nbr_postes ?? '—'}</p>
              <p><b>{t('tasks.status', 'Statut')} :</b> {STATUTS[details.statut] || details.statut}</p>
              <p><b>{t('internship.startDate', 'Début')} :</b> {formatDate(details.date_debut)}</p>
              <p><b>{t('internship.endDate', 'Fin')} :</b> {formatDate(details.date_fin)}</p>
              <p><b>{t('internship.candidatures', 'Candidatures')} :</b> {details.nombre_candidatures ?? 0}</p>
            </div>
            <div className="mt-4 text-sm" style={{ color: 'var(--text-color)' }}>
              <p className="mb-1"><b>{t('internship.requirements', 'Compétences requises')} :</b></p>
              <p style={{ color: 'var(--muted-text)' }}>{details.competences_requises || '—'}</p>
              <p className="mt-3 mb-1"><b>{t('internship.description', 'Description')} :</b></p>
              <p style={{ color: 'var(--muted-text)' }}>{details.description || '—'}</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-primary text-sm" onClick={() => { const o = details; setDetails(null); openModal(o); }}>{t('common.edit', 'Modifier')}</button>
              <button className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }} onClick={() => setDetails(null)}>{t('common.close', 'Fermer')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
