const fp = require("fastify-plugin");
const axios = require("axios");

async function filebot(fastify, opts) {
  fastify.decorate("filebot", async function runFilebot() {
    axios.get(`${fastify.config.FILEBOT_NODE_URL}/task?id=0`);
  });
}

module.exports = fp(filebot);
