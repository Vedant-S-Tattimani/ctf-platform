export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-pill focus:bg-primary focus:px-5 focus:py-3 focus:text-small focus:font-medium focus:text-inverse focus:shadow-float"
    >
      Skip to content
    </a>
  );
}
