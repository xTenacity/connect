#!/usr/bin/env node
const fileSystem = require('fs');
const fileSystemPromises = fileSystem.promises;
const path = require('path');

async function rimrafDirectory(directory) {
    if (!fileSystem.existsSync(directory)) return;
    const entries = await fileSystemPromises.readdir(
        directory, {
            withFileTypes: true
        }
    );
    for (const entry of entries) {
        const full = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            await fileSystemPromises.rm(
                full, {
                    recursive: true,
                    force: true
                }
            );
        } else {
            await fileSystemPromises.unlink(full);
        }
    }
}

async function copyDirectory(source, distribution) {
    await fileSystemPromises.mkdir(distribution, {
        recursive: true
    });
    const entries = await fileSystemPromises.readdir(
        source, {
            withFileTypes: true
        }
    );
    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const distributionPath = path.join(distribution, entry.name);
        if (entry.isDirectory()) {
          await copyDirectory(sourcePath, distributionPath);
        } else {
          await fileSystemPromises.copyFile(sourcePath, distributionPath);
        }
    }
}

(async () => {
    const scriptsDirectory = __dirname; // .../src/main/frontend/scripts
    const frontendDirectory = path.resolve(scriptsDirectory, '..'); // .../src/main/frontend
    const distributionDirectory = path.join(frontendDirectory, 'dist');
    const destinationDirectory = path.join(frontendDirectory, '..', 'resources', 'static'); // .../src/main/resources/static
    try {
        if (!fileSystem.existsSync(distributionDirectory)) {
            console.error('Postbuild: dist folder not found at', distributionDirectory);
            process.exit(1);
        }

        await fileSystemPromises.mkdir(
            destinationDirectory, {
                recursive: true 
            }
        );
        await rimrafDirectory(destinationDirectory);
        await copyDirectory(distributionDirectory, destinationDirectory);

        // Also copy dist/models into dest/assets/models so files are available both at
        // `/models/...` and `/assets/models/...` (some runtime bundles request the latter).
        const distModels = path.join(distributionDirectory, 'models');
        const destAssetsModels = path.join(destinationDirectory, 'assets', 'models');
        if (fileSystem.existsSync(distModels)) {

            await fileSystemPromises.mkdir(
                path.join(destinationDirectory, 'assets'), {
                    recursive: true
                }
            );

            await copyDirectory(
                distModels,
                destAssetsModels
            );
        }

        console.log('Postbuild: copied', distributionDirectory, '->', destinationDirectory);
        process.exit(0);
    } catch (error) {
        console.error('Postbuild failed:', error);
        process.exit(2);
    }
})();
