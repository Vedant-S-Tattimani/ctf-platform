import { useState } from 'react';
import { AnimatedList } from '@/components/reactbits/AnimatedList';
import ParticleField from '@/components/reactbits/ParticleField';
import { Stepper, type StepperStep } from '@/components/reactbits/Stepper';
import { TiltedCard } from '@/components/reactbits/TiltedCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Carousel } from '@/components/ui/Carousel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CopyButton } from '@/components/ui/CopyButton';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Progress } from '@/components/ui/Progress';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Segmented } from '@/components/ui/Segmented';
import { useTheme } from '@/store/theme';
import { Select } from '@/components/ui/Select';
import { Stat, StatRow } from '@/components/ui/Stat';
import { Tabs } from '@/components/ui/Tabs';
import { Textarea } from '@/components/ui/Textarea';
import { formatDateTimeUTC } from '@/lib/format';
import { Icon } from '@/lib/icons';
import { toast } from '@/store/toast';

interface TeamRow {
  id: string;
  name: string;
  solves: number;
  points: number;
}

const teamRows: TeamRow[] = [
  { id: 'null-route', name: 'Null Route', solves: 18, points: 4820 },
  { id: 'kernel-panic', name: 'Kernel Panic', solves: 17, points: 4310 },
  { id: 'off-by-one', name: 'Off-By-One', solves: 16, points: 3990 },
];

const teamColumns: DataTableColumn<TeamRow>[] = [
  {
    key: 'name',
    header: 'Team',
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: 'solves',
    header: 'Solves',
    align: 'right',
    render: (row) => <span className="nums">{row.solves}</span>,
  },
  {
    key: 'points',
    header: 'Points',
    align: 'right',
    render: (row) => <span className="nums text-accent-strong">{row.points}</span>,
  },
];

const colors = [
  { label: 'Canvas', token: '--bg-canvas', className: 'bg-canvas' },
  { label: 'Surface', token: '--bg-surface', className: 'bg-surface' },
  { label: 'Elevated', token: '--bg-elevated', className: 'bg-elevated' },
  { label: 'Overlay', token: '--bg-overlay', className: 'bg-overlay' },
  { label: 'Accent', token: '--accent', className: 'bg-accent' },
  { label: 'Info / solved', token: '--secondary', className: 'bg-info' },
  { label: 'Success', token: '--success', className: 'bg-success' },
  { label: 'Warning', token: '--warning', className: 'bg-warning' },
  { label: 'Danger', token: '--danger', className: 'bg-danger' },
];

const steps: StepperStep[] = [
  { value: 'basics', label: 'Basics' },
  { value: 'content', label: 'Content' },
  { value: 'flags', label: 'Flags' },
];

