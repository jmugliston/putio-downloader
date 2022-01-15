const fp = require("fastify-plugin");
const stream = require("stream");
const unzip = require("unzip-stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);
const sleep = promisify(setTimeout);

async function processorPlugin(fastify, opts) {
  const { downloadDir, filebotEnabled } = opts;

  fastify.decorate("processor", async function processFile(fileId) {
    try {
      const { createZip, checkZipStatus, getDownloadStream, deleteFile } =
        fastify.putio;

      fastify.log.info({ fileId }, "creating put.io zip file");

      const { zip_id: zipId } = await createZip(fileId);

      let url = null;
      let retryCount = 0;

      while (!url && retryCount <= 3) {
        fastify.log.info({ zipId }, "checking zip status");
        const res = await checkZipStatus(zipId);
        url = res.url;
        if (!url) {
          fastify.log.warn({ zipId }, "zip file not ready");
          retryCount += 1;
          await sleep(3000);
        }
      }

      if (!url) {
        throw new Error({ zipId }, "failed to get zip file");
      }

      fastify.log.info({ fileId, zipId }, "starting download");

      const downloadStream = await getDownloadStream(url);

      await pipeline(
        downloadStream,
        unzip.Extract({ path: `${downloadDir}/` })
      );

      fastify.log.info({ fileId, zipId }, "finished download");

      fastify.log.info({ fileId }, "deleting file from put.io");

      await deleteFile(fileId);

      if (filebotEnabled) {
        fastify.log.info("running filebot task");
        await fastify.filebot();
      }

      fastify.log.info("finished processing");
    } catch (error) {
      if (error.isAxiosError) {
        fastify.log.error(error.toJSON());
      } else {
        fastify.log.error(error);
      }
    }

    return true;
  });
}

module.exports = fp(processorPlugin);
