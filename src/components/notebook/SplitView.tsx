'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  layout?: 'vertical' | 'horizontal';
  defaultSplit?: number;
}

export default function SplitView({
  left,
  right,
  layout = 'horizontal',
  defaultSplit = 50,
}: SplitViewProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clampedSplit = Math.min(80, Math.max(20, split));

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent: number;
      if (layout === 'horizontal') {
        percent = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        percent = ((e.clientY - rect.top) / rect.height) * 100;
      }
      setSplit(percent);
    },
    [isDragging, layout]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleUp);
    return () => window.removeEventListener('pointerup', handleUp);
  }, []);

  const isHorizontal = layout === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex w-full h-full ${isHorizontal ? 'flex-row' : 'flex-col'} select-none overflow-hidden`}
      style={{ cursor: isDragging ? (isHorizontal ? 'col-resize' : 'row-resize') : undefined }}
    >
      <div
        className="overflow-auto"
        style={{
          [isHorizontal ? 'width' : 'height']: `${clampedSplit}%`,
        }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`
          flex-shrink-0 relative
          ${isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
          group
        `}
      >
        <div
          className={`
            absolute inset-0
            bg-neutral-200 dark:bg-neutral-700
            group-hover:bg-neutral-400 dark:group-hover:bg-neutral-500
            transition-colors duration-150
            ${isHorizontal ? '' : ''}
          `}
        />
        <div
          className={`
            absolute
            ${isHorizontal
              ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 rounded-full'
              : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-8 rounded-full'
            }
            border-2 border-neutral-300 dark:border-neutral-600
            group-hover:border-neutral-500 dark:group-hover:border-neutral-400
            transition-colors duration-150
            flex items-center justify-center
          `}
        >
          <div className={`${isHorizontal ? 'flex flex-col gap-0.5' : 'flex flex-row gap-0.5'}`}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`${isHorizontal ? 'w-0.5 h-0.5' : 'h-0.5 w-0.5'} rounded-full bg-neutral-400 dark:bg-neutral-500`}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="overflow-auto"
        style={{
          [isHorizontal ? 'width' : 'height']: `${100 - clampedSplit}%`,
        }}
      >
        {right}
      </div>
    </div>
  );
}
