const fp = require("fastify-plugin");
const axios = require("axios");

module.exports = fp(async function (fastify, opts) {
  fastify.decorate("filebot", () =>
    axios.get(`${fastify.config.FILEBOT_NODE_URL}/task?id=0`)
  );
});