export default function Kit() {
  const [tab, setTab] = useState('profile');
  const [scope, setScope] = useState<'teams' | 'players'>('teams');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState('basics');
  const mode = useTheme((state) => state.mode);
  const setMode = useTheme((state) => state.setMode);

  return (
    <main className="mx-auto w-full max-w-container px-4 py-10 sm:px-6 sm:py-12">
      <PageHeader
        title="Design kit"
        description="The shared vocabulary for the redesign: tokens, typography, controls, states and motion. Development only."
        meta={
          <>
            <span>Updated {formatDateTimeUTC(new Date().toISOString())}</span>
            <span aria-hidden>·</span>
            <span>Tokens in src/styles/tokens.css</span>
          </>
        }
      />

      <div className="mb-10 flex flex-wrap items-center gap-3">
        <span className="type-small text-secondary">Preview theme</span>
        <Segmented
          label="Preview theme"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-16">
        <section aria-labelledby="kit-color" className="flex flex-col gap-6">
          <SectionHeader
            id="kit-color"
            title="Color roles"
            description="OKLCH roles, not swatches. The accent is reserved for action and the live signal."
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colors.map((color) => (
              <li
                key={color.token}
                className="flex items-center gap-3 rounded-md border border-hairline bg-surface p-3"
              >
                <span
                  aria-hidden
                  className={`size-8 shrink-0 rounded-sm border border-subtle ${color.className}`}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="text-small text-primary">{color.label}</span>
                  <span className="type-mono text-muted">{color.token}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="kit-type" className="flex flex-col gap-6">
          <SectionHeader
            id="kit-type"
            title="Typography"
            description="Display caps at 6rem; body measure stays between 65 and 75 characters."
          />
          <div className="flex flex-col gap-5">
            <p className="type-display text-primary">Every flag moves the board.</p>
            <p className="type-h1 text-primary">H1 — Challenge board</p>
            <p className="type-h2 text-primary">H2 — Recent solves</p>
            <p className="type-h3 text-primary">H3 — Cold Start</p>
            <p className="max-w-measure text-primary">
              Body copy that explains the competition without decoration. This paragraph is capped
              at the measure token so it never runs past a comfortable reading width on a wide
              display.
            </p>
            <p className="type-small text-secondary">
              Small text for metadata, hints and secondary actions.
            </p>
            <p className="type-mono text-mono text-accent-strong">YOURCTF{"{"}flag_hash{"}"}</p>
          </div>
        </section>

        <section aria-labelledby="kit-controls" className="flex flex-col gap-6">
          <SectionHeader
            id="kit-controls"
            title="Controls"
            description="Visible focus, 44px primary targets and a 24px hard floor for dense controls."
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary action</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <CopyButton value="7K2Q9M" label="Copy invite code" />
            <Badge tone="accent">Live</Badge>
            <Badge tone="success">Solved</Badge>
            <Badge tone="warning">Costs 25 points</Badge>
            <Badge tone="danger">Ended</Badge>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Challenge search" placeholder="Search by title" hint="Case-insensitive." />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error="Use a valid email address."
              defaultValue="not-an-email"
            />
            <PasswordInput label="Password" placeholder="At least 10 characters" />
            <Select label="Difficulty" defaultValue="hard">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <Textarea
              label="Challenge brief"
              placeholder="Write the brief the way a player will read it."
              hint="Plain text, line breaks preserved."
            />
            <div className="flex flex-col gap-2">
              <span className="type-label text-secondary">Scope</span>
              <Segmented
                label="Leaderboard scope"
                value={scope}
                onChange={setScope}
                options={[
                  { value: 'teams', label: 'Teams' },
                  { value: 'players', label: 'Players' },
                ]}
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="kit-data" className="flex flex-col gap-6">
          <SectionHeader
            id="kit-data"
            title="Data and navigation"
            description="Numbers align, tables become cards below 768px, and tabs are a real tablist."
          />
          <Tabs
            label="Account sections"
            value={tab}
            onChange={setTab}
            items={[
              {
                value: 'profile',
                label: 'Profile',
                content: (
                  <div className="rounded-lg border border-hairline bg-surface p-6">
                    <h3 className="type-h3 text-primary">Profile</h3>
                    <p className="mt-2 max-w-measure text-secondary">
                      Public identity, bio and team. Email is never rendered on a public profile.
                    </p>
                  </div>
                ),
              },
              {
                value: 'security',
                label: 'Security',
                content: (
                  <div className="rounded-lg border border-hairline bg-surface p-6">
                    <h3 className="type-h3 text-primary">Security</h3>
                    <p className="mt-2 max-w-measure text-secondary">
                      Password change, verification status and session controls arrive with the
                      backend recovery work.
                    </p>
                  </div>
                ),
              },
            ]}
          />
          <DataTable
            label="Top teams"
            columns={teamColumns}
            rows={teamRows}
            rowKey={(row) => row.id}
          />
          <StatRow>
            <Stat label="Published challenges" value="24" />
            <Stat label="Teams" value="18" />
            <Stat label="Solves" value="240" />
            <Stat label="Points at stake" value="12.4k" hint="Across all challenges" />
          </StatRow>
          <div className="grid gap-6 sm:grid-cols-2">
            <Progress value={8} max={12} label="Board progress" hint="8 of 12 solved" />
            <Progress value={8} max={12} label="Board progress" variant="ring" />
          </div>
        </section>

        <section aria-labelledby="kit-feedback" className="flex flex-col gap-6">
          <SectionHeader
            id="kit-feedback"
            title="States and feedback"
            description="Empty, error and loading states name the next useful action. Dialogs trap focus and restore it."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <EmptyState
              title="No solves yet"
              description="The board fills in with the first solve of the event."
              action={<Button size="sm">Open challenges</Button>}
            />
            <ErrorState
              description="The leaderboard did not load. Check the connection and try again."
              onRetry={() => toast.info('Retrying', 'This is a demo state.')}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => toast.success('Flag accepted', 'First blood.')}>
              Success toast
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast.error('Submission failed', 'Try again in 60 seconds.')}
            >
              Error toast
            </Button>
            <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
              Open confirm dialog
            </Button>
            <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
              Open filter drawer
            </Button>
          </div>
        </section>

        <section aria-labelledby="kit-bits" className="flex flex-col gap-6">
          <SectionHeader
            id="kit-bits"
            title="React Bits"
            description="Adapted to the tokens. No external icon set, no glass, no ambient glow."
          />
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <TiltedCard>
              <div className="flex h-full flex-col justify-between gap-6 rounded-lg border border-hairline bg-surface p-6">
                <div className="flex items-center gap-2">
                  <Badge tone="accent">Live</Badge>
                  <Badge tone="neutral">Web · Hard</Badge>
                </div>
                <div>
                  <h3 className="type-h2 text-primary">Cold Start</h3>
                  <p className="mt-2 max-w-measure text-secondary">
                    A featured challenge panel. The tilt is fine-pointer only and becomes static
                    under reduced motion.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-hairline pt-4">
                  <span className="nums text-h3 text-accent-strong">500</span>
                  <Button size="sm" variant="secondary">
                    Open challenge
                  </Button>
                </div>
              </div>
            </TiltedCard>
            <div className="rounded-lg border border-hairline bg-surface p-4">
              <h3 className="type-h3 text-primary">Activity</h3>
              <p className="mt-1 type-small text-secondary">Mount-only stagger.</p>
              <AnimatedList
                className="mt-3"
                items={[
                  {
                    id: 1,
                    content: (
                      <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-2">
                        <span className="text-small text-primary">alice solved Cold Start</span>
                        <span className="nums type-small text-success">+500</span>
                      </div>
                    ),
                  },
                  {
                    id: 2,
                    content: (
                      <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-2">
                        <span className="text-small text-primary">Null Route unlocked a hint</span>
                        <span className="nums type-small text-warning">-25</span>
                      </div>
                    ),
                  },
                  {
                    id: 3,
                    content: (
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <span className="text-small text-primary">Kernel Panic joined the board</span>
                        <span className="nums type-small text-muted">14:02</span>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
          <div>
            <Stepper label="Challenge editor sections" value={step} onChange={setStep} steps={steps} />
            <div className="mt-4 rounded-lg border border-hairline bg-surface p-6">
              <h3 className="type-h3 text-primary">
                {steps.find((entry) => entry.value === step)?.label}
              </h3>
              <p className="mt-2 max-w-measure text-secondary">
                The stepper navigates sections; it does not gate saving. Every section is reachable
                and owns its own validation.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="kit-landing" className="flex flex-col gap-4 border-t border-hairline pt-8">
          <SectionHeader
            id="kit-landing"
            title="Landing primitives"
            description="The pieces the landing composes: a scroll reveal, a snap carousel with round controls, and the hero's particle field."
          />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4">
              <Carousel label="Kit carousel">
                {['Snap on scroll, native touch', 'Round controls at both ends', 'A mono readout tracks position'].map(
                  (line) => (
                    <div
                      key={line}
                      className="flex h-40 flex-col justify-end rounded-lg border border-hairline bg-surface p-5 font-display text-h3 text-primary"
                    >
                      {line}
                    </div>
                  ),
                )}
              </Carousel>
              <Reveal stagger className="grid gap-3 sm:grid-cols-3">
                {['Transform only', 'Opacity only', 'One observer per element'].map((line) => (
                  <div
                    key={line}
                    className="rounded-lg border border-hairline bg-elevated p-4 type-small text-secondary"
                  >
                    {line}
                  </div>
                ))}
              </Reveal>
              <p className="max-w-measure type-small text-muted">
                Reveal watches its element with an IntersectionObserver and sets data-visible once.
                The stagger variant defers each child by <code className="nums">sibling-index()</code>{' '}
                where the browser supports it, and falls back to a single group fade where not.
              </p>
            </div>
            <div className="h-64 overflow-hidden rounded-lg border border-hairline bg-surface">
              <ParticleField density={22} speed={12} influence={90} />
            </div>
          </div>
        </section>

        <section aria-labelledby="kit-motion" className="flex flex-col gap-4 border-t border-hairline pt-8">
          <SectionHeader
            id="kit-motion"
            title="Motion and focus"
            description="One authored moment per page. Decorative loops stop under reduced motion; state color and opacity stay."
          />
          <ul className="grid gap-3 text-secondary sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-1 text-success" />
              <span>Press Tab through this page: every control shows a 2px accent ring with offset.</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-1 text-success" />
              <span>Small buttons keep a 44px hit area; the visible control can stay 36px.</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-1 text-success" />
              <span>Tables become labeled cards below 768px; no page-level horizontal scroll.</span>
            </li>
            <li className="flex items-start gap-2">
              <Icon name="check" size={16} className="mt-1 text-success" />
              <span>Charts will ship with a table view and patterns, not color alone.</span>
            </li>
          </ul>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('Team left', 'The demo action completed.');
        }}
        title="Leave this team?"
        description="Your solves stay on the team score. You can join a new team with an invite code."
        confirmLabel="Leave team"
      />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        description="Mobile filter sheet with focus trap and scroll lock."
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDrawerOpen(false)}>
              Clear
            </Button>
            <Button className="flex-1" onClick={() => setDrawerOpen(false)}>
              Apply
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input label="Search" placeholder="Search challenges" />
          <Segmented
            label="Solved status"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'teams', label: 'All' },
              { value: 'players', label: 'Unsolved' },
            ]}
          />
          <Select label="Category" defaultValue="all">
            <option value="all">All categories</option>
            <option value="web">Web</option>
            <option value="pwn">Pwn</option>
          </Select>
        </div>
      </Drawer>
    </main>
  );
}
