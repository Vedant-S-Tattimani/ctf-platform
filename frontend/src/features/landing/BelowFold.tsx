import { CtaBand } from './CtaBand';
import { Disciplines } from './Disciplines';
import { FeaturedChallenge } from './FeaturedChallenge';
import { HowItWorks } from './HowItWorks';
import { StatsBand } from './StatsBand';

export default function BelowFold() {
  return (
    <>
      <Disciplines />
      <FeaturedChallenge />
      <StatsBand />
      <HowItWorks />
      <CtaBand />
    </>
  );
}
