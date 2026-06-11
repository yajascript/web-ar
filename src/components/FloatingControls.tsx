import React from 'react';
import type { PlacedObject } from '../app/page';

export default function FloatingControls({
  activeObject,
  updateObject,
  interactionMode,
  setInteractionMode,
  onClose,
  onRemove,
  onShowShortcuts
}: {
  activeObject: PlacedObject;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  interactionMode: 'move' | 'rotate' | 'scale';
  setInteractionMode: (mode: 'move' | 'rotate' | 'scale') => void;
  onClose: () => void;
  onRemove: () => void;
  onShowShortcuts: () => void;
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {/* Bottom Action Bar */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
        position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', 
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', 
        padding: '0.6rem 0.8rem', zIndex: 100, 
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: isMobile ? '240px' : '300px',
      }}>
        {/* Mode Toggle */}
        <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '4px', flex: 1 }}>
          <div style={{
            position: 'absolute', top: '4px', bottom: '4px',
            left: interactionMode === 'move' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 6px)',
            background: '#3b82f6', borderRadius: '16px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          <button onClick={() => setInteractionMode('move')} style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none', color: '#fff', borderRadius: '16px', padding: '0.6rem 0', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>MOVE</button>
          <button onClick={() => setInteractionMode('rotate')} style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none', color: '#fff', borderRadius: '16px', padding: '0.6rem 0', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>ROTATE</button>
        </div>
      </div>

      {/* Unified Right Toolbar */}
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '1.5rem',
        background: 'rgba(25,28,33,0.7)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '40px',
        padding: '1rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
        zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', width: '56px'
      }}>
        {/* Ambient Light Toggle */}
        <button 
          onClick={() => updateObject(activeObject.instanceId, { matchLighting: !activeObject.matchLighting })}
          style={{ background: 'transparent', border: 'none', color: activeObject.matchLighting ? '#fcd34d' : '#ccc', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={(e) => { if (!activeObject.matchLighting) e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { if (!activeObject.matchLighting) e.currentTarget.style.color = '#ccc'; }}
          title="Toggle Ambient Light"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        </button>

        {/* Reset Position & Rotation */}
        <button 
          onClick={() => updateObject(activeObject.instanceId, { positionX: 0, positionY: 0, positionZ: -3, rotationX: 0, rotationY: 0, rotationZ: 0, resetKey: (activeObject.resetKey || 0) + 1 })}
          style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
          title="Reset Position & Rotation"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
        </button>

        {/* Keyboard Shortcuts */}
        <button 
          onClick={onShowShortcuts}
          style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#ccc'}
          title="Keyboard Shortcuts"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </button>

        {/* Delete Button */}
        <button 
          onClick={onRemove} 
          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Delete Object"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>

        <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

        {/* Scale Slider Pill (Vertical) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', height: '180px' }}>
          <span 
            onClick={() => updateObject(activeObject.instanceId, { scale: 1.0 })}
            style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}
            title="Reset Scale"
          >
            {activeObject.scale.toFixed(1)}x
          </span>
          <div style={{ flex: 1, position: 'relative', width: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', width: '100px', height: '4px',
              transform: 'translate(-50%, -50%) rotate(-90deg)', pointerEvents: 'none', zIndex: 10
            }}>
              <div style={{ position: 'absolute', left: '27.27%', top: '-3px', width: '2px', height: '10px', background: 'rgba(255,255,255,0.8)', borderRadius: '1px' }} />
            </div>

            <input
              type="range" min="0.25" max="3" step="any"
              value={activeObject.scale}
              onChange={(e) => {
                let val = parseFloat(e.target.value);
                if (Math.abs(val - 1.0) < 0.1) val = 1.0;
                updateObject(activeObject.instanceId, { scale: val });
              }}
              style={{ 
                position: 'absolute',
                width: '100px', cursor: 'pointer', margin: 0, height: '4px', 
                accentColor: '#fff', background: 'rgba(255,255,255,0.2)', 
                borderRadius: '2px', outline: 'none',
                transform: 'rotate(-90deg)', transformOrigin: 'center'
              }}
            />
          </div>
          <span style={{ color: '#888', fontSize: '0.6rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Scale</span>
        </div>
      </div>
    </>
  );
}
