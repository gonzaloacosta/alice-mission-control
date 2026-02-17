import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';
import { getPhase, PHASE_LABELS } from '../../types';
import type { Project, ProjectAgent } from '../../types';

// ═══ SUN (Core) ═══
export function Sun() {
  const coreRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const coronaRef = useRef<THREE.Mesh>(null!);
  const coreName = useStore(s => s.coreName);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    coreRef.current.rotation.y += 0.002;
    coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.12);
    coronaRef.current.rotation.y -= 0.003;
    coronaRef.current.rotation.z += 0.001;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[3, 4]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.65} />
      </mesh>
      {/* Inner solid */}
      <mesh>
        <icosahedronGeometry args={[2.4, 3]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.8} transparent opacity={0.3} />
      </mesh>
      {/* Glow */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[4, 2]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.05} />
      </mesh>
      {/* Corona */}
      <mesh ref={coronaRef}>
        <icosahedronGeometry args={[5, 1]} />
        <meshBasicMaterial color="#00f0ff" wireframe transparent opacity={0.03} />
      </mesh>
      {/* Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.04, 8, 64]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.12} />
      </mesh>
      {/* Lights */}
      <pointLight color="#00f0ff" intensity={3} distance={80} decay={2} />
      <pointLight color="#ffffff" intensity={0.5} distance={100} position={[0, 8, 0]} />
      {/* Label */}
      <Html position={[0, 6, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', color: '#00f0ff', letterSpacing: '3px', textShadow: '0 0 10px #00f0ff50', textAlign: 'center', opacity: 0.7 }}>
          {coreName}
        </div>
      </Html>
    </group>
  );
}

// ═══ ORBIT PATH ═══
function OrbitPath({ radius, color }: { radius: number; color: string }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);

  return <Line points={points} color={color} transparent opacity={0.08} lineWidth={0.5} />;
}

// ═══ SATELLITE (Agent) ═══
function Satellite({ agent, index, planetPos, planetColor, time }: {
  agent: ProjectAgent; index: number; planetPos: THREE.Vector3; planetColor: string; time: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const orbitR = 3.5 + index * 1.4;
  const speed = 0.3 + index * 0.2;
  const offset = index * Math.PI * 0.7;
  const isActive = agent.state === 'active';

  useFrame(() => {
    const a = time * speed + offset;
    ref.current.position.set(
      Math.cos(a) * orbitR,
      Math.sin(a * 0.6) * 0.8,
      Math.sin(a) * orbitR
    );
  });

  return (
    <group ref={ref}>
      {/* Sat body */}
      <mesh>
        <octahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial
          color={isActive ? '#00ff88' : '#5a6a7a'}
          emissive={isActive ? '#00ff88' : '#5a6a7a'}
          emissiveIntensity={isActive ? 0.6 : 0.1}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial color={isActive ? '#00ff88' : '#5a6a7a'} transparent opacity={isActive ? 0.12 : 0.04} />
      </mesh>
      {/* Solar panels for active */}
      {isActive && (
        <>
          <mesh position={[-0.5, 0, 0]}>
            <planeGeometry args={[0.4, 0.15]} />
            <meshBasicMaterial color="#1a4a7a" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.5, 0, 0]}>
            <planeGeometry args={[0.4, 0.15]} />
            <meshBasicMaterial color="#1a4a7a" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      {/* Label */}
      <Html position={[0, 0.7, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: isActive ? '#00ff88' : '#5a6a7a', whiteSpace: 'nowrap', textShadow: isActive ? '0 0 6px #00ff8850' : 'none' }}>
          {agent.name}
        </div>
      </Html>
    </group>
  );
}

// ═══ ENERGY BEAM ═══
function EnergyBeam({ from, to, color, intensity, time, offset }: {
  from: THREE.Vector3; to: THREE.Vector3; color: string; intensity: number; time: number; offset: number;
}) {
  // Animated particles along beam
  const particleCount = 4;
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => i);
  }, []);

  return (
    <group>
      {/* Base line */}
      <Line
        points={[from, to]}
        color={color}
        transparent
        opacity={0.06 + intensity * 0.08 + Math.sin(time * 4 + offset) * 0.03}
        lineWidth={0.5}
      />
      {/* Energy particles */}
      {particles.map(i => {
        const t = ((time * 1.5 + offset + i / particleCount) % 1);
        const pos = new THREE.Vector3().lerpVectors(from, to, t);
        return (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.08, 4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.5 * (1 - t) * intensity} />
          </mesh>
        );
      })}
    </group>
  );
}

