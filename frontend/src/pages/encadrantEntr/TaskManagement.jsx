import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import UserNavbar from '../../components/UserNavbar';
import { api } from '../../services/api';

export default function TaskManagement() {
  const { t } = useTranslation();
  const userId = Number(localStorage.getItem('userId'));

  const [stages, setStages] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ titre: '', date_echeance: '', id_etudiant: '' });
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStages() {
      setIsLoading(true);
      try {
        const affectations = await api.encadrantStage.byencadrant('entr', userId);
        const map = new Map();
        affectations.forEach((a) => {
          if (!map.has(a.id_stage)) map.set(a.id_stage, { id_stage: a.id_stage, titre: a.stage_titre, etudiants: [] });
          map.get(a.id_stage).etudiants.push({ id: a.id_etudiant, nom: a.etudiant_nom, prenom: a.etudiant_prenom });
        });
        setStages([...map.values()]);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) loadStages();
  }, [userId]);

  const loadTasks = async (stage) => {
    setSelectedStage(stage);
    setStudents(stage.etudiants || []);
    try {
      setTasks(await api.taches.byStage(stage.id_stage));
    } catch {
      setTasks([]);
    }
  };

  const handleAddTask = async () => {
    if (!selectedStage || !newTask.titre) { setError(t('tasks.required', 'Le titre est obligatoire')); return; }
    try {
      await api.taches.create({
        titre: newTask.titre,
        date_echeance: newTask.date_echeance || null,
        id_stage: selectedStage.id_stage,
        id_etudiant: newTask.id_etudiant || null,
        id_encadrant_entr: userId,
      });
      setTasks(await api.taches.byStage(selectedStage.id_stage));
      setNewTask({ titre: '', date_echeance: '', id_etudiant: '' });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await api.taches.remove(id);
      setTasks(await api.taches.byStage(selectedStage.id_stage));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh' }}>
      <UserNavbar userRole="ENCADRANT_ENTREPRISE" />
      <div className="ml-24 p-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--btn-primary)' }}>{t('tasks.manage', 'Assignation des tâches')}</h1>
        {error && <div className="mb-4 p-3 rounded" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <h2 className="font-semibold" style={{ color: 'var(--text-color)' }}>{t('internship.list', 'Stages encadrés')}</h2>
              </div>
              {isLoading ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('common.loading', 'Chargement...')}</div>
                : stages.length === 0 ? <div className="p-4" style={{ color: 'var(--muted-text)' }}>{t('internship.none', 'Aucun stage')}</div>
                : stages.map((s) => (
                  <div key={s.id_stage} onClick={() => loadTasks(s)}
                    className="p-4 cursor-pointer" style={{ borderTop: '1px solid var(--border-color)', background: selectedStage?.id_stage === s.id_stage ? 'var(--input-bg)' : 'transparent', color: 'var(--text-color)' }}>
                    {s.titre}
                  </div>
                ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-8">
            <div className="card p-6">
              {selectedStage ? (
                <>
                  <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{selectedStage.titre}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <input value={newTask.titre} onChange={(e) => setNewTask({ ...newTask, titre: e.target.value })}
                      placeholder={t('tasks.title', 'Titre de la tâche')} className="border rounded px-3 py-2"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
                    <input type="date" value={newTask.date_echeance} onChange={(e) => setNewTask({ ...newTask, date_echeance: e.target.value })}
                      className="border rounded px-3 py-2" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }} />
                    <select value={newTask.id_etudiant} onChange={(e) => setNewTask({ ...newTask, id_etudiant: e.target.value })}
                      className="border rounded px-3 py-2" style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                      <option value="">{t('tasks.assignTo', 'Assigner à...')}</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>)}
                    </select>
                  </div>
                  <button className="btn-primary mb-6" onClick={handleAddTask}>{t('tasks.add', 'Ajouter la tâche')}</button>

                  <div className="space-y-2">
                    {tasks.length === 0 ? <p style={{ color: 'var(--muted-text)' }}>{t('tasks.none', 'Aucune tâche')}</p>
                      : tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}>
                          <div>
                            <p className="font-medium">{task.titre}</p>
                            <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
                              {task.date_echeance ? new Date(task.date_echeance).toLocaleDateString() : '—'} · {task.statut}
                            </p>
                          </div>
                          <button className="text-red-600" onClick={() => handleDeleteTask(task.id)}>{t('common.delete', 'Supprimer')}</button>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--muted-text)' }}>{t('tasks.selectStage', 'Sélectionnez un stage')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
