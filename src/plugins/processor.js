const fp = require("fastify-plugin");
const stream = require("stream");
const unzip = require("unzip-stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);
const sleep = promisify(setTimeout);

async function processorPlugin(fastify, opts) {
  const { downloadDir } = opts;

  fastify.decorate("processor", async function processFile(fileId) {
    try {
      const {
        getFileInfo,
        createZip,
        checkZipStatus,
        getDownloadStream,
        deleteFile,
      } = fastify.putio;

      fastify.log.info({ fileId }, `Checking file info [${fileId}]`);

      const {
        file: { name: fileName },
      } = await getFileInfo(fileId);

      fastify.log.info({ fileId }, `creating put.io zip file [${fileName}]`);

      const { zip_id: zipId } = await createZip(fileId);

      let url = null;
      let retryCount = 0;

      while (!url && retryCount <= 3) {
        fastify.log.info({ zipId }, "checking zip status");
        const res = await checkZipStatus(zipId);
        url = res.url;
        if (!url) {
          fastify.log.warn({ zipId }, `zip file not ready [${fileName}]`);
          retryCount += 1;
          await sleep(3000);
        }
      }

      if (!url) {
        throw new Error({ zipId }, `failed to get zip file [${fileName}]`);
      }

      fastify.log.info({ fileId, zipId }, `starting download [${fileName}]`);

      const downloadStream = await getDownloadStream(url);

      await pipeline(
        downloadStream,
        unzip.Extract({ path: downloadDir })
      );

      fastify.log.info({ fileId, zipId }, `finished download [${fileName}]`);

      fastify.log.info({ fileId }, `deleting file from put.io [${fileName}]`);

      await deleteFile(fileId);

      fastify.log.info(`finished processing [${fileName}]`);
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
