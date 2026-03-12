import { useEffect, useRef, useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';

// ── Load model-viewer from CDN so its Three.js stays isolated ──
const SCRIPT_ID = 'model-viewer-script';
const CDN_URL =
  'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';

function useModelViewerScript() {
  const [ready, setReady] = useState(
    () =>
      typeof customElements !== 'undefined' &&
      customElements.get('model-viewer') !== undefined,
  );

  useEffect(() => {
    if (ready) return;
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => setReady(true);
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.type = 'module';
    script.src = CDN_URL;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [ready]);

  return ready;
}

// Detect mobile for lighter rendering settings
function useIsMobile() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 900);
  }, []);
}

const ModelViewer = 'model-viewer' as any;

export function BuildingViewer() {
  const modelRef = useRef<any>(null);
  const scriptReady = useModelViewerScript();
  const isMobile = useIsMobile();
  const setIsLoading = useStore((state) => state.setIsLoading);
  const setLoadingProgress = useStore((state) => state.setLoadingProgress);
  const setLoadingPhase = useStore((state) => state.setLoadingPhase);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Update loading phase when script becomes ready
  useEffect(() => {
    if (scriptReady) {
      setLoadingPhase('Rendering divine architecture…');
      setLoadingProgress(20);
    }
  }, [scriptReady, setLoadingPhase, setLoadingProgress]);

  // Wire up progress + load events — keep preloader until model is FULLY loaded
  useEffect(() => {
    if (!scriptReady) return;
    const mv = modelRef.current;
    if (!mv) return;

    const onProgress = (e: any) => {
      const rawPct = (e.detail.totalProgress ?? 0) * 100;
      // Map 0-100 model progress to 20-95 of overall progress
      const mappedPct = Math.round(20 + rawPct * 0.75);
      setLoadingProgress(mappedPct);

      if (rawPct < 30) {
        setLoadingPhase('Loading sacred textures…');
      } else if (rawPct < 60) {
        setLoadingPhase('Carving temple pillars…');
      } else if (rawPct < 85) {
        setLoadingPhase('Adorning with gold leaf…');
      } else {
        setLoadingPhase('Final blessings…');
      }
    };
    const onLoad = () => {
      setLoadingProgress(100);
      setLoadingPhase('Temple ready');
      setModelLoaded(true);
      // Dismiss preloader after a beat, then reveal model with transition
      setTimeout(() => {
        setIsLoading(false);
        // Stagger the reveal so users see the model appear after preloader fades
        requestAnimationFrame(() => setRevealed(true));
      }, 300);
    };

    mv.addEventListener('progress', onProgress);
    mv.addEventListener('load', onLoad);
    return () => {
      mv.removeEventListener('progress', onProgress);
      mv.removeEventListener('load', onLoad);
    };
  }, [scriptReady, setIsLoading, setLoadingProgress, setLoadingPhase]);

  // ── Render ──
  // While script isn't ready, render nothing visible — preloader covers everything
  if (!scriptReady) {
    return (
      <div className="relative w-full h-full"
        style={{ background: 'linear-gradient(to bottom, #1e3a5f, #0a1525)' }} />
    );
  }

  return (
    <div className="relative w-full h-full">
      <ModelViewer
        ref={modelRef}
        src="/models/ram%20mandir.glb"
        alt="3D Ram Mandir Temple"
        loading="eager"
        reveal="auto"
        camera-controls
        auto-rotate
        auto-rotate-delay={isMobile ? '2000' : '1000'}
        rotation-per-second={isMobile ? '15deg' : '20deg'}
        min-camera-orbit="auto auto 0.5m"
        max-camera-orbit="auto auto 100m"
        min-field-of-view="10deg"
        max-field-of-view="90deg"
        camera-orbit="45deg 55deg auto"
        camera-target="auto auto auto"
        interpolation-decay={isMobile ? '200' : '100'}
        shadow-intensity="0"
        touch-action="none"
        interaction-prompt="auto"
        interaction-prompt-style="wiggle"
        style={{
          width: isMobile ? '100%' : '65%',
          height: isMobile ? '65%' : '100%',
          background: 'transparent',
          '--poster-color': 'transparent',
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 1s cubic-bezier(0.4,0,0.2,1), transform 1.2s cubic-bezier(0.4,0,0.2,1)',
        } as any}
      />
    </div>
  );
}
