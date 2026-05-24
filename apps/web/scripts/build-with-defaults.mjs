import { spawnSync } from 'child_process';

process.env.PORT = process.env.PORT || '3000';
process.env.BASE_PATH = process.env.BASE_PATH || '/';

const res = spawnSync('pnpm', ['exec', 'vite', 'build', '--config', 'vite.config.ts'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(res.status ?? 1);
