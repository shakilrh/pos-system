const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd, cwd) {
  execSync(cmd, { cwd, shell: true, stdio: 'inherit' });
}

(async () => {
  // Build remote
  run('npm run build && npm run export', path.resolve(__dirname, 'remote-app'));
  // Build host
  run('npm run build && npm run export', path.resolve(__dirname, 'host-app'));

  // Clean & recreate deploy folder
  fs.removeSync('deploy');
  fs.ensureDirSync('deploy');

  // Copy host-app to root of deploy
  fs.copySync('host-app/out', 'deploy');

  // Copy remote-app into subfolder
  fs.copySync('remote-app/out', 'deploy/remote-app');

  // Add redirect from / to home
  fs.writeFileSync('deploy/404.html', `
    <meta http-equiv="refresh" content="0; url=./index.html">
  `);

  // Publish
  run('npx gh-pages -d deploy -r git@github.com:shakilrh/pos-system.git', process.cwd());

  console.log('✅ Deployed successfully!');
})();
