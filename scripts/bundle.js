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
    ignore: [
      // aws-sdk is already provided in Lambda images
      '**/aws-sdk/**/*',
      // next server files not required for minimal mode
      // https://github.com/vercel/next.js/blob/canary/scripts/trace-next-server.js#L76
      'node_modules/next/dist/pages/**/*',
      'node_modules/next/dist/compiled/@ampproject/toolbox-optimizer/**/*',
      'node_modules/next/dist/server/lib/squoosh/**/*.wasm',
      'node_modules/next/dist/compiled/webpack/(bundle4|bundle5).js',
      'node_modules/react/**/*.development.js',
      'node_modules/react-dom/**/*.development.js',
      'node_modules/use-subscription/**/*.development.js',
    ],
  });

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
