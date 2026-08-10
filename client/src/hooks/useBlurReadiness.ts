import { useState, useEffect } from 'react';

const BLUR_PROBE_STYLE = `
  position: fixed;
  top: -100px;
  left: -100px;
  width: 10px;
  height: 10px;
  backdrop-filter: blur(1px);
  background: rgba(255,255,255,0.1);
  pointer-events: none;
  z-index: -1;
`;

export const useBlurReadiness = (initialDelay: number = 200) => {
  const [blurReady, setBlurReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let outerFrame = 0;
    let innerFrame = 0;
    let probe: HTMLDivElement | null = null;

    const removeProbe = () => {
      probe?.parentNode?.removeChild(probe);
      probe = null;
    };

    const timer = setTimeout(() => {
      if (cancelled) return;

      probe = document.createElement('div');
      probe.style.cssText = BLUR_PROBE_STYLE;
      document.body.appendChild(probe);

      outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(() => {
          removeProbe();
          if (cancelled) return;
          setBlurReady(true);
          setContentVisible(true);
        });
      });
    }, initialDelay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
      removeProbe();
    };
  }, [initialDelay]);

  return { blurReady, contentVisible };
};
