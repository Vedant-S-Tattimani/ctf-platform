import { isRouteErrorResponse, Link, useRevalidator, useRouteError } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/Button';

function describe(error: unknown): { status?: number; message: string } {
  if (isRouteErrorResponse(error)) {
    return {
      status: error.status,
      message: error.statusText || error.data?.message || 'The route could not be loaded.',
    };
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'An unexpected error interrupted this screen.' };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  const { status, message } = describe(error);

  const detail = import.meta.env.DEV
    ? error instanceof Error
      ? (error.stack ?? error.message)
      : safeStringify(error)
    : null;

  return (
    <main className="mx-auto flex w-full max-w-container flex-col gap-7 px-4 py-20 sm:px-6 lg:py-28">
      <p className="type-mono text-small text-muted">
        {status ? `${status} · ` : ''}render failed
      </p>

      <div className="flex flex-col gap-4">
        <h1 className="max-w-[18ch] font-display text-display font-medium tracking-[-0.035em] text-primary">
          This screen failed to render
        </h1>
        <p className="max-w-measure text-body text-secondary">
          Something broke while drawing this page. Try again — if it keeps failing, reload the app
          or head back home. Your submissions and score are untouched.
        </p>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <Button onClick={() => revalidator.revalidate()}>Try again</Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
        <Link to="/" className={buttonVariants('ghost', 'md')}>
          Back home
        </Link>
      </div>

      {detail && (
        <details className="mt-6 rounded-md border border-hairline bg-elevated p-4">
          <summary className="cursor-pointer type-small font-semibold text-primary">
            Technical detail (development only)
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-small text-secondary">
            {detail}
          </pre>
        </details>
      )}

      <p className="type-small text-muted">{message}</p>
    </main>
  );
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
