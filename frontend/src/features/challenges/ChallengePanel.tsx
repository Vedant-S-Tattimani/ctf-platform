import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ApiError } from '@/api/client';
import type { ChallengeDetail, ChallengeFile, PublicHint } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Progress } from '@/components/ui/Progress';
import { Skeleton } from '@/components/ui/Skeleton';
import { FlagSubmitForm } from '@/features/challenges/FlagSubmitForm';
import { useChallenge, useUnlockHint } from '@/features/challenges/queries';
import { useAuth } from '@/hooks/useAuth';
import { errorMessage } from '@/lib/errors';
import {
  difficultyLabel,
  difficultyTone,
  formatBytes,
  formatCount,
  formatPoints,
  isHttpUrl,
} from '@/lib/format';
import { Icon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';

interface ChallengePanelProps {
  challengeId: string;
}

export function ChallengePanel({ challengeId }: ChallengePanelProps) {
  const { data, isPending, isError, error, refetch } = useChallenge(challengeId);
  const [searchParams] = useSearchParams();

  const backTo = { pathname: '/challenges', search: searchParams.toString() };
  const backLink = (
    <Link
      to={backTo}
      className="inline-flex w-fit items-center gap-1.5 type-small text-secondary transition-colors duration-instant hover:text-primary lg:hidden"
    >
      <Icon name="arrow-left" size={15} />
      All challenges
    </Link>
  );

  if (isPending) {
    return (
      <article className="flex flex-col gap-5 pt-2" aria-busy="true">
        {backLink}
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-full" />
        <span className="sr-only">Loading challenge…</span>
      </article>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="flex flex-col gap-4 pt-2">
          {backLink}
          <EmptyState
            title="That challenge is not on the board"
            description="It may have been unpublished by the organizers, or the link is wrong."
            action={
              <Link to={backTo} className="type-small font-medium text-accent-strong hover:underline">
                Back to all challenges
              </Link>
            }
          />
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 pt-2">
        {backLink}
        <ErrorState
          title="Could not load this challenge"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data?.challenge) return null;

  return (
    <article className="flex flex-col gap-8 pb-4 pt-2">
      {backLink}
      <motion.div
        key={data.challenge.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-8"
      >
        <ChallengeBody challenge={data.challenge} />
      </motion.div>
    </article>
  );
}

function ChallengeBody({ challenge }: { challenge: ChallengeDetail }) {
  const hintsId = useId();
  const targetsId = useId();
  const filesId = useId();
  const submitId = useId();
  const mobileTitleRef = useRef<HTMLHeadingElement>(null);
  const desktopTitleRef = useRef<HTMLHeadingElement>(null);
  const location = useLocation();
  const fromBoard = Boolean((location.state as { fromBoard?: boolean } | null)?.fromBoard);

  useEffect(() => {
    if (!fromBoard) return;
    const target = mobileTitleRef.current?.offsetParent
      ? mobileTitleRef.current
      : desktopTitleRef.current;
    target?.focus();
  }, [challenge.id, fromBoard]);

  const flagsSolved = challenge.flags.filter((flag) => flag.solvedByMe).length;
  const allSolved = challenge.flags.length > 0 && flagsSolved === challenge.flags.length;
  const multiFlag = challenge.flags.length > 1;

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-hairline pb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 type-small text-secondary">
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 rounded-pill"
              style={{ backgroundColor: challenge.category.color ?? 'var(--accent)' }}
            />
            {challenge.category.name}
          </span>
          <Badge tone={difficultyTone(challenge.difficulty)}>
            {difficultyLabel(challenge.difficulty)}
          </Badge>
          <span className="nums font-mono font-semibold text-accent-strong">
            {formatPoints(challenge.currentPoints)} pts
          </span>
          <span className="text-muted">{formatCount(challenge.solveCount, 'solve')}</span>
          {challenge.solvedByMe && <Badge tone="success">Solved</Badge>}
          {challenge.firstBloodByMe && <Badge tone="accent">First blood by you</Badge>}
        </div>

        <h1
          ref={mobileTitleRef}
          tabIndex={-1}
          className="type-h1 text-primary outline-none lg:hidden"
        >
          {challenge.title}
        </h1>
        <h2
          ref={desktopTitleRef}
          tabIndex={-1}
          className="hidden type-h1 text-primary outline-none lg:block"
        >
          {challenge.title}
        </h2>

        {multiFlag && (
          <Progress
            value={flagsSolved}
            max={challenge.flags.length}
            label="Flags captured"
            hint={
              allSolved
                ? 'Every target on this challenge is on your record.'
                : `${challenge.flags.length - flagsSolved} still open`
            }
            className="max-w-sm"
          />
        )}
      </header>

      <p className="max-w-measure whitespace-pre-line text-[1.0625rem] leading-relaxed text-secondary">
        {challenge.description}
      </p>

      {multiFlag && (
        <section aria-labelledby={targetsId} className="flex flex-col gap-3">
          <h2 id={targetsId} className="type-h3 text-primary">
            Targets
          </h2>
          <ul className="max-w-3xl overflow-hidden rounded-lg border border-hairline bg-surface shadow-soft">
            {challenge.flags.map((flag, index) => (
              <li
                key={flag.id}
                className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 type-small last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-pill border',
                      flag.solvedByMe
                        ? 'border-success bg-success-faint text-success'
                        : 'border-subtle text-muted',
                    )}
                  >
                    {flag.solvedByMe ? (
                      <Icon name="check" size={12} />
                    ) : (
                      <span className="size-1.5 rounded-pill bg-current" />
                    )}
                  </span>
                  <span className="truncate text-primary">{flag.label ?? `Flag ${index + 1}`}</span>
                  <span className="nums font-mono text-muted">{flag.currentPoints} pts</span>
                </span>
                {flag.solvedByMe ? (
                  <Badge tone="success">{flag.firstBlood ? 'First blood' : 'Solved'}</Badge>
                ) : (
                  <Badge tone="neutral">Open</Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {challenge.hints.length > 0 && (
        <HintsSection challengeId={challenge.id} hints={challenge.hints} headingId={hintsId} />
      )}

      {challenge.files.length > 0 && (
        <section aria-labelledby={filesId} className="flex flex-col gap-3">
          <h2 id={filesId} className="type-h3 text-primary">
            Files
          </h2>
          <FileList files={challenge.files} />
        </section>
      )}

      {allSolved ? (
        <p className="flex max-w-3xl items-center gap-2 rounded-lg border border-success bg-success-faint px-4 py-3 type-small text-success">
          <Icon name="check" size={14} />
          Every flag on this challenge is on your record.
        </p>
      ) : (
        <section
          aria-labelledby={submitId}
          className="flex max-w-3xl flex-col gap-4 rounded-lg border border-hairline bg-surface p-5 shadow-card lg:p-6"
        >
          <h2 id={submitId} className="type-h3 text-primary">
            Submit a flag
          </h2>
          <FlagSubmitForm challengeId={challenge.id} />
        </section>
      )}
    </>
  );
}

async function copyPath(path: string) {
  try {
    await navigator.clipboard.writeText(path);
    toast.success('File path copied');
  } catch {
    toast.error('Could not copy the path', 'Copy it manually from the file list.');
  }
}

function FileList({ files }: { files: ChallengeFile[] }) {
  const hasReferenceOnly = files.some(
    (file) => file.path && !file.downloadUrl && !isHttpUrl(file.path),
  );

  return (
    <div className="flex max-w-3xl flex-col gap-2">
      <ul className="overflow-hidden rounded-lg border border-hairline bg-surface shadow-soft">
        {files.map((file) => {
          const size = formatBytes(file.sizeBytes);
          const path = file.path;
          const href = file.downloadUrl ?? (path && isHttpUrl(path) ? path : null);
          return (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2 type-small">
                <Icon name={href ? 'download' : 'copy'} size={14} className="text-muted" />
                <span className="truncate font-mono text-primary">{file.name}</span>
                {size && <span className="shrink-0 text-muted">{size}</span>}
              </span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="shrink-0 type-small font-medium text-accent-strong hover:underline"
                >
                  Download
                </a>
              ) : path ? (
                <button
                  type="button"
                  onClick={() => void copyPath(path)}
                  className="shrink-0 type-small font-medium text-accent-strong hover:underline"
                >
                  Copy path
                </button>
              ) : (
                <span className="shrink-0 type-small text-muted">Unavailable</span>
              )}
            </li>
          );
        })}
      </ul>
      {hasReferenceOnly && (
        <p className="type-small text-muted">
          Files stored as local paths are references; this deployment does not host them.
        </p>
      )}
    </div>
  );
}

function HintsSection({
  challengeId,
  hints,
  headingId,
}: {
  challengeId: string;
  hints: PublicHint[];
  headingId: string;
}) {
  const { isAuthenticated } = useAuth();
  const unlock = useUnlockHint();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<{ hintId: string; message: string } | null>(null);

  const unlockedCount = hints.filter((hint) => hint.unlocked).length;
  const spent = hints.reduce((total, hint) => (hint.unlocked ? total + hint.cost : total), 0);

  function handleUnlock(hint: PublicHint) {
    setError(null);
    unlock.mutate(
      { challengeId, hintId: hint.id },
      {
        onSuccess: (result) => {
          setConfirming(null);
          toast.success(
            result.alreadyUnlocked
              ? 'Hint already unlocked'
              : `Hint unlocked for ${result.pointsSpent} pts`,
            result.alreadyUnlocked
              ? 'Your team already paid for this one.'
              : `${result.points} pts remain on your score.`,
          );
        },
        onError: (failure) => {
          setConfirming(null);
          if (failure instanceof ApiError && failure.status === 409) {
            const current = (failure.details as { points?: number } | undefined)?.points;
            setError({
              hintId: hint.id,
              message:
                typeof current === 'number'
                  ? `Not enough points — your score is ${current}, this hint costs ${hint.cost}.`
                  : `Not enough points for this hint (${hint.cost} pts).`,
            });
          } else {
            setError({ hintId: hint.id, message: errorMessage(failure) });
          }
        },
      },
    );
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={headingId} className="type-h3 text-primary">
          Hints
        </h2>
        <span className="type-small text-muted">
          {unlockedCount} of {hints.length} unlocked
          {spent > 0 && ` · ${formatPoints(spent)} pts spent`}
        </span>
      </div>
      <ul className="flex max-w-3xl flex-col gap-2">
        {hints.map((hint, index) => (
          <li key={hint.id}>
            {hint.unlocked && hint.content !== null ? (
              <details className="group rounded-lg border border-hairline bg-surface shadow-soft">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 type-small text-secondary transition-colors duration-instant hover:text-primary marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <Icon name="info" size={14} className="text-muted" />
                    Hint {index + 1}
                  </span>
                  <span className="flex items-center gap-2">
                    {hint.cost > 0 && <Badge tone="success">Unlocked · {hint.cost} pts</Badge>}
                    <Chevron />
                  </span>
                </summary>
                <p className="border-t border-hairline px-4 py-3 type-small leading-relaxed text-secondary">
                  {hint.content}
                </p>
              </details>
            ) : (
              <div className="rounded-lg border border-hairline bg-surface px-4 py-3 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 type-small">
                  <span className="flex items-center gap-2 text-secondary">
                    <Icon name="lock" size={14} className="text-muted" />
                    Hint {index + 1}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone="warning">Costs {hint.cost} pts</Badge>
                    {!isAuthenticated ? (
                      <Link
                        to="/login"
                        className="rounded-sm type-small font-medium text-accent-strong hover:underline"
                      >
                        Sign in to unlock
                      </Link>
                    ) : confirming === hint.id ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={unlock.isPending && unlock.variables?.hintId === hint.id}
                          onClick={() => handleUnlock(hint)}
                        >
                          Confirm · −{hint.cost} pts
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setError(null);
                          setConfirming(hint.id);
                        }}
                      >
                        Unlock · {hint.cost} pts
                      </Button>
                    )}
                  </span>
                </div>
                {confirming === hint.id && (
                  <p role="status" className="mt-2 type-small text-secondary">
                    {hint.cost} points come off your score now, and the text cannot be re-locked.
                  </p>
                )}
                {error?.hintId === hint.id && (
                  <p role="alert" className="mt-2 type-small text-danger">
                    {error.message}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chevron() {
  return (
    <Icon
      name="chevron-down"
      size={14}
      className={cn(
        'text-muted transition-transform duration-fast ease-decel',
        'group-open:rotate-180 motion-reduce:transition-none',
      )}
    />
  );
}
