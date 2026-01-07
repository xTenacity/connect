#!/usr/bin/env node
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function rimrafDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await fsp.rm(full, { recursive: true, force: true });
    } else {
      await fsp.unlink(full);
    }
  }
}

async function copyDir(src, dst) {
  await fsp.mkdir(dst, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else {
      await fsp.copyFile(s, d);
    }
  }
}

(async () => {
  const scriptsDir = __dirname; // .../src/main/frontend/scripts
  const frontendDir = path.resolve(scriptsDir, '..'); // .../src/main/frontend
  const distDir = path.join(frontendDir, 'dist');
  const destDir = path.join(frontendDir, '..', 'resources', 'static'); // .../src/main/resources/static

  try {
    if (!fs.existsSync(distDir)) {
      console.error('postbuild: dist folder not found at', distDir);
      process.exit(1);
    }

    // ensure destination exists
    await fsp.mkdir(destDir, { recursive: true });

    // remove any existing files under dest (but keep the dest folder)
    await rimrafDir(destDir);

    // copy dist -> dest
    await copyDir(distDir, destDir);

    // Also copy dist/models into dest/assets/models so files are available both at
    // `/models/...` and `/assets/models/...` (some runtime bundles request the latter).
    const distModels = path.join(distDir, 'models');
    const destAssetsModels = path.join(destDir, 'assets', 'models');
    if (fs.existsSync(distModels)) {
      await fsp.mkdir(path.join(destDir, 'assets'), { recursive: true });
      await copyDir(distModels, destAssetsModels);
    }

    console.log('postbuild: copied', distDir, '->', destDir);
    process.exit(0);
  } catch (err) {
    console.error('postbuild failed:', err);
    process.exit(2);
  }
})();
