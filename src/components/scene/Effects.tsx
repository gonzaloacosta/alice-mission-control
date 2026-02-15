import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { useStore } from '../../store';

export function Effects() {
  const quality = useStore(s => s.quality);

  if (quality === 'low') return null;

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette offset={0.3} darkness={0.65} />
    </EffectComposer>
  );
}
