import { useEffect } from 'react';
/** Keep focused fields and final rows clear of fixed navigation, including large text. */
export function useLayoutBounds(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const header = document.querySelector<HTMLElement>('.topbar');
    const nav = header?.querySelector('nav');
    if (!header || !nav) return;
    const update = () => {
      const root = document.documentElement;
      root.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
      root.style.setProperty('--bottom-nav-height', `${getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().height : 0}px`);
    };
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(header); observer.observe(nav); update();
    return () => observer.disconnect();
  }, [ready]);
}
