import { useState, useEffect, useCallback } from 'react';

interface NewsItem {
  id: string;
  category: string;
  headline: string;
  summary: string;
  source: string;
  sourceTag?: string;
  url?: string;
  timestamp: string;
}

interface NewsFeed {
  updatedAt: string;
  items: NewsItem[];
}

const CATEGORY_STYLES: Record<string, { color: string; bg: string; icon: string }> = {
  ai:        { color: '#00ff88', bg: 'rgba(0,255,136,0.06)',  icon: '🤖' },
  cybersec:  { color: '#ff3355', bg: 'rgba(255,51,85,0.06)',  icon: '🔒' },
  argentina: { color: '#4488ff', bg: 'rgba(68,136,255,0.06)', icon: '🇦🇷' },
  spain:     { color: '#ffcc00', bg: 'rgba(255,204,0,0.06)',  icon: '🇪🇸' },
  tech:      { color: '#aa44ff', bg: 'rgba(170,68,255,0.06)', icon: '💻' },
  weather:   { color: '#00f0ff', bg: 'rgba(0,240,255,0.06)',  icon: '🌤️' },
  world:     { color: '#6a8aaa', bg: 'rgba(106,138,170,0.06)',icon: '🌍' },
};

const DEFAULT_STYLE = { color: '#6a7a8a', bg: 'rgba(106,122,138,0.06)', icon: '📰' };

export function NewsView() {
  const [feed, setFeed] = useState<NewsFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/news.json?t=' + Date.now());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFeed(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchNews]);

  const items = feed?.items || [];
  const categories = [...new Set(items.map(i => i.category))];
  const filtered = filter ? items.filter(i => i.category === filter) : items;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="detail-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <h2 style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '14px',
            color: 'var(--cyan)', letterSpacing: '2px', margin: 0,
          }}>
            📡 NEWS FEED
          </h2>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(0,240,255,0.08)', color: 'var(--cyan)',
            border: '1px solid rgba(0,240,255,0.15)',
            fontFamily: 'Orbitron, sans-serif',
          }}>
            {filtered.length}
          </span>
          {feed?.updatedAt && (
            <span style={{
              fontSize: '10px', color: '#4a5a6a', fontFamily: 'Share Tech Mono, monospace',
              marginLeft: 'auto',
            }}>
              Updated: {new Date(feed.updatedAt).toLocaleString('en-US', {
                hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter(null)}
            style={{
              fontSize: '10px', padding: '4px 10px', borderRadius: '12px',
              border: `1px solid ${!filter ? 'var(--cyan)' : 'rgba(0,240,255,0.15)'}`,
              background: !filter ? 'rgba(0,240,255,0.12)' : 'transparent',
              color: !filter ? 'var(--cyan)' : '#6a7a8a',
              cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace',
              transition: 'all 0.15s',
            }}
          >
            ALL
          </button>
          {categories.map(cat => {
            const style = CATEGORY_STYLES[cat] || DEFAULT_STYLE;
            const active = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilter(active ? null : cat)}
                style={{
                  fontSize: '10px', padding: '4px 10px', borderRadius: '12px',
                  border: `1px solid ${active ? style.color : style.color + '30'}`,
                  background: active ? style.bg : 'transparent',
                  color: active ? style.color : '#6a7a8a',
                  cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace',
                  transition: 'all 0.15s', textTransform: 'uppercase',
                }}
              >
                {style.icon} {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5a6a' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📡</div>
            <div style={{ fontSize: '13px', fontFamily: 'Share Tech Mono, monospace' }}>Loading feed...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5a6a' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📰</div>
            <div style={{ fontSize: '13px', fontFamily: 'Share Tech Mono, monospace', marginBottom: '8px' }}>
              No news data yet
            </div>
            <div style={{ fontSize: '11px', color: '#3a4a5a' }}>
              News will appear here after the daily briefing runs
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4a5a6a' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '13px', fontFamily: 'Share Tech Mono, monospace' }}>
              No items in this category
            </div>
          </div>
        )}

        {filtered.map(item => {
          const cat = CATEGORY_STYLES[item.category] || DEFAULT_STYLE;
          return (
            <div
              key={item.id}
              style={{
                padding: '16px 20px', borderBottom: '1px solid rgba(0,240,255,0.04)',
                transition: 'background 0.15s', cursor: item.url ? 'pointer' : 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,240,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => item.url && window.open(item.url, '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {/* Category badge */}
                <span style={{
                  fontSize: '9px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px',
                  padding: '3px 8px', borderRadius: '3px',
                  background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`,
                  fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {cat.icon} {item.category}
                </span>

                {/* Source */}
                <span style={{
                  fontSize: '10px', color: '#4a5a6a', fontFamily: 'Share Tech Mono, monospace',
                }}>
                  {item.source}
                </span>

                {item.sourceTag && (
                  <span style={{
                    fontSize: '9px', padding: '2px 6px', borderRadius: '3px',
                    background: 'rgba(106,138,170,0.08)', color: '#6a8aaa',
                    border: '1px solid rgba(106,138,170,0.15)',
                    fontFamily: 'Share Tech Mono, monospace',
                  }}>
                    {item.sourceTag}
                  </span>
                )}

                {/* Timestamp */}
                <span style={{
                  fontSize: '10px', color: '#3a4a5a', fontFamily: 'Orbitron, sans-serif',
                  marginLeft: 'auto',
                }}>
                  {item.timestamp}
                </span>
              </div>

              {/* Headline */}
              <div style={{
                fontSize: '14px', color: '#e0eaf4', fontWeight: 600,
                fontFamily: 'Share Tech Mono, monospace', lineHeight: '1.5',
                marginBottom: '6px',
              }}>
                {item.headline}
              </div>

              {/* Summary */}
              <div style={{
                fontSize: '12px', color: '#7a8a9a', fontFamily: 'Share Tech Mono, monospace',
                lineHeight: '1.6',
              }}>
                {item.summary}
              </div>

              {/* Link hint */}
              {item.url && (
                <div style={{
                  fontSize: '10px', color: 'var(--cyan)', marginTop: '8px',
                  fontFamily: 'Share Tech Mono, monospace', opacity: 0.6,
                }}>
                  ↗ Click to open source
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
