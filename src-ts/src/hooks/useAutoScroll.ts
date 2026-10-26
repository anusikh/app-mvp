import { useEffect, useRef } from 'react';

export const useAutoScroll = <T extends HTMLElement>(dependency: unknown) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.scrollTop = element.scrollHeight;
  }, [dependency]);

  return ref;
};
