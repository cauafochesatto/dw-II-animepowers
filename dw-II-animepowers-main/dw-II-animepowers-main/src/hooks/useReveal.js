import { useEffect, useRef } from 'react';

/**
 * Revela elementos progressivamente ao entrarem na viewport.
 * Usa IntersectionObserver — sem dependências extras.
 * Respeita prefers-reduced-motion (o CSS desliga a animação).
 */
export function useReveal(options = {}) {
  const { threshold = 0.12, rootMargin = '0px 0px -8% 0px' } = options;
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const nodes = root.matches('[data-reveal]')
      ? [root]
      : Array.from(root.querySelectorAll('[data-reveal]'));

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { threshold, rootMargin }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return ref;
}
