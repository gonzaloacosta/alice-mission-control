import { useRef, useMemo, useEffect } from 'react';
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
        <meshBasicMaterial color="#9ece6a" wireframe transparent opacity={0.65} />
      </mesh>
      {/* Inner solid */}
      <mesh>
        <icosahedronGeometry args={[2.4, 3]} />
        <meshStandardMaterial color="#9ece6a" emissive="#9ece6a" emissiveIntensity={0.8} transparent opacity={0.3} />
      </mesh>
      {/* Glow */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[4, 2]} />
        <meshBasicMaterial color="#9ece6a" transparent opacity={0.05} />
      </mesh>
      {/* Corona */}
      <mesh ref={coronaRef}>
        <icosahedronGeometry args={[5, 1]} />
        <meshBasicMaterial color="#9ece6a" wireframe transparent opacity={0.03} />
      </mesh>
      {/* Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.04, 8, 64]} />
        <meshBasicMaterial color="#9ece6a" transparent opacity={0.12} />
      </mesh>
      {/* Lights */}
      <pointLight color="#9ece6a" intensity={3} distance={80} decay={2} />
      <pointLight color="var(--foreground)" intensity={0.5} distance={100} position={[0, 8, 0]} />
      {/* Label */}
      <Html position={[0, 6, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '10px', color: '#9ece6a', letterSpacing: '3px', textShadow: '0 0 10px rgba(158,206,106,0.35)', textAlign: 'center', opacity: 0.7 }}>
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

  return <Line points={points} color={color} transparent opacity={0.05} lineWidth={0.5} />;
}


// ═══ UNUSED COMPONENTS REMOVED FOR CLEAN BUILD ═══

function Planet({ project }: { project: Project }) {
  const ref = useRef<THREE.Group>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const focusProject = useStore(s => s.focusProject);
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

  // Expose projectId for CameraController to find us
  useEffect(() => {
    if (ref.current) {
      ref.current.userData.projectId = project.id;
    }
  }, [project.id]);

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
          <meshBasicMaterial color="var(--foreground)" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Focus indicator */}
      {isFocused && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[project.size * 1.6, 0.05, 8, 64]} />
          <meshBasicMaterial color="var(--cyan)" transparent opacity={0.6} />
        </mesh>
      )}

      {/* Satellites */}
      <SatelliteSystem project={project} />

      {/* Label */}
      <Html position={[0, project.size + 1.7, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            textAlign: 'center',
            minWidth: '92px',
            padding: '4px 6px',
            borderRadius: '8px',
            background: 'rgba(26,27,38,0.72)',
            border: '1px solid rgba(125,207,255,0.2)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={handlePlanetClick}
        >
          <div style={{ fontFamily: 'Geist, sans-serif', fontSize: 'clamp(8px, 2.5vw, 10px)', letterSpacing: '1.2px', fontWeight: 600, color: project.color, textShadow: `0 0 8px ${project.color}55`, textTransform: 'uppercase' }}>
            {project.name}
          </div>
          <div style={{ width: '100%', height: '3px', background: 'rgba(125,207,255,0.12)', borderRadius: '999px', margin: '4px auto', overflow: 'hidden' }}>
            <div style={{ width: `${p * 100}%`, height: '100%', background: project.color, borderRadius: '999px' }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(7px, 2vw, 9px)', color: 'var(--foreground)', letterSpacing: '0.5px' }}>
            {Math.round(p * 100)}% · {project.version}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(6px, 1.8vw, 8px)', color: 'var(--muted-foreground)', letterSpacing: '0.8px', marginTop: '2px' }}>
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

  // Removed unused planetWorldPos variable

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
  // Removed unused beamRef variable
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
            color={isActive ? 'var(--green)' : 'var(--muted-foreground)'}
            emissive={isActive ? 'var(--green)' : 'var(--muted-foreground)'}
            emissiveIntensity={isActive ? 0.5 : 0.1}
            metalness={0.7} roughness={0.3}
          />
        </mesh>
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[0.35, 6, 6]} />
          <meshBasicMaterial color={isActive ? 'var(--green)' : 'var(--muted-foreground)'} transparent opacity={isActive ? 0.1 : 0.03} />
        </mesh>
        {/* Panels */}
        {isActive && <>
          <mesh position={[-0.45, 0, 0]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshBasicMaterial color="var(--border)" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.45, 0, 0]}>
            <planeGeometry args={[0.35, 0.12]} />
            <meshBasicMaterial color="var(--border)" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </>}
        {/* Name */}
        <Html position={[0, 0.6, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '6px', color: isActive ? 'var(--green)' : 'var(--muted-foreground)', whiteSpace: 'nowrap', opacity: isActive ? 0.9 : 0.55, textShadow: isActive ? '0 0 4px color-mix(in srgb, var(--green) 25%, transparent)' : 'none' }}>
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
          <bufferAttribute attach="attributes-position" args={[new Float32Array(6), 3]} />
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
