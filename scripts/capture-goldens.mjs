#!/usr/bin/env node
// Capture/refresh visual golden frames (build plan §24.4). Thin wrapper that runs
// the Playwright visual specs in snapshot-update mode. Requires a WebGPU-capable
// browser on the machine (auto-skips otherwise).

import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['playwright', 'test', 'tests/visual', '--update-snapshots'], {
  stdio: 'inherit',
});
process.exit(r.status ?? 0);
