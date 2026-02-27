import { useMemo, useState } from 'react';

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

const FILTERS = ['All', 'Alice', 'Gonzalo'] as const;
type AssigneeFilter = (typeof FILTERS)[number];

const ASSIGNEE_COLOR = { Alice: 'var(--cyan)', Gonzalo: 'var(--neon-orange)' } as const;

export function TaskBoardView() {
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('All');

  const filteredTasks = useMemo(
    () => TASKS.filter((task) => assigneeFilter === 'All' || task.assignee === assigneeFilter),
    [assigneeFilter],
  );

  const totalByStatus = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => {
          acc[col.key] = filteredTasks.filter((t) => t.status === col.key).length;
          return acc;
        },
        { todo: 0, doing: 0, done: 0 } as Record<Task['status'], number>,
      ),
    [filteredTasks],
  );

  return (
    <div style={{ padding: '20px 24px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ margin: 0, color: 'var(--foreground)', fontFamily: 'Geist, sans-serif', letterSpacing: '0.08em' }}>📋 TASK BOARD</h2>
      <p style={{ marginTop: 6, color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
        Shared board (Alice + Gonzalo) — owner workflow view
      </p>

      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((filter) => {
          const active = assigneeFilter === filter;
          const color = filter === 'All' ? 'var(--foreground)' : ASSIGNEE_COLOR[filter];
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setAssigneeFilter(filter)}
              style={{
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.16)'}`,
                background: active ? 'rgba(11,18,42,0.95)' : 'rgba(6,10,25,0.85)',
                color,
                boxShadow: active ? `0 0 12px ${color}55` : 'none',
                borderRadius: 999,
                padding: '6px 10px',
                fontSize: 11,
                fontFamily: 'Geist, sans-serif',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, color: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '4px 8px', background: 'rgba(36,40,59,0.8)' }}>
          TOTAL {filteredTasks.length}
        </span>
        {COLUMNS.map((col) => (
          <span
            key={col.key}
            style={{
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              padding: '4px 8px',
              background: 'rgba(36,40,59,0.8)',
            }}
          >
            {col.label.toUpperCase()} {totalByStatus[col.key]}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 12 }}>
        {COLUMNS.map((col) => (
          <div key={col.key} style={{ background: 'rgba(36,40,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ color: 'var(--cyan)', fontFamily: 'Geist, sans-serif', fontSize: 12 }}>{col.label}</div>
              <div style={{ color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{totalByStatus[col.key]}</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {filteredTasks
                .filter((t) => t.status === col.key)
                .map((t) => (
                  <div key={t.id} style={{ background: 'rgba(3,6,16,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
                    <div style={{ color: 'var(--foreground)', fontSize: 12 }}>{t.title}</div>
                    <div style={{ marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
                      <span style={{ color: 'var(--muted-foreground)', border: '1px solid rgba(127,147,180,0.35)', borderRadius: 999, padding: '2px 6px' }}>
                        PROJECT: {t.project}
                      </span>
                      <span
                        style={{
                          color: ASSIGNEE_COLOR[t.assignee],
                          border: `1px solid ${ASSIGNEE_COLOR[t.assignee]}66`,
                          borderRadius: 999,
                          padding: '2px 6px',
                        }}
                      >
                        ASSIGNEE: {t.assignee}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
