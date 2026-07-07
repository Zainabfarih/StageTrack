import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import DataTable from '../../components/DataTable';
import { InfoField } from '../../components/ProfileShell';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

const FILIERES = ['GL', 'BIA', 'SSE', '2IA', 'IDF', '2SCL', 'D2S', 'CSCC'];
const NIVEAUX = ['1A', '2A', '3A'];
const EMPTY = { nom: '', prenom: '', mail: '', niveau: '1A', filiere: 'GL' };
const EDITABLE = ['nom', 'prenom', 'mail', 'tel', 'date_naissance', 'sexe', 'adresse', 'ville', 'niveau', 'filiere'];

export default function Etudiants() {
  const { t } = useTranslation();
  const toast = useToast();
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [universiteId, setUniversiteId] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { api.auth.profile().then((p) => setUniversiteId(p.id)).catch(() => setError(t('errors.loadError'))); }, [t]);

  const fetchEtudiants = useCallback(async () => {
    setLoading(true); setError('');
    try { const data = await api.etudiants.list(); setEtudiants(data.data || data || []); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (universiteId) fetchEtudiants(); }, [universiteId, fetchEtudiants]);

  const handleAdd = async (e) => {
    e.preventDefault(); setAddError(''); setAddLoading(true);
    try {
      await api.auth.createEtudiant({ ...addForm, password: 'Etu@1234', id_universite: universiteId });
      setShowAdd(false); setAddForm(EMPTY); await fetchEtudiants();
      toast.success(t('common.created', 'Créé'));
    } catch (err) { setAddError(err.message); } finally { setAddLoading(false); }
  };

  const deleteOne = async (id) => {
    if (!window.confirm(t('students.deleteConfirm'))) return;
    try { await api.etudiants.remove(id); setEtudiants((p) => p.filter((e) => e.id !== id)); toast.success(t('common.deleted', 'Supprimé')); }
    catch (err) { toast.error(err.message); }
  };
  const deleteMany = async (ids) => {
    if (!window.confirm(t('students.deleteManyConfirm'))) return;
    try { await Promise.all(ids.map((id) => api.etudiants.remove(id))); setEtudiants((p) => p.filter((e) => !ids.includes(e.id))); toast.success(t('common.deleted', 'Supprimé')); }
    catch (err) { toast.error(err.message); fetchEtudiants(); }
  };

  const openRow = (row) => {
    setViewing(row); setEditing(false);
    setEditForm(Object.fromEntries(EDITABLE.map((k) => [k, row[k] ?? ''])));
  };

  const saveEdit = async () => {
    try {
      await api.etudiants.update(viewing.id, editForm);
      await fetchEtudiants();
      setEditing(false);
      setViewing((v) => ({ ...v, ...editForm }));
      toast.success(t('common.updated', 'Mis à jour'));
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'nom', label: t('profile.nom'), sortable: true, searchable: true },
    { key: 'prenom', label: t('profile.prenom'), sortable: true, searchable: true },
    { key: 'mail', label: t('auth.email'), searchable: true },
    { key: 'filiere', label: t('profile.filiere'), filter: 'select', options: FILIERES },
    { key: 'niveau', label: t('students.year'), filter: 'select', options: NIVEAUX },
  ];

  const inputCls = 'w-full p-2 border rounded-lg';
  const inputStyle = { background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' };

  return (
    <>
      <UserNavbar userRole="ADMIN_UNIV" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl" style={{ color: 'var(--btn-primary)' }}>{t('students.title')}</h1>
            <button className="btn-primary text-sm" onClick={() => { setShowAdd((v) => !v); setAddForm(EMPTY); setAddError(''); }}>
              {showAdd ? t('common.close') : `+ ${t('common.add')}`}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} className="mb-6 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ background: 'var(--muted-bg)' }}>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{t('profile.nom')} *</label>
                <input required value={addForm.nom} onChange={(e) => setAddForm({ ...addForm, nom: e.target.value })} className={inputCls} style={inputStyle} /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{t('profile.prenom')} *</label>
                <input required value={addForm.prenom} onChange={(e) => setAddForm({ ...addForm, prenom: e.target.value })} className={inputCls} style={inputStyle} /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{t('auth.email')} *</label>
                <input required type="email" value={addForm.mail} onChange={(e) => setAddForm({ ...addForm, mail: e.target.value })} className={inputCls} style={inputStyle} /></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{t('profile.filiere')}</label>
                <select value={addForm.filiere} onChange={(e) => setAddForm({ ...addForm, filiere: e.target.value })} className={inputCls} style={inputStyle}>
                  {FILIERES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select></div>
              <div><label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{t('students.year')}</label>
                <select value={addForm.niveau} onChange={(e) => setAddForm({ ...addForm, niveau: e.target.value })} className={inputCls} style={inputStyle}>
                  {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                </select></div>
              <div className="sm:col-span-2 text-xs" style={{ color: 'var(--muted-text)' }}>{t('students.tempPwdNote')}</div>
              {addError && <div className="sm:col-span-2 text-red-600 text-sm">{addError}</div>}
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" disabled={addLoading} className="btn-primary text-sm">{addLoading ? '...' : t('common.add')}</button>
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          )}

          {error && <div className="mb-3 text-red-600">{error}</div>}
          {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
            <DataTable columns={columns} rows={etudiants} onRowClick={openRow} onDelete={deleteOne} onBulkDelete={deleteMany} emptyLabel={t('students.none')} />
          )}
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'var(--gradient-primary)' }}>
                  {(viewing.prenom?.[0] || '') + (viewing.nom?.[0] || '')}
                </div>
                <div>
                  <div className="font-bold" style={{ color: 'var(--text-color)' }}>{viewing.prenom} {viewing.nom}</div>
                  <div className="text-sm" style={{ color: 'var(--muted-text)' }}>{viewing.mail}</div>
                </div>
              </div>
              {!editing
                ? <button className="btn-primary text-sm" onClick={() => setEditing(true)}>{t('common.edit')}</button>
                : <button className="btn-primary text-sm" onClick={saveEdit}>{t('common.save')}</button>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
              <InfoField label={t('profile.nom')} value={editForm.nom} editing={editing} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
              <InfoField label={t('profile.prenom')} value={editForm.prenom} editing={editing} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
              <InfoField label={t('auth.email')} value={editForm.mail} editing={editing} type="email" onChange={(e) => setEditForm({ ...editForm, mail: e.target.value })} />
              <InfoField label={t('profile.tel')} value={editForm.tel} editing={editing} onChange={(e) => setEditForm({ ...editForm, tel: e.target.value })} />
              <InfoField label={t('profile.date_naissance')} value={editForm.date_naissance} editing={editing} type="date" onChange={(e) => setEditForm({ ...editForm, date_naissance: e.target.value })} />
              <InfoField label={t('profile.sexe')} value={editForm.sexe} editing={editing} options={[['H', 'H'], ['F', 'F']]} onChange={(e) => setEditForm({ ...editForm, sexe: e.target.value })} />
              <InfoField label={t('profile.ville')} value={editForm.ville} editing={editing} onChange={(e) => setEditForm({ ...editForm, ville: e.target.value })} />
              <InfoField label={t('profile.adresse')} value={editForm.adresse} editing={editing} onChange={(e) => setEditForm({ ...editForm, adresse: e.target.value })} />
              <InfoField label={t('profile.filiere')} value={editForm.filiere} editing={editing} options={FILIERES.map((f) => [f, f])} onChange={(e) => setEditForm({ ...editForm, filiere: e.target.value })} />
              <InfoField label={t('students.year')} value={editForm.niveau} editing={editing} options={NIVEAUX.map((n) => [n, n])} onChange={(e) => setEditForm({ ...editForm, niveau: e.target.value })} />
            </div>

            <div className="mt-6 flex justify-end">
              <button className="btn-secondary text-sm" onClick={() => setViewing(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
