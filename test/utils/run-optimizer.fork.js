/**
 * Helper to execute the image optimizer in a child process
 * --
 * This is necessary due to the handling of the internal image processor
 * (squoosh). It runs in WASM and produces open handles which can only be closed
 * when we kill the process.
 */

const http = require('http');
const { imageOptimizer } = require('@millihq/tf-next-image-optimization');
const S3 = require('aws-sdk/clients/s3');

async function invoke({
  port,
  imageConfig,
  parsedUrl,
  s3Config,
  baseOriginUrl,
}) {
  const server = http.createServer(async (request, response) => {
    const result = await imageOptimizer(imageConfig, request, response, {
      baseOriginUrl,
      parsedUrl,
      s3Config: s3Config
        ? {
            s3: new S3(s3Config.options),
            bucket: s3Config.bucket,
          }
        : undefined,
    });

    process.send({ type: 'RESULT', payload: result });
  });
  server.listen(port, () => {
    process.send({ type: 'STARTED' });
  });
}

process.on('message', invoke);
