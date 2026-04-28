import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'inherit',
});

interface MermaidProps {
  chart: string;
}

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      mermaid.contentLoaded();
      // To force re-render if chart changes
      containerRef.current.removeAttribute('data-processed');
      mermaid.init(undefined, containerRef.current);
    }
  }, [chart]);

  return (
    <div className="mermaid flex justify-center items-center" ref={containerRef}>
      {chart}
    </div>
  );
};
