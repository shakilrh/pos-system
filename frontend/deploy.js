const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

const deployDir = path.join(__dirname, 'deploy');
const remoteStaticDir = path.join(deployDir, 'remote-app', '_next', 'static');

// Clean the deploy directory
fs.removeSync(deployDir);
fs.mkdirSync(deployDir, { recursive: true });

// Build and export the remote app
console.log('Building and exporting remote app...');
execSync('npm run build && npm run export', {
  cwd: path.join(__dirname, 'remote-app'),
  stdio: 'inherit',
});

// Copy remote app's static files
console.log('Copying remote app static files...');
fs.copySync(
  path.join(__dirname, 'remote-app', 'out', '_next', 'static'),
  remoteStaticDir
);

// Build and export the host app
console.log('Building and exporting host app...');
execSync('npm run build && npm run export', {
  cwd: path.join(__dirname, 'host-app'),
  stdio: 'inherit',
});

// Copy host app output
console.log('Copying host app files...');
fs.copySync(path.join(__dirname, 'host-app', 'out'), deployDir);

// Deploy to GitHub Pages
console.log('Deploying to GitHub Pages...');
execSync(
  'npx gh-pages -d deploy -r https://github.com/shakilrh/pos-system.git',
  { stdio: 'inherit' }
);
