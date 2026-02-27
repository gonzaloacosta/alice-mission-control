import { useState } from 'react';
import type { Project } from '../../types';

interface NewProjectModalProps {
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export function NewProjectModal({ onClose, onCreated }: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<{ step: string; success: boolean; note?: string }[]>([]);

  const handleCreate = async () => {
    if (name.trim().length < 2 || idea.trim().length < 10) {
      setError('Name (2+ chars) and idea (10+ chars) are required');
      return;
    }

    setLoading(true);
    setError(null);
    setSteps([]);

    try {
      const res = await fetch('/api/v1/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), idea: idea.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project');
        setLoading(false);
        return;
      }

      setSteps(data.steps || []);

      // Add the project to the store
      if (data.planet) {
        onCreated(data.planet as Project);
      }

      // Auto-close after 2 seconds on success
      setTimeout(() => onClose(), 2000);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div style={{
        width: '560px', maxHeight: '80vh', overflowY: 'auto',
        background: 'rgba(36,40,59,0.98)', border: '1px solid rgba(125,207,255,0.2)',
        borderRadius: '12px', padding: '32px',
        boxShadow: '0 0 40px rgba(125,207,255,0.1)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <span style={{ fontSize: '28px' }}>🚀</span>
          <div>
            <h2 style={{
              fontFamily: 'Geist, sans-serif', fontSize: '16px',
              color: 'var(--cyan)', letterSpacing: '2px', margin: 0,
            }}>
              NEW PROJECT
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
              Creates repo from template, initializes Claude Code agents
            </div>
          </div>
        </div>

        {/* Name field */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block', fontSize: '10px', color: 'var(--muted-foreground)',
            fontFamily: 'Geist, sans-serif', letterSpacing: '2px', marginBottom: '8px',
          }}>
            PROJECT NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. PKI Manager"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(125,207,255,0.04)', border: '1px solid rgba(125,207,255,0.15)',
              borderRadius: '8px', color: 'var(--foreground)', fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace', outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(125,207,255,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(125,207,255,0.15)'}
          />
          <div style={{ fontSize: '10px', color: 'var(--border)', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
            Will create: github.com/gonzaloacosta/{name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '...'}
          </div>
        </div>

        {/* Idea field */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '10px', color: 'var(--muted-foreground)',
            fontFamily: 'Geist, sans-serif', letterSpacing: '2px', marginBottom: '8px',
          }}>
            PROJECT IDEA
          </label>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder="Describe your project idea... What problem does it solve? What's the MVP scope? What tech stack are you considering?"
            disabled={loading}
            rows={6}
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(125,207,255,0.04)', border: '1px solid rgba(125,207,255,0.15)',
              borderRadius: '8px', color: 'var(--foreground)', fontSize: '13px',
              fontFamily: 'JetBrains Mono, monospace', outline: 'none',
              resize: 'vertical', lineHeight: '1.6',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(125,207,255,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(125,207,255,0.15)'}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', marginBottom: '16px', borderRadius: '8px',
            background: 'rgba(247,118,142,0.08)', border: '1px solid rgba(247,118,142,0.2)',
            color: 'var(--red)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Steps progress */}
        {steps.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 0', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
                color: s.success ? 'var(--green)' : 'var(--red)',
              }}>
                <span>{s.success ? '✅' : '❌'}</span>
                <span>{s.step.replace(/_/g, ' ')}</span>
                {s.note && <span style={{ color: 'var(--muted-foreground)' }}>({s.note})</span>}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: 'transparent', border: '1px solid rgba(86,95,137,0.3)',
              color: 'var(--muted-foreground)', fontSize: '12px',
              fontFamily: 'Geist, sans-serif', letterSpacing: '1px',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || name.trim().length < 2 || idea.trim().length < 10}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: loading ? 'rgba(125,207,255,0.05)' : 'rgba(125,207,255,0.12)',
              border: '1px solid rgba(125,207,255,0.3)',
              color: loading ? 'var(--muted-foreground)' : 'var(--cyan)', fontSize: '12px',
              fontFamily: 'Geist, sans-serif', letterSpacing: '1px',
              cursor: loading ? 'wait' : 'pointer', transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ CREATING...' : '🚀 CREATE PROJECT'}
          </button>
        </div>

        {/* What it does */}
        <div style={{
          marginTop: '24px', padding: '14px', borderRadius: '8px',
          background: 'rgba(125,207,255,0.02)', border: '1px solid rgba(125,207,255,0.06)',
        }}>
          <div style={{ fontSize: '9px', color: 'var(--muted-foreground)', fontFamily: 'Geist, sans-serif', letterSpacing: '2px', marginBottom: '8px' }}>
            WHAT THIS DOES
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.8' }}>
            1. Creates GitHub repo from <span style={{ color: 'var(--blue)' }}>project-template</span><br/>
            2. Fills CLAUDE.md with your idea<br/>
            3. Sets up 7 Claude Code agents (backend, frontend, devops, devsecops, qa, reviewer, planner)<br/>
            4. Creates Notion project page with TODOs<br/>
            5. Registers project in Mission Control API<br/>
            6. Adds planet to the 3D solar system<br/>
          </div>
        </div>
      </div>
    </div>
  );
}
