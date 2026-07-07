const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api$/, '');

let _accessToken = null;

export function setToken(token) {
  _accessToken = token;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}
export function getToken() {
  return _accessToken || localStorage.getItem('token') || null;
}
export function setRefreshToken(token) {
  if (token) localStorage.setItem('refreshToken', token);
  else localStorage.removeItem('refreshToken');
}
export function getRefreshToken() {
  return localStorage.getItem('refreshToken') || null;
}
export function clearToken() {
  _accessToken = null;
  ['token', 'refreshToken', 'role', 'userId', 'userUuid', 'profile_completed', 'needs_password_change']
    .forEach((k) => localStorage.removeItem(k));
}

// Tente de rafraîchir l'access token via le refresh token
async function tryRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  clearToken();
  if (window.location.pathname !== '/login') window.location.href = '/login';
}

// Requête JSON générique avec auto-refresh sur 401
export async function apiFetch(path, options = {}, _retried = false) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Sur les routes d'authentification 
  const isAuthEntry = /^\/auth\/(login|register|forgot-password|reset-password|refresh-token|verify-email)/.test(path);

  if (res.status === 401 && !_retried && !isAuthEntry) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, options, true);
    redirectToLogin();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }
  if (res.status === 401 && !isAuthEntry) {
    redirectToLogin();
    throw new Error('Session expirée.');
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }

  if (!res.ok) {
    const message = (payload && payload.message) || payload || `Erreur ${res.status}`;
    throw new Error(message);
  }
  return payload;
}

