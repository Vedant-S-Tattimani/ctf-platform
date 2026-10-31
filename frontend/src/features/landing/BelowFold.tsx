import { ChallengeRail } from './ChallengeRail';
import { CtaBand } from './CtaBand';
import { Disciplines } from './Disciplines';
import { Faq } from './Faq';
import { HowItWorks } from './HowItWorks';
import { StatsBand } from './StatsBand';
import { StickyFeature } from './StickyFeature';

export default function BelowFold() {
  return (
    <>
      <Disciplines />
      <ChallengeRail />
      <StickyFeature />
      <StatsBand />
      <HowItWorks />
      <Faq />
      <CtaBand />
    </>
  );
}
