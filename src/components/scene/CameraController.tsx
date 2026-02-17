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

  // Get the focused project
  const focusedProject = projects.find(p => p.id === focusedProjectId);

  useEffect(() => {
    if (!focusedProject) {
      // Return to overview
      targetPosition.current.set(0, 35, 55);
      targetLookAt.current.set(0, 0, 0);
      animating.current = true;
      animationProgress.current = 0;
    } else {
      // Calculate planet position
      const project = focusedProject;
      const angle = project.startAngle + (Date.now() * 0.001) * project.orbitSpeed * 0.008;
      const planetPos = new THREE.Vector3(
        Math.cos(angle) * project.orbitRadius,
        Math.sin(angle * 0.3 + project.startAngle) * 1.2,
        Math.sin(angle) * project.orbitRadius
      );

      // Position camera to focus on planet
      const offset = new THREE.Vector3(15, 10, 15);
      targetPosition.current.copy(planetPos).add(offset);
      targetLookAt.current.copy(planetPos);
      
      animating.current = true;
      animationProgress.current = 0;
    }
  }, [focusedProjectId, focusedProject]);

  useFrame(() => {
    if (animating.current && controlsRef.current) {
      // Smooth animation using lerp
      const duration = 2.0; // 2 seconds
      const deltaTime = 1/60; // Assume 60fps for smooth animation
      
      animationProgress.current += deltaTime / duration;
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1;
        animating.current = false;
      }

      // Easing function (ease-in-out)
      const t = animationProgress.current;
      const easedT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      // Animate camera position
      camera.position.lerp(targetPosition.current, easedT * 0.1);

      // Animate camera target (what it's looking at)
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
      minDistance={8}
      maxPolarAngle={Math.PI / 2.1}
      autoRotate={!focusedProjectId} // Disable auto-rotate when focused
      autoRotateSpeed={0.15}
    />
  );
}