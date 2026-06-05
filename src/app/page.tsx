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

export default function SpatialPlayground(): React.JSX.Element {
  const [uploadedSceneUrl, setUploadedSceneUrl] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'move' | 'rotate'>('move');

  // Model Transform State
  const [modelScale, setModelScale] = useState(1.0);
  const [modelRotationX, setModelRotationX] = useState(0);
  const [modelRotationY, setModelRotationY] = useState(0);
  const [modelRotationZ, setModelRotationZ] = useState(0);

  // Calibration State
  const [camY, setCamY] = useState(1.5);
  const [camPitch, setCamPitch] = useState(-15);
  const [camYaw, setCamYaw] = useState(0);
  const [camFov, setCamFov] = useState(65);

  const modelRef = useRef<{ reset: (mode: string) => void, nudge: (dx: number, dy: number, dz: number) => void }>(null);

  // Dynamic Models State
  const [dynamicModels, setDynamicModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [dynamicRooms, setDynamicRooms] = useState<any[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{ id: string, name: string, src: string }[]>([]);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setDynamicModels(data);
          setSelectedModel(data[0]);
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
    initialPinchScale.current = modelScale;
  }, [modelScale]);

  useEffect(() => {
    const el = pinchLayerRef.current;
    if (!el || !isSelected) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setModelScale(prev => Math.max(0.25, Math.min(3.0, prev - e.deltaY * 0.005)));
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const scaleFactor = dist / initialPinchDist.current;
        setModelScale(Math.max(0.25, Math.min(3.0, initialPinchScale.current * scaleFactor)));
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
  }, [isSelected]);

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
        case 'escape':
          setIsSelected(false);
          break;
        case 'backspace':
        case 'delete':
          if (isSelected) {
            setSelectedModel(null);
            setIsSelected(false);
          }
          break;
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          if (!isSelected) return;
          e.preventDefault();
          if (interactionMode === 'rotate') {
            const step = 5 * (Math.PI / 180);
            if (e.key === 'ArrowUp') setModelRotationX(r => r - step);
            if (e.key === 'ArrowDown') setModelRotationX(r => r + step);
            if (e.key === 'ArrowLeft') setModelRotationY(r => r - step);
            if (e.key === 'ArrowRight') setModelRotationY(r => r + step);
          } else if (interactionMode === 'move') {
            const step = 0.1;
            if (e.key === 'ArrowUp') modelRef.current?.nudge(0, 0, -step);
            if (e.key === 'ArrowDown') modelRef.current?.nudge(0, 0, step);
            if (e.key === 'ArrowLeft') modelRef.current?.nudge(-step, 0, 0);
            if (e.key === 'ArrowRight') modelRef.current?.nudge(step, 0, 0);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, interactionMode]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedSceneUrl(url);
      setUploadedImages(prev => [...prev, { id: url, name: file.name.substring(0, 10), src: url }]);
      setIsSelected(true);
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
                onClick={() => { setUploadedSceneUrl(bg.src); setIsSelected(true); }}
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
                isActive={selectedModel?.id === m.id}
                onClick={() => setSelectedModel(m)}
                name={m.name}
                modelSrc={m.src}
              />
            ))}
          </div>
        </aside>

        <section className={styles.viewport} style={{ position: 'relative' }}>
          {isSelected && (
            <FloatingControls
              modelScale={modelScale}
              setModelScale={setModelScale}
              interactionMode={interactionMode}
              setInteractionMode={setInteractionMode}
              modelRef={modelRef}
              setIsSelected={setIsSelected}
            />
          )}

          {uploadedSceneUrl ? (
            <div
              className={styles.canvasCompositeBridge}
              style={{ touchAction: 'none' }}
            >
              <img src={uploadedSceneUrl} alt="Background" className={styles.bgImage} draggable={false} />

              <div
                ref={pinchLayerRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
              >
                <Canvas onPointerMissed={() => setIsSelected(false)}>
                  <PerspectiveCamera
                    makeDefault
                    position={[0, camY, 5]}
                    rotation={[camPitch * (Math.PI / 180), camYaw * (Math.PI / 180), 0]}
                    fov={camFov}
                  />
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[10, 10, 5]} intensity={1} />
                  <Environment preset="apartment" />

                  <Selection>
                    <EffectComposer autoClear={false}>
                      <Outline blur visibleEdgeColor={0x3b82f6} edgeStrength={1.5} width={1000} />
                    </EffectComposer>

                    <React.Suspense fallback={null}>
                      {selectedModel && (
                        <ModelRenderer
                          ref={modelRef}
                          url={selectedModel.src}
                          scale={modelScale}
                          rotationX={modelRotationX}
                          rotationY={modelRotationY}
                          rotationZ={modelRotationZ}
                          isSelected={isSelected}
                          setIsSelected={setIsSelected}
                          interactionMode={interactionMode}
                          setRotationX={setModelRotationX}
                          setRotationY={setModelRotationY}
                        />
                      )}
                    </React.Suspense>
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
