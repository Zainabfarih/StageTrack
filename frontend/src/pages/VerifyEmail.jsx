import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const verificationCalled = useRef(false);

  useEffect(() => {
    if (location.state?.email) setEmail(location.state.email);
  }, [location]);

  useEffect(() => {
    const tokenParam = new URLSearchParams(window.location.search).get('token');
    if (tokenParam && !verificationCalled.current) {
      verificationCalled.current = true;
      handleVerifyEmail(tokenParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyEmail = async (verificationToken) => {
    setLoading(true);
    try {
      await api.auth.verifyEmail(verificationToken);
      setMessage('Email vérifié avec succès ! Redirection vers la connexion...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      setMessage(error.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const data = await api.auth.resendVerification(email);
      setMessage(data.message || 'Email de vérification renvoyé !');
    } catch (error) {
      setMessage(error.message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center animate-fade-in"
      style={{ background: 'var(--bg-color)' }}
    >
      <div className="card w-full max-w-md p-8 flex flex-col gap-6">
        <img src="/logo-stage-track.svg" alt="Logo" className="w-14 h-14 mx-auto mb-2" />
        <h1 className="h1 text-center mb-2">Vérification de l'Email</h1>

        <div className="text-center" style={{ color: 'var(--muted-text)' }}>
          <p className="mb-4">
            Un email de vérification a été envoyé à <strong>{email}</strong>
          </p>
          <p className="text-sm mb-4">
            Cliquez sur le lien dans l'email pour activer votre compte.
          </p>
        </div>

        {message && (
          <div
            className="text-sm text-center p-3 rounded"
            style={{
              backgroundColor: message.includes('succès') ? '#dcfce7' : '#fee2e2',
              color: message.includes('succès') ? '#166534' : '#991b1b',
            }}
          >
            {message}
          </div>
        )}

        {loading && (
          <p className="text-sm text-center" style={{ color: 'var(--muted-text)' }}>
            Vérification en cours…
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResendEmail}
            disabled={loading || !email}
            className="btn-secondary w-full"
          >
            {loading ? 'Envoi en cours...' : "Renvoyer l'email"}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm hover:underline"
            style={{ color: 'var(--btn-primary)' }}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
