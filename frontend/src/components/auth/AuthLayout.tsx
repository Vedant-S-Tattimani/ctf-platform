export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-container flex-col items-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md">
        <h1 className="type-h1 text-center text-primary">{title}</h1>
        <p className="type-small mt-2 text-center text-secondary">{subtitle}</p>
        <div className="mt-8 rounded-lg border border-hairline bg-surface p-6 shadow-panel sm:p-8">
          {children}
        </div>
        <div className="mt-6 text-center">
          <p className="type-small text-muted">{footer}</p>
        </div>
      </div>
    </main>
  );
}
