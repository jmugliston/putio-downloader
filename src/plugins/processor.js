const path = require("path");
const fs = require("fs");
const fp = require("fastify-plugin");
const stream = require("stream");
const unzip = require("unzip-stream");
const retry = require("retry");
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

      fastify.log.info({ fileId }, `checking file info [${fileId}]`);

      const {
        file: { name: fileName },
      } = await getFileInfo(fileId);

      fastify.log.info({ fileId }, `creating put.io zip file [${fileName}]`);

      const { zip_id: zipId } = await createZip(fileId);

      const operation = retry.operation({
        retries: 10,
        factor: 4,
        minTimeout: 1 * 3000,
        maxTimeout: 120 * 1000,
        randomize: true,
      });

      const url = await new Promise(async (resolve, reject) => {
        await sleep(3000);

        operation.attempt(async function (currentAttempt) {
          fastify.log.info(
            { zipId },
            `checking zip status attempt ${currentAttempt}`
          );

          const res = await checkZipStatus(zipId);

          if (operation.retry(!res.url)) {
            fastify.log.warn({ zipId }, `zip file not ready [${fileName}]`);
            return;
          }

          if (res.url) {
            return resolve(res.url);
          }

          return reject("failed to create zip file in time");
        });
      });

      fastify.log.info({ fileId, zipId }, `starting download [${fileName}]`);

      const downloadStream = await getDownloadStream(url);

      const processedDirs = new Set();

      await pipeline(
        downloadStream,
        unzip.Parse(),
        stream.Transform({
          objectMode: true,
          transform: function (entry, e, cb) {
            const type = entry.type;
            if (type === "File") {
              const outputFilepath = path.join(downloadDir, entry.path);
              const outputDir = path.dirname(outputFilepath);
              if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
              }
              processedDirs.add(path.dirname(entry.path).split(path.sep)[0]);
              entry.pipe(fs.createWriteStream(outputFilepath)).on("finish", cb);
            } else {
              entry.autodrain();
              cb();
            }
          },
        })
      );

      fastify.log.info({ fileId, zipId }, `finished download [${fileName}]`);

      fastify.log.info({ fileId }, `deleting file from put.io [${fileName}]`);

      await deleteFile(fileId);

      fastify.log.info(`finished processing [${fileName}]`);

      fs.appendFileSync(
        path.join(downloadDir, "putio-downloader.log"),
        `${new Date().toISOString()} ${fileName}\n`
      );
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
