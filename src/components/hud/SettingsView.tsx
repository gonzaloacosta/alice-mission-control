import { useStore } from '../../store';

export function SettingsView() {
  const quality = useStore(s => s.quality);
  const paused = useStore(s => s.paused);
  const setQuality = useStore(s => s.setQuality);
  const togglePause = useStore(s => s.togglePause);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="detail-header" style={{ flexShrink: 0 }}>
        <h2 style={{ fontFamily: 'Geist, sans-serif', fontSize: '14px', color: 'var(--cyan)', letterSpacing: '2px', margin: 0 }}>
          SETTINGS
        </h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

        {/* Render Quality */}
        <Section title="RENDER QUALITY">
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['low', 'medium', 'high'] as const).map(q => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: '6px', cursor: 'pointer',
                  background: quality === q ? 'rgba(125,207,255,0.08)' : 'rgba(125,207,255,0.02)',
                  border: `1px solid ${quality === q ? 'rgba(125,207,255,0.3)' : 'var(--border)'}`,
                  color: quality === q ? 'var(--cyan)' : 'var(--muted-foreground)',
                  fontFamily: 'Geist, sans-serif', fontSize: '11px', letterSpacing: '2px',
                  transition: 'all 0.2s',
                }}
              >
                {q.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '10px', fontFamily: 'JetBrains Mono, monospace' }}>
            {quality === 'low' ? '⚡ No postprocessing — best performance' :
             quality === 'medium' ? '✨ Bloom enabled — balanced' :
             '🌟 Bloom + Vignette + MSAA — best visuals'}
          </div>
        </Section>

        {/* Simulation Control */}
        <Section title="SIMULATION">
          <button
            onClick={togglePause}
            style={{
              width: '100%', padding: '14px', borderRadius: '6px', cursor: 'pointer',
              background: paused ? 'rgba(247,118,142,0.08)' : 'rgba(158,206,106,0.06)',
              border: `1px solid ${paused ? 'rgba(247,118,142,0.25)' : 'rgba(158,206,106,0.2)'}`,
              color: paused ? 'var(--red)' : 'var(--green)',
              fontFamily: 'Geist, sans-serif', fontSize: '12px', letterSpacing: '2px',
              transition: 'all 0.2s',
            }}
          >
            {paused ? '▶ RESUME SIMULATION' : '⏸ PAUSE SIMULATION'}
          </button>
        </Section>

        {/* Links */}
        <Section title="QUICK LINKS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <LinkCard
              icon="📋"
              label="Notion — All Projects"
              href="https://www.notion.so/Projects-3066ba8342198098afebf637fc5a24d6"
            />
            <LinkCard
              icon="⚙️"
              label="GitHub — Repositories"
              href="https://github.com/gonzaloacosta"
            />
            <LinkCard
              icon="🤖"
              label="OpenClaw Admin Panel"
              href="/openclaw-ui/"
            />
          </div>
        </Section>

        {/* System Info */}
        <Section title="SYSTEM">
          <div className="detail-grid">
            <InfoItem label="Version" value="v0.1.0" />
            <InfoItem label="Agent" value="Alice" />
            <InfoItem label="Frontend" value="React + Three.js" />
            <InfoItem label="API" value="Port 4446" />
            <InfoItem label="Gateway" value="Port 18789" />
            <InfoItem label="Domain" value="alice.gonzaloacosta.me" />
          </div>
        </Section>

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '24px 0 12px', fontSize: '11px',
          color: 'var(--border)', fontFamily: 'JetBrains Mono, monospace',
        }}>
          Mission Control Pro · Built by Alice 🤓
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        fontSize: '10px', color: 'var(--muted-foreground)', letterSpacing: '2px', textTransform: 'uppercase',
        fontFamily: 'Geist, sans-serif', marginBottom: '14px', fontWeight: 700,
        paddingBottom: '8px', borderBottom: '1px solid rgba(125,207,255,0.06)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{
        fontSize: '9px', color: 'var(--muted-foreground)', letterSpacing: '1px', textTransform: 'uppercase',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '13px', color: 'var(--foreground)', fontFamily: 'JetBrains Mono, monospace',
      }}>
        {value}
      </div>
    </div>
  );
}

function LinkCard({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 16px', borderRadius: '6px', textDecoration: 'none',
        background: 'rgba(125,207,255,0.02)', border: '1px solid var(--border)',
        color: 'var(--foreground)', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace',
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(125,207,255,0.06)';
        e.currentTarget.style.borderColor = 'rgba(125,207,255,0.25)';
        e.currentTarget.style.color = 'var(--cyan)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(125,207,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(125,207,255,0.15)';
        e.currentTarget.style.color = 'var(--foreground)';
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{label}</span>
      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--cyan)' }}>→</span>
    </a>
  );
}
