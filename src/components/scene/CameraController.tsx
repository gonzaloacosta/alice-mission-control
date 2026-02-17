import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';

export function CameraController() {
  const { camera, scene } = useThree();
  const controlsRef = useRef<any>(null);
  const focusedProjectId = useStore(s => s.focusedProjectId);
  const projects = useStore(s => s.projects);
  
  const targetPosition = useRef(new THREE.Vector3(0, 35, 55));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const animating = useRef(false);
  const animationProgress = useRef(0);
  const tracking = useRef(false); // track planet continuously while focused

  const focusedProject = projects.find(p => p.id === focusedProjectId);

  useEffect(() => {
    if (!focusedProject) {
      targetPosition.current.set(0, 35, 55);
      targetLookAt.current.set(0, 0, 0);
      animating.current = true;
      tracking.current = false;
      animationProgress.current = 0;
    } else {
      animating.current = true;
      tracking.current = true;
      animationProgress.current = 0;
    }
  }, [focusedProjectId]);

  // Find the planet group in the scene by searching for userData.projectId
  const findPlanetPosition = (projectId: string): THREE.Vector3 | null => {
    let found: THREE.Vector3 | null = null;
    scene.traverse((obj) => {
      if ((obj as any).userData?.projectId === projectId) {
        found = new THREE.Vector3();
        obj.getWorldPosition(found);
      }
    });
    return found;
  };

  useFrame(() => {
    if (!controlsRef.current) return;

    // If tracking a focused planet, update target continuously
    if (tracking.current && focusedProjectId) {
      const planetPos = findPlanetPosition(focusedProjectId);
      if (planetPos) {
        const offset = new THREE.Vector3(8, 4, 8);
        targetPosition.current.copy(planetPos).add(offset);
        targetLookAt.current.copy(planetPos).add(new THREE.Vector3(0, -1, 0));
      }
    }

    if (animating.current || tracking.current) {
      if (animating.current) {
        const duration = 2.0;
        const deltaTime = 1/60;
        animationProgress.current += deltaTime / duration;
        
        if (animationProgress.current >= 1) {
          animationProgress.current = 1;
          animating.current = false;
        }
      }

      const lerpFactor = animating.current ? 0.06 : 0.03;

      camera.position.lerp(targetPosition.current, lerpFactor);

      const controls = controlsRef.current;
      controls.target.lerp(targetLookAt.current, lerpFactor);
      controls.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxDistance={140}
      minDistance={5}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={!focusedProjectId}
      autoRotateSpeed={0.15}
    />
  );
}
