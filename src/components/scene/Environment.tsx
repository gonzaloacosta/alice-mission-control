import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';

export function Environment() {
  const gridRef = useRef<THREE.GridHelper>(null!);

  return (
    <>
      {/* Fog */}
      <fog attach="fog" args={['#1a1b26', 30, 120]} />

      {/* Ambient */}
      <ambientLight intensity={0.15} color="#24283b" />

      {/* Stars */}
      <Stars radius={150} depth={80} count={4000} factor={3} saturation={0.5} fade speed={0.5} />

      {/* Grid */}
      <gridHelper
        ref={gridRef}
        args={[120, 60, "#292e42", "#1a1b26"]}
        position={[0, -5, 0]}
        // @ts-ignore
        material-transparent={true}
        // @ts-ignore
        material-opacity={0.15}
      />

      {/* Core beacon light */}
      <pointLight position={[0, 2, 0]} color="#7dcfff" intensity={3} distance={60} decay={2} />
      <pointLight position={[0, 10, 0]} color="#c0caf5" intensity={0.3} distance={80} />
    </>
  );
}

export function CoreBeacon() {
  const ref = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y += 0.003;
    ref.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    glowRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.12);
    ringRef.current.rotation.z += 0.002;
  });

  return (
    <group position={[0, 2, 0]}>
      {/* Core */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[2, 3]} />
        <meshBasicMaterial color="#7dcfff" wireframe transparent opacity={0.7} />
      </mesh>

      {/* Glow */}
      <mesh ref={glowRef}>
        <icosahedronGeometry args={[2.8, 2]} />
        <meshBasicMaterial color="#7dcfff" transparent opacity={0.06} />
      </mesh>

      {/* Corona ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.04, 8, 64]} />
        <meshBasicMaterial color="#7dcfff" transparent opacity={0.15} />
      </mesh>

      {/* Label */}
      <mesh position={[0, 3.5, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.01, 0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
