import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Types ──

interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
}

interface WeatherPoint {
  lat: number;
  lon: number;
  index: number;
  distanceKm: number;
  temperature?: number;
  windSpeed?: number;
  windDirection?: number;
  precipProbability?: number;
  loading: boolean;
  error?: string;
}

interface RouteStats {
  totalDistanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  minEle: number;
  maxEle: number;
}

// ── Helpers ──

function parseGpx(xml: string): GpxPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const trkpts = doc.querySelectorAll('trkpt');
  const points: GpxPoint[] = [];
  trkpts.forEach(pt => {
    const lat = parseFloat(pt.getAttribute('lat') || '0');
    const lon = parseFloat(pt.getAttribute('lon') || '0');
    const eleEl = pt.querySelector('ele');
    const ele = eleEl ? parseFloat(eleEl.textContent || '0') : undefined;
    points.push({ lat, lon, ele });
  });
  return points;
}

function haversineDistance(a: GpxPoint, b: GpxPoint): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function computeStats(points: GpxPoint[]): RouteStats {
  let totalDistanceKm = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let minEle = Infinity;
  let maxEle = -Infinity;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) totalDistanceKm += haversineDistance(points[i - 1], points[i]);
    const ele = points[i].ele;
    if (ele !== undefined) {
      if (ele < minEle) minEle = ele;
      if (ele > maxEle) maxEle = ele;
      if (i > 0 && points[i - 1].ele !== undefined) {
        const diff = ele - points[i - 1].ele!;
        if (diff > 0) elevationGain += diff;
        else elevationLoss += Math.abs(diff);
      }
    }
  }
  return { totalDistanceKm, elevationGain, elevationLoss, minEle: minEle === Infinity ? 0 : minEle, maxEle: maxEle === -Infinity ? 0 : maxEle };
}

function samplePoints(points: GpxPoint[], n: number): { point: GpxPoint; distanceKm: number; index: number }[] {
  if (points.length === 0) return [];
  const cumulDist: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumulDist.push(cumulDist[i - 1] + haversineDistance(points[i - 1], points[i]));
  }
  const totalDist = cumulDist[cumulDist.length - 1];
  const samples: { point: GpxPoint; distanceKm: number; index: number }[] = [];
  for (let i = 0; i < n; i++) {
    const targetDist = (i / (n - 1)) * totalDist;
    let idx = cumulDist.findIndex(d => d >= targetDist);
    if (idx < 0) idx = points.length - 1;
    samples.push({ point: points[idx], distanceKm: cumulDist[idx], index: i });
  }
  return samples;
}

