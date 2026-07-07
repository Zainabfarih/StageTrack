import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaTrashAlt, FaSort, FaSortUp, FaSortDown,
  FaChevronLeft, FaChevronRight, FaSearch,
} from 'react-icons/fa';


export default function DataTable({
  columns, rows, getId = (r) => r.id,
  onRowClick, onDelete, onBulkDelete, pageSize = 8, emptyLabel,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(() => new Set());

  const searchKeys = columns.filter((c) => c.searchable).map((c) => c.key);
  const selectCols = columns.filter((c) => c.filter === 'select');

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(0); };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = rows.filter((row) => {
      const okSearch = !q || searchKeys.some((k) => (row[k] ?? '').toString().toLowerCase().includes(q));
      const okFilters = selectCols.every((c) => {
        const v = filters[c.key];
        return !v || (row[c.key] ?? '').toString() === v;
      });
      return okSearch && okFilters;
    });
    if (sort.key) {
      data = [...data].sort((a, b) => {
        const av = a[sort.key] ?? '', bv = b[sort.key] ?? '';
        const num = !isNaN(parseFloat(av)) && !isNaN(parseFloat(bv));
        const cmp = num ? parseFloat(av) - parseFloat(bv) : av.toString().localeCompare(bv.toString());
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return data;
  }, [rows, query, filters, sort, searchKeys, selectCols]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key) => setSort((s) => s.key !== key ? { key, dir: 'asc' } : { key, dir: s.dir === 'asc' ? 'desc' : 'asc' });

  const pageIds = pageRows.map(getId);
  const allSel = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected((prev) => {
    const next = new Set(prev);
    if (allSel) pageIds.forEach((id) => next.delete(id)); else pageIds.forEach((id) => next.add(id));
    return next;
  });
  const toggleOne = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const headStyle = { background: 'var(--btn-primary)', color: '#fff' };
  const inputStyle = { background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' };

  return (
    <div>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted-text)' }} />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }}
            placeholder={t('common.search', 'Rechercher')}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" style={inputStyle} />
        </div>
        {selectCols.map((c) => (
          <select key={c.key} value={filters[c.key] || ''} onChange={(e) => setFilter(c.key, e.target.value)}
            className="py-2 px-3 border rounded-lg text-sm" style={inputStyle}>
            <option value="">{c.label} · {t('common.all', 'Tous')}</option>
            {(c.options || []).map((o) => {
              const val = (o && typeof o === 'object') ? o.value : o;
              const lab = (o && typeof o === 'object') ? o.label : o;
              return <option key={val} value={val}>{lab}</option>;
            })}
          </select>
        ))}
        {selected.size > 0 && onBulkDelete && (
          <button className="ml-auto inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
            style={{ background: '#fee2e2', color: '#dc2626' }}
            onClick={() => { onBulkDelete([...selected]); setSelected(new Set()); }}>
            <FaTrashAlt /> {t('common.deleteSelection', 'Supprimer')} ({selected.size})
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={headStyle}>
              {onBulkDelete && <th className="px-3 py-3 w-10"><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>}
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 text-left whitespace-nowrap ${c.sortable ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => c.sortable && toggleSort(c.key)}>
                  <span className="inline-flex items-center gap-1.5">
                    {c.label}
                    {c.sortable && (sort.key === c.key ? (sort.dir === 'asc' ? <FaSortUp /> : <FaSortDown />) : <FaSort className="opacity-50" />)}
                  </span>
                </th>
              ))}
              {onDelete && <th className="px-3 py-3 w-12" />}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={columns.length + (onBulkDelete ? 1 : 0) + (onDelete ? 1 : 0)}
                className="text-center py-8" style={{ color: 'var(--muted-text)' }}>{emptyLabel || t('common.noData', 'Aucune donnée')}</td></tr>
            )}
            {pageRows.map((row) => {
              const id = getId(row);
              return (
                <tr key={id} onClick={() => onRowClick && onRowClick(row)} className={onRowClick ? 'cursor-pointer' : ''}
                  style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
                  {onBulkDelete && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(id)} onChange={() => toggleOne(id)} />
                    </td>
                  )}
                  {columns.map((c) => <td key={c.key} className="px-4 py-3">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>)}
                  {onDelete && (
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <button title={t('common.delete', 'Supprimer')} onClick={() => onDelete(id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-red-500/10" style={{ color: '#dc2626' }}>
                        <FaTrashAlt />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>
        <span>{filtered.length} {t('common.results', 'résultat(s)')}</span>
        <div className="flex items-center gap-2">
          <button disabled={current === 0} onClick={() => setPage(current - 1)}
            className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}><FaChevronLeft /></button>
          <span style={{ color: 'var(--text-color)' }}>{current + 1} / {pageCount}</span>
          <button disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}
            className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-40"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}><FaChevronRight /></button>
        </div>
      </div>
    </div>
  );
}
