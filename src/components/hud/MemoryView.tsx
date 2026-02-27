import { useEffect, useMemo, useState } from 'react';

type MemoryDoc = {
  id: string;
  title: string;
  path: string;
  summary: string;
  updatedAt: string;
  tags: string[];
  content: string;
};

const INITIAL_DOCS: MemoryDoc[] = [
  {
    id: '1',
    title: 'MEMORY.md',
    path: 'workspace/MEMORY.md',
    summary: 'Long-term memory: user profile, projects, preferences.',
    updatedAt: '2026-02-22',
    tags: ['core', 'profile'],
    content: '# MEMORY.md\n\nLong-term memory and key user preferences.\n\n- Keep communication in English for practice\n- Prioritize practical delivery over theory\n',
  },
  {
    id: '2',
    title: '2026-02-22.md',
    path: 'memory/2026-02-22.md',
    summary: 'Daily log with decisions and pending work.',
    updatedAt: '2026-02-22',
    tags: ['daily', 'journal'],
    content: '# 2026-02-22\n\n- Mission Control mock views refined\n- Model routing switched to GPT-5.3 Codex\n- Pending: connect mock views to real APIs\n',
  },
  {
    id: '3',
    title: 'clara/2026-02-22.md',
    path: 'memory/clara/2026-02-22.md',
    summary: 'Clara conversations and reminders.',
    updatedAt: '2026-02-22',
    tags: ['contact', 'clara'],
    content: '# Clara notes\n\n- Interested in Sculptra research\n- Asked for Kindle books in Spanish\n',
  },
  {
    id: '4',
    title: 'onespan-research.md',
    path: 'memory/onespan-research.md',
    summary: 'Research notes and role recommendations.',
    updatedAt: '2026-02-19',
    tags: ['research', 'career'],
    content: '# OneSpan research\n\nCloud Architect remains strongest fit due to experience and no on-call preference.\n',
  },
  {
    id: '5',
    title: 'gonzalo-profile.md',
    path: 'memory/gonzalo-profile.md',
    summary: 'Detailed profile and professional history.',
    updatedAt: '2026-02-18',
    tags: ['profile'],
    content: '# Gonzalo profile\n\n15 years in infra/cloud/k8s/mlops. Based in Barcelona.\n',
  },
];

export function MemoryView() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<MemoryDoc[]>(INITIAL_DOCS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_DOCS[0].id);
  const [draft, setDraft] = useState(INITIAL_DOCS[0].content);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(id);
  }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return docs;
    return docs.filter((d) =>
      [d.title, d.path, d.summary, d.tags.join(' '), d.content].join(' ').toLowerCase().includes(k)
    );
  }, [q, docs]);

  const selectedDoc = docs.find((d) => d.id === selectedId) ?? null;

  const openDoc = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc) return;
    setSelectedId(id);
    setDraft(doc.content);
    setSavedAt(null);
  };

  const saveDoc = () => {
    if (!selectedDoc) return;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    setDocs((prev) =>
      prev.map((d) =>
        d.id === selectedDoc.id
          ? {
              ...d,
              content: draft,
              updatedAt: date,
              summary: draft.slice(0, 110).replace(/\n/g, ' ') || d.summary,
            }
          : d
      )
    );
    setSavedAt(now.toLocaleTimeString('en-GB', { hour12: false }));
  };

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ margin: 0, color: 'var(--foreground)', fontFamily: 'Geist, sans-serif', letterSpacing: '0.08em' }}>🧠 MEMORY BROWSER</h2>
      <p style={{ marginTop: 6, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        Click a memory file to view/edit content (mock editor)
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
        <Stat label="Documents" value={String(docs.length)} color="var(--foreground)" />
        <Stat label="Matches" value={String(filtered.length)} color="var(--cyan)" />
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search memory files, tags, paths, content..."
        style={{
          width: '100%',
          marginTop: 10,
          marginBottom: 10,
          background: 'rgba(36,40,59,0.92)',
          color: 'var(--foreground)',
          border: '1px solid rgba(125,207,255,0.25)',
          borderRadius: 8,
          padding: '10px 12px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12,
        }}
      />

      {loading ? (
        <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, marginTop: 8 }}>Loading memory documents…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12, minHeight: 0, flex: 1 }}>
          <div style={{ overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, background: 'rgba(36,40,59,0.88)' }}>
            {filtered.length === 0 ? (
              <div style={{ color: 'var(--muted-foreground)', fontSize: 12, textAlign: 'center', padding: '14px 8px' }}>No memory files found.</div>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => openDoc(d.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    marginBottom: 8,
                    background: d.id === selectedId ? 'rgba(125,207,255,0.10)' : 'rgba(3,6,16,0.7)',
                    border: d.id === selectedId ? '1px solid rgba(125,207,255,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    padding: 10,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ color: 'var(--cyan)', fontFamily: 'Geist, sans-serif', fontSize: 11 }}>{d.title}</div>
                  <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, marginTop: 2 }}>{d.path}</div>
                  <div style={{ color: 'var(--foreground)', fontSize: 11, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.summary}</div>
                  <div style={{ color: 'var(--muted-foreground)', fontSize: 10, marginTop: 6 }}>Updated: {d.updatedAt}</div>
                </button>
              ))
            )}
          </div>

          <div style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, background: 'rgba(36,40,59,0.9)', display: 'flex', flexDirection: 'column' }}>
            {!selectedDoc ? (
              <div style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>Select a memory document to view content.</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ color: 'var(--cyan)', fontFamily: 'Geist, sans-serif', fontSize: 13 }}>{selectedDoc.title}</div>
                  <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>{selectedDoc.path}</div>
                  <button
                    onClick={saveDoc}
                    style={{
                      marginLeft: 'auto',
                      border: '1px solid rgba(125,207,255,0.45)',
                      background: 'rgba(125,207,255,0.08)',
                      color: 'var(--cyan)',
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                    }}
                  >
                    Save
                  </button>
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  style={{
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    resize: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    background: 'rgba(3,6,16,0.85)',
                    color: 'var(--foreground)',
                    padding: 12,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                />
                <div style={{ color: 'var(--muted-foreground)', fontSize: 10, marginTop: 8 }}>
                  {savedAt ? `Saved at ${savedAt}` : 'Changes are local in this mock view.'}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', background: 'rgba(36,40,59,0.9)' }}>
      <div style={{ color: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{label}</div>
      <div style={{ color, fontFamily: 'Geist, sans-serif', fontSize: 16 }}>{value}</div>
    </div>
  );
}
