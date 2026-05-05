const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'laundry-app', 'backend');
const frontendDir = path.join(rootDir, 'laundry-app', 'frontend');

function assertDir(dir, name) {
  if (!fs.existsSync(dir)) {
    console.error(`Missing ${name} directory: ${dir}`);
    process.exit(1);
  }
}

assertDir(backendDir, 'backend');
assertDir(frontendDir, 'frontend');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let shuttingDown = false;

function stopAll(signal = 'SIGTERM') {
  for (const child of children) {
    if (child && !child.killed) child.kill(signal);
  }
}

function onChildExit(name, code, signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${name} exited (${signal || code}). Stopping remaining process...`);
  stopAll('SIGTERM');
  setTimeout(() => process.exit(typeof code === 'number' ? code : 1), 150);
}

function runDev(name, cwd) {
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => onChildExit(name, code, signal));
  child.on('error', (err) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`${name} failed to start:`, err.message);
    stopAll('SIGTERM');
    process.exit(1);
  });
  children.push(child);
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\nReceived ${signal}. Stopping backend and frontend...`);
  stopAll('SIGTERM');
  setTimeout(() => process.exit(0), 150);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

console.log('Starting backend and frontend...');
runDev('backend', backendDir);
runDev('frontend', frontendDir);
