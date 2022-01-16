const fp = require("fastify-plugin");
const axios = require("axios");

async function filebot(fastify, opts) {
  fastify.decorate("filebot", async function runFilebot() {
    try {
      fastify.log.info("Starting Filebot task...");
      await axios.get(`${fastify.config.FILEBOT_NODE_URL}/task?id=0`);
    } catch (err) {
      // ignore errors with filebot
    }
  });
}

module.exports = fp(filebot);
