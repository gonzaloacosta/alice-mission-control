import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store';

export function CameraController() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const focusedProjectId = useStore(s => s.focusedProjectId);
  const projects = useStore(s => s.projects);
  
  const targetPosition = useRef(new THREE.Vector3(0, 35, 55));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const animating = useRef(false);
  const animationProgress = useRef(0);

  const focusedProject = projects.find(p => p.id === focusedProjectId);

  useEffect(() => {
    if (!focusedProject) {
      targetPosition.current.set(0, 35, 55);
      targetLookAt.current.set(0, 0, 0);
      animating.current = true;
      animationProgress.current = 0;
    } else {
      const project = focusedProject;
      const angle = project.startAngle + (Date.now() * 0.001) * project.orbitSpeed * 0.008;
      const planetPos = new THREE.Vector3(
        Math.cos(angle) * project.orbitRadius,
        Math.sin(angle * 0.3 + project.startAngle) * 1.2,
        Math.sin(angle) * project.orbitRadius
      );

      // Camera offset: closer + shifted down so planet appears in upper third
      // Looking slightly above the planet to push it up on screen
      const offset = new THREE.Vector3(8, 4, 8);
      targetPosition.current.copy(planetPos).add(offset);
      // Look at a point slightly below the planet — this pushes planet UP on screen
      targetLookAt.current.copy(planetPos).add(new THREE.Vector3(0, -2, 0));
      
      animating.current = true;
      animationProgress.current = 0;
    }
  }, [focusedProjectId, focusedProject]);

  useFrame(() => {
    if (animating.current && controlsRef.current) {
      const duration = 2.0;
      const deltaTime = 1/60;
      
      animationProgress.current += deltaTime / duration;
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        animating.current = false;
      }

      const t = animationProgress.current;
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      camera.position.lerp(targetPosition.current, easedT * 0.1);

      const controls = controlsRef.current;
      controls.target.lerp(targetLookAt.current, easedT * 0.1);
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
