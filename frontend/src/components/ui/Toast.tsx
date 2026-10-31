import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/lib/icons';
import { useToastStore, type ToastVariant } from '@/store/toast';
import { cn } from '@/lib/utils';

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <Icon name="check" size={18} />,
  error: <Icon name="warning" size={18} />,
  info: <Icon name="info" size={18} />,
};

const toneClasses: Record<ToastVariant, string> = {
  success: 'border-success text-success',
  error: 'border-danger text-danger',
  info: 'border-info text-info',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end md:bottom-6"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-elevated p-4 shadow-panel',
              toneClasses[t.variant],
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.variant]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-primary">{t.title}</p>
              {t.description && <p className="type-small text-secondary">{t.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="-m-2 grid size-11 shrink-0 place-items-center rounded-sm text-muted transition-colors duration-instant hover:bg-surface hover:text-primary"
            >
              <Icon name="close" size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
