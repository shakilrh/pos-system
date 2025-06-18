const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

function run(cmd, cwd) {
  try {
    execSync(cmd, { cwd, shell: true, stdio: 'inherit', maxBuffer: 1024 * 1024 * 10 });
  } catch (error) {
    console.error(`Error executing ${cmd} in ${cwd}:`, error.message);
    process.exit(1);
  }
}

(async () => {
  const baseDir = 'C:\\pos-short\\frontend'; // Use the symlink path

  // Clean & recreate deploy folder for host
  fs.removeSync(path.join(baseDir, 'deploy-host'));
  fs.ensureDirSync(path.join(baseDir, 'deploy-host'));

  // Copy pre-existing host-app/out to root of deploy
  fs.copySync(path.join(baseDir, 'host-app/out'), path.join(baseDir, 'deploy-host'));

  // Copy shared-tailwind folder
  fs.copySync(path.resolve(baseDir, '../shared-tailwind'), path.join(baseDir, 'deploy-host', 'shared-tailwind'));

  // Add redirect from / to home
  fs.writeFileSync(path.join(baseDir, 'deploy-host', '404.html'), `
    <meta http-equiv="refresh" content="0; url=./index.html">
  `);

  // Publish to gh-pages branch
  run('npx gh-pages -d deploy-host -r git@github.com:shakilrh/pos-system.git', baseDir);

  console.log('✅ Host app deployed successfully!');
})();
