import React from 'react';

export default function FloatingControls({
  modelScale,
  setModelScale,
  interactionMode,
  setInteractionMode,
  modelRef,
  setIsSelected
}: {
  modelScale: number;
  setModelScale: (scale: number) => void;
  interactionMode: 'move' | 'rotate';
  setInteractionMode: (mode: 'move' | 'rotate') => void;
  modelRef: React.RefObject<any>;
  setIsSelected: (selected: boolean) => void;
}) {
  return (
    <div style={{
      position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.2)', borderRadius: '40px',
      padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '2rem',
      zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', width: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: '400px' }}>
        <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>Size</span>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range" min="0.25" max="3" step="0.05" list="size-ticks"
            value={modelScale}
            onChange={(e) => setModelScale(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', margin: 0, position: 'relative', zIndex: 1 }}
          />
          <datalist id="size-ticks">
            <option value="0.25"></option>
            <option value="0.5"></option>
            <option value="0.75"></option>
            <option value="1"></option>
            <option value="1.5"></option>
            <option value="2"></option>
            <option value="2.5"></option>
            <option value="3"></option>
          </datalist>
          <div style={{ position: 'relative', height: '12px', marginTop: '2px' }}>
            <span style={{ position: 'absolute', left: '0%', transform: 'translateX(0)', fontSize: '0.65rem', color: '#888' }}>.25x</span>
            <span style={{ position: 'absolute', left: '9.09%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#888' }}>.5x</span>
            <span style={{ position: 'absolute', left: '27.27%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#888' }}>1x</span>
            <span style={{ position: 'absolute', left: '63.63%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#888' }}>2x</span>
            <span style={{ position: 'absolute', left: '100%', transform: 'translateX(-100%)', fontSize: '0.65rem', color: '#888' }}>3x</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', padding: '4px', width: '160px' }}>
        <div style={{
          position: 'absolute', top: '4px', bottom: '4px',
          left: interactionMode === 'move' ? '4px' : 'calc(50% + 2px)',
          width: 'calc(50% - 6px)',
          background: '#3b82f6', borderRadius: '16px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />

        <button
          onClick={() => setInteractionMode('move')}
          style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none', color: '#fff', borderRadius: '16px', padding: '0.4rem 0', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
        >
          Move
        </button>
        <button
          onClick={() => setInteractionMode('rotate')}
          style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 'none', color: '#fff', borderRadius: '16px', padding: '0.4rem 0', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
        >
          Rotate
        </button>
      </div>

      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />

      <button
        onClick={() => {
          if (interactionMode === 'move') {
            setModelScale(1.0);
          }
          modelRef.current?.reset(interactionMode);
        }}
        onDoubleClick={() => {
          setModelScale(1.0);
          modelRef.current?.reset('all');
        }}
        style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: '0 0.5rem' }}
        title="Click to reset active mode. Double-click to reset everything."
      >
        ↺
      </button>

      <button onClick={() => setIsSelected(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', padding: '0 0.5rem' }}>✕</button>
    </div>
  );
}
