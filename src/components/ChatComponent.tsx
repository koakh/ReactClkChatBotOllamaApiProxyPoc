import React, { useEffect, useState } from 'react';
import useAutoScroll from '../hooks/useAutoScrollTextArea';

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const { elementRef, handleScroll } = useAutoScroll();

  useEffect(() => {
    // Simulate receiving messages from a stream
    const simulateStream = () => {
      const newMessage = `New message ${messages.length + 1}`;
      setMessages(prev => [...prev, newMessage]);
      handleScroll();
    };

    // Simulate receiving a new message every 2 seconds
    const intervalId = setInterval(simulateStream, 500);

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, [messages.length, handleScroll]);

  return (
    <div>
      <textarea
        ref={elementRef}
        value={messages.join('\n')}
        readOnly
        style={{ width: '300px', height: '200px' }}
      />
    </div>
  );
};

export default ChatComponent;