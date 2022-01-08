const path = require("path");
const AutoLoad = require("fastify-autoload");
const Env = require("fastify-env");
const S = require("fluent-json-schema");
const schedule = require("node-schedule");
const putio = require("./services/putio");
const processor = require("./services/processor");
const queue = require("./services/queue");

module.exports = async function (fastify, opts) {
  // Get environment config
  fastify.register(Env, {
    schema: S.object()
      .prop("NODE_ENV", S.string().required().default("production"))
      .prop("ACCESS_TOKEN", S.string().required())
      .prop("DOWNLOAD_DIR", S.string().required().default("./tmp"))
      .prop("FILEBOT_ENABLED", S.string().required().default("true"))
      .prop(
        "FILEBOT_NODE_URL",
        S.string().required().default("http://filebot-node:5452")
      )
      .valueOf(),
  });

  // Custom plugins (need to be loaded in order)
  await fastify.register(putio);
  await fastify.register(processor);
  await fastify.register(queue);

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: Object.assign({}, opts),
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "routes"),
    options: Object.assign({}, opts),
  });

  // Schedule job to run every day (in case callbacks are missed)
  schedule.scheduleJob("0 6 * * *", async () => {
    fastify.log.info("Starting download files job");
    const { files } = await fastify.putio.getFiles();
    for (const file of files) {
      fastify.queue(file.id);
    }
  });
};
