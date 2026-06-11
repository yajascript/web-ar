'use client';

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, useGLTF, Environment, DragControls } from '@react-three/drei';
import * as THREE from 'three';
import styles from './page.module.css';
import ModelRenderer from '../components/ModelRenderer';
import ThumbnailCard from '../components/ThumbnailCard';
import FloatingControls from '../components/FloatingControls';


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

export default function SpatialPlayground(): React.JSX.Element {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [uploadedSceneUrl, setUploadedSceneUrl] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'move' | 'rotate' | 'scale'>('move');

  // Placed Objects State
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [clipboardData, setClipboardData] = useState<Partial<PlacedObject> | null>(null);

  // Lighting State
  const [ambientLightColor, setAmbientLightColor] = useState<string>('#ffffff');
  const [ambientLightIntensity, setAmbientLightIntensity] = useState<number>(0.5);
  
  // UI State
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const updateObject = (id: string, updates: Partial<PlacedObject>) => {
    setPlacedObjects(prev => prev.map(obj => obj.instanceId === id ? { ...obj, ...updates } : obj));
  };

  // Calibration State
  const [camY, setCamY] = useState(1.5);
  const [camPitch, setCamPitch] = useState(-15);
  const [camYaw, setCamYaw] = useState(0);
  const [camFov, setCamFov] = useState(65);

  const [isExporting, setIsExporting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Overlay State
  const [showModelsOverlay, setShowModelsOverlay] = useState(false);
  const [showRoomsOverlay, setShowRoomsOverlay] = useState(false);

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
          // Preload all models in the background so thumbnails render instantly
          data.forEach((m: any) => useGLTF.preload(m.src));
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

  // Auto-calibrate and Ambient Light Match when photo changes
  useEffect(() => {
    if (!uploadedSceneUrl) return;
    setCamY(1.5); // Average standing height (approx 1.5m / 5ft)
    setCamPitch(-15); // Looking slightly down into the room
    setCamFov(65); // Wide-angle phone camera default

    // Light Matching
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
      
      // Calculate brightness for intensity (perceived luminance)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      // Map brightness 0-255 to intensity 0.2 - 1.2
      setAmbientLightIntensity(Math.max(0.2, (brightness / 255) * 1.2));
    };
    img.src = uploadedSceneUrl;
  }, [uploadedSceneUrl]);
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
        setSelectedObjectId(null);
        return;
      }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'm':
          if (e.shiftKey && selectedObjectId) {
            const activeObj = placedObjects.find(o => o.instanceId === selectedObjectId);
            if (activeObj) {
              updateObject(selectedObjectId, { positionX: 0, positionY: 0, positionZ: -3, resetKey: (activeObj.resetKey || 0) + 1 });
            }
          } else {
            setInteractionMode('move');
          }
          break;
        case 'r':
          if (e.shiftKey && selectedObjectId) {
            updateObject(selectedObjectId, { rotationX: 0, rotationY: 0, rotationZ: 0 });
          } else {
            setInteractionMode('rotate');
          }
          break;
        case 's':
          if (e.shiftKey && selectedObjectId) {
            updateObject(selectedObjectId, { scale: 1.0 });
          } else {
            setInteractionMode('scale');
          }
          break;
        case 'a':
          if (selectedObjectId) {
            const activeObj = placedObjects.find(o => o.instanceId === selectedObjectId);
            if (activeObj) {
              updateObject(selectedObjectId, { matchLighting: !activeObj.matchLighting });
            }
          }
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
            setInteractionMode('move');
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
  }, [selectedObjectId, interactionMode, placedObjects, clipboardData, showShortcuts]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedSceneUrl(url);
      setUploadedImages(prev => [...prev, { id: url, name: file.name.substring(0, 10), src: url }]);
    }
  };

  const handleExportPhoto = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Slight delay to show UI

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
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.viewport} style={{ position: 'relative', padding: 0 }}>
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
              onShowShortcuts={() => setShowShortcuts(prev => !prev)}
            />
          )}





          {uploadedSceneUrl ? (
            <div
              className={styles.canvasCompositeBridge}
              style={{ touchAction: 'none' }}
            >
              {/* Shortcuts Modal */}
              {showShortcuts && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
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
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Move</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>M</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Rotate</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>R</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Scale</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>S</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reset Position</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Shift + M</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reset Rotation</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Shift + R</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Reset Scale</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Shift + S</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ambient Light</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>A</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delete Object</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Backspace</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Copy / Paste</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Cmd+C / Cmd+V</kbd></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Deselect</span><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd></div>
                    </div>
                  </div>
                </div>
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
                  
                  <ambientLight color="#ffffff" intensity={0.5} />
                  <directionalLight color="#ffffff" position={[5, 5, 5]} intensity={1} />
                  
                  <Environment resolution={128}>
                    <mesh scale={100}>
                      <sphereGeometry args={[1, 16, 16]} />
                      <meshBasicMaterial 
                        color="#ffffff" 
                        side={THREE.BackSide} 
                      />
                    </mesh>
                  </Environment>

                  {placedObjects.map(obj => (
                    <React.Suspense key={`${obj.instanceId}-${obj.resetKey || 0}`} fallback={null}>
                      <ModelRenderer
                          object={obj}
                          isSelected={selectedObjectId === obj.instanceId}
                          onSelect={() => {
                            if (selectedObjectId !== obj.instanceId) {
                              setSelectedObjectId(obj.instanceId);
                            }
                          }}
                          updateObject={updateObject}
                          interactionMode={interactionMode}
                          ambientLightColor={ambientLightColor}
                        />
                      </React.Suspense>
                    ))}
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
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Choose a Scene</h2>
              <p style={{ color: '#888', marginBottom: '2rem' }}>Upload a photo or select a preloaded environment below.</p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '3rem' }}>
                <label className={styles.uploadBtn} style={{ width: 'auto', padding: '1rem 2rem', margin: 0 }}>
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

              <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Or Start With a Preloaded Scene</h3>
                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {[...uploadedImages, ...dynamicRooms].map(bg => (
                    <ThumbnailCard
                      key={bg.id}
                      isActive={uploadedSceneUrl === bg.src}
                      onClick={() => setUploadedSceneUrl(bg.src)}
                      name={bg.name}
                      imageSrc={bg.src}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Center Header Bar */}
          {uploadedSceneUrl && (
            <div style={{ position: 'absolute', top: 'max(1.5rem, env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', background: 'rgba(25,28,33,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: isMobile ? '0.3rem' : '0.4rem', borderRadius: '40px', gap: isMobile ? '0.2rem' : '0.4rem', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', width: isMobile ? 'max-content' : 'auto' }}>
              <button onClick={() => setShowRoomsOverlay(true)} style={{ background: 'transparent', border: 'none', color: '#ccc', padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', fontSize: isMobile ? '0.8rem' : '1rem' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'transparent'; }}>
                <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                {isMobile ? 'Room' : 'Change Room'}
              </button>
              
              <button onClick={() => setShowModelsOverlay(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', fontSize: isMobile ? '0.8rem' : '1rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}>
                <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Object
              </button>

              {selectedObjectId && (
                <>
                  <div style={{ width: '1px', height: isMobile ? '16px' : '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.2rem' }} />
                  <button onClick={() => setSelectedObjectId(null)} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', fontSize: isMobile ? '0.8rem' : '1rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; }}>
                    <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Done
                  </button>
                </>
              )}

              {placedObjects.length > 0 && !selectedObjectId && (
                <>
                  <div style={{ width: '1px', height: isMobile ? '16px' : '24px', background: 'rgba(255,255,255,0.1)', margin: '0 0.2rem' }} />
                  <button onClick={handleExportPhoto} disabled={isExporting} style={{ background: 'transparent', border: 'none', color: '#ccc', padding: isMobile ? '0.4rem 0.8rem' : '0.6rem 1.2rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s', fontSize: isMobile ? '0.8rem' : '1rem' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'transparent'; }}>
                    <svg width={isMobile ? "14" : "18"} height={isMobile ? "14" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                    Export
                  </button>
                </>
              )}
            </div>
          )}

          {/* Models Overlay Lightbox */}
          {showModelsOverlay && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowModelsOverlay(false); }}>
              <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Choose an Object</h2>
                  <button onClick={() => setShowModelsOverlay(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                    {dynamicModels.map(m => (
                      <ThumbnailCard
                        key={m.id}
                        disabled={!uploadedSceneUrl}
                        isActive={false}
                        onClick={() => {
                          if (!uploadedSceneUrl) return;
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
                            positionZ: -3,
                            matchLighting: false
                          };
                          setPlacedObjects(prev => [...prev, newObj]);
                          setSelectedObjectId(newObj.instanceId);
                          setInteractionMode('move');
                          setShowModelsOverlay(false); // Close modal on select
                        }}
                        name={m.name}
                        modelSrc={m.src}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rooms Overlay Lightbox */}
          {showRoomsOverlay && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowRoomsOverlay(false); }}>
              <div style={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', width: '90%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Choose an Environment</h2>
                  <button onClick={() => setShowRoomsOverlay(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                
                <div style={{ padding: '2rem', overflowY: 'auto' }}>
                  <div style={{ marginBottom: '2rem' }}>
                    <label className={styles.uploadBtn} style={{ width: 'max-content', padding: '1rem 2rem' }}>
                      <div className={styles.uploadBtnIcon} style={{ width: '24px', height: '24px', background: 'transparent' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </div>
                      <div className={styles.uploadBtnText}>
                        <span className={styles.uploadBtnTitle}>Upload Custom Image</span>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => { handleFileUpload(e); setShowRoomsOverlay(false); }} hidden />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                    {[...uploadedImages, ...dynamicRooms].map(bg => (
                      <ThumbnailCard
                        key={bg.id}
                        isActive={uploadedSceneUrl === bg.src}
                        onClick={() => { setUploadedSceneUrl(bg.src); setShowRoomsOverlay(false); }}
                        name={bg.name}
                        imageSrc={bg.src}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
