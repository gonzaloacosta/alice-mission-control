import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { SolarSystem } from './SolarSystem';
import { Effects } from './Effects';
import { useStore } from '../../store';

export function Scene() {
  const selectProject = useStore(s => s.selectProject);

  return (
    <Canvas
      camera={{ position: [0, 35, 55], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => selectProject(null)}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#0a0a12']} />
      <fog attach="fog" args={['#0a0a12', 40, 150]} />
      <ambientLight intensity={0.12} color="#112244" />
      <Stars radius={180} depth={80} count={5000} factor={3} saturation={0.5} fade speed={0.3} />

      {/* Grid floor */}
      <gridHelper
        args={[200, 80, '#0a2a4a', '#0a1a2a']}
        position={[0, -6, 0]}
        // @ts-ignore
        material-transparent={true}
        // @ts-ignore
        material-opacity={0.12}
      />

      <SolarSystem />
      <Effects />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxDistance={140}
        minDistance={8}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.15}
      />
    </Canvas>
  );
}
