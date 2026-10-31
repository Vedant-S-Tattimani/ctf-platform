export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-sm focus:bg-accent focus:px-4 focus:py-3 focus:text-small focus:font-semibold focus:text-inverse"
    >
      Skip to content
    </a>
  );
}
