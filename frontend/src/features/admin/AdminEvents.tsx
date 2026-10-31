import { useState } from 'react';
import type { AdminEvent } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeUTC } from '@/lib/format';
import { toast } from '@/store/toast';
import { useAdminEvents, useEventMutations } from './queries';

interface EventForm {
  name: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string;
  teamMaxSize: string;
  published: boolean;
  scoringMode: 'STATIC' | 'DYNAMIC';
  scoringMinimumPoints: string;
  scoringDecayThreshold: string;
}

const EMPTY: EventForm = {
  name: '',
  slug: '',
  description: '',
  startsAt: '',
  endsAt: '',
  teamMaxSize: '5',
  published: false,
  scoringMode: 'STATIC',
  scoringMinimumPoints: '100',
  scoringDecayThreshold: '40',
};

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function AdminEvents() {
  const { data, isPending, isError, error, refetch } = useAdminEvents();
  const { create, update } = useEventMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);

  const events = data?.events ?? [];

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(eventItem: AdminEvent) {
    setEditing(eventItem);
    setForm({
      name: eventItem.name,
      slug: eventItem.slug,
      description: eventItem.description ?? '',
      startsAt: toLocalInput(eventItem.startsAt),
      endsAt: toLocalInput(eventItem.endsAt),
      teamMaxSize: String(eventItem.teamMaxSize),
      published: eventItem.published,
      scoringMode: eventItem.scoringMode ?? 'STATIC',
      scoringMinimumPoints: String(eventItem.scoringMinimumPoints ?? 100),
      scoringDecayThreshold: String(eventItem.scoringDecayThreshold ?? 40),
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError('Event names need at least 2 characters.');
      return;
    }
    const startsAt = toIso(form.startsAt);
    const endsAt = toIso(form.endsAt);
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setFormError('The end time must be after the start time.');
      return;
    }
    const minimum = Number(form.scoringMinimumPoints);
    const threshold = Number(form.scoringDecayThreshold);
    if (form.scoringMode === 'DYNAMIC') {
      if (!Number.isInteger(minimum) || minimum < 0) {
        setFormError('The score floor must be a whole number of points, 0 or more.');
        return;
      }
      if (!Number.isInteger(threshold) || threshold < 2) {
        setFormError('The decay threshold must be at least 2 solves.');
        return;
      }
    }
    const input = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      startsAt,
      endsAt,
      teamMaxSize: Number(form.teamMaxSize) || 5,
      published: form.published,
      scoringMode: form.scoringMode,
      scoringMinimumPoints: Number.isInteger(minimum) && minimum >= 0 ? minimum : 100,
      scoringDecayThreshold: Number.isInteger(threshold) && threshold >= 2 ? threshold : 40,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
        toast.success('Event updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Event created');
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function togglePublished(eventItem: AdminEvent) {
    try {
      await update.mutateAsync({ id: eventItem.id, input: { published: !eventItem.published } });
      toast.success(eventItem.published ? 'Event unpublished' : 'Event published');
    } catch (error) {
      toast.error('Could not change the event', errorMessage(error));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Events"
        description="Control the competition window. Flag submissions close when an event ends."
        actions={<Button onClick={openCreate}>New event</Button>}
      />

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-md" />
          ))}
          <span className="sr-only">Loading events…</span>
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load events"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : events.length === 0 ? (
        <div className="border-y border-hairline py-12 text-center">
          <p className="type-h3 text-primary">No events yet</p>
          <p className="mx-auto mt-2 max-w-measure text-secondary">
            Create one to give challenges a competition window.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={openCreate}>
            New event
          </Button>
        </div>
      ) : (
        <ul className="border-t border-hairline">
          {events.map((eventItem) => (
            <li
              key={eventItem.id}
              className="grid gap-4 border-b border-hairline py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="type-h3 text-primary">{eventItem.name}</h2>
                  <Badge tone={eventItem.published ? 'success' : 'neutral'}>
                    {eventItem.published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge tone="accent">{eventItem._count.challenges} challenges</Badge>
                  <Badge tone={eventItem.scoringMode === 'DYNAMIC' ? 'info' : 'neutral'}>
                    {eventItem.scoringMode === 'DYNAMIC' ? 'Dynamic scoring' : 'Static scoring'}
                  </Badge>
                </div>
                <p className="mt-1 font-mono type-small text-muted">/{eventItem.slug}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-2 type-small sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="type-label text-muted">Starts</dt>
                    <dd className="nums text-secondary">
                      {eventItem.startsAt ? formatDateTimeUTC(eventItem.startsAt) : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-label text-muted">Ends</dt>
                    <dd className="nums text-secondary">
                      {eventItem.endsAt ? formatDateTimeUTC(eventItem.endsAt) : 'Not set'}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-label text-muted">Team size cap</dt>
                    <dd className="nums text-secondary">{eventItem.teamMaxSize}</dd>
                  </div>
                  <div>
                    <dt className="type-label text-muted">Scoring</dt>
                    <dd className="text-secondary">
                      {eventItem.scoringMode === 'DYNAMIC'
                        ? `Dynamic · floor ${eventItem.scoringMinimumPoints} · ${eventItem.scoringDecayThreshold} solves`
                        : 'Static'}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <Button variant="ghost" size="sm" onClick={() => void togglePublished(eventItem)}>
                  {eventItem.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openEdit(eventItem)}>
                  Edit
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit event' : 'New event'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            maxLength={120}
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            maxLength={60}
            hint="Generated from the name if empty."
            className="font-mono"
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Starts at"
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
              hint="Your local time; stored in UTC."
            />
            <Input
              label="Ends at"
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
              hint="Your local time; stored in UTC."
            />
          </div>
          <Input
            label="Team size cap"
            type="number"
            min={1}
            max={50}
            value={form.teamMaxSize}
            onChange={(event) => setForm({ ...form, teamMaxSize: event.target.value })}
            className="w-40"
          />
          <Select
            label="Scoring"
            value={form.scoringMode}
            onChange={(event) =>
              setForm({ ...form, scoringMode: event.target.value as EventForm['scoringMode'] })
            }
            hint="Static keeps each flag at its configured points. Dynamic decays the award as solves accumulate."
          >
            <option value="STATIC">Static — fixed points</option>
            <option value="DYNAMIC">Dynamic — decays with solves</option>
          </Select>
          {form.scoringMode === 'DYNAMIC' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Score floor"
                type="number"
                min={0}
                value={form.scoringMinimumPoints}
                onChange={(event) =>
                  setForm({ ...form, scoringMinimumPoints: event.target.value })
                }
                hint="Lowest award once the flag is solved out."
              />
              <Input
                label="Decay threshold"
                type="number"
                min={2}
                value={form.scoringDecayThreshold}
                onChange={(event) =>
                  setForm({ ...form, scoringDecayThreshold: event.target.value })
                }
                hint="Solve count at which the floor is reached."
              />
            </div>
          )}
          <label className="flex items-center gap-3 text-small text-secondary">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm({ ...form, published: event.target.checked })}
              className="size-4 rounded-sm border-subtle bg-elevated accent-[var(--accent)]"
            />
            Published — shown as the active event
          </label>
          {formError && (
            <p role="alert" className="type-small text-danger">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-hairline pt-4">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {editing ? 'Save changes' : 'Create event'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
