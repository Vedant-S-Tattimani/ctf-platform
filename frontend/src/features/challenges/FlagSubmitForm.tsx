import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/store/toast';
import { useSubmitFlag } from './queries';

interface Feedback {
  tone: 'success' | 'info' | 'danger';
  title: string;
  detail?: string;
}

const feedbackTone: Record<Feedback['tone'], string> = {
  success: 'border-success bg-success-faint text-success',
  info: 'border-info bg-info-faint text-info',
  danger: 'border-danger bg-danger-faint text-danger',
};

export function FlagSubmitForm({ challengeId }: { challengeId: string }) {
  const { isAuthenticated } = useAuth();
  const submit = useSubmitFlag();
  const queryClient = useQueryClient();
  const controls = useAnimationControls();
  const inputId = useId();

  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const flag = value.trim();
    if (!flag || submit.isPending) return;

    try {
      const result = await submit.mutateAsync({ challengeId, flag });
      if (!result.correct) {
        setValue('');
        await controls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
        setFeedback({ tone: 'danger', title: 'That flag is not right', detail: result.message });
        return;
      }
      setValue('');
      setFeedback({
        tone: 'success',
        title: `Flag accepted${typeof result.points === 'number' ? ` · +${result.points} pts` : ''}`,
        detail: result.firstBlood
          ? 'You took first blood on this flag.'
          : (result.flagLabel ?? undefined),
      });
      toast.success(
        result.firstBlood ? 'First blood!' : 'Flag accepted',
        typeof result.points === 'number' ? `+${result.points} points` : undefined,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setValue('');
        queryClient.invalidateQueries({ queryKey: ['challenges'] });
        setFeedback({
          tone: 'info',
          title: 'Already solved',
          detail: 'This flag is already on your record.',
        });
        return;
      }
      await controls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
      setFeedback({ tone: 'danger', title: 'That flag is not right', detail: errorMessage(error) });
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-hairline bg-elevated p-4 type-small text-secondary">
        <Link to="/login" className="font-medium text-accent-strong hover:underline">
          Sign in
        </Link>{' '}
        to submit flags and put points on the board.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor={inputId} className="type-label text-secondary">
        Flag
      </label>
      <motion.div animate={controls} className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="YourCTF{...}"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="h-12 min-w-0 flex-1 rounded-md border border-subtle bg-elevated px-4 font-mono text-base text-primary placeholder:text-muted transition-colors duration-instant hover:border-strong focus:outline-none focus-visible:border-accent"
        />
        <Button type="submit" loading={submit.isPending} disabled={!value.trim()}>
          Submit flag
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {feedback && (
          <motion.div
            key={`${feedback.tone}-${feedback.title}`}
            role="status"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-lg border px-4 py-2.5 type-small ${feedbackTone[feedback.tone]}`}
          >
            <span className="font-semibold">{feedback.title}</span>
            {feedback.detail && <span className="ml-2 opacity-80">{feedback.detail}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
