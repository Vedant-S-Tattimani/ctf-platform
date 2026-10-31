import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedListEntry {
  id?: string | number;
  content: React.ReactNode;
}

export type AnimatedListItem = AnimatedListEntry | string;

interface AnimatedListProps {
  items: AnimatedListItem[];
  renderItem?: (item: AnimatedListItem, index: number) => React.ReactNode;
  label?: string;
  stagger?: number;
  className?: string;
  itemClassName?: string;
}

export function AnimatedList({
  items,
  renderItem,
  label,
  stagger = 0.04,
  className,
  itemClassName,
}: AnimatedListProps) {
  const reduce = useReducedMotion();

  return (
    <ul aria-label={label} className={cn('flex flex-col', className)}>
      {items.map((item, index) => {
        const normalized = typeof item === 'string' ? { id: index, content: item } : item;
        return (
          <motion.li
            key={normalized.id ?? index}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduce ? 0 : 0.35,
              delay: reduce ? 0 : Math.min(index * stagger, 0.3),
              ease: [0.16, 1, 0.3, 1],
            }}
            className={itemClassName}
          >
            {renderItem ? renderItem(item, index) : normalized.content}
          </motion.li>
        );
      })}
    </ul>
  );
}
