import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { errorMessage, fieldErrorsFromApi } from '@/lib/errors';
import { formatBytes, formatCount, formatDateTimeUTC, formatPoints } from '@/lib/format';
import { toast } from '@/store/toast';
import {
  useAdminCategories,
  useAdminChallenge,
  useAdminEvents,
  useCreateChallenge,
  useDeleteChallenge,
  useFileMutations,
  useFlagMutations,
  useHintMutations,
  useUpdateChallenge,
} from './queries';

interface AdminChallengeEditorProps {
  mode?: 'create';
}

interface BasicForm {
  title: string;
  description: string;
  categoryId: string;
  eventId: string;
  difficulty: string;
  points: string;
  order: string;
  published: boolean;
}

interface FlagRow {
  label: string;
  value: string;
  points: string;
}

interface HintRow {
  content: string;
  cost: string;
}

interface FileRow {
  name: string;
  path: string;
}

const EMPTY_BASIC: BasicForm = {
  title: '',
  description: '',
  categoryId: '',
  eventId: '',
  difficulty: 'medium',
  points: '100',
  order: '0',
  published: false,
};

const DIFFICULTIES = ['easy', 'medium', 'hard', 'insane'] as const;

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface p-6 shadow-card sm:p-8">
      <div className="flex flex-col gap-1">
        <h2 className="type-h3 text-primary">{title}</h2>
        {description && <p className="max-w-measure type-small text-secondary">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function AdminChallengeEditor({ mode }: AdminChallengeEditorProps) {
  const editing = mode !== 'create';
  const { challengeId } = useParams<{ challengeId: string }>();
  const id = editing ? (challengeId ?? null) : null;
  const navigate = useNavigate();

  const detail = useAdminChallenge(id);
  const categories = useAdminCategories();
  const events = useAdminEvents();

  const create = useCreateChallenge();
  const update = useUpdateChallenge(id ?? '');
  const remove = useDeleteChallenge();

  const [form, setForm] = useState<BasicForm>(EMPTY_BASIC);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [flags, setFlags] = useState<FlagRow[]>([{ label: '', value: '', points: '100' }]);
  const [hints, setHints] = useState<HintRow[]>([{ content: '', cost: '0' }]);
  const [files, setFiles] = useState<FileRow[]>([{ name: '', path: '' }]);

  const [newFlag, setNewFlag] = useState<FlagRow>({ label: '', value: '', points: '100' });
  const [newHint, setNewHint] = useState<HintRow>({ content: '', cost: '0' });
  const [newFile, setNewFile] = useState<FileRow>({ name: '', path: '' });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const flagOps = useFlagMutations(id ?? '');
  const hintOps = useHintMutations(id ?? '');
  const fileOps = useFileMutations(id ?? '');

  const challenge = detail.data?.challenge;

  useEffect(() => {
    setErrors({});
    setGeneralError(null);
    setListError(null);
    setConfirmDelete(false);
    if (!id) {
      setLoadedFor(null);
      setForm(EMPTY_BASIC);
      setFlags([{ label: '', value: '', points: '100' }]);
      setHints([{ content: '', cost: '0' }]);
      setFiles([{ name: '', path: '' }]);
    }
  }, [id]);

  useEffect(() => {
    if (!challenge || loadedFor === challenge.id) return;
    setForm({
      title: challenge.title,
      description: challenge.description,
      categoryId: challenge.categoryId,
      eventId: challenge.eventId ?? '',
      difficulty: challenge.difficulty,
      points: String(challenge.points),
      order: String(challenge.order),
      published: challenge.published,
    });
    setLoadedFor(challenge.id);
  }, [challenge, loadedFor]);

  const categoryOptions = useMemo(
    () => categories.data?.categories ?? [],
    [categories.data?.categories],
  );

  function setField<K extends keyof BasicForm>(key: K, value: BasicForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: '' }));
  }

  function validateBasics(): Record<string, string> {
    const nextErrors: Record<string, string> = {};
    if (form.title.trim().length < 2) nextErrors.title = 'Give the challenge a title.';
    if (!form.description.trim()) nextErrors.description = 'Add a description or brief.';
    if (!form.categoryId) nextErrors.categoryId = 'Pick a category.';
    const points = Number(form.points);
    if (!Number.isInteger(points) || points <= 0) {
      nextErrors.points = 'Points must be a positive whole number.';
    }
    return nextErrors;
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateBasics();

    const cleanFlags = flags
      .map((flag) => ({
        label: flag.label.trim() || undefined,
        value: flag.value.trim(),
        points: Number(flag.points),
      }))
      .filter((flag) => flag.value.length > 0);

    if (cleanFlags.length === 0) nextErrors.flags = 'Add at least one flag.';
    else if (cleanFlags.some((flag) => flag.value.length < 4)) {
      nextErrors.flags = 'Flags need at least 4 characters.';
    } else if (cleanFlags.some((flag) => !Number.isInteger(flag.points) || flag.points <= 0)) {
      nextErrors.flags = 'Each flag needs positive whole-number points.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const result = await create.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        eventId: form.eventId || null,
        difficulty: form.difficulty,
        points: Number(form.points),
        published: form.published,
        order: Number(form.order) || 0,
        flags: cleanFlags,
        hints: hints
          .map((hint) => ({ content: hint.content.trim(), cost: Number(hint.cost) || 0 }))
          .filter((hint) => hint.content.length > 0),
        files: files
          .map((file) => ({ name: file.name.trim(), path: file.path.trim() }))
          .filter((file) => file.name.length > 0 && file.path.length > 0),
      });
      toast.success(
        'Challenge created',
        form.published ? 'It is live on the board.' : 'Saved as a draft.',
      );
      navigate(`/admin/challenges/${result.challenge.id}`, { replace: true });
    } catch (error) {
      const fields = fieldErrorsFromApi(error);
      setErrors(fields);
      setGeneralError(Object.keys(fields).length ? null : errorMessage(error));
    }
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!id) return;
    const nextErrors = validateBasics();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await update.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        eventId: form.eventId || null,
        difficulty: form.difficulty,
        points: Number(form.points),
        order: Number(form.order) || 0,
        published: form.published,
      });
      toast.success('Challenge updated');
    } catch (error) {
      const fields = fieldErrorsFromApi(error);
      setErrors(fields);
      setGeneralError(Object.keys(fields).length ? null : errorMessage(error));
    }
  }

  async function handleDelete() {
    if (!id) return;
    try {
      await remove.mutateAsync(id);
      toast.success('Challenge deleted');
      navigate('/admin/challenges', { replace: true });
    } catch (error) {
      toast.error('Could not delete the challenge', errorMessage(error));
    }
  }

  async function addFlag() {
    setListError(null);
    if (newFlag.value.trim().length < 4) {
      setListError('Flag values need at least 4 characters.');
      return;
    }
    if (!Number.isInteger(Number(newFlag.points)) || Number(newFlag.points) <= 0) {
      setListError('Flag points must be a positive whole number.');
      return;
    }
    try {
      await flagOps.add.mutateAsync({
        label: newFlag.label.trim() || undefined,
        value: newFlag.value.trim(),
        points: Number(newFlag.points),
      });
      setNewFlag({ label: '', value: '', points: '100' });
      toast.success('Flag added');
    } catch (error) {
      setListError(errorMessage(error));
    }
  }

  async function addHint() {
    setListError(null);
    if (!newHint.content.trim()) {
      setListError('Hint text cannot be empty.');
      return;
    }
    try {
      await hintOps.add.mutateAsync({
        content: newHint.content.trim(),
        cost: Number(newHint.cost) || 0,
      });
      setNewHint({ content: '', cost: '0' });
      toast.success('Hint added');
    } catch (error) {
      setListError(errorMessage(error));
    }
  }

  async function addFile() {
    setListError(null);
    if (!newFile.name.trim() || !newFile.path.trim()) {
      setListError('Files need both a name and a path.');
      return;
    }
    try {
      await fileOps.add.mutateAsync({ name: newFile.name.trim(), path: newFile.path.trim() });
      setNewFile({ name: '', path: '' });
      toast.success('File added');
    } catch (error) {
      setListError(errorMessage(error));
    }
  }

  async function uploadHandout(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !id) return;
    setListError(null);
    try {
      const { asset } = await fileOps.upload.mutateAsync(file);
      await fileOps.add.mutateAsync({ assetId: asset.id });
      toast.success('Handout uploaded', `${asset.name} is attached to this challenge.`);
    } catch (error) {
      setListError(errorMessage(error));
    }
  }

  async function deleteSubItem(kind: 'flag' | 'hint' | 'file', itemId: string) {
    setListError(null);
    try {
      if (kind === 'flag') await flagOps.remove.mutateAsync(itemId);
      if (kind === 'hint') await hintOps.remove.mutateAsync(itemId);
      if (kind === 'file') await fileOps.remove.mutateAsync(itemId);
      toast.success(`${kind === 'file' ? 'File' : kind === 'hint' ? 'Hint' : 'Flag'} deleted`);
    } catch (error) {
      setListError(errorMessage(error));
    }
  }

  const pending = create.isPending || update.isPending;
  const loadingDetail = editing && detail.isPending;
  const saveDisabled = editing && !challenge;

  return (
    <form onSubmit={editing ? handleSave : handleCreate} className="flex flex-col gap-8">
      <PageHeader
        breadcrumbs={[
          { label: 'Challenges', to: '/admin/challenges' },
          { label: editing ? (challenge?.title ?? 'Challenge') : 'New challenge' },
        ]}
        title={editing ? 'Edit challenge' : 'New challenge'}
        description={
          editing
            ? 'Update the brief, flags, hints and files. Flag values are hashed on write and can never be read back.'
            : 'Publish a brief, attach files and hash the flags players must find.'
        }
        meta={
          challenge ? (
            <>
              <Badge tone={challenge.published ? 'success' : 'neutral'}>
                {challenge.published ? 'Live' : 'Draft'}
              </Badge>
              <Badge tone="neutral">{challenge.category.name}</Badge>
              <span className="nums">{formatPoints(challenge.points)} pts</span>
              <span className="nums">{formatCount(challenge._count.solves, 'solve')}</span>
            </>
          ) : undefined
        }
        actions={
          <>
            <Link to="/admin/challenges" className={buttonVariants('ghost', 'md')}>
              Cancel
            </Link>
            <Button type="submit" loading={pending} disabled={saveDisabled}>
              {editing ? 'Save changes' : 'Create challenge'}
            </Button>
          </>
        }
      />

      {loadingDetail ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-48 w-full rounded-md" />
            <span className="sr-only">Loading the challenge…</span>
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : editing && detail.isError ? (
        <ErrorState
          title="Could not load this challenge"
          description={errorMessage(detail.error)}
          onRetry={() => void detail.refetch()}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
          <Reveal stagger className="flex min-w-0 flex-col gap-6">
            <EditorSection title="Basics" description="The brief players read before they start.">
              <Input
                label="Title"
                value={form.title}
                onChange={(event) => setField('title', event.target.value)}
                maxLength={120}
                error={errors.title}
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                rows={6}
                error={errors.description}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Category"
                  value={form.categoryId}
                  onChange={(event) => setField('categoryId', event.target.value)}
                  error={errors.categoryId}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Event (optional)"
                  value={form.eventId}
                  onChange={(event) => setField('eventId', event.target.value)}
                >
                  <option value="">No event</option>
                  {(events.data?.events ?? []).map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Difficulty"
                  value={form.difficulty}
                  onChange={(event) => setField('difficulty', event.target.value)}
                >
                  {DIFFICULTIES.map((level) => (
                    <option key={level} value={level}>
                      {level[0]!.toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Points"
                    type="number"
                    min={1}
                    value={form.points}
                    onChange={(event) => setField('points', event.target.value)}
                    error={errors.points}
                  />
                  <Input
                    label="Order"
                    type="number"
                    value={form.order}
                    onChange={(event) => setField('order', event.target.value)}
                  />
                </div>
              </div>
              <label className="flex cursor-pointer items-start gap-3 border-y border-hairline py-3">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) => setField('published', event.target.checked)}
                  className="mt-0.5 size-4 rounded-sm border-subtle bg-elevated accent-[var(--accent)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="type-small font-medium text-primary">Published</span>
                  <span className="type-small text-muted">
                    Visible to players on the challenge board.
                  </span>
                </span>
              </label>
            </EditorSection>

            {editing && challenge ? (
              <>
                <EditorSection
                  title="Flags"
                  description="Values are salted and hashed on write. Only the label and points stay readable."
                >
                  <ul className="flex flex-col gap-1 rounded-md border border-hairline bg-canvas p-2">
                    {challenge.flags.length === 0 && (
                      <li className="px-3 py-2.5 type-small text-muted">
                        No flags yet — add the first one below.
                      </li>
                    )}
                    {challenge.flags.map((flag, index) => (
                      <li
                        key={flag.id}
                        className="flex items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors duration-instant hover:bg-elevated"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-primary">
                            {flag.label ?? `Flag ${index + 1}`}
                          </span>
                          <span className="type-small text-muted">
                            {flag.algo.toUpperCase()} salted hash · {formatPoints(flag.points)} pts
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-faint"
                          onClick={() => void deleteSubItem('flag', flag.id)}
                        >
                          Delete
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_7rem_auto] sm:items-end">
                    <Input
                      label="Label (optional)"
                      value={newFlag.label}
                      onChange={(event) => setNewFlag({ ...newFlag, label: event.target.value })}
                      placeholder="Optional"
                    />
                    <Input
                      label="Flag value"
                      value={newFlag.value}
                      onChange={(event) => setNewFlag({ ...newFlag, value: event.target.value })}
                      placeholder="YourCTF{...}"
                      className="font-mono"
                    />
                    <Input
                      label="Points"
                      type="number"
                      min={1}
                      value={newFlag.points}
                      onChange={(event) => setNewFlag({ ...newFlag, points: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={flagOps.add.isPending}
                      onClick={() => void addFlag()}
                    >
                      Add flag
                    </Button>
                  </div>
                </EditorSection>

                <EditorSection title="Hints" description="Optional nudges players can unlock.">
                  <ul className="flex flex-col gap-1 rounded-md border border-hairline bg-canvas p-2">
                    {challenge.hints.length === 0 && (
                      <li className="px-3 py-2.5 type-small text-muted">
                        No hints yet.
                      </li>
                    )}
                    {challenge.hints.map((hint) => (
                      <li
                        key={hint.id}
                        className="flex items-start justify-between gap-3 rounded-md px-3 py-2.5 transition-colors duration-instant hover:bg-elevated"
                      >
                        <span className="min-w-0">
                          <span className="block text-primary">{hint.content}</span>
                          <span className="type-small text-muted">
                            {hint.cost > 0 ? `Costs ${formatPoints(hint.cost)} pts` : 'Free'}
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-faint"
                          onClick={() => void deleteSubItem('hint', hint.id)}
                        >
                          Delete
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-3">
                    <Textarea
                      label="Hint text"
                      rows={2}
                      value={newHint.content}
                      onChange={(event) => setNewHint({ ...newHint, content: event.target.value })}
                    />
                    <div className="flex items-end gap-3">
                      <Input
                        label="Cost (points)"
                        type="number"
                        min={0}
                        value={newHint.cost}
                        onChange={(event) => setNewHint({ ...newHint, cost: event.target.value })}
                        className="w-40"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        loading={hintOps.add.isPending}
                        onClick={() => void addHint()}
                      >
                        Add hint
                      </Button>
                    </div>
                  </div>
                </EditorSection>

                <EditorSection title="Files" description="Handouts, archives or links attached to the brief.">
                  <ul className="flex flex-col gap-1 rounded-md border border-hairline bg-canvas p-2">
                    {challenge.files.length === 0 && (
                      <li className="px-3 py-2.5 type-small text-muted">
                        No files attached.
                      </li>
                    )}
                    {challenge.files.map((file) => (
                      <li
                        key={file.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md px-3 py-2.5 transition-colors duration-instant hover:bg-elevated"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-mono text-primary">{file.name}</span>
                          <span className="block truncate font-mono type-small text-muted">
                            {file.downloadUrl
                              ? [file.mimeType ?? 'stored file', formatBytes(file.sizeBytes)]
                                  .filter((part): part is string => Boolean(part))
                                  .join(' · ')
                              : file.path}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1">
                          {file.downloadUrl && (
                            <a
                              href={file.downloadUrl}
                              className="rounded-md px-2.5 py-1.5 type-small font-medium text-accent-strong transition-colors duration-instant hover:bg-accent-faint"
                            >
                              Download
                            </a>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:bg-danger-faint"
                            onClick={() => void deleteSubItem('file', file.id)}
                          >
                            Delete
                          </Button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Input
                    label="Upload a handout"
                    type="file"
                    accept="application/pdf,application/zip,application/x-zip-compressed,application/gzip,application/x-tar,text/plain,text/csv,image/png,image/jpeg,image/gif,image/webp,application/octet-stream"
                    onChange={(event) => void uploadHandout(event)}
                    disabled={fileOps.upload.isPending || fileOps.add.isPending}
                    hint={
                      fileOps.upload.isPending
                        ? 'Uploading…'
                        : 'PDF, ZIP, tar, text, CSV or images up to 5 MB. The file is stored under a random name and attached immediately.'
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                    <Input
                      label="File name"
                      value={newFile.name}
                      onChange={(event) => setNewFile({ ...newFile, name: event.target.value })}
                      placeholder="handout.pdf"
                    />
                    <Input
                      label="Path or URL"
                      value={newFile.path}
                      onChange={(event) => setNewFile({ ...newFile, path: event.target.value })}
                      placeholder="https://… or files/handout.pdf"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      loading={fileOps.add.isPending}
                      onClick={() => void addFile()}
                    >
                      Add file
                    </Button>
                  </div>
                </EditorSection>
              </>
            ) : (
              <>
                <EditorSection
                  title="Flags"
                  description="Values are hashed server-side and never shown again. Add one row per flag."
                >
                  {flags.map((flag, index) => (
                    <div
                      key={index}
                      className="grid gap-3 border-b border-hairline pb-4 sm:grid-cols-[1fr_1.4fr_7rem_auto] sm:items-end"
                    >
                      <Input
                        label={`Label ${index + 1}`}
                        value={flag.label}
                        onChange={(event) =>
                          setFlags((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, label: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="Optional"
                      />
                      <Input
                        label="Flag value"
                        value={flag.value}
                        onChange={(event) =>
                          setFlags((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, value: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="YourCTF{...}"
                        className="font-mono"
                      />
                      <Input
                        label="Points"
                        type="number"
                        min={1}
                        value={flag.points}
                        onChange={(event) =>
                          setFlags((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, points: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-faint"
                        disabled={flags.length === 1}
                        onClick={() => setFlags((rows) => rows.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  {errors.flags && (
                    <p role="alert" className="type-small text-danger">
                      {errors.flags}
                    </p>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setFlags((rows) => [...rows, { label: '', value: '', points: '100' }])
                      }
                    >
                      Add another flag
                    </Button>
                  </div>
                </EditorSection>

                <EditorSection title="Hints" description="Optional nudges players can unlock.">
                  {hints.map((hint, index) => (
                    <div
                      key={index}
                      className="grid gap-3 border-b border-hairline pb-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
                    >
                      <Input
                        label={`Hint ${index + 1}`}
                        value={hint.content}
                        onChange={(event) =>
                          setHints((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, content: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="Optional"
                      />
                      <Input
                        label="Cost"
                        type="number"
                        min={0}
                        value={hint.cost}
                        onChange={(event) =>
                          setHints((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, cost: event.target.value } : row,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-faint"
                        onClick={() => setHints((rows) => rows.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setHints((rows) => [...rows, { content: '', cost: '0' }])}
                    >
                      Add hint
                    </Button>
                  </div>
                </EditorSection>

                <EditorSection title="Files" description="Handouts, archives or links attached to the brief.">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="grid gap-3 border-b border-hairline pb-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
                    >
                      <Input
                        label={`File ${index + 1} name`}
                        value={file.name}
                        onChange={(event) =>
                          setFiles((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, name: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="handout.pdf"
                      />
                      <Input
                        label="Path or URL"
                        value={file.path}
                        onChange={(event) =>
                          setFiles((rows) =>
                            rows.map((row, i) =>
                              i === index ? { ...row, path: event.target.value } : row,
                            ),
                          )
                        }
                        placeholder="https://… or files/handout.pdf"
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-faint"
                        onClick={() => setFiles((rows) => rows.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setFiles((rows) => [...rows, { name: '', path: '' }])}
                    >
                      Add file
                    </Button>
                  </div>
                </EditorSection>
              </>
            )}

            {listError && (
              <p role="alert" className="type-small text-danger">
                {listError}
              </p>
            )}
            {generalError && (
              <p role="alert" className="type-small text-danger">
                {generalError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline pt-5">
              <Link to="/admin/challenges" className={buttonVariants('ghost', 'md')}>
                Cancel
              </Link>
              <Button type="submit" loading={pending} disabled={saveDisabled}>
                {editing ? 'Save changes' : 'Create challenge'}
              </Button>
            </div>
          </Reveal>

          <Reveal stagger className="flex flex-col gap-6">
            {editing && challenge ? (
              <>
                <section
                  aria-labelledby="editor-status"
                  className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
                >
                  <h2 id="editor-status" className="type-label text-muted">
                    Status
                  </h2>
                  <dl className="mt-3 divide-y divide-hairline type-small">
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Visibility</dt>
                      <dd className="text-secondary">
                        {challenge.published ? 'Live on the board' : 'Draft'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Category</dt>
                      <dd className="text-secondary">{challenge.category.name}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Event</dt>
                      <dd className="truncate text-secondary">{challenge.event?.name ?? '—'}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Flags</dt>
                      <dd className="nums text-secondary">{challenge.flags.length}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Solves</dt>
                      <dd className="nums text-secondary">{challenge._count.solves}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-muted">Updated</dt>
                      <dd className="nums text-secondary">
                        {formatDateTimeUTC(challenge.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                  {challenge && (
                    <p className="mt-3 type-small text-muted">
                      Order {challenge.order} · {formatPoints(challenge.points)} pts
                    </p>
                  )}
                </section>

                {challenge.scoring && (
                  <section
                    aria-labelledby="editor-scoring"
                    className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
                  >
                    <h2 id="editor-scoring" className="type-label text-muted">
                      Dynamic scoring
                    </h2>
                    <p className="mt-1 type-small text-secondary">
                      Next awards fall from the {formatPoints(challenge.points)} base toward a floor
                      of {formatPoints(challenge.scoring.minimumPoints)} at{' '}
                      {challenge.scoring.decayThreshold} solves.
                    </p>
                    <dl className="mt-3 divide-y divide-hairline type-small">
                      {challenge.scoring.samples.map((sample) => (
                        <div
                          key={sample.solves}
                          className="flex items-baseline justify-between gap-4 py-2"
                        >
                          <dt className="text-muted">After {formatCount(sample.solves, 'solve')}</dt>
                          <dd className="nums text-accent-strong">{formatPoints(sample.points)}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}

                <section
                  aria-labelledby="editor-danger"
                  className="band-tint rounded-lg border border-danger bg-danger-faint p-6 shadow-card"
                >
                  <h2 id="editor-danger" className="type-label text-muted">
                    Danger zone
                  </h2>
                  {confirmDelete ? (
                    <div className="mt-3 flex flex-col gap-3">
                      <p className="type-small text-danger">
                        This removes the challenge with its flags, hints, files and solve records.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={remove.isPending}
                          onClick={() => void handleDelete()}
                        >
                          Delete challenge
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-danger hover:bg-danger-faint"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete challenge
                    </Button>
                  )}
                </section>
              </>
            ) : (
              <section
                aria-labelledby="editor-publishing"
                className="rounded-lg border border-hairline bg-surface p-6 shadow-card"
              >
                <h2 id="editor-publishing" className="type-label text-muted">
                  Before you publish
                </h2>
                <ul className="mt-3 divide-y divide-hairline type-small text-secondary">
                  <li className="py-3">
                    Flags are hashed with a per-flag salt. Values never leave the server in
                    plaintext.
                  </li>
                  <li className="py-3">Drafts stay hidden from players until you mark them live.</li>
                  <li className="py-3">
                    Order sets the position on the public board; ties fall back to title.
                  </li>
                </ul>
              </section>
            )}
          </Reveal>
        </div>
      )}
    </form>
  );
}
