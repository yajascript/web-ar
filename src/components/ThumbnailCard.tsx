import React from 'react';
import styles from '../app/page.module.css';

export default function ThumbnailCard({ isActive, onClick, name, imageSrc, modelSrc }: { isActive: boolean, onClick: () => void, name: string, imageSrc?: string, modelSrc?: string }) {
  return (
    <div className={`${styles.bgCard} ${isActive ? styles.activeCard : ''}`} onClick={onClick}>
      {imageSrc ? (
        <img src={imageSrc} alt={name} draggable={false} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', background: '#f3f4f6' }} />
      ) : (
        /* @ts-expect-error model-viewer is a custom web component */
        <model-viewer src={modelSrc} style={{ width: '100%', height: '100px', background: '#f3f4f6', borderRadius: '4px', pointerEvents: 'none' }} />
      )}
      <span style={{ fontSize: '0.65rem', textAlign: 'center', color: '#ccc', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{name}</span>
    </div>
  );
}
