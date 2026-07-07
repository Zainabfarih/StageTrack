import React, { useState, useEffect, useRef, useCallback } from 'react';
import UserNavbar from '../../components/UserNavbar';
import { apiFetch } from '../../services/api';
import { FaPaperPlane, FaSearch, FaComments } from 'react-icons/fa';

const POLL_INTERVAL = 3000; 

const roleLabel = {
  ETUDIANT:             'Étudiant',
  ENCADRANT_UNIV:       'Encadrant Univ.',
  ENCADRANT_ENTREPRISE: 'Encadrant Entr.',
  ADMIN_UNIV:           'Admin Univ.',
  ADMIN_ENTREPRISE:     'Admin Entr.',
};

const roleColor = {
  ETUDIANT:             'bg-blue-100 text-blue-700',
  ENCADRANT_UNIV:       'bg-green-100 text-green-700',
  ENCADRANT_ENTREPRISE: 'bg-purple-100 text-purple-700',
  ADMIN_UNIV:           'bg-orange-100 text-orange-700',
  ADMIN_ENTREPRISE:     'bg-pink-100 text-pink-700',
};

export default function Chat({ userRole }) {
  const [contacts, setContacts]           = useState([]);
  const [allowedContacts, setAllowedContacts] = useState([]);
  const [selectedConv, setSelectedConv]   = useState(null); 
  const [messages, setMessages]           = useState([]);
  const [newMessage, setNewMessage]       = useState('');
  const [search, setSearch]               = useState('');
  const [myId, setMyId]                   = useState(null);
  const [loading, setLoading]             = useState(false);
  const [sendLoading, setSendLoading]     = useState(false);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  // ── Charger profil utilisateur ──────────────────────────────────────────
  useEffect(() => {
    apiFetch('/auth/profile').then(p => setMyId(p.id)).catch(() => {});
  }, []);

  // ── Charger les conversations existantes + contacts autorisés ───────────
  useEffect(() => {
    const load = async () => {
      try {
        const [convs, allowed] = await Promise.all([
          apiFetch('/chat/contacts'),
          apiFetch('/chat/allowed-contacts'),
        ]);
        setContacts(convs || []);
        setAllowedContacts(allowed || []);
      } catch {}
    };
    load();
  }, []);

  // ── Scroll automatique vers le bas ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Polling des messages de la conversation active ──────────────────────
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const msgs = await apiFetch(`/chat/conversation/${convId}/messages`);
      setMessages(msgs || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.conversation_id);
    pollRef.current = setInterval(() => fetchMessages(selectedConv.conversation_id), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [selectedConv, fetchMessages]);

  // ── Ouvrir ou créer une conversation ───────────────────────────────────
  const openConversation = async (contact) => {
    setLoading(true);
    setMessages([]);
    try {
      const res = await apiFetch('/chat/conversation', {
        method: 'POST',
        body: JSON.stringify({ contact_id: contact.id || contact.contact_id, contact_role: contact.role || contact.contact_role }),
      });
      const convId = res.conversation_id;
      setSelectedConv({
        conversation_id: convId,
        contact_name:    contact.name || contact.contact_name,
        contact_role:    contact.role || contact.contact_role,
        contact_id:      contact.id   || contact.contact_id,
      });
      // Mettre à jour le badge non-lus
      setContacts(prev => prev.map(c =>
        c.conversation_id === convId ? { ...c, unread_count: 0 } : c
      ));
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
    setLoading(false);
  };

  // ── Envoyer un message ──────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConv || sendLoading) return;
    setSendLoading(true);
    try {
      const sent = await apiFetch(`/chat/conversation/${selectedConv.conversation_id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
      // Rafraîchir la liste des contacts (dernier message)
      setContacts(prev => {
        const exists = prev.find(c => c.conversation_id === selectedConv.conversation_id);
        if (exists) {
          return prev.map(c => c.conversation_id === selectedConv.conversation_id
            ? { ...c, last_message: sent.content, last_message_at: sent.created_at }
            : c
          );
        }
        return [{ ...selectedConv, last_message: sent.content, last_message_at: sent.created_at, unread_count: 0 }, ...prev];
      });
    } catch (e) { alert('Erreur envoi : ' + e.message); }
    setSendLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Fusionner contacts existants + contacts autorisés (sans doublon) ────
  const existingIds = new Set(contacts.map(c => `${c.contact_role}:${c.contact_id}`));
  const newContacts = allowedContacts.filter(c => !existingIds.has(`${c.role}:${c.id}`));

  // ── Filtrer par recherche ───────────────────────────────────────────────
  const filteredContacts = contacts.filter(c =>
    c.contact_name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNew = newContacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <UserNavbar userRole={userRole} />
      <div className="ml-24 flex h-screen overflow-hidden" style={{ background: 'var(--bg-color)' }}>

        {/* ── Panneau gauche : liste contacts ─────────────────────────── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <h2 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
              <FaComments /> Messagerie
            </h2>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Conversations existantes */}
            {filteredContacts.map(conv => (
              <button key={conv.conversation_id} onClick={() => openConversation(conv)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b transition hover:bg-blue-50 ${
                  selectedConv?.conversation_id === conv.conversation_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
                style={{ borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                  {conv.contact_name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm truncate" style={{ color: 'var(--text-color)' }}>{conv.contact_name}</span>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 ml-1 flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'var(--muted-text)' }}>
                    {conv.last_message || <em>Aucun message</em>}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${roleColor[conv.contact_role] || 'bg-gray-100 text-gray-600'}`}>
                    {roleLabel[conv.contact_role] || conv.contact_role}
                  </span>
                </div>
              </button>
            ))}

            {/* Nouveaux contacts (pas encore de conversation) */}
            {filteredNew.length > 0 && (
              <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-text)' }}>
                Nouveaux contacts
              </div>
            )}
            {filteredNew.map(contact => (
              <button key={`new-${contact.role}-${contact.id}`} onClick={() => openConversation(contact)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 border-b transition hover:bg-blue-50"
                style={{ borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">
                  {contact.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate" style={{ color: 'var(--text-color)' }}>{contact.name}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${roleColor[contact.role] || 'bg-gray-100 text-gray-600'}`}>
                    {roleLabel[contact.role] || contact.role}
                  </span>
                </div>
              </button>
            ))}

            {filteredContacts.length === 0 && filteredNew.length === 0 && (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--muted-text)' }}>
                Aucun contact disponible
              </div>
            )}
          </div>
        </div>

        {/* ── Panneau droit : zone messages ───────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              {/* Header conversation */}
              <div className="px-6 py-4 border-b flex items-center gap-3"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700">
                  {selectedConv.contact_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-color)' }}>{selectedConv.contact_name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${roleColor[selectedConv.contact_role] || 'bg-gray-100'}`}>
                    {roleLabel[selectedConv.contact_role]}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                {loading && <div className="text-center py-8 text-gray-400">Chargement...</div>}
                {messages.map(msg => {
                  const isMine = msg.sender_id === myId && msg.sender_role === userRole;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl shadow-sm ${
                        isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'
                      }`} style={isMine ? {} : { background: 'var(--card-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                          {formatTime(msg.created_at)}
                          {isMine && <span className="ml-1">{msg.is_read ? '✓✓' : '✓'}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && !loading && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center" style={{ color: 'var(--muted-text)' }}>
                      <FaComments className="text-5xl mx-auto mb-3 text-blue-200" />
                      <p className="text-sm">Commencez la conversation avec {selectedConv.contact_name}</p>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Zone de saisie */}
              <div className="px-6 py-4 border-t flex items-end gap-3"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <textarea
                  value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Écrivez un message... (Entrée pour envoyer)"
                  rows={2}
                  className="flex-1 border rounded-xl px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-color)', borderColor: 'var(--border-color)' }}
                />
                <button
                  onClick={handleSend} disabled={!newMessage.trim() || sendLoading}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-4" style={{ color: 'var(--muted-text)' }}>
              <FaComments className="text-7xl text-blue-200" />
              <p className="text-lg font-medium">Sélectionnez un contact pour démarrer</p>
              <p className="text-sm">Vos conversations apparaîtront ici</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
