import { spawnSync } from 'child_process';

process.env.PORT = process.env.PORT || '3001';
process.env.BASE_PATH = process.env.BASE_PATH || '/mockup-sandbox/';

const res = spawnSync('pnpm', ['exec', 'vite', 'build'], {
  stdio: 'inherit',
  shell: true,
});

process.exit(res.status ?? 1);
