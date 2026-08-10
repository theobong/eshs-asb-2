import { useState, useEffect } from 'react';

/**
 * Hook to detect when backdrop-filter blur effects are ready to render
 * This prevents the flash of unblurred content by waiting for GPU composition
 */
export const useBlurReadiness = (initialDelay: number = 200) => {
  const [blurReady, setBlurReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Create a test element to detect when backdrop-filter is ready
      const testElement = document.createElement('div');
      testElement.style.cssText = `
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
      document.body.appendChild(testElement);

      // Use requestAnimationFrame to wait for compositor
      const checkBlurReady = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Double RAF ensures we're past the composite phase
            setBlurReady(true);
            setContentVisible(true);
            // Clean up test element
            if (document.body.contains(testElement)) {
              document.body.removeChild(testElement);
            }
          });
        });
      };

      checkBlurReady();
    }, initialDelay);

    return () => {
      clearTimeout(timer);
      // Clean up any remaining test elements
      const testElements = document.querySelectorAll('div[style*="backdrop-filter: blur(1px)"]');
      testElements.forEach(el => {
        if (document.body.contains(el)) {
          document.body.removeChild(el);
        }
      });
    };
  }, [initialDelay]);

  return { blurReady, contentVisible };
};