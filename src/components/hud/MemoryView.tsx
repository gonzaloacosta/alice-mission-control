import { useMemo, useState } from 'react';

type MemoryDoc = { id: string; title: string; path: string; summary: string; updatedAt: string; tags: string[] };

const DOCS: MemoryDoc[] = [
  { id: '1', title: 'MEMORY.md', path: 'workspace/MEMORY.md', summary: 'Long-term memory: user profile, projects, preferences.', updatedAt: '2026-02-22', tags: ['core', 'profile'] },
  { id: '2', title: '2026-02-22.md', path: 'memory/2026-02-22.md', summary: 'Daily log with decisions and pending work.', updatedAt: '2026-02-22', tags: ['daily', 'journal'] },
  { id: '3', title: 'clara/2026-02-22.md', path: 'memory/clara/2026-02-22.md', summary: 'Clara conversations and reminders.', updatedAt: '2026-02-22', tags: ['contact', 'clara'] },
  { id: '4', title: 'onespan-research.md', path: 'memory/onespan-research.md', summary: 'Research notes and role recommendations.', updatedAt: '2026-02-19', tags: ['research', 'career'] },
  { id: '5', title: 'gonzalo-profile.md', path: 'memory/gonzalo-profile.md', summary: 'Detailed profile and professional history.', updatedAt: '2026-02-18', tags: ['profile'] },
];

export function MemoryView() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return DOCS;
    return DOCS.filter((d) =>
      [d.title, d.path, d.summary, d.tags.join(' ')].join(' ').toLowerCase().includes(k)
    );
  }, [q]);

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: '#dfe8ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>🧠 MEMORY BROWSER</h2>
      <p style={{ marginTop: 6, color: '#6b7c96', fontFamily: 'Share Tech Mono, monospace', fontSize: 12 }}>
        Searchable memory documents (mock version)
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search memory files..."
        style={{
          width: '100%', marginTop: 10, marginBottom: 14,
          background: 'rgba(8,12,28,0.92)', color: '#dfe8ff',
          border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, padding: '10px 12px',
          fontFamily: 'Share Tech Mono, monospace', fontSize: 12,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {filtered.map((d) => (
          <div key={d.id} style={{ background: 'rgba(8,12,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}>
            <div style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', fontSize: 12 }}>{d.title}</div>
            <div style={{ color: '#7488a8', fontFamily: 'Share Tech Mono, monospace', fontSize: 10, marginTop: 2 }}>{d.path}</div>
            <div style={{ color: '#c0cde3', fontSize: 11, marginTop: 8 }}>{d.summary}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {d.tags.map((t) => <span key={t} style={{ fontSize: 10, color: '#93a7ca', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 999, padding: '2px 7px' }}>{t}</span>)}
            </div>
            <div style={{ marginTop: 8, color: '#5d7192', fontSize: 10 }}>Updated: {d.updatedAt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
