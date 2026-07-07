import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import DataTable from '../../components/DataTable';
import { InfoField } from '../../components/ProfileShell';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

const EMPTY = { nom: '', prenom: '', mail: '', tel: '', poste: '', specialite: '' };
const EDITABLE = ['nom', 'prenom', 'mail', 'tel', 'poste', 'specialite'];

export default function EncadrantsEntr() {
  const { t } = useTranslation();
  const toast = useToast();
  const entrepriseId = Number(localStorage.getItem('userId'));

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchList = useCallback(async () => {
    setLoading(true); setError('');
    try { setList(await api.encadrantsEntr.byEntreprise(entrepriseId)); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [entrepriseId]);

  useEffect(() => { if (entrepriseId) fetchList(); }, [entrepriseId, fetchList]);

  const handleAdd = async (e) => {
    e.preventDefault(); setAddError(''); setAddLoading(true);
    try {
      await api.encadrantsEntr.create({ ...addForm, id_entreprise: entrepriseId });
      setShowAdd(false); setAddForm(EMPTY); await fetchList();
      toast.success(t('common.created', 'Créé'));
    } catch (err) { setAddError(err.message); } finally { setAddLoading(false); }
  };

  const deleteOne = async (id) => {
    if (!window.confirm(t('supervisor.deleteConfirm'))) return;
    try { await api.encadrantsEntr.remove(id); setList((p) => p.filter((e) => e.id !== id)); toast.success(t('common.deleted', 'Supprimé')); }
    catch (err) { toast.error(err.message); }
  };
  const deleteMany = async (ids) => {
    if (!window.confirm(t('supervisors.deleteManyConfirm'))) return;
    try { await Promise.all(ids.map((id) => api.encadrantsEntr.remove(id))); setList((p) => p.filter((e) => !ids.includes(e.id))); toast.success(t('common.deleted', 'Supprimé')); }
    catch (err) { toast.error(err.message); fetchList(); }
  };

  const openRow = (row) => { setViewing(row); setEditing(false); setEditForm(Object.fromEntries(EDITABLE.map((k) => [k, row[k] ?? '']))); };

  const saveEdit = async () => {
    try {
      await api.encadrantsEntr.update(viewing.id, editForm);
      await fetchList();
      setEditing(false); setViewing((v) => ({ ...v, ...editForm }));
      toast.success(t('common.updated', 'Mis à jour'));
    } catch (e) { toast.error(e.message); }
  };

  const columns = [
    { key: 'nom', label: t('profile.nom'), sortable: true, searchable: true },
    { key: 'prenom', label: t('profile.prenom'), sortable: true, searchable: true },
    { key: 'mail', label: t('auth.email'), searchable: true },
    { key: 'poste', label: t('profile.poste'), searchable: true },
    { key: 'specialite', label: t('profile.specialite'), searchable: true },
  ];

  const inputCls = 'w-full p-2 border rounded-lg';
  const inputStyle = { background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' };

  return (
    <>
      <UserNavbar userRole="ADMIN_ENTREPRISE" />
      <div className="ml-24 p-6 md:p-8" style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
        <div className="card max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl" style={{ color: 'var(--btn-primary)' }}>{t('supervisors.title')}</h1>
            <button className="btn-primary text-sm" onClick={() => { setShowAdd((v) => !v); setAddForm(EMPTY); setAddError(''); }}>
              {showAdd ? t('common.close') : `+ ${t('common.add')}`}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} className="mb-6 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ background: 'var(--muted-bg)' }}>
              {[['nom', t('profile.nom'), true], ['prenom', t('profile.prenom'), true], ['mail', t('auth.email'), true], ['tel', t('profile.tel'), false], ['poste', t('profile.poste'), false], ['specialite', t('profile.specialite'), false]].map(([n, l, req]) => (
                <div key={n}>
                  <label className="block text-sm mb-1" style={{ color: 'var(--muted-text)' }}>{l}{req && ' *'}</label>
                  <input required={req} type={n === 'mail' ? 'email' : 'text'} value={addForm[n]}
                    onChange={(e) => setAddForm({ ...addForm, [n]: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
              ))}
              <div className="sm:col-span-2 text-xs" style={{ color: 'var(--muted-text)' }}>{t('supervisor.created')}</div>
              {addError && <div className="sm:col-span-2 text-red-600 text-sm">{addError}</div>}
              <div className="sm:col-span-2 flex gap-2">
                <button type="submit" disabled={addLoading} className="btn-primary text-sm">{addLoading ? '...' : t('common.add')}</button>
                <button type="button" className="btn-secondary text-sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</button>
              </div>
            </form>
          )}

          {error && <div className="mb-3 text-red-600">{error}</div>}
          {loading ? <div style={{ color: 'var(--muted-text)' }}>{t('common.loading')}</div> : (
            <DataTable columns={columns} rows={list} onRowClick={openRow} onDelete={deleteOne} onBulkDelete={deleteMany} emptyLabel={t('supervisors.none')} />
          )}
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setViewing(null)}>
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
              {EDITABLE.map((f) => (
                <InfoField key={f} label={f === 'mail' ? t('auth.email') : t(`profile.${f}`)} value={editForm[f]} editing={editing}
                  type={f === 'mail' ? 'email' : 'text'} onChange={(e) => setEditForm({ ...editForm, [f]: e.target.value })} />
              ))}
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
