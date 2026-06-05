import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        'camera-controls'?: string | boolean;
        'auto-rotate'?: string | boolean;
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
