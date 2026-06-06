'use client';

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF, Environment, DragControls } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Outline, Selection, Select } from '@react-three/postprocessing';
import styles from './page.module.css';
import ModelRenderer from '../components/ModelRenderer';
import ThumbnailCard from '../components/ThumbnailCard';
import FloatingControls from '../components/FloatingControls';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'camera-controls'?: boolean | string;
        'auto-rotate'?: boolean | string;
        'shadow-intensity'?: string | number;
        'shadow-softness'?: string | number;
        'ar-modes'?: string;
        'camera-orbit'?: string;
        'interaction-prompt'?: string;
        scale?: string;
      };
    }
  }
}
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
};

export default function SpatialPlayground(): React.JSX.Element {
  const [uploadedSceneUrl, setUploadedSceneUrl] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'move' | 'rotate' | 'scale'>('move');

  // Placed Objects State
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [clipboardData, setClipboardData] = useState<Partial<PlacedObject> | null>(null);

  const updateObject = (id: string, updates: Partial<PlacedObject>) => {
    setPlacedObjects(prev => prev.map(obj => obj.instanceId === id ? { ...obj, ...updates } : obj));
  };

  // Calibration State
  const [camY, setCamY] = useState(1.5);
  const [camPitch, setCamPitch] = useState(-15);
  const [camYaw, setCamYaw] = useState(0);
  const [camFov, setCamFov] = useState(65);

  // Dynamic Models State
  const [dynamicModels, setDynamicModels] = useState<any[]>([]);
  const [dynamicRooms, setDynamicRooms] = useState<any[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ id: string, name: string, src: string }[]>([]);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDynamicModels(data);
        }
      })
      .catch(err => console.error("Failed to load models", err));

    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDynamicRooms(data);
        }
      })
      .catch(err => console.error("Failed to load rooms", err));
  }, []);

  // Pinch-to-zoom Refs
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchScale = useRef<number>(1);
  const pinchLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pinchLayerRef.current;
    if (!el || !selectedObjectId) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setPlacedObjects(prev => prev.map(obj => {
        if (obj.instanceId !== selectedObjectId) return obj;
        return { ...obj, scale: Math.max(0.25, Math.min(3.0, obj.scale - e.deltaY * 0.005)) };
      }));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist.current = Math.hypot(dx, dy);
        const activeObj = placedObjects.find(o => o.instanceId === selectedObjectId);
        if (activeObj) initialPinchScale.current = activeObj.scale;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scaleFactor = dist / initialPinchDist.current;
        setPlacedObjects(prev => prev.map(obj => {
          if (obj.instanceId !== selectedObjectId) return obj;
          return { ...obj, scale: Math.max(0.25, Math.min(3.0, initialPinchScale.current * scaleFactor)) };
        }));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist.current = null;
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
  }, [selectedObjectId, placedObjects, interactionMode]);

  // Auto-calibrate when photo changes (mock AI guess)
  useEffect(() => {
    if (!uploadedSceneUrl) return;
    setCamY(1.5); // Average standing height (approx 1.5m / 5ft)
    setCamPitch(-15); // Looking slightly down into the room
    setCamFov(65); // Wide-angle phone camera default
  }, [uploadedSceneUrl]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          setInteractionMode('move');
          break;
        case 'r':
          setInteractionMode('rotate');
          break;
        case 's':
          setInteractionMode('scale');
          break;
        case 'c':
          if ((e.metaKey || e.ctrlKey) && selectedObjectId) {
            e.preventDefault();
            const activeObj = placedObjects.find(o => o.instanceId === selectedObjectId);
            if (activeObj) setClipboardData(activeObj);
          }
          break;
        case 'x':
          if ((e.metaKey || e.ctrlKey) && selectedObjectId) {
            e.preventDefault();
            const activeObj = placedObjects.find(o => o.instanceId === selectedObjectId);
            if (activeObj) {
              setClipboardData(activeObj);
              setPlacedObjects(prev => prev.filter(obj => obj.instanceId !== selectedObjectId));
              setSelectedObjectId(null);
            }
          }
          break;
        case 'v':
          if ((e.metaKey || e.ctrlKey) && clipboardData) {
            e.preventDefault();
            const newObj: PlacedObject = {
              ...clipboardData as PlacedObject,
              instanceId: Math.random().toString(36).substr(2, 9),
              positionX: clipboardData.positionX! + 0.5,
              positionZ: clipboardData.positionZ! + 0.5
            };
            setPlacedObjects(prev => [...prev, newObj]);
            setSelectedObjectId(newObj.instanceId);
          }
          break;
        case 'escape':
          setSelectedObjectId(null);
          break;
        case 'backspace':
        case 'delete':
          if (selectedObjectId) {
            setPlacedObjects(prev => prev.filter(obj => obj.instanceId !== selectedObjectId));
            setSelectedObjectId(null);
          }
          break;
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          if (!selectedObjectId) return;
          e.preventDefault();
          const activeObj = placedObjects.find(o => o.instanceId === selectedObjectId);
          if (!activeObj) return;

          if (interactionMode === 'rotate') {
            const step = 5 * (Math.PI / 180);
            if (e.key === 'ArrowUp') updateObject(selectedObjectId, { rotationX: activeObj.rotationX - step });
            if (e.key === 'ArrowDown') updateObject(selectedObjectId, { rotationX: activeObj.rotationX + step });
            if (e.key === 'ArrowLeft') updateObject(selectedObjectId, { rotationY: activeObj.rotationY - step });
            if (e.key === 'ArrowRight') updateObject(selectedObjectId, { rotationY: activeObj.rotationY + step });
          } else if (interactionMode === 'move') {
            const step = 0.1;
            if (e.key === 'ArrowUp') updateObject(selectedObjectId, { positionZ: activeObj.positionZ - step });
            if (e.key === 'ArrowDown') updateObject(selectedObjectId, { positionZ: activeObj.positionZ + step });
            if (e.key === 'ArrowLeft') updateObject(selectedObjectId, { positionX: activeObj.positionX - step });
            if (e.key === 'ArrowRight') updateObject(selectedObjectId, { positionX: activeObj.positionX + step });
          } else if (interactionMode === 'scale') {
            const step = 0.05;
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') updateObject(selectedObjectId, { scale: Math.min(3.0, activeObj.scale + step) });
            if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') updateObject(selectedObjectId, { scale: Math.max(0.25, activeObj.scale - step) });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, interactionMode, placedObjects, clipboardData]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedSceneUrl(url);
      setUploadedImages(prev => [...prev, { id: url, name: file.name.substring(0, 10), src: url }]);
    }
  };

  const handleExportPhoto = async () => {
    try {
      const bgImg = document.querySelector(`.${styles.bgImage}`) as HTMLImageElement;
      const webglCanvas = document.querySelector('canvas') as HTMLCanvasElement;
      
      if (!bgImg || !webglCanvas) return;

      const canvas = document.createElement('canvas');
      canvas.width = webglCanvas.width;
      canvas.height = webglCanvas.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background image using object-fit: contain logic
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

      // Draw WebGL canvas on top
      ctx.drawImage(webglCanvas, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `webar-export-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export photo.");
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <header className={styles.header}>
            <h1>Web AR</h1>
          </header>

          {/* Environment Section */}
          <div className={styles.sectionTitle}>Environment</div>
          <div className={styles.controlGroup}>
            <label className={styles.uploadBtn}>
              <div className={styles.uploadBtnIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <div className={styles.uploadBtnText}>
                <span className={styles.uploadBtnTitle}>Upload Image</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
            </label>
          </div>

          <div className={styles.bgGrid}>
            {[...uploadedImages, ...dynamicRooms].map(bg => (
              <ThumbnailCard
                key={bg.id}
                isActive={uploadedSceneUrl === bg.src}
                onClick={() => { setUploadedSceneUrl(bg.src); }}
                name={bg.name}
                imageSrc={bg.src}
              />
            ))}
          </div>


          <div className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Object</div>
          <div className={styles.bgGrid}>
            {dynamicModels.map(m => (
              <ThumbnailCard
                key={m.id}
                isActive={false}
                onClick={() => {
                  const newObj: PlacedObject = {
                    instanceId: Math.random().toString(36).substr(2, 9),
                    modelId: m.id,
                    src: m.src,
                    scale: 1.0,
                    rotationX: 0,
                    rotationY: 0,
                    rotationZ: 0,
                    positionX: 0,
                    positionY: 0,
                    positionZ: -3
                  };
                  setPlacedObjects(prev => [...prev, newObj]);
                  setSelectedObjectId(newObj.instanceId);
                }}
                name={m.name}
                modelSrc={m.src}
              />
            ))}
          </div>
        </aside>

        <section className={styles.viewport} style={{ position: 'relative' }}>
          {selectedObjectId && placedObjects.find(o => o.instanceId === selectedObjectId) && (
            <FloatingControls
              activeObject={placedObjects.find(o => o.instanceId === selectedObjectId)!}
              updateObject={updateObject}
              interactionMode={interactionMode}
              setInteractionMode={setInteractionMode}
              onClose={() => setSelectedObjectId(null)}
              onRemove={() => {
                setPlacedObjects(prev => prev.filter(obj => obj.instanceId !== selectedObjectId));
                setSelectedObjectId(null);
              }}
            />
          )}

          {uploadedSceneUrl ? (
            <div
              className={styles.canvasCompositeBridge}
              style={{ touchAction: 'none' }}
            >
              {placedObjects.length > 0 && (
                <button
                  onClick={handleExportPhoto}
                  style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white', padding: '0.6rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Save Photo
                </button>
              )}

              <img src={uploadedSceneUrl} alt="Background" className={styles.bgImage} draggable={false} />

              <div
                ref={pinchLayerRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
              >
                <Canvas gl={{ preserveDrawingBuffer: true }} onPointerMissed={() => setSelectedObjectId(null)}>
                  <PerspectiveCamera
                    makeDefault
                    position={[0, camY, 5]}
                    rotation={[camPitch * (Math.PI / 180), camYaw * (Math.PI / 180), 0]}
                    fov={camFov}
                  />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Environment preset="city" />

                  <Selection>
                    <EffectComposer autoClear={false}>
                      <Outline blur visibleEdgeColor={0x3b82f6} edgeStrength={1.5} width={1000} />
                    </EffectComposer>

                    {placedObjects.map(obj => (
                      <React.Suspense key={obj.instanceId} fallback={null}>
                        <ModelRenderer
                          object={obj}
                          isSelected={selectedObjectId === obj.instanceId}
                          onSelect={() => setSelectedObjectId(obj.instanceId)}
                          updateObject={updateObject}
                          interactionMode={interactionMode}
                        />
                      </React.Suspense>
                    ))}
                  </Selection>
                </Canvas>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h2>Step 1: Set the Scene</h2>
              <p>Upload a photo of your room or choose a template from the sidebar to get started.</p>
              <label className={styles.uploadBtn} style={{ marginTop: '1.5rem', width: 'auto', padding: '1rem 2rem', marginBottom: 0 }}>
                <div className={styles.uploadBtnIcon} style={{ width: '24px', height: '24px', background: 'transparent' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div className={styles.uploadBtnText}>
                  <span className={styles.uploadBtnTitle}>Upload Image</span>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
              </label>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
