import React, { useState } from 'react';
import type { PlacedObject } from './WebARViewer';

export default function FloatingControls({
  activeObject,
  updateObject,
  onClose,
  onRemove,
  onShowShortcuts
}: {
  activeObject: PlacedObject;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  onClose: () => void;
  onRemove: () => void;
  onShowShortcuts: () => void;
}) {
  return (
    <>
      {/* Unified Right Toolbar */}
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '1.5rem',
        background: 'rgba(25,28,33,0.75)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '40px',
        padding: '1.2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem',
        zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.4)', width: '56px'
      }}>
        <TooltipButton 
          onClick={onClose} 
          title="Done (Esc)" 
          baseColor="#10b981" 
          hoverColor="#10b981" 
          scaleOnHover
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </TooltipButton>

        <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        <TooltipButton 
          onClick={() => updateObject(activeObject.instanceId, { matchLighting: !activeObject.matchLighting })} 
          title="Match Ambient Light (A)" 
          baseColor={activeObject.matchLighting ? '#fcd34d' : '#ccc'} 
          hoverColor={activeObject.matchLighting ? '#fcd34d' : '#fff'}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </TooltipButton>

        <TooltipButton 
          onClick={() => updateObject(activeObject.instanceId, { positionX: 0, positionY: 0, positionZ: -3, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 1.0, resetKey: (activeObject.resetKey || 0) + 1 })} 
          title="Reset All (R)" 
          baseColor="#ccc" 
          hoverColor="#fff"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
        </TooltipButton>

        <TooltipButton 
          onClick={onShowShortcuts} 
          title="Keyboard Shortcuts" 
          baseColor="#ccc" 
          hoverColor="#fff"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </TooltipButton>

        <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        <TooltipButton 
          onClick={onRemove} 
          title="Delete (Backspace)" 
          baseColor="#ef4444" 
          hoverColor="#ef4444" 
          scaleOnHover
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </TooltipButton>
      </div>
    </>
  );
}

function TooltipButton({ 
  onClick, 
  baseColor, 
  hoverColor, 
  scaleOnHover = false, 
  title, 
  children 
}: {
  onClick: () => void;
  baseColor: string;
  hoverColor: string;
  scaleOnHover?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        position: 'relative', background: 'transparent', border: 'none', 
        color: isHovered ? hoverColor : baseColor, cursor: 'pointer', padding: 0, 
        transition: 'all 0.2s', 
        transform: scaleOnHover && isHovered ? 'scale(1.1)' : 'scale(1)' 
      }}
    >
      {children}
      {isHovered && (
        <div style={{
          position: 'absolute', right: 'calc(100% + 18px)', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(25,28,33,0.9)', color: '#fff', padding: '6px 12px', borderRadius: '8px',
          fontSize: '0.75rem', whiteSpace: 'nowrap', pointerEvents: 'none', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)', fontWeight: '500', letterSpacing: '0.5px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          zIndex: 1000
        }}>
          {title}
        </div>
      )}
    </button>
  );
}
