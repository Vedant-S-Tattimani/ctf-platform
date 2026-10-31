import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { Reveal } from '@/components/ui/Reveal';

const OUTCOMES = [
  {
    code: '200',
    tone: 'text-success',
    title: 'Correct — once',
    body: 'The flag is checked against a salted hash in constant time. Your team earns the points the board was showing at that moment.',
  },
  {
    code: '200',
    tone: 'text-secondary',
    title: 'Wrong',
    body: (
      <>
        A miss returns <code className="nums text-secondary">correct:false</code> and costs you
        nothing but the moment. Guessing is loud, though: the endpoint is rate-limited, so brute
        force stalls.
      </>
    ),
  },
  {
    code: '409',
    tone: 'text-warning',
    title: 'Already counted',
    body: (
      <>
        Re-submitting a captured flag returns the original solve with{' '}
        <code className="nums text-secondary">duplicate:true</code>. A flag scores once per team,
        forever.
      </>
    ),
  },
] as const;

const FEATURES = [
  {
    number: '01',
    title: 'Flag values never reach the browser',
    body: 'The database stores a salt and a hash, and the API only ever answers whether a submission matched. Nothing in the bundle, a response body or a devtools network tab hands out an answer key.',
  },
  {
    number: '02',
    title: 'Points move while the event runs',
    body: 'On a dynamic event the value of a challenge decays as more teams capture it, so the board reflects who solved what and when — not just who got there last. First blood is marked on the solve.',
  },
  {
    number: '03',
    title: 'The team line is the unit of record',
    body: 'Solves belong to the team, not to whichever keyboard typed them. Members share one line on the scoreboard, and a solo run is just a team of one.',
  },
] as const;

/** Sticky claim on the left, the argument scrolling past it on the right. */
export function StickyFeature() {
  return (
    <section className="border-y border-hairline bg-surface" aria-labelledby="feature-title">
      <div className="mx-auto grid max-w-container gap-12 px-4 py-16 sm:px-6 sm:py-band lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal>
            <h2 id="feature-title" className="max-w-[16ch] type-h1 text-primary">
              Scoring you can audit after the fact.
            </h2>
            <p className="mt-4 max-w-measure text-secondary">
              Every submission resolves to one of three answers. There is no partial credit and no
              silent re-score, which is what makes the final board defensible.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <SpotlightCard
              className="mt-8 border border-hairline p-6 sm:p-7"
              spotlightColor="rgba(124, 92, 255, 0.14)"
              intensity={0.6}
            >
              <p className="type-label text-muted">What a submission returns</p>
              <ul className="mt-4 flex flex-col">
                {OUTCOMES.map((outcome) => (
                  <li
                    key={outcome.title}
                    className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-t border-hairline py-4 first:border-t-0"
                  >
                    <span className={`nums type-small font-semibold ${outcome.tone}`}>
                      {outcome.code}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="type-small font-medium text-primary">{outcome.title}</p>
                      <p className="type-small text-muted">{outcome.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </Reveal>
        </div>

        <ol className="flex flex-col gap-14 lg:gap-24 lg:pt-6">
          {FEATURES.map((feature, index) => (
            <Reveal as="li" key={feature.number} delay={index * 60} className="flex flex-col gap-3">
              <span className="nums type-small text-accent-strong">{feature.number}</span>
              <h3 className="max-w-[20ch] type-h2 text-primary">{feature.title}</h3>
              <p className="max-w-measure text-secondary">{feature.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
