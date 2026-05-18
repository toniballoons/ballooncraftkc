import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const focusMain = () => {
      const main = document.querySelector('[data-route-main="true"]');
      if (main instanceof HTMLElement) {
        main.focus();
      }
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(focusMain);
    } else {
      focusMain();
    }
  }, [pathname]);
  return null;
}
