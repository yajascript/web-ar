import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export default function ThumbnailRenderer({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  
  // Clone the scene and scale/center it perfectly
  const processedScene = useMemo(() => {
    const clone = scene.clone();
    
    // Compute bounding box
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Scale model so its max dimension is 3
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 3 / maxDim : 1;
    clone.scale.setScalar(scale);
    
    // Center it
    clone.position.sub(center.multiplyScalar(scale));
    
    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={processedScene} />
    </group>
  );
}
