type Task = {
  id: string;
  title: string;
  assignee: 'Alice' | 'Gonzalo';
  project: string;
  status: 'todo' | 'doing' | 'done';
};

const TASKS: Task[] = [
  { id: 't1', title: 'Add deployment panel in Kubiverse', assignee: 'Alice', project: 'Kubiverse', status: 'doing' },
  { id: 't2', title: 'Define consumers mapping rules', assignee: 'Gonzalo', project: 'Kubiverse', status: 'todo' },
  { id: 't3', title: 'Digital Office mock view', assignee: 'Alice', project: 'Mission Control', status: 'doing' },
  { id: 't4', title: 'Review Wallapop mini PCs', assignee: 'Gonzalo', project: 'Infra', status: 'done' },
];

const COLUMNS: Array<{ key: Task['status']; label: string }> = [
  { key: 'todo', label: 'To Do' },
  { key: 'doing', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

const ASSIGNEE_COLOR = { Alice: '#00f0ff', Gonzalo: '#ffb366' } as const;

export function TaskBoardView() {
  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: '#dfe8ff', fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.08em' }}>📋 TASK BOARD</h2>
      <p style={{ marginTop: 6, color: '#6b7c96', fontFamily: 'Share Tech Mono, monospace', fontSize: 12 }}>
        Shared board (Alice + Gonzalo) — mock version
      </p>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 12 }}>
        {COLUMNS.map((col) => (
          <div key={col.key} style={{ background: 'rgba(8,12,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
            <div style={{ color: '#00f0ff', fontFamily: 'Orbitron, sans-serif', fontSize: 12, marginBottom: 8 }}>{col.label}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {TASKS.filter((t) => t.status === col.key).map((t) => (
                <div key={t.id} style={{ background: 'rgba(3,6,16,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                  <div style={{ color: '#dfe8ff', fontSize: 12 }}>{t.title}</div>
                  <div style={{ color: '#7f93b4', fontSize: 10, marginTop: 4 }}>{t.project}</div>
                  <div style={{ marginTop: 6, fontSize: 10, color: ASSIGNEE_COLOR[t.assignee] }}>● {t.assignee}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
