/**
 * Helper to execute the image optimizer in a child process
 * --
 * This is necessary due to the handling of the internal image processor
 * (squoosh). It runs in WASM and produces open handles which can only be closed
 * when we kill the process.
 */

const http = require('http');
const { imageOptimizer } = require('@dealmore/tf-next-image-optimization');

async function invoke({ port, imageConfig, parsedUrl, s3Config }) {
  const server = http.createServer(async (request, response) => {
    const result = await imageOptimizer(
      imageConfig,
      request,
      response,
      parsedUrl,
      s3Config
    );

    process.send({ type: 'RESULT', payload: result });
  });
  server.listen(port, () => {
    process.send({ type: 'STARTED' });
  });
}

process.on('message', invoke);
