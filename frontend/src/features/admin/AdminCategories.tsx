import { useState } from 'react';
import type { AdminCategory } from '@/api/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/lib/errors';
import { toast } from '@/store/toast';
import { useAdminCategories, useCategoryMutations } from './queries';

interface CategoryForm {
  name: string;
  slug: string;
  color: string;
}

const EMPTY: CategoryForm = { name: '', slug: '', color: '#7d68ff' };

export function AdminCategories() {
  const { data, isPending, isError, error, refetch } = useAdminCategories();
  const { create, update, remove } = useCategoryMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const categories = data?.categories ?? [];

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      color: category.color ?? '#7d68ff',
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError('Category names need at least 2 characters.');
      return;
    }
    const input = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      color: form.color || null,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
        toast.success('Category updated');
      } else {
        await create.mutateAsync(input);
        toast.success('Category created');
      }
      setFormOpen(false);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id);
      setConfirmId(null);
      toast.success('Category deleted');
    } catch (error) {
      toast.error('Could not delete the category', errorMessage(error));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Group challenges by discipline. The colour dot carries through to the public board."
        actions={<Button onClick={openCreate}>New category</Button>}
      />

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-md" />
          ))}
          <span className="sr-only">Loading categories…</span>
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load categories"
          description={errorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface p-6 text-center shadow-card sm:p-8">
          <p className="type-h3 text-primary">No categories yet</p>
          <p className="mx-auto mt-2 max-w-measure text-secondary">
            Create the first category so challenges can be grouped.
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={openCreate}>
            New category
          </Button>
        </div>
      ) : (
        <Reveal>
          <ul className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-surface px-3 shadow-card sm:px-4 md:hidden">
            {categories.map((category) => (
              <li key={category.id} className="-mx-3 flex flex-col gap-3 rounded-md px-3 py-3 sm:-mx-4 sm:px-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-pill"
                      style={{ backgroundColor: category.color ?? 'var(--accent)' }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-primary">{category.name}</span>
                      <span className="block truncate font-mono type-small text-muted">
                        {category.slug}
                      </span>
                    </span>
                  </span>
                  <Badge tone="neutral">{category._count.challenges}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {confirmId === category.id ? (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={remove.isPending}
                        onClick={() => void handleDelete(category.id)}
                      >
                        Confirm delete
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger hover:bg-danger-faint"
                        onClick={() => setConfirmId(category.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-lg border border-hairline bg-surface px-4 py-2 shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-hairline type-label text-muted">
                    <th scope="col" className="py-2.5 pr-4 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Slug
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Challenges
                    </th>
                    <th scope="col" className="py-2.5 pl-4 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-hairline last:border-b-0 hover:bg-elevated">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-medium text-primary">
                          <span
                            aria-hidden
                            className="size-2.5 rounded-pill"
                            style={{ backgroundColor: category.color ?? 'var(--accent)' }}
                          />
                          {category.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono type-small text-secondary">
                        {category.slug}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge tone="neutral">{category._count.challenges}</Badge>
                      </td>
                      <td className="py-3 pl-4">
                        <div className="flex items-center justify-end gap-1">
                          {confirmId === category.id ? (
                            <>
                              <Button
                                variant="danger"
                                size="sm"
                                loading={remove.isPending}
                                onClick={() => void handleDelete(category.id)}
                              >
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-danger hover:bg-danger-faint"
                                onClick={() => setConfirmId(category.id)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}

      <p className="type-small text-muted">
        Categories in use cannot be deleted; move their challenges first.
      </p>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            maxLength={40}
          />
          <Input
            label="Slug (optional)"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            maxLength={40}
            hint="Lowercase letters, numbers and dashes. Generated from the name if empty."
            className="font-mono"
          />
          <Input
            label="Color"
            type="color"
            value={form.color}
            onChange={(event) => setForm({ ...form, color: event.target.value })}
            className="h-11 w-24 p-1"
          />
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
              {editing ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
