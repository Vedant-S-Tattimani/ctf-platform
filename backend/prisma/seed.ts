import { randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/config/env.js';
import { hashFlag, hashPassword, newSalt } from '../src/utils/hash.js';

const prisma = new PrismaClient();

interface FlagSeed {
  label?: string;
  value: string;
  points: number;
}

interface ChallengeSeed {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'insane';
  points: number;
  categorySlug: string;
  flags: FlagSeed[];
  hints?: { content: string; cost?: number }[];
  files?: { name: string; path: string }[];
}

const CATEGORIES = [
  { name: 'Web', slug: 'web', color: '#38BDF8', icon: 'globe' },
  { name: 'Crypto', slug: 'crypto', color: '#F59E0B', icon: 'key' },
  { name: 'Pwn', slug: 'pwn', color: '#EF4444', icon: 'skull' },
  { name: 'Reverse', slug: 'reverse', color: '#A78BFA', icon: 'gear' },
  { name: 'Forensics', slug: 'forensics', color: '#34D399', icon: 'search' },
  { name: 'Misc', slug: 'misc', color: '#F472B6', icon: 'sparkles' },
];

const CHALLENGES: ChallengeSeed[] = [
  {
    title: 'Blog Vault',
    description:
      'The company blog stores every post in a vault behind a comment form. The moderators say it is XSS-proof. Prove them wrong and read the admin note.',
    difficulty: 'easy',
    points: 100,
    categorySlug: 'web',
    flags: [{ value: 'YourCTF{bl0g_vault_xss}', points: 100 }],
    hints: [{ content: 'Which attribute does the sanitizer forget to strip?', cost: 15 }],
  },
  {
    title: 'Cookie Jar',
    description:
      'Session cookies are signed with a home-grown scheme. Forge a session for the admin, then smuggle it into the internal report endpoint.',
    difficulty: 'medium',
    points: 250,
    categorySlug: 'web',
    flags: [
      { label: 'Task 1', value: 'YourCTF{cookie_forge}', points: 120 },
      { label: 'Task 2', value: 'YourCTF{session_smuggle}', points: 130 },
    ],
  },
  {
    title: "Caesar's Lunch",
    description:
      'An intercepted note reads: "Rxhwhc wkh vdqgzlfk uhflsh". The chef swears only a simple shift was used.',
    difficulty: 'easy',
    points: 100,
    categorySlug: 'crypto',
    flags: [{ value: 'YourCTF{et_tu_brute}', points: 100 }],
  },
  {
    title: 'Pad Again',
    description:
      'The oracle tells you nothing except whether the padding is right. That is all you need. Recover the secret suffix of the ciphertext.',
    difficulty: 'hard',
    points: 400,
    categorySlug: 'crypto',
    flags: [{ value: 'YourCTF{padding_oracle_ftw}', points: 400 }],
    hints: [{ content: 'Byte by byte, from the last block backwards.', cost: 25 }],
  },
  {
    title: 'Echo Chamber',
    description:
      'A tiny service repeats whatever you say, but its buffer repeats a little too much. Reach the hidden function.',
    difficulty: 'medium',
    points: 250,
    categorySlug: 'pwn',
    flags: [{ value: 'YourCTF{b0f_slip}', points: 250 }],
    files: [{ name: 'echo_challenge.bin', path: 'files/pwn/echo_challenge.bin' }],
  },
  {
    title: 'Format Feast',
    description:
      'The menu printer accepts custom format strings. The chef left the flag on the stack, somewhere around argument seven.',
    difficulty: 'hard',
    points: 400,
    categorySlug: 'pwn',
    flags: [{ value: 'YourCTF{fmt_wizard}', points: 400 }],
  },
  {
    title: 'Crackme Junior',
    description:
      'A beginner binary asks for a password and compares it byte by byte. Patch, trace or just read — any route counts.',
    difficulty: 'easy',
    points: 100,
    categorySlug: 'reverse',
    flags: [{ value: 'YourCTF{n0t_s0_hard}', points: 100 }],
    files: [{ name: 'crackme_junior', path: 'files/reverse/crackme_junior' }],
  },
  {
    title: 'Maze Runner',
    description:
      'Four thousand branches stand between you and the exit. Only one path prints the flag.',
    difficulty: 'hard',
    points: 400,
    categorySlug: 'reverse',
    flags: [{ value: 'YourCTF{maze_exit_42}', points: 400 }],
  },
  {
    title: 'Hidden in Plain Sight',
    description:
      'This photo of the office plant looks fine. Your eyes are fine. The least significant bits are not.',
    difficulty: 'easy',
    points: 100,
    categorySlug: 'forensics',
    flags: [{ value: 'YourCTF{lsb_whispers}', points: 100 }],
    files: [{ name: 'plant.png', path: 'files/forensics/plant.png' }],
  },
  {
    title: 'Memory Lane',
    description:
      'A memory image from a compromised workstation. Something was typed into notepad and never saved to disk.',
    difficulty: 'medium',
    points: 250,
    categorySlug: 'forensics',
    flags: [{ value: 'YourCTF{mem_dump_secret}', points: 250 }],
    files: [{ name: 'workstation.raw', path: 'files/forensics/workstation.raw' }],
  },
  {
    title: 'Sanity Check',
    description:
      'Welcome aboard. Read the rules page to the end and claim your first flag.',
    difficulty: 'easy',
    points: 50,
    categorySlug: 'misc',
    flags: [{ value: 'YourCTF{w3lc0me_aboard}', points: 50 }],
  },
  {
    title: 'QR Quest',
    description:
      'Seven QR fragments were printed across the venue posters. Reassemble the chain in order.',
    difficulty: 'medium',
    points: 200,
    categorySlug: 'misc',
    flags: [{ value: 'YourCTF{qr_trail_7}', points: 200 }],
    hints: [{ content: 'Fragment 3 is rotated 90 degrees.', cost: 10 }],
  },
];

/** Optional demo population (`npm run seed -- --demo`) so a fresh instance has a live board. */
async function seedDemo() {
  const passwordHash = await hashPassword('DemoPass123!');
  const specs = [
    { username: 'pixel', email: 'pixel@demo.yourctf.local' },
    { username: 'byte', email: 'byte@demo.yourctf.local' },
    { username: 'raven', email: 'raven@demo.yourctf.local' },
    { username: 'nova', email: 'nova@demo.yourctf.local' },
    { username: 'cipher', email: 'cipher@demo.yourctf.local' },
    { username: 'ghost', email: 'ghost@demo.yourctf.local' },
  ];
  const users = new Map<string, { id: string }>();
  for (const spec of specs) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: { username: spec.username, email: spec.email, passwordHash, role: 'USER' },
      select: { id: true },
    });
    users.set(spec.username, user);
  }

  const teams = [
    { name: 'Bit Bandits', owner: 'pixel', members: ['pixel', 'byte'] },
    { name: 'Null Route', owner: 'raven', members: ['raven', 'nova'] },
    { name: 'Cipher Cartel', owner: 'cipher', members: ['cipher', 'ghost'] },
  ];
  for (const spec of teams) {
    const owner = users.get(spec.owner);
    if (!owner) continue;
    const team = await prisma.team.upsert({
      where: { name: spec.name },
      update: {},
      create: {
        name: spec.name,
        description: `${spec.name} — demo roster for the scoreboard.`,
        inviteCode: `DEMO${randomBytes(4).toString('hex').toUpperCase()}`,
        ownerId: owner.id,
      },
      select: { id: true },
    });
    await prisma.user.updateMany({
      where: { username: { in: spec.members } },
      data: { teamId: team.id },
    });
  }

  const plan: { username: string; title: string }[] = [
    { username: 'pixel', title: 'Sanity Check' },
    { username: 'pixel', title: 'Blog Vault' },
    { username: 'byte', title: "Caesar's Lunch" },
    { username: 'byte', title: 'Hidden in Plain Sight' },
    { username: 'raven', title: 'QR Quest' },
    { username: 'raven', title: 'Crackme Junior' },
    { username: 'nova', title: 'Cookie Jar' },
    { username: 'nova', title: 'Echo Chamber' },
    { username: 'cipher', title: 'Crackme Junior' },
    { username: 'ghost', title: 'Sanity Check' },
  ];

  let created = 0;
  for (const entry of plan) {
    const user = users.get(entry.username);
    if (!user) continue;
    const challenge = await prisma.challenge.findFirst({
      where: { title: entry.title },
      include: { flags: { orderBy: { order: 'asc' } } },
    });
    const flag = challenge?.flags[0];
    if (!challenge || !flag) continue;

    const existing = await prisma.solve.findFirst({
      where: { flagId: flag.id, userId: user.id },
    });
    if (existing) continue;

    const solvesBefore = await prisma.solve.count({ where: { flagId: flag.id } });
    const userRow = await prisma.user.findUnique({
      where: { id: user.id },
      select: { teamId: true },
    });
    await prisma.$transaction([
      prisma.solve.create({
        data: {
          userId: user.id,
          teamId: userRow?.teamId ?? null,
          challengeId: challenge.id,
          flagId: flag.id,
          points: flag.points,
          firstBlood: solvesBefore === 0,
        },
      }),
      prisma.submission.create({
        data: {
          userId: user.id,
          teamId: userRow?.teamId ?? null,
          challengeId: challenge.id,
          flagId: flag.id,
          correct: true,
        },
      }),
    ]);
    created += 1;
  }

  console.log(
    `Seed: demo data ready — ${specs.length} players, ${teams.length} teams, ${created} new solves.`,
  );
  console.log('Seed: demo sign-in password is DemoPass123! (pixel, byte, raven, nova, cipher, ghost).');
}

