import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import styles from '../app/page.module.css';
import ModelRenderer from './ModelRenderer';
import FloatingControls from './FloatingControls';

export type PlacedObject = {
  instanceId: string;
  modelId: string;
  src: string;
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  matchLighting?: boolean;
  resetKey?: number;
};

interface WebARViewerProps {
  backgroundImageUrl: string;
  modelUrl?: string;
}

export default function WebARViewer({ backgroundImageUrl, modelUrl }: WebARViewerProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [activeObject, setActiveObject] = useState<PlacedObject | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Lighting State
  const [ambientLightColor, setAmbientLightColor] = useState<string>('#ffffff');
  const [ambientLightIntensity, setAmbientLightIntensity] = useState<number>(0.5);

  // Calibration State
  const camY = 1.5;
  const camPitch = -15;
  const camYaw = 0;
  const camFov = 65;

  // Sync modelUrl to activeObject
  useEffect(() => {
    if (modelUrl) {
      setActiveObject({
        instanceId: 'single-model-instance',
        modelId: 'single-model',
        src: modelUrl,
        scale: 1.0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        positionX: 0,
        positionY: 0,
        positionZ: -3,
        matchLighting: false
      });
      setIsSelected(true);
    } else {
      setActiveObject(null);
      setIsSelected(false);
    }
  }, [modelUrl]);

  const updateObject = (id: string, updates: Partial<PlacedObject>) => {
    setActiveObject(prev => prev ? { ...prev, ...updates } : null);
  };

  // Pinch-to-zoom and twist-to-rotate Refs
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchAngle = useRef<number | null>(null);
  const initialPinchScale = useRef<number>(1);
  const initialPinchRotY = useRef<number>(0);
  const pinchLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pinchLayerRef.current;
    if (!el || !activeObject || !isSelected) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setActiveObject(prev => prev ? { ...prev, scale: Math.max(0.25, Math.min(3.0, prev.scale - e.deltaY * 0.005)) } : null);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist.current = Math.hypot(dx, dy);
        initialPinchAngle.current = Math.atan2(dy, dx);
        if (activeObject) {
          initialPinchScale.current = activeObject.scale;
          initialPinchRotY.current = activeObject.rotationY;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist.current && initialPinchAngle.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        const scaleFactor = dist / initialPinchDist.current;
        const angleDiff = angle - initialPinchAngle.current;
        
        setActiveObject(prev => prev ? { 
          ...prev, 
          scale: Math.max(0.25, Math.min(3.0, initialPinchScale.current * scaleFactor)),
          rotationY: initialPinchRotY.current + angleDiff
        } : null);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist.current = null;
        initialPinchAngle.current = null;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeObject, isSelected]);

  // Lighting matcher
  useEffect(() => {
    if (!backgroundImageUrl) return;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 64; 
      canvas.height = 64;
      ctx.drawImage(img, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i+1];
        b += data[i+2];
      }
      const count = data.length / 4;
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      
      const hex = '#' + [r, g, b].map(x => {
        const hexStr = x.toString(16);
        return hexStr.length === 1 ? '0' + hexStr : hexStr;
      }).join('');
      
      setAmbientLightColor(hex);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      setAmbientLightIntensity(Math.max(0.2, (brightness / 255) * 1.2));
    };
    img.src = backgroundImageUrl;
  }, [backgroundImageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the shortcuts modal is open, Esc should close it and we ignore other keys
      if (showShortcuts) {
        if (e.key === 'Escape') {
          setShowShortcuts(false);
        }
        return;
      }

      if (e.key === 'Escape') {
        setIsSelected(false);
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'r':
          if (activeObject) {
            updateObject(activeObject.instanceId, { 
              positionX: 0, positionY: 0, positionZ: -3, 
              rotationX: 0, rotationY: 0, rotationZ: 0, 
              scale: 1.0, 
              resetKey: (activeObject.resetKey || 0) + 1 
            });
          }
          break;
        case 'a':
          if (activeObject) {
            updateObject(activeObject.instanceId, { matchLighting: !activeObject.matchLighting });
          }
          break;
        case 'escape':
          setIsSelected(false);
          break;
        case 'backspace':
        case 'delete':
          setActiveObject(null);
          break;
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          if (!activeObject || !isSelected) return;
          e.preventDefault();

          if (e.shiftKey) {
            // Rotate
            const step = 5 * (Math.PI / 180);
            if (e.key === 'ArrowUp') updateObject(activeObject.instanceId, { rotationX: activeObject.rotationX - step });
            if (e.key === 'ArrowDown') updateObject(activeObject.instanceId, { rotationX: activeObject.rotationX + step });
            if (e.key === 'ArrowLeft') updateObject(activeObject.instanceId, { rotationY: activeObject.rotationY - step });
            if (e.key === 'ArrowRight') updateObject(activeObject.instanceId, { rotationY: activeObject.rotationY + step });
          } else {
            // Move
            const step = 0.1;
            if (e.key === 'ArrowUp') updateObject(activeObject.instanceId, { positionZ: activeObject.positionZ - step });
            if (e.key === 'ArrowDown') updateObject(activeObject.instanceId, { positionZ: activeObject.positionZ + step });
            if (e.key === 'ArrowLeft') updateObject(activeObject.instanceId, { positionX: activeObject.positionX - step });
            if (e.key === 'ArrowRight') updateObject(activeObject.instanceId, { positionX: activeObject.positionX + step });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeObject, isSelected, showShortcuts]);

  const handleExportPhoto = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      // We need to reliably grab the image and the canvas rendered within this component
      const container = pinchLayerRef.current?.parentElement;
      if (!container) return;

      const bgImg = container.querySelector('img') as HTMLImageElement;
      const webglCanvas = container.querySelector('canvas') as HTMLCanvasElement;

      if (!bgImg || !webglCanvas) return;

      const canvas = document.createElement('canvas');
      canvas.width = webglCanvas.width;
      canvas.height = webglCanvas.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const imgRatio = bgImg.naturalWidth / bgImg.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
      ctx.drawImage(webglCanvas, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'webar-room-export.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.canvasCompositeBridge} style={{ touchAction: 'none' }}>
      
      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1a1a1a', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
            width: '320px', color: 'white', position: 'relative'
          }}>
            <button onClick={() => setShowShortcuts(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>Keyboard Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Move Object</span><span style={{ color: '#aaa', fontSize: '0.75rem' }}>Left-Click + Drag</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Rotate Object</span><span style={{ color: '#aaa', fontSize: '0.7rem', textAlign: 'right' }}>Right-Click + Drag<br/>(or Shift+Left-Click)</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scale Object</span><span style={{ color: '#aaa', fontSize: '0.75rem' }}>Scroll Wheel</span></div>
              <hr style={{ borderColor: 'rgba(255,255,255,0.1)', width: '100%', margin: '0.2rem 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Reset All</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>R</kbd></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Ambient Light</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>A</kbd></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>Deselect</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd></div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Controls Overlay */}
      {activeObject && isSelected && (
        <FloatingControls
          activeObject={activeObject}
          updateObject={updateObject}
          onClose={() => setIsSelected(false)}
          onRemove={() => setActiveObject(null)}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
      )}



      {/* Exporting Loading Indicator (Top Center) */}
      {isExporting && (
        <div style={{ position: 'absolute', top: 'max(1.5rem, env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', background: 'rgba(25,28,33,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 1.2rem', borderRadius: '40px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>Exporting...</span>
        </div>
      )}

      {/* Floating Export Button (Bottom Right) */}
      {activeObject && !isSelected && !isExporting && (
        <button 
          onClick={handleExportPhoto} 
          style={{ 
            position: 'absolute', bottom: '2rem', right: '2rem',
            background: 'rgba(25,28,33,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', 
            color: '#fff', padding: '1rem', borderRadius: '50%', cursor: 'pointer', zIndex: 100, 
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Export Scene"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
        </button>
      )}

      <img src={backgroundImageUrl} alt="Background" className={styles.bgImage} draggable={false} />

      <div
        ref={pinchLayerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Canvas gl={{ preserveDrawingBuffer: true }} onPointerMissed={(e) => { if (e.button === 0) setIsSelected(false); }}>
          <PerspectiveCamera
            makeDefault
            position={[0, camY, 5]}
            rotation={[camPitch * (Math.PI / 180), camYaw * (Math.PI / 180), 0]}
            fov={camFov}
          />
          
          <ambientLight color="#ffffff" intensity={0.5} />
          <directionalLight color="#ffffff" position={[5, 5, 5]} intensity={1} />
          
          <Environment resolution={128}>
            <mesh scale={100}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="#ffffff" side={THREE.BackSide} />
            </mesh>
          </Environment>

          {activeObject && (
            <React.Suspense fallback={null}>
              <ModelRenderer
                object={activeObject}
                isSelected={isSelected}
                onSelect={() => setIsSelected(true)}
                updateObject={updateObject}
                ambientLightColor={ambientLightColor}
              />
            </React.Suspense>
          )}
        </Canvas>
      </div>
    </div>
  );
}
