import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../../store';

const API = import.meta.env.VITE_API_URL || '';

interface KanbanCard {
  id: number;
  column_id: number;
  project_id: string;
  title: string;
  description: string;
  assignee: string;
  priority: string;
  position: number;
  created_at: string;
  updated_at: string;
}

interface KanbanColumn {
  id: number;
  name: string;
  position: number;
  color: string;
  cards: KanbanCard[];
}

interface EditingCard extends Partial<KanbanCard> {
  isNew?: boolean;
  columnName?: string;
}

const PRIORITY_COLORS: Record<string, { color: string; label: string; icon: string }> = {
  critical: { color: '#ff3355', label: 'CRITICAL', icon: '🔴' },
  high:     { color: '#ffcc00', label: 'HIGH',     icon: '🟡' },
  medium:   { color: '#00ff88', label: 'MEDIUM',   icon: '🟢' },
  low:      { color: '#6a7a8a', label: 'LOW',      icon: '⚪' },
};

export function KanbanView() {
  const projects = useStore(s => s.projects);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [allProjects, setAllProjects] = useState<string[]>([]);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [editing, setEditing] = useState<EditingCard | null>(null);
  const [dragCard, setDragCard] = useState<KanbanCard | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/kanban/all`);
      const data = await res.json();
      setColumns(data.columns || []);
      setAllProjects(data.projects || []);
    } catch (e) {
      console.error('Failed to fetch kanban:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const filteredColumns = columns.map(col => ({
    ...col,
    cards: filterProject === 'all' ? col.cards : col.cards.filter(c => c.project_id === filterProject)
  }));

  const totalCards = filteredColumns.reduce((sum, col) => sum + col.cards.length, 0);

  const getProjectColor = (pid: string) => projects.find(p => p.id === pid)?.color || '#00f0ff';

  // ─── Drag & Drop ───
  const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
    setDragCard(card);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(card.id));
    if (dragRef.current) {
      dragRef.current.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent, colId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: number) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!dragCard || dragCard.column_id === targetColId) { setDragCard(null); return; }

    // Optimistic update
    setColumns(prev => prev.map(col => {
      if (col.id === dragCard.column_id) return { ...col, cards: col.cards.filter(c => c.id !== dragCard.id) };
      if (col.id === targetColId) return { ...col, cards: [...col.cards, { ...dragCard, column_id: targetColId, position: col.cards.length }] };
      return col;
    }));

    try {
      await fetch(`${API}/api/v1/kanban/cards/${dragCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: targetColId, position: 0 }),
      });
      await fetchBoard();
    } catch (e) {
      console.error('Move failed:', e);
      await fetchBoard();
    }
    setDragCard(null);
  };

  // ─── CRUD ───
  const handleSave = async () => {
    if (!editing) return;
    try {
      if (editing.isNew) {
        await fetch(`${API}/api/v1/kanban/${editing.project_id || allProjects[0] || 'default'}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            column: editing.columnName || 'Backlog',
            title: editing.title,
            description: editing.description,
            assignee: editing.assignee,
            priority: editing.priority || 'low',
          }),
        });
      } else {
        await fetch(`${API}/api/v1/kanban/cards/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editing.title,
            description: editing.description,
            assignee: editing.assignee,
            priority: editing.priority,
          }),
        });
      }
      setEditing(null);
      await fetchBoard();
    } catch (e) {
      console.error('Save failed:', e);
    }
  };

  const handleDelete = async (cardId: number) => {
    try {
      await fetch(`${API}/api/v1/kanban/cards/${cardId}`, { method: 'DELETE' });
      setEditing(null);
      await fetchBoard();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="detail-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: 'var(--cyan)', letterSpacing: '2px', margin: 0 }}>
              KANBAN BOARD
            </h2>
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(0,240,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.15)',
              fontFamily: 'Orbitron, sans-serif',
            }}>
              {totalCards}
            </span>
          </div>
          {/* Project filter */}
          <select
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}
            style={{
              background: 'rgba(8,12,28,0.96)', border: '1px solid rgba(0,240,255,0.2)',
              borderRadius: '4px', color: 'var(--cyan)', padding: '4px 8px',
              fontFamily: 'Share Tech Mono, monospace', fontSize: '11px', outline: 'none',
            }}
          >
            <option value="all">ALL PROJECTS</option>
            {allProjects.map(pid => (
              <option key={pid} value={pid}>{pid.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5a6a' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '13px' }}>Loading board...</div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', gap: '8px', padding: '12px 8px', overflowX: 'auto', overflowY: 'hidden',
        }}>
          {filteredColumns.map(col => (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={e => handleDrop(e, col.id)}
              style={{
                flex: '1 1 0', minWidth: '200px', maxWidth: '280px',
                display: 'flex', flexDirection: 'column',
                background: dragOverCol === col.id ? 'rgba(0,240,255,0.04)' : 'rgba(8,12,28,0.6)',
                border: `1px solid ${dragOverCol === col.id ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.08)'}`,
                borderRadius: '8px', transition: 'all 0.2s',
              }}
            >
              {/* Column header */}
              <div style={{
                padding: '10px 12px', borderBottom: '1px solid rgba(0,240,255,0.08)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, boxShadow: `0 0 6px ${col.color}44` }} />
                  <span style={{
                    fontFamily: 'Orbitron, sans-serif', fontSize: '10px', letterSpacing: '1.5px',
                    color: col.color, textTransform: 'uppercase',
                  }}>
                    {col.name}
                  </span>
                  <span style={{
                    fontSize: '10px', color: '#4a5a6a', fontFamily: 'Share Tech Mono, monospace',
                  }}>
                    {col.cards.length}
                  </span>
                </div>
                <button
                  onClick={() => setEditing({ isNew: true, columnName: col.name, title: '', description: '', assignee: '', priority: 'low', project_id: filterProject !== 'all' ? filterProject : allProjects[0] })}
                  style={{
                    background: 'none', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '4px',
                    color: 'var(--cyan)', cursor: 'pointer', fontSize: '12px', lineHeight: '1',
                    padding: '2px 6px', opacity: 0.6, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                >
                  +
                </button>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {col.cards.map(card => {
                  const pri = PRIORITY_COLORS[card.priority] || PRIORITY_COLORS.low;
                  const projColor = getProjectColor(card.project_id);
                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={e => handleDragStart(e, card)}
                      onDragEnd={() => setDragCard(null)}
                      onClick={() => setEditing({ ...card })}
                      ref={dragCard?.id === card.id ? dragRef : undefined}
                      style={{
                        padding: '10px', borderRadius: '6px', cursor: 'grab',
                        background: 'rgba(8,12,28,0.96)',
                        border: '1px solid rgba(0,240,255,0.08)',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.15s',
                        opacity: dragCard?.id === card.id ? 0.4 : 1,
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.border = '1px solid rgba(0,240,255,0.25)';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(0,240,255,0.08)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.border = '1px solid rgba(0,240,255,0.08)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Project badge + priority */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '9px', padding: '1px 6px', borderRadius: '3px',
                          background: `${projColor}18`, color: projColor, border: `1px solid ${projColor}33`,
                          fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px', textTransform: 'uppercase',
                        }}>
                          {card.project_id}
                        </span>
                        <span style={{ fontSize: '10px' }} title={pri.label}>{pri.icon}</span>
                      </div>
                      {/* Title */}
                      <div style={{
                        fontFamily: 'Share Tech Mono, monospace', fontSize: '12px',
                        color: '#e0e6ed', lineHeight: '1.4', marginBottom: card.assignee ? '6px' : 0,
                      }}>
                        {card.title}
                      </div>
                      {/* Assignee */}
                      {card.assignee && (
                        <div style={{
                          fontSize: '10px', color: '#4a5a6a', fontFamily: 'Share Tech Mono, monospace',
                        }}>
                          → {card.assignee}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setEditing(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div style={{
            background: 'rgba(8,12,28,0.98)', border: '1px solid rgba(0,240,255,0.2)',
            borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90vw',
            boxShadow: '0 0 40px rgba(0,240,255,0.1)',
          }}>
            <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px', color: 'var(--cyan)', letterSpacing: '2px', margin: '0 0 16px' }}>
              {editing.isNew ? 'NEW CARD' : 'EDIT CARD'}
            </h3>

            {/* Project selector for new cards */}
            {editing.isNew && (
              <ModalField label="Project">
                <select
                  value={editing.project_id || ''}
                  onChange={e => setEditing({ ...editing, project_id: e.target.value })}
                  style={inputStyle}
                >
                  {allProjects.map(pid => <option key={pid} value={pid}>{pid.toUpperCase()}</option>)}
                </select>
              </ModalField>
            )}

            <ModalField label="Title">
              <input
                value={editing.title || ''}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                style={inputStyle}
                autoFocus
                placeholder="Card title..."
              />
            </ModalField>

            <ModalField label="Description">
              <textarea
                value={editing.description || ''}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                placeholder="Description..."
              />
            </ModalField>

            <div style={{ display: 'flex', gap: '12px' }}>
              <ModalField label="Assignee" style={{ flex: 1 }}>
                <input
                  value={editing.assignee || ''}
                  onChange={e => setEditing({ ...editing, assignee: e.target.value })}
                  style={inputStyle}
                  placeholder="Who?"
                />
              </ModalField>
              <ModalField label="Priority" style={{ flex: 1 }}>
                <select
                  value={editing.priority || 'low'}
                  onChange={e => setEditing({ ...editing, priority: e.target.value })}
                  style={inputStyle}
                >
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟡 High</option>
                  <option value="medium">🟢 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </ModalField>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
              {!editing.isNew && (
                <button onClick={() => editing.id && handleDelete(editing.id)} style={{ ...btnStyle, color: '#ff3355', borderColor: '#ff335533' }}>
                  DELETE
                </button>
              )}
              <button onClick={() => setEditing(null)} style={{ ...btnStyle, color: '#6a7a8a', borderColor: '#6a7a8a33' }}>
                CANCEL
              </button>
              <button onClick={handleSave} style={{ ...btnStyle, color: 'var(--cyan)', borderColor: 'rgba(0,240,255,0.3)', background: 'rgba(0,240,255,0.08)' }}>
                {editing.isNew ? 'CREATE' : 'SAVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)',
  borderRadius: '4px', color: '#e0e6ed', padding: '8px 10px',
  fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', outline: 'none',
};

const btnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid', borderRadius: '4px',
  padding: '6px 16px', cursor: 'pointer',
  fontFamily: 'Orbitron, sans-serif', fontSize: '10px', letterSpacing: '1px',
};

function ModalField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: '12px', ...style }}>
      <label style={{ display: 'block', fontFamily: 'Orbitron, sans-serif', fontSize: '9px', color: '#4a5a6a', letterSpacing: '1px', marginBottom: '4px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
