import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

export default function ThumbnailRenderer({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<any>(null);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.5;
  });
  return <primitive ref={ref} object={scene.clone()} />;
}
