import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

export default function globalSetup() {
  rmSync('./test-uploads', { recursive: true, force: true });
  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
}