async function main() {
  const adminPasswordHash = await hashPassword(env.ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { username: env.ADMIN_USERNAME, role: 'ADMIN' },
    create: {
      username: env.ADMIN_USERNAME,
      email: env.ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, color: category.color, icon: category.icon },
      create: category,
    });
  }

  const now = new Date();
  const event = await prisma.event.upsert({
    where: { slug: 'yourctf-open-2026' },
    update: {},
    create: {
      name: 'YourCTF Open 2026',
      slug: 'yourctf-open-2026',
      description:
        'The flagship open competition. Six categories, twelve challenges, one scoreboard.',
      startsAt: new Date(now.getTime() - 24 * 3600 * 1000),
      endsAt: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
      published: true,
    },
  });

  const existing = await prisma.challenge.count();
  if (existing > 0) {
    console.log(`Seed: ${existing} challenges already present — skipping challenge seed.`);
  } else {
    const categories = await prisma.category.findMany();
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    let order = 0;

    for (const seed of CHALLENGES) {
      const category = bySlug.get(seed.categorySlug);
      if (!category) throw new Error(`Unknown category slug: ${seed.categorySlug}`);

      const challenge = await prisma.challenge.create({
        data: {
          title: seed.title,
          description: seed.description,
          difficulty: seed.difficulty,
          points: seed.points,
          published: true,
          order: order++,
          categoryId: category.id,
          eventId: event.id,
          hints: {
            create: (seed.hints ?? []).map((hint, i) => ({
              content: hint.content,
              cost: hint.cost ?? 0,
              order: i,
            })),
          },
          files: {
            create: (seed.files ?? []).map((f) => ({ name: f.name, path: f.path })),
          },
          flags: {
            create: seed.flags.map((flag, i) => {
              const salt = newSalt();
              return {
                label: flag.label ?? null,
                salt,
                hash: hashFlag(flag.value, salt),
                points: flag.points,
                order: i,
              };
            }),
          },
        },
      });
      console.log(`Seed: challenge "${challenge.title}" (${seed.flags.length} flag(s))`);
    }
  }

  if (process.argv.includes('--demo')) await seedDemo();

  const [users, challenges, flags] = await Promise.all([
    prisma.user.count(),
    prisma.challenge.count(),
    prisma.flag.count(),
  ]);
  console.log(`Seed complete: admin=${admin.username} users=${users} challenges=${challenges} flags=${flags}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
