import React, { useRef, useState, useEffect, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  keyExtractor: (item: T, index: number) => string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = '',
  keyExtractor
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  const totalHeight = items.length * itemHeight;

  const { visibleItems, startIndex, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 3);
    const visibleCount = Math.ceil(height / itemHeight) + 6;
    const end = Math.min(items.length, start + visibleCount);

    return {
      visibleItems: items.slice(start, end),
      startIndex: start,
      offsetY: start * itemHeight
    };
  }, [scrollTop, itemHeight, height, items]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height, overflowY: 'auto' }}
      className={`relative scrollbar-thin scrollbar-thumb-stone-700 ${className}`}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div key={keyExtractor(item, actualIndex)} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
