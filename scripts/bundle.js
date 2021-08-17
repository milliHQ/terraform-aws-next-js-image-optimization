/**
 * Creates a bundled zip file with all dependencies for AWS Lambda
 */

const path = require('path');
const fs = require('fs');
const { nodeFileTrace } = require('@vercel/nft');
const glob = require('glob');
const archiver = require('archiver');

const workspaceRoot = path.resolve(__dirname, '..');
const buildDir = path.resolve(workspaceRoot, 'lib/dist');

async function main() {
  // Get all files from build dir
  const buildFiles = glob.sync('**/*.js', { cwd: buildDir, absolute: true });

  const { fileList } = await nodeFileTrace(buildFiles, {
    base: workspaceRoot,
    processCwd: process.cwd(),
    // aws-sdk is already provided in Lambda images
    ignore: ['**/aws-sdk/**/*'],
  });

  // Manually add node_modules/next/node_modules/jest-worker/build/workers/threadChild.js
  // This is likely a bug in nft or Next.js codebase because this file is required when the png
  // example is processed
  fileList.push(
    'node_modules/next/node_modules/jest-worker/build/workers/threadChild.js'
  );

  fileList.push(
    ...glob.sync(
      'node_modules/next/dist/server/lib/squoosh/**/*.{js,wasm}',
      {
        cwd: workspaceRoot,
      }
    )
  );

  // Create zip file
  await new Promise((resolve, reject) => {
    const outputFile = fs.createWriteStream(
      path.resolve(workspaceRoot, 'lib/dist.zip')
    );

    outputFile.on('close', () => resolve());
    outputFile.on('error', (error) => reject(error));

    const archive = archiver('zip', {
      zlib: { level: 5 }, // Optimal compression
    });
    archive.pipe(outputFile);

    for (const file of fileList) {
      // Remove lib/ and lib/dist/ prefix
      const fileName = file.replace(/^lib\/(dist\/)?/, '');

      archive.append(fs.createReadStream(path.join(workspaceRoot, file)), {
        name: fileName,
        mode: 0o666,
      });
    }
    archive.finalize();
  });
}

main();
