import React, { useState, useRef, useEffect } from 'react';
import { useGLTF, DragControls } from '@react-three/drei';
import * as THREE from 'three';
import { Select } from '@react-three/postprocessing';

const ModelRenderer = React.forwardRef(({
  url, scale, rotationX, rotationY, rotationZ, isSelected, setIsSelected,
  interactionMode, setRotationX, setRotationY
}: {
  url: string, scale: number, rotationX: number, rotationY: number, rotationZ: number, isSelected: boolean, setIsSelected: (s: boolean) => void,
  interactionMode: 'move' | 'rotate', setRotationX: (v: React.SetStateAction<number>) => void, setRotationY: (v: React.SetStateAction<number>) => void,
}, ref) => {
  const { scene } = useGLTF(url);
  const [isRotating, setIsRotating] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const groupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  React.useImperativeHandle(ref, () => ({
    reset: (mode: 'move' | 'rotate' | 'all') => {
      if (!groupRef.current) return;
      if (mode === 'move' || mode === 'all') {
        setResetKey(k => k + 1);
      }
      if (mode === 'rotate' || mode === 'all') {
        groupRef.current.rotation.set(0, 0, 0);
        setRotationX(0);
        setRotationY(0);
      }
    },
    nudge: (dx: number, dy: number, dz: number) => {
      if (groupRef.current) {
        groupRef.current.position.x += dx;
        groupRef.current.position.y += dy;
        groupRef.current.position.z += dz;
      }
    }
  }));

  useEffect(() => {
    if (groupRef.current && !isRotating) {
      groupRef.current.rotation.x = rotationX;
      groupRef.current.rotation.y = rotationY;
      groupRef.current.rotation.z = rotationZ;
    }
  }, [rotationX, rotationY, rotationZ, isRotating]);

  // Handle global pointer moves for rotation to completely bypass R3F raycast lag
  useEffect(() => {
    if (!isRotating) return;

    const onPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - pointerRef.current.x;
      const deltaY = e.clientY - pointerRef.current.y;
      pointerRef.current = { x: e.clientX, y: e.clientY };

      if (groupRef.current) {
        groupRef.current.rotation.y += deltaX * 0.01;
        groupRef.current.rotation.x += deltaY * 0.01;
      }
    };

    const onPointerUp = () => {
      setIsRotating(false);
      if (groupRef.current) {
        setRotationX(groupRef.current.rotation.x);
        setRotationY(groupRef.current.rotation.y);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isRotating, setRotationX, setRotationY]);

  return (
    <DragControls key={resetKey} axisLock="y" onDragStart={() => setIsSelected(true)}>
      <group
        ref={groupRef}
        position={[0, 0, -3]}
        scale={scale}
        onClick={(e) => { e.stopPropagation(); setIsSelected(true); }}
        onPointerDown={(e) => {
          if (interactionMode === 'rotate') {
            e.stopPropagation();
            setIsRotating(true);
            pointerRef.current = { x: e.clientX, y: e.clientY };
          }
        }}
      >
        <Select enabled={isSelected}>
          <primitive object={scene.clone()} />
        </Select>
      </group>
    </DragControls>
  );
});

ModelRenderer.displayName = 'ModelRenderer';

export default ModelRenderer;
