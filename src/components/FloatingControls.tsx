import React from 'react';
import type { PlacedObject } from '../app/page';

export default function FloatingControls({
  activeObject,
  updateObject,
  interactionMode,
  setInteractionMode,
  onClose,
  onRemove
}: {
  activeObject: PlacedObject;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  interactionMode: 'move' | 'rotate' | 'scale';
  setInteractionMode: (mode: 'move' | 'rotate' | 'scale') => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  return (
    <>
      {/* Primary Interaction Bar (Bottom Center) */}
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '1.5rem', 
        position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', 
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', 
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px', 
        padding: '0.8rem 1.5rem', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: 'auto' 
      }}>
        {/* Mode Toggle */}
        <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '4px', width: '160px' }}>
          <div style={{
            position: 'absolute', top: '4px', bottom: '4px',
            left: interactionMode === 'move' ? '4px' : interactionMode === 'rotate' ? 'calc(50% + 2px)' : '4px', // default to move visually if scale is selected
            width: 'calc(50% - 6px)',
            background: '#3b82f6', borderRadius: '16px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          <button onClick={() => setInteractionMode('move')} style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none', color: '#fff', borderRadius: '16px', padding: '0.4rem 0', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Move</button>
          <button onClick={() => setInteractionMode('rotate')} style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none', color: '#fff', borderRadius: '16px', padding: '0.4rem 0', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Rotate</button>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Scale Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '250px' }}>
          <span style={{ color: '#ccc', fontSize: '0.8rem', fontWeight: 'bold' }}>Size</span>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="range" min="0.25" max="2" step="0.05"
              value={activeObject.scale}
              onChange={(e) => updateObject(activeObject.instanceId, { scale: parseFloat(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer', margin: 0, position: 'relative', zIndex: 1 }}
            />
          </div>
        </div>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

        {/* Done */}
        <button onClick={onClose} style={{ background: '#10b981', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold', padding: '0.5rem 1rem', borderRadius: '20px' }} title="Deselect">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Done
        </button>
      </div>

      {/* Secondary Actions Bar (Right Panel) */}
      <div style={{
        position: 'absolute', top: '2rem', right: '2rem',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px',
        padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem',
        zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: 'auto'
      }}>
        <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', opacity: 0.7 }}>Object Tools</div>
        
        <button onClick={() => updateObject(activeObject.instanceId, { positionX: 0, positionY: 0, positionZ: -3 })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', fontWeight: 500 }}>
          Reset Position
        </button>
        <button onClick={() => updateObject(activeObject.instanceId, { rotationX: 0, rotationY: 0, rotationZ: 0 })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', fontWeight: 500 }}>
          Reset Rotation
        </button>
        <button onClick={() => updateObject(activeObject.instanceId, { scale: 1.0 })} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', fontWeight: 500 }}>
          Reset Size
        </button>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', margin: '0.4rem 0' }} />

        <button onClick={onRemove} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Delete Object
        </button>

      </div>
    </>
  );
}
