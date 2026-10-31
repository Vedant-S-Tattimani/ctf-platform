const STEPS = [
  {
    number: '01',
    title: 'Read the brief',
    body: 'Open a challenge and read what the target actually asks for. Files, categories and difficulty are on the board from the start.',
  },
  {
    number: '02',
    title: 'Work the target',
    body: 'Solve it alone or split the work with your team. Solves land on your team’s line, and first blood is marked when you get there first.',
  },
  {
    number: '03',
    title: 'Submit the flag',
    body: 'Paste the exact value. The check runs server-side against a salted hash — a repeat submission returns your original solve, not a second score.',
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="scoring"
      className="mx-auto max-w-container scroll-mt-24 px-4 py-16 sm:px-6"
      aria-labelledby="how-title"
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="flex flex-col gap-3">
          <h2 id="how-title" className="type-h2 text-primary">
            How scoring works
          </h2>
          <p className="max-w-measure text-secondary">
            Every flag is checked against a salted hash and compared in constant time. Points are
            awarded once per flag, on the team line, the moment the submission is accepted.
          </p>
          <p className="max-w-measure type-small text-muted">
            The board re-ranks on the next refresh. Duplicate solves are refused, not re-scored.
          </p>
        </div>

        <ol className="grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((step) => (
            <li key={step.number} className="flex flex-col gap-2 border-t border-hairline pt-4">
              <span className="nums type-small text-accent-strong">{step.number}</span>
              <h3 className="type-h3 text-primary">{step.title}</h3>
              <p className="type-small text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
