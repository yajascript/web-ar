import React, { useState, useRef, useEffect } from 'react';
import { useGLTF, DragControls } from '@react-three/drei';
import * as THREE from 'three';
import { Select } from '@react-three/postprocessing';
import type { PlacedObject } from '../app/page';

export default function ModelRenderer({
  object,
  isSelected,
  onSelect,
  updateObject,
  interactionMode
}: {
  object: PlacedObject;
  isSelected: boolean;
  onSelect: () => void;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  interactionMode: 'move' | 'rotate' | 'scale';
}) {
  const { scene } = useGLTF(object.src);
  const [isRotating, setIsRotating] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (groupRef.current && !isRotating) {
      groupRef.current.rotation.set(object.rotationX, object.rotationY, object.rotationZ);
    }
  }, [object.rotationX, object.rotationY, object.rotationZ, isRotating]);

  // Handle global pointer moves for rotation and scaling to completely bypass R3F raycast lag
  useEffect(() => {
    if (!isRotating && !isScaling) return;

    const onPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - pointerRef.current.x;
      const deltaY = e.clientY - pointerRef.current.y;
      pointerRef.current = { x: e.clientX, y: e.clientY };

      if (isRotating && groupRef.current) {
        groupRef.current.rotation.y += deltaX * 0.01;
        groupRef.current.rotation.x += deltaY * 0.01;
      } else if (isScaling && groupRef.current) {
        const scaleFactor = 1 - deltaY * 0.005;
        const newScale = Math.max(0.1, Math.min(10, object.scale * scaleFactor));
        groupRef.current.scale.set(newScale, newScale, newScale);
      }
    };

    const onPointerUp = () => {
      if (isRotating) {
        setIsRotating(false);
        if (groupRef.current) {
          updateObject(object.instanceId, {
            rotationX: groupRef.current.rotation.x,
            rotationY: groupRef.current.rotation.y
          });
        }
      }
      if (isScaling) {
        setIsScaling(false);
        if (groupRef.current) {
          updateObject(object.instanceId, {
            scale: groupRef.current.scale.x
          });
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isRotating, isScaling, object.instanceId, updateObject, object.scale]);

  return (
    <DragControls 
      axisLock="y" 
      onDragStart={() => onSelect()}
      onDragEnd={() => {
        if (groupRef.current) {
           updateObject(object.instanceId, {
            positionX: groupRef.current.position.x,
            positionY: groupRef.current.position.y,
            positionZ: groupRef.current.position.z
          });
        }
      }}
    >
      <group
        ref={groupRef}
        position={[object.positionX, object.positionY, object.positionZ]}
        scale={object.scale}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerDown={(e) => {
          if (interactionMode === 'rotate') {
            e.stopPropagation();
            setIsRotating(true);
            pointerRef.current = { x: e.clientX, y: e.clientY };
          } else if (interactionMode === 'scale') {
            e.stopPropagation();
            setIsScaling(true);
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
}
