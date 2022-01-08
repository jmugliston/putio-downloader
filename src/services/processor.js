const fp = require("fastify-plugin");
const stream = require("stream");
const unzip = require("unzip-stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);
const sleep = promisify(setTimeout);

module.exports = fp(async (fastify, opts) => {
  const logger = fastify.log;
  const downloadDir = fastify.config.DOWNLOAD_DIR;
  const { createZip, checkZipStatus, getDownloadStream, deleteFile } =
    fastify.putio;

  /**
   * Process a file from put.io
   * @param {*} fileId - The file id to process
   * @param {*} logger - The logger to use
   */
  const processFile = async (fileId) => {
    try {
      logger.info({ fileId }, "creating put.io zip file");

      const { zip_id: zipId } = await createZip(fileId);

      let url = null;
      let retryCount = 0;

      while (!url && retryCount <= 3) {
        logger.info({ zipId }, "checking zip status");
        const res = await checkZipStatus(zipId);
        url = res.url;
        if (!url) {
          logger.warn({ zipId }, "zip file not ready");
          retryCount += 1;
          await sleep(3000);
        }
      }

      if (!url) {
        throw new Error({ zipId }, "failed to get zip file");
      }

      logger.info({ fileId, zipId }, "starting download");

      const downloadStream = await getDownloadStream(url);

      await pipeline(
        downloadStream,
        unzip.Extract({ path: `${downloadDir}/` })
      );

      logger.info({ fileId, zipId }, "finished download");

      logger.info({ fileId }, "deleting file from put.io");

      await deleteFile(fileId);

      if (fastify.config.FILEBOT_ENABLED === "true") {
        logger.info("running filebot task");
        await fastify.filebot();
      }

      logger.info("finished processing");
    } catch (error) {
      logger.error(error);
    }
    return true;
  };

  fastify.decorate("processor", (fileId) => processFile(fileId));
});
