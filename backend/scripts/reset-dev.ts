import { execSync } from 'node:child_process';
import { env } from '../src/config/env.js';

/**
 * Destructive development helper: wipes the local database, replays every
 * migration and re-runs the seed. Refuses production and non-SQLite targets so
 * it can never be pointed at a shared database by accident.
 */
function fail(message: string): never {
  console.error(`reset:dev — ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);

if (env.NODE_ENV === 'production') {
  fail('refusing to run with NODE_ENV=production');
}
if (!env.DATABASE_URL.startsWith('file:')) {
  fail(`refusing to reset a non-SQLite DATABASE_URL (${env.DATABASE_URL})`);
}
if (!args.includes('--yes')) {
  console.error(
    'This deletes every local user, team, challenge, solve and upload row.\n' +
      'Re-run with confirmation: npm run reset:dev -- --yes [--demo]',
  );
  process.exit(1);
}

console.log(`Resetting ${env.DATABASE_URL} …`);
execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
  stdio: 'inherit',
  env: process.env,
});

const seedArgs = args.includes('--demo') ? ' --demo' : '';
execSync(`npx tsx prisma/seed.ts${seedArgs}`, { stdio: 'inherit', env: process.env });
console.log('Development database reset and re-seeded.');
