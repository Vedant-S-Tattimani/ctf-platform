import { useId, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: TabItem[];
  className?: string;
  panelClassName?: string;
}

export function Tabs({ label, value, onChange, items, className, panelClassName }: TabsProps) {
  const rawId = useId();
  const baseId = rawId.replace(/:/g, '');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = items.find((item) => item.value === value);

  function move(from: number, direction: 1 | -1) {
    const enabled = items.filter((item) => !item.disabled);
    if (enabled.length === 0) return;
    const currentValue = items[from]?.value;
    const currentEnabled = enabled.findIndex((item) => item.value === currentValue);
    const next =
      enabled[
        ((currentEnabled === -1 ? 0 : currentEnabled) + direction + enabled.length) % enabled.length
      ];
    if (!next) return;
    onChange(next.value);
    tabRefs.current[next.value]?.focus();
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex flex-wrap gap-1 border-b border-hairline"
      >
        {items.map((item, index) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[item.value] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={item.content !== undefined ? `${baseId}-panel-${item.value}` : undefined}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  move(index, 1);
                } else if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  move(index, -1);
                } else if (event.key === 'Home') {
                  event.preventDefault();
                  const first = items.findIndex((entry) => !entry.disabled);
                  if (first >= 0) {
                    onChange(items[first]!.value);
                    tabRefs.current[items[first]!.value]?.focus();
                  }
                } else if (event.key === 'End') {
                  event.preventDefault();
                  const last = [...items].reverse().find((entry) => !entry.disabled);
                  if (last) {
                    onChange(last.value);
                    tabRefs.current[last.value]?.focus();
                  }
                }
              }}
              className={cn(
                '-mb-px min-h-11 rounded-t-sm border-b-2 px-3 text-small font-medium transition-colors duration-instant',
                selected
                  ? 'border-accent text-primary'
                  : 'border-transparent text-secondary hover:text-primary',
                'disabled:pointer-events-none disabled:opacity-40',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {active?.content !== undefined && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.value}`}
          aria-labelledby={`${baseId}-tab-${active.value}`}
          tabIndex={0}
          className={cn('pt-6 focus-visible:outline-offset-4', panelClassName)}
        >
          <motion.div
            key={active.value}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {active.content}
          </motion.div>
        </div>
      )}
    </div>
  );
}
