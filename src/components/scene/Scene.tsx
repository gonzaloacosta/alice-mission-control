import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { SolarSystem } from './SolarSystem';
import { Effects } from './Effects';
import { CameraController } from './CameraController';
import { useStore } from '../../store';

export function Scene() {
  const selectProject = useStore(s => s.selectProject);

  return (
    <Canvas
      camera={{ position: [0, 35, 55], fov: 50, near: 0.1, far: 500 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => selectProject(null)}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#1a1b26']} />
      <fog attach="fog" args={['#1a1b26', 40, 150]} />
      <ambientLight intensity={0.12} color="#24283b" />
      <Stars radius={180} depth={80} count={5000} factor={3} saturation={0.5} fade speed={0.3} />

      {/* Grid floor */}
      <gridHelper
        args={[200, 80, "#292e42", "#1a1b26"]}
        position={[0, -6, 0]}
        // @ts-ignore
        material-transparent={true}
        // @ts-ignore
        material-opacity={0.12}
      />

      <SolarSystem />
      <Effects />
      <CameraController />
    </Canvas>
  );
}
