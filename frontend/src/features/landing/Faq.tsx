import { Reveal } from '@/components/ui/Reveal';
import { Icon } from '@/lib/icons';

const QUESTIONS = [
  {
    q: 'Do I need to install anything?',
    a: 'No. The platform is a browser and an HTTP API. Challenges themselves may hand you files to download, but nothing about playing requires a client, plugin or agent.',
  },
  {
    q: 'How do teams work?',
    a: 'Create an account, then either create a team or join one with its invite code. Solves are recorded against the team, so members share one line on the scoreboard. Playing alone is fine — that is just a team of one.',
  },
  {
    q: 'What happens if I submit a flag my team already captured?',
    a: 'You get your original solve back. The submission is refused with duplicate:true rather than scored a second time, so a mistyped paste or a retry can never inflate a total.',
  },
  {
    q: 'Why did the points for a challenge change mid-event?',
    a: 'On a dynamic event the value decays as more teams capture a flag. The number on the board is what the next solver earns right now, which is why early solves are worth more.',
  },
  {
    q: 'Can the answer be read from the page or the network tab?',
    a: 'No. Flag values are never sent to the client and never stored in the clear — the server keeps a salt and a hash and compares in constant time. The API answers whether a submission matched, nothing more.',
  },
  {
    q: 'Which timezone are event times in?',
    a: 'UTC, everywhere, including the countdown in the header. Start and end times are shown the same way to every team so a schedule cannot be misread.',
  },
] as const;

export function Faq() {
  return (
    <section className="mx-auto max-w-container px-4 py-16 sm:px-6 sm:py-band" aria-labelledby="faq-title">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <Reveal>
          <h2 id="faq-title" className="type-h2 text-primary">
            Questions people ask before the first submission
          </h2>
          <p className="mt-4 max-w-measure text-secondary">
            If something is missing here, the organizers can be reached at the address in the
            footer.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <ul className="border-t border-hairline">
            {QUESTIONS.map((item) => (
              <li key={item.q} className="border-b border-hairline">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 type-h3 text-primary transition-colors duration-instant hover:text-secondary [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span
                      aria-hidden
                      className="grid size-8 shrink-0 place-items-center rounded-pill border border-hairline text-muted transition-transform duration-fast ease-decel group-open:rotate-45 motion-reduce:transition-none"
                    >
                      <Icon name="plus" size={15} />
                    </span>
                  </summary>
                  <p className="max-w-measure pb-6 type-small leading-relaxed text-secondary">
                    {item.a}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
