import { useEffect, useRef } from 'react';

const useAutoScroll = () => {
  const elementRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (elementRef.current) {
        elementRef.current.scrollTop = elementRef.current.scrollHeight;
      }
    };

    scrollToBottom();
  }, []);

  const handleScroll = () => {
    if (elementRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = elementRef.current;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (isScrolledToBottom) {
        setTimeout(() => {
          if (elementRef.current) {
            elementRef.current.scrollTop = elementRef.current.scrollHeight;
          }
        }, 0);
      }
    }
  };

  return { elementRef, handleScroll };
};

export default useAutoScroll;