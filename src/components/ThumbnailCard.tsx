import React from 'react';
import { Canvas } from '@react-three/fiber';
import ThumbnailRenderer from './ThumbnailRenderer';
import styles from '../app/page.module.css';

export default function ThumbnailCard({ isActive, onClick, name, imageSrc, modelSrc, disabled }: { isActive: boolean, onClick: () => void, name: string, imageSrc?: string, modelSrc?: string, disabled?: boolean }) {
  return (
    <div className={`${styles.bgCard} ${isActive ? styles.activeCard : ''}`} onClick={() => {
        if (!disabled) onClick();
      }}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={name} draggable={false} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', background: '#f3f4f6' }} />
      ) : (
        <div style={{ width: '100%', height: '100px', background: '#f3f4f6', borderRadius: '4px', pointerEvents: 'none', overflow: 'hidden' }}>
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 50 }} 
            dpr={1} 
            gl={{ antialias: false, powerPreference: 'low-power' }}
          >
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={1.5} />
            <React.Suspense fallback={null}>
              {modelSrc && <ThumbnailRenderer url={modelSrc} />}
            </React.Suspense>
          </Canvas>
        </div>
      )}
      <span style={{ fontSize: '0.65rem', textAlign: 'center', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{name}</span>
    </div>
  );
}
