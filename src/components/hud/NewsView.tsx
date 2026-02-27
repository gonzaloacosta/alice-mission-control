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
  ai:        { color: 'var(--green)', bg: 'rgba(158,206,106,0.06)',  icon: '🤖' },
  cybersec:  { color: 'var(--red)', bg: 'rgba(247,118,142,0.06)',  icon: '🔒' },
  argentina: { color: 'var(--blue)', bg: 'rgba(122,162,247,0.06)', icon: '🇦🇷' },
  spain:     { color: 'var(--yellow)', bg: 'rgba(224,175,104,0.06)',  icon: '🇪🇸' },
  tech:      { color: 'var(--purple)', bg: 'rgba(187,154,247,0.06)', icon: '💻' },
  weather:   { color: 'var(--cyan)', bg: 'rgba(125,207,255,0.06)',  icon: '🌤️' },
  world:     { color: 'var(--blue)', bg: 'rgba(106,138,170,0.06)',icon: '🌍' },
};

const DEFAULT_STYLE = { color: 'var(--muted-foreground)', bg: 'rgba(86,95,137,0.06)', icon: '📰' };

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
            fontFamily: 'Geist, sans-serif', fontSize: '14px',
            color: 'var(--cyan)', letterSpacing: '2px', margin: 0,
          }}>
            📡 NEWS FEED
          </h2>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
            background: 'rgba(125,207,255,0.08)', color: 'var(--cyan)',
            border: '1px solid rgba(125,207,255,0.15)',
            fontFamily: 'Geist, sans-serif',
          }}>
            {filtered.length}
          </span>
          {feed?.updatedAt && (
            <span style={{
              fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace',
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
              border: `1px solid ${!filter ? 'var(--cyan)' : 'rgba(125,207,255,0.15)'}`,
              background: !filter ? 'rgba(125,207,255,0.12)' : 'transparent',
              color: !filter ? 'var(--cyan)' : 'var(--muted-foreground)',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
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
                  color: active ? style.color : 'var(--muted-foreground)',
                  cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
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
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📡</div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>Loading feed...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📰</div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
              No news data yet
            </div>
            <div style={{ fontSize: '11px', color: 'var(--border)' }}>
              News will appear here after the daily briefing runs
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>
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
                padding: '16px 20px', borderBottom: '1px solid rgba(125,207,255,0.04)',
                transition: 'background 0.15s', cursor: item.url ? 'pointer' : 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(125,207,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => item.url && window.open(item.url, '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                {/* Category badge */}
                <span style={{
                  fontSize: '9px', fontFamily: 'Geist, sans-serif', letterSpacing: '1px',
                  padding: '3px 8px', borderRadius: '3px',
                  background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`,
                  fontWeight: 700, textTransform: 'uppercase',
                }}>
                  {cat.icon} {item.category}
                </span>

                {/* Source */}
                <span style={{
                  fontSize: '10px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {item.source}
                </span>

                {item.sourceTag && (
                  <span style={{
                    fontSize: '9px', padding: '2px 6px', borderRadius: '3px',
                    background: 'rgba(106,138,170,0.08)', color: 'var(--blue)',
                    border: '1px solid rgba(106,138,170,0.15)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {item.sourceTag}
                  </span>
                )}

                {/* Timestamp */}
                <span style={{
                  fontSize: '10px', color: 'var(--border)', fontFamily: 'Geist, sans-serif',
                  marginLeft: 'auto',
                }}>
                  {item.timestamp}
                </span>
              </div>

              {/* Headline */}
              <div style={{
                fontSize: '14px', color: 'var(--foreground)', fontWeight: 600,
                fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.5',
                marginBottom: '6px',
              }}>
                {item.headline}
              </div>

              {/* Summary */}
              <div style={{
                fontSize: '12px', color: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono, monospace',
                lineHeight: '1.6',
              }}>
                {item.summary}
              </div>

              {/* Link hint */}
              {item.url && (
                <div style={{
                  fontSize: '10px', color: 'var(--cyan)', marginTop: '8px',
                  fontFamily: 'JetBrains Mono, monospace', opacity: 0.6,
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