function bearingBetween(a: GpxPoint, b: GpxPoint): number {
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function windRelativeAngle(routeBearing: number, windDir: number): number {
  // Wind direction is where wind comes FROM, route bearing is where we're going
  // Tailwind = wind coming from behind = wind direction ~ route bearing
  // Headwind = wind coming from front = wind direction ~ (route bearing + 180)
  let diff = ((windDir - routeBearing) + 360) % 360;
  if (diff > 180) diff = diff - 360;
  return diff; // -180..180, 0 = direct tailwind, +-180 = direct headwind
}

function windLabel(angle: number): { label: string; color: string } {
  const abs = Math.abs(angle);
  if (abs < 45) return { label: 'Tailwind', color: '#00ff88' };
  if (abs < 90) return { label: 'Cross-tail', color: '#88ff88' };
  if (abs < 135) return { label: 'Cross-head', color: '#ffcc00' };
  return { label: 'Headwind', color: '#ff3355' };
}

// Custom marker icons
const startIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#00ff88;border-radius:50%;border:2px solid #0a0a12;box-shadow:0 0 8px #00ff88"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const endIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#ff3355;border-radius:50%;border:2px solid #0a0a12;box-shadow:0 0 8px #ff3355"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const sampleIcon = L.divIcon({
  className: '',
  html: '<div style="width:8px;height:8px;background:#00f0ff;border-radius:50%;border:1px solid #0a0a12;box-shadow:0 0 6px #00f0ff"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

// ── Map auto-fit component ──

function FitBounds({ points }: { points: GpxPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [points, map]);
  return null;
}

// ── Styles ──

const cardStyle: React.CSSProperties = {
  background: 'rgba(8,12,28,0.8)',
  border: '1px solid rgba(0,240,255,0.15)',
  borderRadius: '8px',
  padding: '14px',
  backdropFilter: 'blur(8px)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'Orbitron, sans-serif',
  fontSize: '9px',
  color: '#4a5a6a',
  letterSpacing: '1.5px',
  textTransform: 'uppercase' as const,
  marginBottom: '4px',
};

const valueStyle: React.CSSProperties = {
  fontFamily: 'Orbitron, sans-serif',
  fontSize: '16px',
  fontWeight: 700,
};

const btnStyle: React.CSSProperties = {
  background: 'rgba(0,240,255,0.08)',
  border: '1px solid rgba(0,240,255,0.25)',
  borderRadius: '6px',
  color: 'var(--cyan)',
  cursor: 'pointer',
  fontFamily: 'Orbitron, sans-serif',
  fontSize: '10px',
  letterSpacing: '1px',
  padding: '8px 16px',
  transition: 'all 0.2s',
};

// ── Main Component ──

export function RouteView() {
  const [points, setPoints] = useState<GpxPoint[]>([]);
  const [routeName, setRouteName] = useState<string>('');
  const [weather, setWeather] = useState<WeatherPoint[]>([]);
  const [departureTime, setDepartureTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  });
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => points.length > 0 ? computeStats(points) : null, [points]);
  const routeBearing = useMemo(() => {
    if (points.length < 2) return 0;
    return bearingBetween(points[0], points[points.length - 1]);
  }, [points]);

  const loadGpxText = useCallback((text: string) => {
    const parsed = parseGpx(text);
    if (parsed.length === 0) return;
    // Try to get route name from GPX
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const name = doc.querySelector('trk > name')?.textContent || 'Unnamed Route';
    setRouteName(name);
    setPoints(parsed);
    setWeather([]);
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') loadGpxText(reader.result);
    };
    reader.readAsText(file);
  }, [loadGpxText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.gpx')) handleFile(file);
  }, [handleFile]);

  const loadSample = useCallback(async () => {
    try {
      const res = await fetch('/sample-route.gpx');
      const text = await res.text();
      loadGpxText(text);
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  }, [loadGpxText]);

  const fetchWeather = useCallback(async () => {
    if (points.length === 0) return;
    setLoading(true);
    const samples = samplePoints(points, 10);
    const initial: WeatherPoint[] = samples.map(s => ({
      lat: s.point.lat,
      lon: s.point.lon,
      index: s.index,
      distanceKm: s.distanceKm,
      loading: true,
    }));
    setWeather(initial);

    const targetHour = new Date(departureTime);

    const results = await Promise.allSettled(
      samples.map(async (s) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${s.point.lat.toFixed(4)}&longitude=${s.point.lon.toFixed(4)}&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability&forecast_days=2`;
        const res = await fetch(url);
        const data = await res.json();
        // Find closest hour
        const hours: string[] = data.hourly?.time || [];
        let bestIdx = 0;
        let bestDiff = Infinity;
        hours.forEach((h: string, i: number) => {
          const diff = Math.abs(new Date(h).getTime() - targetHour.getTime());
          if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
        });
        return {
          temperature: data.hourly?.temperature_2m?.[bestIdx],
          windSpeed: data.hourly?.wind_speed_10m?.[bestIdx],
          windDirection: data.hourly?.wind_direction_10m?.[bestIdx],
          precipProbability: data.hourly?.precipitation_probability?.[bestIdx],
        };
      })
    );

    setWeather(prev => prev.map((wp, i) => {
      const result = results[i];
      if (result.status === 'fulfilled') {
        return { ...wp, ...result.value, loading: false };
      }
      return { ...wp, loading: false, error: 'Failed to fetch' };
    }));
    setLoading(false);
  }, [points, departureTime]);

  // Auto-fetch weather when route is loaded
  useEffect(() => {
    if (points.length > 0) fetchWeather();
  }, [points]); // eslint-disable-line react-hooks/exhaustive-deps

  const weatherStats = useMemo(() => {
    const loaded = weather.filter(w => !w.loading && w.temperature !== undefined);
    if (loaded.length === 0) return null;
    const temps = loaded.map(w => w.temperature!);
    const winds = loaded.map(w => w.windSpeed ?? 0);
    const precips = loaded.map(w => w.precipProbability ?? 0);
    return {
      minTemp: Math.min(...temps),
      maxTemp: Math.max(...temps),
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      maxWind: Math.max(...winds),
      avgWind: winds.reduce((a, b) => a + b, 0) / winds.length,
      maxPrecip: Math.max(...precips),
      avgPrecip: precips.reduce((a, b) => a + b, 0) / precips.length,
    };
  }, [weather]);

  const polyline = useMemo(() => points.map(p => [p.lat, p.lon] as [number, number]), [points]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="detail-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: 'var(--cyan)', letterSpacing: '2px', margin: 0 }}>
            ROUTE PLANNER
          </h2>
          {routeName && (
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
              background: 'rgba(0,240,255,0.08)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.15)',
              fontFamily: 'Share Tech Mono, monospace',
            }}>{routeName}</span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={loadSample} style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; }}>
              LOAD SAMPLE
            </button>
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; }}>
              UPLOAD GPX
            </button>
            <input ref={fileInputRef} type="file" accept=".gpx" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {points.length === 0 ? (
          /* Upload zone */
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--cyan)' : 'rgba(0,240,255,0.2)'}`,
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(0,240,255,0.04)' : 'transparent',
              transition: 'all 0.3s',
              maxWidth: '600px',
              margin: '60px auto',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.6 }}>🧭</div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: 'var(--cyan)', letterSpacing: '2px', marginBottom: '8px' }}>
              DROP GPX FILE HERE
            </div>
            <div style={{ fontSize: '12px', color: '#4a5a6a', fontFamily: 'Share Tech Mono, monospace' }}>
              or click to browse
            </div>
            <div style={{ marginTop: '24px' }}>
              <button onClick={(e) => { e.stopPropagation(); loadSample(); }} style={{ ...btnStyle, background: 'rgba(0,255,136,0.08)', borderColor: 'rgba(0,255,136,0.25)', color: '#00ff88' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,255,136,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,255,136,0.08)'; }}>
                LOAD SAMPLE ROUTE
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Route stats bar */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                <div style={cardStyle}>
                  <div style={labelStyle}>Distance</div>
                  <div style={{ ...valueStyle, color: 'var(--cyan)' }}>{stats.totalDistanceKm.toFixed(1)} km</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Elev. Gain</div>
                  <div style={{ ...valueStyle, color: '#00ff88' }}>+{stats.elevationGain.toFixed(0)} m</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Elev. Loss</div>
                  <div style={{ ...valueStyle, color: '#ff3355' }}>-{stats.elevationLoss.toFixed(0)} m</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Min / Max Elev</div>
                  <div style={{ ...valueStyle, color: '#ffcc00', fontSize: '14px' }}>{stats.minEle.toFixed(0)} / {stats.maxEle.toFixed(0)} m</div>
                </div>
                <div style={cardStyle}>
                  <div style={labelStyle}>Points</div>
                  <div style={{ ...valueStyle, color: '#aa44ff' }}>{points.length.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Map + Time control */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ ...cardStyle, flex: '1 1 600px', minHeight: '400px', padding: 0, overflow: 'hidden', position: 'relative' }}>
                <MapContainer
                  center={[points[0].lat, points[0].lon]}
                  zoom={12}
                  style={{ height: '400px', width: '100%', background: '#0a0a12' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <FitBounds points={points} />
                  <Polyline positions={polyline} pathOptions={{ color: '#00f0ff', weight: 3, opacity: 0.8 }} />
                  <Marker position={[points[0].lat, points[0].lon]} icon={startIcon}>
                    <Popup><span style={{ color: '#000' }}>Start</span></Popup>
                  </Marker>
                  <Marker position={[points[points.length - 1].lat, points[points.length - 1].lon]} icon={endIcon}>
                    <Popup><span style={{ color: '#000' }}>End</span></Popup>
                  </Marker>
                  {weather.filter(w => !w.loading).map(wp => (
                    <Marker key={wp.index} position={[wp.lat, wp.lon]} icon={sampleIcon}>
                      <Popup>
                        <div style={{ color: '#000', fontSize: '11px', fontFamily: 'monospace' }}>
                          <div><strong>Point {wp.index + 1}</strong> ({wp.distanceKm.toFixed(1)} km)</div>
                          {wp.temperature !== undefined && <div>Temp: {wp.temperature}°C</div>}
                          {wp.windSpeed !== undefined && <div>Wind: {wp.windSpeed} km/h</div>}
                          {wp.precipProbability !== undefined && <div>Rain: {wp.precipProbability}%</div>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>

              {/* Time selector panel */}
              <div style={{ ...cardStyle, flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={labelStyle}>Departure Time</div>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={e => setDepartureTime(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.2)',
                    borderRadius: '4px', color: 'var(--cyan)', padding: '8px',
                    fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', outline: 'none',
                    colorScheme: 'dark',
                  }}
                />
                <button onClick={fetchWeather} disabled={loading} style={{
                  ...btnStyle,
                  opacity: loading ? 0.5 : 1,
                  width: '100%',
                  textAlign: 'center',
                }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(0,240,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.08)'; }}>
                  {loading ? 'FETCHING...' : 'UPDATE WEATHER'}
                </button>

                {/* Summary */}
                {weatherStats && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <div>
                      <div style={labelStyle}>Temperature</div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#c8d8e8' }}>
                        <span style={{ color: '#4488ff' }}>{weatherStats.minTemp.toFixed(1)}°</span>
                        {' / '}
                        <span style={{ color: '#ffcc00' }}>{weatherStats.avgTemp.toFixed(1)}°</span>
                        {' / '}
                        <span style={{ color: '#ff3355' }}>{weatherStats.maxTemp.toFixed(1)}°</span>
                        <span style={{ color: '#4a5a6a', fontSize: '10px' }}> min/avg/max</span>
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Wind</div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: '#c8d8e8' }}>
                        avg {weatherStats.avgWind.toFixed(1)} km/h, max {weatherStats.maxWind.toFixed(1)} km/h
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>Rain Probability</div>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '12px', color: weatherStats.maxPrecip > 50 ? '#ff3355' : weatherStats.maxPrecip > 20 ? '#ffcc00' : '#00ff88' }}>
                        avg {weatherStats.avgPrecip.toFixed(0)}%, max {weatherStats.maxPrecip.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weather Dashboard */}
            {weather.length > 0 && (
              <div style={cardStyle}>
                <div style={{ ...labelStyle, marginBottom: '12px', fontSize: '10px' }}>WEATHER ALONG ROUTE</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
                        {['#', 'Distance', 'Temp', 'Wind', 'Dir', 'Rain %', 'Wind Analysis'].map(h => (
                          <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontFamily: 'Orbitron, sans-serif', fontSize: '9px', color: '#4a5a6a', letterSpacing: '1px', fontWeight: 400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weather.map(wp => {
                        if (wp.loading) {
                          return (
                            <tr key={wp.index} style={{ borderBottom: '1px solid rgba(0,240,255,0.06)' }}>
                              <td style={{ padding: '8px 10px', color: '#4a5a6a' }}>{wp.index + 1}</td>
                              <td style={{ padding: '8px 10px', color: '#4a5a6a' }}>{wp.distanceKm.toFixed(1)} km</td>
                              <td colSpan={5} style={{ padding: '8px 10px', color: '#4a5a6a' }}>Loading...</td>
                            </tr>
                          );
                        }
                        const relAngle = wp.windDirection !== undefined ? windRelativeAngle(routeBearing, wp.windDirection) : null;
                        const windInfo = relAngle !== null ? windLabel(relAngle) : null;
                        return (
                          <tr key={wp.index} style={{ borderBottom: '1px solid rgba(0,240,255,0.06)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,240,255,0.03)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <td style={{ padding: '8px 10px', color: 'var(--cyan)' }}>{wp.index + 1}</td>
                            <td style={{ padding: '8px 10px', color: '#c8d8e8' }}>{wp.distanceKm.toFixed(1)} km</td>
                            <td style={{ padding: '8px 10px', color: wp.temperature !== undefined && wp.temperature > 30 ? '#ff3355' : wp.temperature !== undefined && wp.temperature < 5 ? '#4488ff' : '#ffcc00' }}>
                              {wp.temperature !== undefined ? `${wp.temperature}°C` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', color: (wp.windSpeed ?? 0) > 30 ? '#ff3355' : '#c8d8e8' }}>
                              {wp.windSpeed !== undefined ? `${wp.windSpeed} km/h` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {wp.windDirection !== undefined ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ display: 'inline-block', transform: `rotate(${wp.windDirection}deg)`, color: 'var(--cyan)', fontSize: '14px' }}>↑</span>
                                  <span style={{ color: '#6a7a8a' }}>{wp.windDirection}°</span>
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '8px 10px', color: (wp.precipProbability ?? 0) > 50 ? '#ff3355' : (wp.precipProbability ?? 0) > 20 ? '#ffcc00' : '#00ff88' }}>
                              {wp.precipProbability !== undefined ? `${wp.precipProbability}%` : '—'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              {windInfo ? (
                                <span style={{
                                  fontSize: '10px', padding: '2px 8px', borderRadius: '3px',
                                  background: `${windInfo.color}15`, color: windInfo.color,
                                  border: `1px solid ${windInfo.color}30`,
                                  fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.5px',
                                }}>
                                  {windInfo.label}
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Wind summary */}
                {weather.filter(w => w.windDirection !== undefined).length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', borderRadius: '6px', background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.1)' }}>
                    <div style={{ ...labelStyle, marginBottom: '8px' }}>WIND ANALYSIS SUMMARY</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontFamily: 'Share Tech Mono, monospace', fontSize: '12px' }}>
                      {(() => {
                        const analyzed = weather
                          .filter(w => w.windDirection !== undefined)
                          .map(w => windLabel(windRelativeAngle(routeBearing, w.windDirection!)));
                        const counts = { Tailwind: 0, 'Cross-tail': 0, 'Cross-head': 0, Headwind: 0 };
                        analyzed.forEach(a => { counts[a.label as keyof typeof counts]++; });
                        const total = analyzed.length;
                        return Object.entries(counts).map(([label, count]) => {
                          const info = analyzed.find(a => a.label === label);
                          const color = info?.color || '#6a7a8a';
                          return (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
                              <span style={{ color }}>{label}: {count}/{total}</span>
                              <span style={{ color: '#4a5a6a' }}>({total > 0 ? Math.round(count / total * 100) : 0}%)</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#6a7a8a', fontFamily: 'Share Tech Mono, monospace' }}>
                      Route bearing: {routeBearing.toFixed(0)}° ({
                        routeBearing < 22.5 || routeBearing >= 337.5 ? 'N' :
                        routeBearing < 67.5 ? 'NE' :
                        routeBearing < 112.5 ? 'E' :
                        routeBearing < 157.5 ? 'SE' :
                        routeBearing < 202.5 ? 'S' :
                        routeBearing < 247.5 ? 'SW' :
                        routeBearing < 292.5 ? 'W' : 'NW'
                      })
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Clear route button */}
            <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
              <button onClick={() => { setPoints([]); setWeather([]); setRouteName(''); }}
                style={{ ...btnStyle, color: '#ff3355', borderColor: 'rgba(255,51,85,0.25)', background: 'rgba(255,51,85,0.06)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,85,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,85,0.06)'; }}>
                CLEAR ROUTE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
