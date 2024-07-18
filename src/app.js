const path = require("path");
const AutoLoad = require("@fastify/autoload");
const Env = require("@fastify/env");
const S = require("fluent-json-schema");
const schedule = require("node-schedule");
const pjson = require("../package.json");
const putio = require("./plugins/putio");
const processor = require("./plugins/processor");
const queue = require("./plugins/queue");

module.exports = async function (fastify, opts) {
  fastify.log.info(`App version: ${pjson.version}`);

  // Get environment config
  await fastify.register(Env, {
    schema: S.object()
      .prop("NODE_ENV", S.string().required().default("dev"))
      .prop("ACCESS_TOKEN", S.string().required().default(""))
      .prop("PROCESSING_DIR", S.string().required().default("./download"))
      .prop("DOWNLOAD_DIR", S.string().required().default("./download"))
      .prop("DOWNLOAD_SCHEDULE_ENABLED", S.boolean().default(false))
      .prop("DOWNLOAD_SCHEDULE_CRON", S.string().default("0 6 * * *"))
      .valueOf(),
  });

  fastify.log.info(`📁 Processing dir: ${fastify.config.PROCESSING_DIR}`);
  fastify.log.info(`📁 Download dir: ${fastify.config.DOWNLOAD_DIR}`);

  // Register plugins
  fastify.register(require("@fastify/sensible"), {
    errorHandler: false,
  });
  fastify.register(require("fastify-healthcheck"));
  fastify.register(require("@fastify/formbody"));

  // Register custom plugins (need to be loaded in order)
  await fastify.register(putio, { accessToken: fastify.config.ACCESS_TOKEN });
  await fastify.register(processor, {
    processingDir: fastify.config.PROCESSING_DIR,
    downloadDir: fastify.config.DOWNLOAD_DIR,
  });
  await fastify.register(queue);

  // Disable logging of healthcheck route
  fastify.addHook("onRoute", (opts) => {
    if (opts.path === "/healthcheck") {
      opts.logLevel = "silent";
    }
  });

  // Define routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: Object.assign({}, opts),
  });

  if (fastify.config.DOWNLOAD_SCHEDULE_ENABLED) {
    fastify.log.info(
      `🕒 Download schedule enabled: ${fastify.config.DOWNLOAD_SCHEDULE_CRON}`
    );
    schedule.scheduleJob(fastify.config.DOWNLOAD_SCHEDULE_CRON, async () => {
      fastify.log.info("Starting download files job");
      const { files } = await fastify.putio.getFiles();
      for (const file of files) {
        fastify.queue(file.id);
      }
    });
  }
};
