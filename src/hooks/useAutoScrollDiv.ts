import { useRef, useEffect } from 'react';

const useAutoScrollDiv = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (elementRef.current) {
      elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  return { elementRef, scrollToBottom };
};

export default useAutoScrollDiv;