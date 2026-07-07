// [App.js]
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import NotFound from './pages/NotFound.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import EntrepriseDashboard from './pages/entreprise/Dashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import EncadrantUnivDashboard from './pages/encadrantUniv/Dashboard.jsx';
import EncadrantEntrDashboard from './pages/encadrantEntr/Dashboard.jsx';
import AboutUs from './pages/AboutUs.jsx';
import EntrepriseProfil from './pages/entreprise/Profil.jsx';
import Stages from './pages/entreprise/Stages.jsx';
import Offres from './pages/entreprise/Offres.jsx';
import EncadrantsEntr from './pages/entreprise/Encadrants.jsx';
import Stagiaires from './pages/entreprise/Stagiaires.jsx';
import SuiviEntreprise from './pages/entreprise/Suivi.jsx';
import ProfilUniv from './pages/admin/ProfilUniv.jsx';
import StagesUniv from './pages/admin/StagesUniv.jsx';
import EtudiantDashboard from './pages/etudiant/DashboardEtudiant.jsx';
import EtudiantProfil from './pages/etudiant/ProfilEtudiant.jsx';
import Etudiants from './pages/admin/Etudiants.jsx';
import Entreprises from './pages/admin/Entreprises.jsx';
import MesTaches from './pages/etudiant/MesTaches.jsx';
import Affectation from './pages/admin/Affectation.jsx';
import EncadrantsUniv from './pages/admin/EncadrantsUniv.jsx';
import Profilencadrant from './pages/encadrantEntr/Profilencadrant.jsx';
import TaskManagement from './pages/encadrantEntr/TaskManagement.jsx';
import SuiviTaches from './pages/encadrantEntr/SuiviTaches.jsx';
import Profilencadrantuniv from './pages/encadrantUniv/Profilencadrant.jsx';
import SuiviTachesUniv from './pages/encadrantUniv/SuiviTaches.jsx';
import Chat from './pages/chat/Chat.jsx';

// Routes publiques (sans sidebar)
const PUBLIC_PATHS = [
  '/', '/login', '/register', '/verify-email',
  '/complete-profile', '/change-password', '/about',
  '/forgot-password', '/reset-password', '/auth/callback',
];

function App() {
  const location = useLocation();
  const { i18n } = useTranslation();

  const isPublicPage = PUBLIC_PATHS.some((p) =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p),
  );

  return (
    <div key={i18n.language}>
      {isPublicPage && <Navbar />}

      <Routes>
        {/* ─── Public ─── */}
        <Route path="/"                element={<Home />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/about"           element={<AboutUs />} />

        {/* ✅ Callback Google OAuth */}
        <Route path="/auth/callback"   element={<AuthCallback />} />

        {/* ─── Étudiant ─── */}
        <Route path="/etudiant/dashboard"  element={<ProtectedRoute><EtudiantDashboard /></ProtectedRoute>} />
        <Route path="/etudiant/profil"     element={<ProtectedRoute><EtudiantProfil /></ProtectedRoute>} />
        <Route path="/etudiant/mes-taches" element={<ProtectedRoute><MesTaches /></ProtectedRoute>} />
        <Route path="/etudiant/chat"       element={<ProtectedRoute><Chat userRole="ETUDIANT" /></ProtectedRoute>} />

        {/* ─── Entreprise ─── */}
        <Route path="/entreprise/dashboard"  element={<ProtectedRoute><EntrepriseDashboard /></ProtectedRoute>} />
        <Route path="/entreprise/profil"     element={<ProtectedRoute><EntrepriseProfil /></ProtectedRoute>} />
        <Route path="/entreprise/offres"     element={<ProtectedRoute><Offres /></ProtectedRoute>} />
        <Route path="/entreprise/stages"     element={<ProtectedRoute><Stages /></ProtectedRoute>} />
        <Route path="/entreprise/encadrants" element={<ProtectedRoute><EncadrantsEntr /></ProtectedRoute>} />
        <Route path="/entreprise/stagiaires" element={<ProtectedRoute><Stagiaires /></ProtectedRoute>} />
        <Route path="/entreprise/suivi"      element={<ProtectedRoute><SuiviEntreprise /></ProtectedRoute>} />
        <Route path="/entreprise/chat"       element={<ProtectedRoute><Chat userRole="ADMIN_ENTREPRISE" /></ProtectedRoute>} />

        {/* ─── Admin Université ─── */}
        <Route path="/admin/dashboard"   element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/profil"      element={<ProtectedRoute><ProfilUniv /></ProtectedRoute>} />
        <Route path="/admin/stages"      element={<ProtectedRoute><StagesUniv /></ProtectedRoute>} />
        <Route path="/admin/etudiants"   element={<ProtectedRoute><Etudiants /></ProtectedRoute>} />
        <Route path="/admin/entreprises" element={<ProtectedRoute><Entreprises /></ProtectedRoute>} />
        <Route path="/admin/affectation" element={<ProtectedRoute><Affectation /></ProtectedRoute>} />
        <Route path="/admin/encadrants"  element={<ProtectedRoute><EncadrantsUniv /></ProtectedRoute>} />
        <Route path="/admin/chat"        element={<ProtectedRoute><Chat userRole="ADMIN_UNIV" /></ProtectedRoute>} />

        {/* ─── Encadrant Univ ─── */}
        <Route path="/encadrant-univ/dashboard" element={<ProtectedRoute><EncadrantUnivDashboard /></ProtectedRoute>} />
        <Route path="/encadrant-univ/profil"    element={<ProtectedRoute><Profilencadrantuniv /></ProtectedRoute>} />
        <Route path="/encadrant-univ/suivi"     element={<ProtectedRoute><SuiviTachesUniv /></ProtectedRoute>} />
        <Route path="/encadrant-univ/chat"      element={<ProtectedRoute><Chat userRole="ENCADRANT_UNIV" /></ProtectedRoute>} />

        {/* ─── Encadrant Entreprise ─── */}
        <Route path="/encadrant-entr/dashboard" element={<ProtectedRoute><EncadrantEntrDashboard /></ProtectedRoute>} />
        <Route path="/encadrant-entr/profil"    element={<ProtectedRoute><Profilencadrant /></ProtectedRoute>} />
        <Route path="/encadrant-entr/taches"    element={<ProtectedRoute><TaskManagement /></ProtectedRoute>} />
        <Route path="/encadrant-entr/suivi"     element={<ProtectedRoute><SuiviTaches /></ProtectedRoute>} />
        <Route path="/encadrant-entr/chat"      element={<ProtectedRoute><Chat userRole="ENCADRANT_ENTREPRISE" /></ProtectedRoute>} />

        {/* ─── 404 ─── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
