import React from 'react';
import { useTranslation } from 'react-i18next';
import { API_ORIGIN } from '../services/api';


export default function SuiviStages({ rows = [], variant = 'admin', emptyLabel }) {
  const { t } = useTranslation();
  const isAdmin = variant === 'admin';

  const link = (url, label) =>
    url ? (
      <a className="underline" style={{ color: 'var(--btn-primary)' }} href={`${API_ORIGIN}${url}`} target="_blank" rel="noopener noreferrer">{label}</a>
    ) : <span style={{ color: 'var(--muted-text)' }}>—</span>;

  const note = (v) => (v === null || v === undefined || v === '') ? <span style={{ color: 'var(--muted-text)' }}>—</span> : v;

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--btn-primary)', color: '#fff' }}>
            <th className="px-4 py-3 text-left whitespace-nowrap">{t('navigation.interns', 'Stagiaire')}</th>
            <th className="px-4 py-3 text-left whitespace-nowrap">{t('internship.subject', 'Stage')}</th>
            {isAdmin && <th className="px-4 py-3 text-left whitespace-nowrap">{t('dashboard.companySupervisor', 'Encadrant entreprise')}</th>}
            {isAdmin && <th className="px-4 py-3 text-left whitespace-nowrap">{t('dashboard.univSupervisor', 'Encadrant université')}</th>}
            <th className="px-4 py-3 text-left whitespace-nowrap">{t('tracking.report', 'Rapport')}</th>
            <th className="px-4 py-3 text-left whitespace-nowrap">{t('profile.convention', 'Convention')}</th>
            <th className="px-4 py-3 text-left whitespace-nowrap">{t('tracking.noteEntr', 'Note entreprise')}</th>
            {isAdmin && <th className="px-4 py-3 text-left whitespace-nowrap">{t('tracking.noteUniv', 'Note université')}</th>}
            {isAdmin && <th className="px-4 py-3 text-left whitespace-nowrap">{t('tracking.average', 'Moyenne')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 9 : 6} className="text-center py-8" style={{ color: 'var(--muted-text)' }}>
                {emptyLabel || t('tracking.none', 'Aucun stage à suivre')}
              </td>
            </tr>
          )}
          {rows.map((a) => (
            <tr key={a.id} style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
              <td className="px-4 py-3 whitespace-nowrap">{a.etudiant_prenom} {a.etudiant_nom}</td>
              <td className="px-4 py-3">{a.stage_titre}</td>
              {isAdmin && <td className="px-4 py-3 whitespace-nowrap">{a.encadrant_entr_nom || '—'}</td>}
              {isAdmin && <td className="px-4 py-3 whitespace-nowrap">{a.encadrant_univ_nom || '—'}</td>}
              <td className="px-4 py-3">{link(a.rapport_pdf, t('tracking.report', 'Rapport'))}</td>
              <td className="px-4 py-3">{link(a.convention_pdf, t('profile.convention', 'Convention'))}</td>
              <td className="px-4 py-3 font-medium">{note(a.note_encadrant_entr)}</td>
              {isAdmin && <td className="px-4 py-3 font-medium">{note(a.note_encadrant_univ)}</td>}
              {isAdmin && <td className="px-4 py-3 font-bold" style={{ color: 'var(--btn-primary)' }}>{note(a.note_finale)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
