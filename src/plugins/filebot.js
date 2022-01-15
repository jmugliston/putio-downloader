const fp = require("fastify-plugin");
const axios = require("axios");

async function filebot(fastify, opts) {
  fastify.decorate("filebot", async function runFilebot() {
    try {
      axios.get(`${fastify.config.FILEBOT_NODE_URL}/task?id=0`);
    } catch (err) {
      fastify.log.error("Failed to run filebot task");
    }
  });
}

module.exports = fp(filebot);
