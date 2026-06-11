'use client';

import React, { useState, ChangeEvent, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import styles from './page.module.css';
import ThumbnailCard from '../components/ThumbnailCard';
import WebARViewer from '../components/WebARViewer';

export default function SpatialPlayground(): React.JSX.Element {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const [uploadedSceneUrl, setUploadedSceneUrl] = useState<string | null>(null);
  const [selectedModelSrc, setSelectedModelSrc] = useState<string | undefined>(undefined);

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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedSceneUrl(url);
      setUploadedImages(prev => [...prev, { id: url, name: file.name.substring(0, 10), src: url }]);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.viewport} style={{ position: 'relative', padding: 0 }}>

          {uploadedSceneUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

              <WebARViewer
                backgroundImageUrl={uploadedSceneUrl}
                modelUrl={selectedModelSrc}
              />

              {/* Top Navigation Bar */}
              <div style={{ position: 'absolute', top: 'max(1.5rem, env(safe-area-inset-top))', left: '1.5rem', display: 'flex', alignItems: 'center', background: 'rgba(25,28,33,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '40px', gap: '4px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                <button onClick={() => setShowRoomsOverlay(true)} style={{ background: 'transparent', border: 'none', color: '#ccc', padding: '0.6rem 1.2rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem', letterSpacing: '0.5px' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'transparent'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Room
                </button>
                <button onClick={() => setShowModelsOverlay(true)} style={{ background: 'transparent', border: 'none', color: '#ccc', padding: '0.6rem 1.2rem', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', fontSize: '0.9rem', letterSpacing: '0.5px' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.background = 'transparent'; }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Model
                </button>
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
                        isActive={selectedModelSrc === m.src}
                        onClick={() => {
                          if (!uploadedSceneUrl) return;
                          setSelectedModelSrc(m.src);
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
