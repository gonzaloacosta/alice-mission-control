import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';

export function NetworkLinks() {
  const agents = useStore(s => s.agents);
  const links = useStore(s => s.links);
  const showLinks = useStore(s => s.showLinks);

  const agentMap = useMemo(() => {
    const m = new Map<string, THREE.Vector3>();
    agents.forEach(a => m.set(a.id, new THREE.Vector3(a.x, a.y, a.z)));
    return m;
  }, [agents]);

  const lineData = useMemo(() => {
    if (!showLinks) return [];
    return links.map(link => {
      const src = agentMap.get(link.sourceId);
      const tgt = agentMap.get(link.targetId);
      if (!src || !tgt) return null;
      const color = link.status === 'down' ? '#ff3355' :
                    link.status === 'degraded' ? '#ffcc00' : '#00f0ff';
      return { points: [src, tgt], color, opacity: link.status === 'active' ? 0.08 : 0.15 };
    }).filter(Boolean) as { points: THREE.Vector3[]; color: string; opacity: number }[];
  }, [links, agentMap, showLinks]);

  if (!showLinks) return null;

  return (
    <group>
      {lineData.map((d, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                d.points[0].x, d.points[0].y, d.points[0].z,
                d.points[1].x, d.points[1].y, d.points[1].z,
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={d.color} transparent opacity={d.opacity} />
        </line>
      ))}
    </group>
  );
}