// Upload multipart (FormData) — réutilise apiFetch sans Content-Type
export function apiUpload(path, formData, method = 'POST') {
  return apiFetch(path, { method, body: formData });
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

// ─── API groupée par domaine ────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: getRefreshToken() }) }),
    verifyEmail: (token) => apiFetch(`/auth/verify-email${qs({ token })}`),
    forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, newPassword) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
    changePassword: (payload) => apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
    profile: () => apiFetch('/auth/profile'),
    completeProfile: (data) => apiFetch('/auth/complete-profile', { method: 'POST', body: JSON.stringify(data) }),
    createEtudiant: (data) => apiFetch('/auth/create_etudiant', { method: 'POST', body: JSON.stringify(data) }),
  },

  etudiants: {
    list: () => apiFetch('/etudiants'),
    get: (id) => apiFetch(`/etudiants/${id}`),
    byUniversite: (idU) => apiFetch(`/etudiants/universite/${idU}`),
    update: (id, data) => apiFetch(`/etudiants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => apiFetch(`/etudiants/${id}`, { method: 'DELETE' }),
    candidatures: (id) => apiFetch(`/etudiants/${id}/candidatures`),
    setScore: (id, score) => apiFetch(`/etudiants/putscore/${id}`, { method: 'PUT', body: JSON.stringify({ score }) }),
    uploadCv: (id, formData) => apiUpload(`/etudiants/cv/${id}`, formData, 'PUT'),
    uploadLm: (id, formData) => apiUpload(`/etudiants/lm/${id}`, formData, 'PUT'),
    uploadRapport: (id, formData) => apiUpload(`/etudiants/rapport/${id}`, formData, 'PUT'),
    uploadConvention: (id, formData) => apiUpload(`/etudiants/convention/${id}`, formData, 'PUT'),
  },

  stages: {
    list: (params) => apiFetch(`/stages${qs(params)}`),
    get: (id) => apiFetch(`/stages/${id}`),
    byEntreprise: (idE) => apiFetch(`/stages/entreprise/${idE}`),
    stats: () => apiFetch('/stages/stage/stats'),
    create: (data) => apiFetch('/stages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/stages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => apiFetch(`/stages/${id}`, { method: 'DELETE' }),
    setDateLimite: (id, dateLimite) => apiFetch(`/stages/dateLimite/${id}`, { method: 'PUT', body: JSON.stringify({ dateLimite }) }),
    setDateLimiteAll: (dateLimite) => apiFetch('/stages/dateLimite/all', { method: 'PUT', body: JSON.stringify({ dateLimite }) }),
    deadlines: () => apiFetch('/stages/deadlines'),
    setDeadline: (niveau, dateLimite) => apiFetch(`/stages/deadlines/${niveau}`, { method: 'PUT', body: JSON.stringify({ dateLimite }) }),
  },

  voeux: {
    list: () => apiFetch('/classement'),
    get: (id) => apiFetch(`/classement/${id}`),
    byEtudiant: (idE) => apiFetch(`/classement/etudiant/${idE}`),
    create: (data) => apiFetch('/classement', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, rang) => apiFetch(`/classement/${id}`, { method: 'PUT', body: JSON.stringify({ rang }) }),
    remove: (id) => apiFetch(`/classement/${id}`, { method: 'DELETE' }),
    setStatut: (idEtudiant, statut) => apiFetch(`/classement/updateStatus/${idEtudiant}`, { method: 'PUT', body: JSON.stringify({ statut }) }),
  },

  taches: {
    byStage: (idStage) => apiFetch(`/taches/stage/${idStage}`),
    byEtudiant: (idEtudiant) => apiFetch(`/taches/etudiant/${idEtudiant}`),
    get: (id) => apiFetch(`/taches/${id}`),
    stats: (idStage) => apiFetch(`/taches/stats/${idStage}`),
    create: (data) => apiFetch('/taches', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/taches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    markDone: (id) => apiFetch(`/taches/done/${id}`, { method: 'PUT' }),
    remove: (id) => apiFetch(`/taches/${id}`, { method: 'DELETE' }),
  },

  affectation: {
    list: () => apiFetch('/affectation'),
    status: () => apiFetch('/affectation/status'),
    auto: (niveau) => apiFetch(`/affectation/auto/${niveau}`, { method: 'POST' }),
    setencadrants: (id, data) => apiFetch(`/affectation/${id}/encadrants`, { method: 'PUT', body: JSON.stringify(data) }),
    byEntreprise: (idEntreprise) => apiFetch(`/affectation/entreprise/${idEntreprise}`),
    setNoteEntr: (id, note) => apiFetch(`/affectation/${id}/note-entr`, { method: 'PUT', body: JSON.stringify({ note }) }),
    setNoteUniv: (id, note) => apiFetch(`/affectation/${id}/note-univ`, { method: 'PUT', body: JSON.stringify({ note }) }),
    desister: (id_etudiant) => apiFetch('/affectation/desister', { method: 'POST', body: JSON.stringify({ id_etudiant }) }),
  },

  etudiantStage: {
    all: () => apiFetch('/etudiant-stage'),
    byEtudiant: (idE) => apiFetch(`/etudiant-stage/etudiant/${idE}`),
    get: (id) => apiFetch(`/etudiant-stage/${id}`),
    setRapportStatut: (id, statut) => apiFetch(`/etudiant-stage/${id}/statut`, { method: 'PUT', body: JSON.stringify({ statut }) }),
  },

  encadrantStage: {
    byStage: (idStage) => apiFetch(`/encadrant-stage/stage/${idStage}`),
    byencadrant: (type, id) => apiFetch(`/encadrant-stage/encadrant/${type}/${id}`),
    assign: (data) => apiFetch('/encadrant-stage', { method: 'POST', body: JSON.stringify(data) }),
  },

  encadrantsUniv: {
    list: () => apiFetch('/encadrant-univ'),
    get: (id) => apiFetch(`/encadrant-univ/${id}`),
    byUniversite: (idU) => apiFetch(`/encadrant-univ/universite/${idU}`),
    create: (data) => apiFetch('/encadrant-univ', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/encadrant-univ/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => apiFetch(`/encadrant-univ/${id}`, { method: 'DELETE' }),
  },

  encadrantsEntr: {
    list: () => apiFetch('/encadrant-entr'),
    get: (id) => apiFetch(`/encadrant-entr/${id}`),
    byEntreprise: (idE) => apiFetch(`/encadrant-entr/entreprise/${idE}`),
    create: (data) => apiFetch('/encadrant-entr', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/encadrant-entr/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => apiFetch(`/encadrant-entr/${id}`, { method: 'DELETE' }),
  },

  entreprises: {
    list: () => apiFetch('/entreprises'),
    get: (id) => apiFetch(`/entreprises/${id}`),
    search: (params) => apiFetch(`/entreprises/search${qs(params)}`),
    create: (data) => apiFetch('/entreprises', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/entreprises/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => apiFetch(`/entreprises/${id}`, { method: 'DELETE' }),
    changePassword: (id, payload) => apiFetch(`/entreprises/${id}/password`, { method: 'PUT', body: JSON.stringify(payload) }),
  },

  etablissements: {
    list: () => apiFetch('/etablissements'),
    get: (id) => apiFetch(`/etablissements/${id}`),
    etudiants: (id) => apiFetch(`/etablissements/${id}/etudiants`),
    update: (id, data) => apiFetch(`/etablissements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  documents: {
    get: (id) => apiFetch(`/documents/encadrants/rapports/${id}`),
    valider: (id, commentaire) => apiFetch(`/documents/encadrants/rapports/${id}/validation`, { method: 'PUT', body: JSON.stringify({ commentaire }) }),
    rejeter: (id, commentaire) => apiFetch(`/documents/encadrants/rapports/${id}/rejet`, { method: 'PUT', body: JSON.stringify({ commentaire }) }),
  },

  upload: {
    avatar: (formData) => apiUpload('/upload/avatar', formData),
    cv: (formData) => apiUpload('/upload/cv', formData),
    lettreMotivation: (formData) => apiUpload('/upload/lettre-motivation', formData),
    documents: (formData) => apiUpload('/upload/documents', formData),
    rapport: (formData) => apiUpload('/upload/rapport', formData),
    myFiles: (type) => apiFetch(`/upload/my-files${qs({ type })}`),
    remove: (filename) => apiFetch(`/upload/${filename}`, { method: 'DELETE' }),
  },

  chat: {
    contacts: () => apiFetch('/chat/contacts'),
    allowedContacts: () => apiFetch('/chat/allowed-contacts'),
    openConversation: (contact_id, contact_role) => apiFetch('/chat/conversation', { method: 'POST', body: JSON.stringify({ contact_id, contact_role }) }),
    messages: (id, params) => apiFetch(`/chat/conversation/${id}/messages${qs(params)}`),
    sendMessage: (id, content) => apiFetch(`/chat/conversation/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    unreadCount: () => apiFetch('/chat/unread-count'),
  },
};

export default api;
