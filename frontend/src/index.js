import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './contexts/ToastContext';
import App from './App';
import i18n from './i18n'; // ✅ import the instance
import './styles/theme.css';
import './index.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ FIX PRINCIPAL : passer l'instance i18n au provider */}
      <I18nextProvider i18n={i18n}>
        <AppProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AppProvider>
      </I18nextProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
