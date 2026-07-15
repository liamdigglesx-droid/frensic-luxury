import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Search, Trash2 } from 'lucide-react';

const GOLD = '#C9A84C';
const CARD_BG = { backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' };

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.ContactMessage.list('-created_date', 200).then(m => {
      setMessages(m);
      setLoading(false);
    });
  }, []);

  const filtered = messages.filter(m =>
    !search ||
    (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;
    await base44.entities.ContactMessage.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-1" style={{ color: '#F9F9F9' }}>Messages</h1>
        <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>Contact form submissions</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#666' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, subject..."
          className="w-full h-10 pl-9 pr-4 text-sm bg-transparent outline-none"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: 400 }}>
        {/* List */}
        <div style={{ ...CARD_BG, maxHeight: 600 }} className="lg:col-span-1 overflow-y-auto" >
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: GOLD }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: '#666' }}>No messages.</div>
          ) : (
            filtered.map(m => (
              <div
                key={m.id}
                className="p-4 cursor-pointer transition-all flex items-start gap-3"
                onClick={() => setSelected(m)}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: selected?.id === m.id ? 'rgba(201,168,76,0.07)' : 'transparent',
                  borderLeft: selected?.id === m.id ? `2px solid ${GOLD}` : '2px solid transparent',
                }}
              >
                <div className="w-8 h-8 flex items-center justify-center font-serif flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: GOLD }}>
                  {(m.name || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: '#F9F9F9' }}>{m.name}</div>
                  <div className="text-xs truncate" style={{ color: '#666' }}>{m.subject || m.message?.slice(0, 40)}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#444' }}>
                    {m.created_date ? new Date(m.created_date).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 p-6" style={CARD_BG}>
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center" style={{ minHeight: 300 }}>
              <Mail size={32} style={{ color: '#333' }} />
              <p className="text-sm" style={{ color: '#555' }}>Select a message to read</p>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl mb-1" style={{ color: '#F9F9F9' }}>{selected.subject || 'No Subject'}</h2>
                  <div className="text-xs" style={{ color: '#888' }}>From: <span style={{ color: '#C9A84C' }}>{selected.name}</span> · {selected.email}</div>
                  {selected.phone && <div className="text-xs mt-0.5" style={{ color: '#666' }}>Phone: {selected.phone}</div>}
                  <div className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {selected.created_date ? new Date(selected.created_date).toLocaleString() : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(selected.id)}
                  className="flex items-center gap-1 text-xs px-3 py-2 transition-all"
                  style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
              <div className="text-sm leading-relaxed p-5" style={{ color: '#aaa', backgroundColor: '#070707', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selected.message}
              </div>
              <a
                href={`mailto:${selected.email}?subject=Re: ${selected.subject || 'Your Enquiry'}`}
                className="inline-flex items-center gap-2 mt-4 px-6 h-10 text-xs tracking-[0.15em] uppercase font-medium transition-all"
                style={{ backgroundColor: GOLD, color: '#050505' }}
              >
                <Mail size={13} /> Reply via Email
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
