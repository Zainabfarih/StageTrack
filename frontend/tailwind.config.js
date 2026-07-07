/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',      // Bleu foncé
        secondary: '#166534',    // Vert foncé
        accent: '#f59e42',       // Orange accent
        background: '#f5f6fa',   // Fond général
        text: '#1e293b',         // Texte principal
        muted: '#e5e7eb',        // Gris clair
        mutedText: '#64748b',    // Texte secondaire
        danger: '#ef4444',       // Rouge
        success: '#22c55e',      // Vert succès
        card: '#fff',            // Fond carte
        border: '#e5e7eb',       // Bordure sobre
      },
    },
  },
  plugins: [],
}

