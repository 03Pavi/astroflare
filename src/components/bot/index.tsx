import React, { useEffect, useRef, useState, MouseEvent } from 'react';

/**
 * TYPES & INTERFACES
 */
interface DragPos {
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [botMessage, setBotMessage] = useState<string>("");
  const [currentGifIndex, setCurrentGifIndex] = useState<number>(0);
  
  // Drag and Drop State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [dragPos, setDragPos] = useState<DragPos>({ x: 0, y: 0 });
  const dragOffset = useRef<DragPos>({ x: 0, y: 0 });

  // Astronaut Idle GIFs
  const idleGifs: string[] = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzlhNDJsa21ncTNhMXp5aHB6NGtjcjBvMWZzbzE3Z3RwZzdqYWptdCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/QB6TUin7YO9HFdvA1z/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzlhNDJsa21ncTNhMXp5aHB6NGtjcjBvMWZzbzE3Z3RwZzdqYWptdCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/57ig8z1kaSdBEWz1QF/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzlhNDJsa21ncTNhMXp5aHB6NGtjcjBvMWZzbzE3Z3RwZzdqYWptdCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/YaICTrHyZm4KUPP9iN/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzlhNDJsa21ncTNhMXp5aHB6NGtjcjBvMWZzbzE3Z3RwZzdqYWptdCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/vIfU8hxWz7TsLsyGXN/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzlhNDJsa21ncTNhMXp5aHB6NGtjcjBvMWZzbzE3Z3RwZzdqYWptdCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/PxA3QjMzW3R40lwUaG/giphy.gif",
    "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTlieHR5dW85aTVzd2N0am4zaXl6eXIyYWtrejYyMHU4ZGZlMWM3MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MF8bULSzyzJgTm1QHx/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZXFhYzN5d3kyOWwwejZ6aDd0MWdrZ2g5NG56d3U2bmYzM3h4cmdycyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/e1Yo8YxOr0ezH1hj6j/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bzV3dDJwNnZ1bXZkcGEyNmxiZDBsdjRjMG5xMHJkdms1cDRwMWF2MCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/HepPYK1va5F2b5S5qQ/giphy.gif"
  ];

  const holdingGif: string = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzlhNDJsa21ncTNhMXp5aHB6NGtjcjBvMWZzbzE3Z3RwZzdqYWptdCZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/kYes5dD6EvhN0tRFtL/giphy.gif";
  const yawningGif: string = "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZXFhYzN5d3kyOWwwejZ6aDd0MWdrZ2g5NG56d3U2bmYzM3h4cmdycyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/5Vyl1cz2OzVvox6RNw/giphy.gif";

  // Cycle idle GIFs
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging && !isSleeping) {
        setCurrentGifIndex((prev) => (prev + 1) % idleGifs.length);
      }
    }, 4500); 
    return () => clearInterval(interval);
  }, [isDragging, isSleeping, idleGifs.length]);

  // Dragging interaction
  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      setDragPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };

    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setIsSleeping(true);
        setBotMessage("ZZZ...");
        setTimeout(() => {
          setIsSleeping(false);
          setBotMessage("");
        }, 5000);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setDragPos({ x: rect.left, y: rect.top });
    setIsDragging(true);
    setIsSleeping(false);
  };

  const getDynamicStyles = (): React.CSSProperties => {
    if (isDragging) {
      return {
        left: `${dragPos.x}px`,
        top: `${dragPos.y}px`,
        cursor: 'grabbing',
        transition: 'none'
      };
    }

    const time = Date.now() * 0.001;
    const bobAmp = isSleeping ? 10 : 20;
    
    return {
      right: `calc(3% + ${Math.sin(time * 0.4) * bobAmp}px)`,
      bottom: `calc(40px + ${Math.cos(time * 0.3) * (bobAmp / 2)}px)`,
      transform: `rotate(${Math.sin(time * 0.3) * 3}deg)`,
      cursor: 'grab',
      transition: 'all 0.6s ease-out'
    };
  };

  const getAstronautGif = () => {
    if (isDragging) return holdingGif;
    if (isSleeping) return yawningGif;
    return idleGifs[currentGifIndex];
  };

  return (
    <div className="app-container">
      <style>{`
        .app-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: transparent;
        }

        .astronaut-container {
          position: fixed;
          z-index: 9999;
          user-select: none;
          touch-action: none;
          width: 220px;
          height: 220px;
          pointer-events: auto;
          display: none; 
        }

        @media (min-width: 768px) {
          .astronaut-container {
            display: block;
          }
        }

        .astronaut-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.2));
        }

        .message-bubble {
          position: absolute;
          top: -1.5rem;
          right: 20%;
          background: rgba(0, 0, 0, 0.8);
          color: cyan;
          padding: 0.4rem 1rem;
          border-radius: 10px 10px 0 10px;
          font-size: 10px;
          font-family: monospace;
          letter-spacing: 0.1em;
          white-space: nowrap;
          pointer-events: none;
        }
      `}</style>

      <div 
        className={`astronaut-container ${isSleeping ? 'is-sleeping' : ''}`}
        onMouseDown={handleMouseDown}
        style={getDynamicStyles()}
      >
        <img 
          src={getAstronautGif()} 
          alt="Bot" 
          className="astronaut-img"
          draggable="false"
        />
        
        {botMessage && (
          <div className="message-bubble">
            {botMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;