// ═══ PLANET (Project) ═══
function Planet({ project }: { project: Project }) {
  const ref = useRef<THREE.Group>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const focusProject = useStore(s => s.focusProject);
  const openChat = useStore(s => s.openChat);
  const selectedId = useStore(s => s.selectedProjectId);
  const focusedId = useStore(s => s.focusedProjectId);
  const isSelected = selectedId === project.id;
  const isFocused = focusedId === project.id;
  const timeRef = useRef(0);
  const angleRef = useRef(project.startAngle);

  const handlePlanetClick = (e: any) => {
    e.stopPropagation();
    focusProject(project.id);
  };

  const p = project.progress;
  const color = new THREE.Color(project.color);
  const phase = getPhase(p);

  // Surface patches (more with progress)
  const patches = useMemo(() => {
    const count = Math.floor(p * 10);
    return Array.from({ length: count }, (_, i) => {
      const phi = Math.acos(2 * ((i + 0.5) / Math.max(count, 1)) - 1);
      const theta = i * 2.4;
      return { phi, theta };
    });
  }, [p]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    timeRef.current = t;

    // Orbit
    angleRef.current += project.orbitSpeed * 0.008;
    const a = angleRef.current;
    ref.current.position.set(
      Math.cos(a) * project.orbitRadius,
      Math.sin(a * 0.3 + project.startAngle) * 1.2,
      Math.sin(a) * project.orbitRadius
    );

    // Planet rotation
    coreRef.current.rotation.y += 0.004;

    // Ring rotation
    if (ringRef.current) ringRef.current.rotation.z += 0.002;
  });

  return (
    <group ref={ref}>
      {/* Planet core */}
      <mesh ref={coreRef} onClick={handlePlanetClick}>
        <icosahedronGeometry args={[project.size, p < 0.2 ? 1 : 3]} />
        <meshStandardMaterial
          color={project.color}
          emissive={project.emissiveColor}
          emissiveIntensity={0.2 + p * 0.5}
          roughness={0.5}
          metalness={0.3}
          wireframe={p < 0.2}
          transparent
          opacity={p < 0.2 ? 0.3 : 0.9}
        />
      </mesh>

      {/* Atmosphere */}
      <mesh>
        <icosahedronGeometry args={[project.size * 1.12, 3]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.04 + p * 0.04} side={THREE.BackSide} />
      </mesh>

      {/* Surface features */}
      {patches.map((patch, i) => (
        <mesh key={i} position={[
          project.size * 0.92 * Math.sin(patch.phi) * Math.cos(patch.theta),
          project.size * 0.92 * Math.cos(patch.phi),
          project.size * 0.92 * Math.sin(patch.phi) * Math.sin(patch.theta),
        ]}>
          <icosahedronGeometry args={[project.size * 0.2, 0]} />
          <meshStandardMaterial
            color={color.clone().multiplyScalar(1.4)}
            emissive={project.emissiveColor}
            emissiveIntensity={0.5}
            transparent opacity={0.5}
          />
        </mesh>
      ))}

      {/* Saturn ring (50%+) */}
      {p >= 0.5 && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[project.size * 1.6, project.size * 2.3, 64]} />
          <meshBasicMaterial color={project.color} transparent opacity={0.06 + (p - 0.5) * 0.12} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Progress ring (equator) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[project.size * 1.08, 0.04, 8, 64, Math.PI * 2 * p]} />
        <meshBasicMaterial color={project.color} transparent opacity={0.5} />
      </mesh>

      {/* Selection indicator */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[project.size * 1.4, 0.03, 8, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Focus indicator */}
      {isFocused && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[project.size * 1.6, 0.05, 8, 64]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Satellites */}
      <SatelliteSystem project={project} />

      {/* Label */}
      <Html position={[0, project.size + 1.5, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handlePlanetClick}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', letterSpacing: '2px', color: project.color, textShadow: `0 0 10px ${project.color}50`, textTransform: 'uppercase' }}>
            {project.name}
          </div>
          <div style={{ width: '80px', height: '3px', background: `${project.color}15`, borderRadius: '2px', margin: '4px auto', overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: project.color, borderRadius: '2px' }} />
          </div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '9px', color: '#4a5a6a', letterSpacing: '1px' }}>
            {Math.round(p * 100)}% · {project.version}
          </div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: project.color, letterSpacing: '1px', marginTop: '2px', opacity: 0.7 }}>
            {PHASE_LABELS[phase]}
          </div>
        </div>
      </Html>
    </group>
  );
}

