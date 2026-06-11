import React, { useState, useRef, useEffect } from 'react';
import { useGLTF, useHelper } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlacedObject } from '../app/page';

export default function ModelRenderer({
  object,
  isSelected,
  onSelect,
  updateObject,
  interactionMode,
  ambientLightColor
}: {
  object: PlacedObject;
  isSelected: boolean;
  onSelect: () => void;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  interactionMode: 'move' | 'rotate' | 'scale';
  ambientLightColor?: string;
}) {
  const { scene } = useGLTF(object.src);

  // Create a deep clone of the scene so materials can be uniquely modified
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    clone.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        if (mesh.material) {
          // Clone the material so each instance has its own color state
          mesh.material = (mesh.material as THREE.Material).clone();
          const stdMat = mesh.material as THREE.MeshStandardMaterial;
          if (stdMat.color) {
            stdMat.userData.originalColor = stdMat.color.clone();
          }
        }
      }
    });
    return clone;
  }, [scene]);

  const [isRotating, setIsRotating] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef(new THREE.Vector3());
  const dragPlaneYRef = useRef(0);
  const { camera, gl } = useThree();

  // Use a BoxHelper when the object is selected
  // We type assertion to any because useHelper typings can be strict about Group vs Object3D
  useHelper(isSelected ? (groupRef as React.MutableRefObject<THREE.Object3D>) : null, THREE.BoxHelper, '#3b82f6');

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const stdMat = mesh.material as THREE.MeshStandardMaterial;
        if (stdMat && stdMat.userData.originalColor) {
          const original: THREE.Color = stdMat.userData.originalColor;
          if (object.matchLighting && ambientLightColor) {
            // Tint the original color with the ambient environment color
            stdMat.color.copy(original).multiply(new THREE.Color(ambientLightColor));
          } else {
            // Restore original un-tinted color
            stdMat.color.copy(original);
          }
        }
      }
    });
  }, [object.matchLighting, clonedScene, ambientLightColor]);



  useEffect(() => {
    if (groupRef.current && !isRotating) {
      groupRef.current.rotation.set(object.rotationX, object.rotationY, object.rotationZ);
    }
  }, [object.rotationX, object.rotationY, object.rotationZ, isRotating]);

  useEffect(() => {
    if (groupRef.current && !isScaling && !isRotating && !isMoving) {
      groupRef.current.position.set(object.positionX, object.positionY, object.positionZ);
      groupRef.current.scale.set(object.scale, object.scale, object.scale);
    }
  }, [object.positionX, object.positionY, object.positionZ, object.scale, isScaling, isRotating, isMoving]);

  // Handle global pointer moves for rotation and scaling to completely bypass R3F raycast lag
  useEffect(() => {
    if (!isRotating && !isScaling && !isMoving) return;

    const onPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - pointerRef.current.x;
      const deltaY = e.clientY - pointerRef.current.y;

      if (isRotating && groupRef.current) {
        pointerRef.current = { x: e.clientX, y: e.clientY };
        groupRef.current.rotation.y += deltaX * 0.01;
        groupRef.current.rotation.x += deltaY * 0.01;
      } else if (isScaling && groupRef.current) {
        pointerRef.current = { x: e.clientX, y: e.clientY };
        const scaleFactor = 1 - deltaY * 0.005;
        const newScale = Math.max(0.25, Math.min(3, groupRef.current.scale.x * scaleFactor));
        groupRef.current.scale.set(newScale, newScale, newScale);
        updateObject(object.instanceId, { scale: newScale });
      } else if (isMoving && groupRef.current) {
        const rect = gl.domElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        // Cast against the horizontal plane at the exact height the user clicked
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragPlaneYRef.current);
        const target = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, target)) {
          target.add(offsetRef.current);
          groupRef.current.position.x = target.x;
          groupRef.current.position.z = target.z;
        }
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
      if (isMoving) {
        setIsMoving(false);
        if (groupRef.current) {
          updateObject(object.instanceId, {
            positionX: groupRef.current.position.x,
            positionY: groupRef.current.position.y,
            positionZ: groupRef.current.position.z
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
  }, [isRotating, isScaling, isMoving, object.instanceId, updateObject, object.scale]);

  return (
    <group
      ref={groupRef}
      position={[object.positionX, object.positionY, object.positionZ]}
      scale={object.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onPointerDown={(e) => {
        e.stopPropagation(); // ALWAYS block raycast penetration! Only frontmost gets this!
        onSelect();
        if (interactionMode === 'rotate') {
          setIsRotating(true);
          pointerRef.current = { x: e.clientX, y: e.clientY };
        } else if (interactionMode === 'scale') {
          setIsScaling(true);
          pointerRef.current = { x: e.clientX, y: e.clientY };
        } else if (interactionMode === 'move') {
          setIsMoving(true);
          
          // The EXACT 3D point where the user clicked the mesh
          const hitPoint = e.intersections[0]?.point;
          if (hitPoint && groupRef.current) {
            dragPlaneYRef.current = hitPoint.y;
            offsetRef.current.copy(groupRef.current.position).sub(hitPoint);
          } else if (groupRef.current) {
            // Fallback if no intersection point (should never happen)
            dragPlaneYRef.current = 0;
            offsetRef.current.set(0,0,0);
          }
        }
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}
