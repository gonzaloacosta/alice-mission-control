import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { STATE_COLORS, STATE_EMISSIVE } from '../../types';
import type { Agent, AgentState } from '../../types';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export function AgentInstances() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const glowRef = useRef<THREE.InstancedMesh>(null!);
  const agents = useStore(s => s.agents);
  const filterState = useStore(s => s.filterState);
  const filterCluster = useStore(s => s.filterCluster);
  const searchQuery = useStore(s => s.searchQuery);
  const selectedAgentId = useStore(s => s.selectedAgentId);
  const selectAgent = useStore(s => s.selectAgent);

  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      if (filterState !== 'all' && a.state !== filterState) return false;
      if (filterCluster !== 'all' && a.cluster !== filterCluster) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase()) && !a.id.includes(searchQuery)) return false;
      return true;
    });
  }, [agents, filterState, filterCluster, searchQuery]);

  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.35, 1), []);
  const glowGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 1), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.3,
    metalness: 0.7,
    transparent: true,
  }), []);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  }), []);

  useFrame((state) => {
    if (!meshRef.current || !glowRef.current) return;
    const t = state.clock.getElapsedTime();

    filteredAgents.forEach((agent, i) => {
      const isSelected = agent.id === selectedAgentId;
      const scale = agent.type === 'gateway' ? 2.5 :
                    agent.type === 'orchestrator' ? 1.8 :
                    agent.type === 'monitor' ? 1.2 : 1.0;

      // Pulse for running/warning/error
      const pulse = agent.state === 'running' ? 1 + Math.sin(t * 3 + i) * 0.08 :
                    agent.state === 'error' ? 1 + Math.sin(t * 8 + i) * 0.15 :
                    agent.state === 'warning' ? 1 + Math.sin(t * 5 + i) * 0.1 : 1;

      const finalScale = scale * pulse * (isSelected ? 1.4 : 1);

      tempObject.position.set(agent.x, agent.y, agent.z);
      tempObject.scale.setScalar(finalScale);
      tempObject.rotation.y = t * 0.5 + i;
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);

      // Color
      tempColor.set(STATE_COLORS[agent.state]);
      meshRef.current.setColorAt(i, tempColor);

      // Glow
      tempObject.scale.setScalar(finalScale * (1.3 + Math.sin(t * 2 + i * 0.5) * 0.2));
      tempObject.updateMatrix();
      glowRef.current.setMatrixAt(i, tempObject.matrix);
      glowRef.current.setColorAt(i, tempColor);
    });

    meshRef.current.count = filteredAgents.length;
    glowRef.current.count = filteredAgents.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    if (glowRef.current.instanceColor) glowRef.current.instanceColor.needsUpdate = true;
  });

  const handleClick = (e: THREE.Event & { instanceId?: number }) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && filteredAgents[e.instanceId]) {
      selectAgent(filteredAgents[e.instanceId].id);
    }
  };

  const maxCount = Math.max(agents.length, 1);

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[geo, mat, maxCount]}
        onClick={handleClick}
        frustumCulled={false}
      />
      <instancedMesh
        ref={glowRef}
        args={[glowGeo, glowMat, maxCount]}
        frustumCulled={false}
        raycast={() => null}
      />
    </>
  );
}