// Satellite system with energy beams
function SatelliteSystem({ project }: { project: Project }) {
  const groupRef = useRef<THREE.Group>(null!);
  const timeRef = useRef(0);

  useFrame(({ clock }) => {
    timeRef.current = clock.getElapsedTime();
  });

  const planetWorldPos = useMemo(() => new THREE.Vector3(), []);

  return (
    <group ref={groupRef}>
      {project.agents.map((agent, i) => (
        <SatelliteWithBeam
          key={agent.id}
          agent={agent}
          index={i}
          planetColor={project.color}
          planetSize={project.size}
        />
      ))}
    </group>
  );
}

function SatelliteWithBeam({ agent, index, planetColor, planetSize }: {
  agent: ProjectAgent; index: number; planetColor: string; planetSize: number;
}) {
  const satRef = useRef<THREE.Group>(null!);
  const beamRef = useRef<THREE.Group>(null!);
  const orbitR = planetSize * 2 + index * 1.5;
  const speed = 0.3 + index * 0.2;
  const offset = index * Math.PI * 0.7;
  const isActive = agent.state === 'active';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const a = t * speed + offset;

    satRef.current.position.set(
      Math.cos(a) * orbitR,
      Math.sin(a * 0.6) * 0.8,
      Math.sin(a) * orbitR
    );

    // Rotate sat
    satRef.current.children[0].rotation.y += 0.04;
    satRef.current.children[0].rotation.x += 0.02;
  });

  return (
    <>
      <group ref={satRef}>
        {/* Sat body */}
        <mesh>
          <octahedronGeometry args={[0.22, 1]} />
          <meshStandardMaterial
            color={isActive ? '#00ff88' : '#5a6a7a'}
            emissive={isActive ? '#00ff88' : '#5a6a7a'}
            emissiveIntensity={isActive ? 0.5 : 0.1}
            metalness={0.7} roughness={0.3}
          />
        </mesh>
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.35, 6, 6]} />
          <meshBasicMaterial color={isActive ? '#00ff88' : '#5a6a7a'} transparent opacity={isActive ? 0.1 : 0.03} />
        </mesh>
        {/* Panels */}
        {isActive && <>
          <mesh position={[-0.45, 0, 0]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshBasicMaterial color="#1a4a7a" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.45, 0, 0]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshBasicMaterial color="#1a4a7a" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </>}
        {/* Name */}
        <Html position={[0, 0.6, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '7px', color: isActive ? '#00ff88' : '#5a6a7a', whiteSpace: 'nowrap', textShadow: isActive ? '0 0 4px #00ff8840' : 'none' }}>
            {agent.name}
          </div>
        </Html>
      </group>

      {/* Energy beam to planet center (only active) */}
      {isActive && <AnimatedBeam satRef={satRef} color={planetColor} contribution={agent.contribution} offset={offset} />}
    </>
  );
}

function AnimatedBeam({ satRef, color, contribution, offset }: {
  satRef: React.RefObject<THREE.Group>; color: string; contribution: number; offset: number;
}) {
  const lineRef = useRef<any>(null);
  const particlesRef = useRef<THREE.Group>(null!);
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame(({ clock }) => {
    if (!satRef.current || !lineRef.current) return;
    const t = clock.getElapsedTime();
    const satPos = satRef.current.position;

    // Update line
    const positions = lineRef.current.geometry.attributes.position;
    if (positions) {
      positions.array[0] = satPos.x;
      positions.array[1] = satPos.y;
      positions.array[2] = satPos.z;
      positions.array[3] = 0;
      positions.array[4] = 0;
      positions.array[5] = 0;
      positions.needsUpdate = true;
    }

    // Update particles
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const frac = ((t * 1.5 + offset + i / 4) % 1);
        child.position.lerpVectors(satPos, origin, frac);
        (child as THREE.Mesh).material && ((child as any).material.opacity = 0.5 * (1 - frac) * contribution);
      });
    }
  });

  return (
    <group>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} array={new Float32Array(6)} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.06 + contribution * 0.06} />
      </line>
      <group ref={particlesRef}>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i}>
            <sphereGeometry args={[0.07, 4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ═══ SOLAR SYSTEM ═══
export function SolarSystem() {
  const projects = useStore(s => s.projects);

  return (
    <group>
      <Sun />
      {projects.map(p => (
        <group key={p.id}>
          <OrbitPath radius={p.orbitRadius} color={p.color} />
          <Planet project={p} />
        </group>
      ))}
    </group>
  );
}
