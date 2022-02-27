const path = require("path");
const AutoLoad = require("fastify-autoload");
const Env = require("fastify-env");
const S = require("fluent-json-schema");
const schedule = require("node-schedule");
const pjson = require("../package.json");
const putio = require("./plugins/putio");
const processor = require("./plugins/processor");
const queue = require("./plugins/queue");

module.exports = async function (fastify, opts) {
  fastify.log.info(`App version: ${pjson.version}`)

  // Get environment config
  await fastify.register(Env, {
    schema: S.object()
      .prop("NODE_ENV", S.string().required().default("production"))
      .prop("ACCESS_TOKEN", S.string().required().default(""))
      .prop("DOWNLOAD_DIR", S.string().required().default("./tmp"))
      .valueOf(),
  });

  // Register plugins
  fastify.register(require("fastify-sensible"), {
    errorHandler: false,
  });
  fastify.register(require("fastify-healthcheck"));
  fastify.register(require("fastify-formbody"));

  // Register custom plugins (need to be loaded in order)
  await fastify.register(putio, { accessToken: fastify.config.ACCESS_TOKEN });
  await fastify.register(processor, {
    downloadDir: fastify.config.DOWNLOAD_DIR,
  });
  await fastify.register(queue);

  // Define routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: Object.assign({}, opts),
  });

  // Schedule a job to run every day (in case Put.io callbacks are missed)
  schedule.scheduleJob("0 6 * * *", async () => {
    fastify.log.info("Starting download files job");
    const { files } = await fastify.putio.getFiles();
    for (const file of files) {
      fastify.queue(file.id);
    }
  });
};
