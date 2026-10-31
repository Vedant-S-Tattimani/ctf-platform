import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface TiltedCardProps {
  children: React.ReactNode;
  className?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
}

export function TiltedCard({
  children,
  className,
  rotateAmplitude = 4,
  scaleOnHover = 1.01,
}: TiltedCardProps) {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const enabled = finePointer && !reduce;

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!enabled || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setRotation({ x: -y * rotateAmplitude * 2, y: x * rotateAmplitude * 2 });
  }

  return (
    <div className={cn('[perspective:1200px]', className)}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => {
          setHovered(false);
          setRotation({ x: 0, y: 0 });
        }}
        style={
          enabled && hovered
            ? {
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${scaleOnHover})`,
              }
            : undefined
        }
        className={cn(
          'h-full transition-transform duration-fast ease-decel',
          'motion-reduce:transition-none',
          enabled && 'will-change-transform',
        )}
      >
        {children}
      </div>
    </div>
  );
}
