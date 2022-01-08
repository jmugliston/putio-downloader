const fp = require("fastify-plugin");
const fastq = require("fastq");

module.exports = fp(async (fastify, opts) => {
  const queue = fastq.promise(fastify.processor, 1);
  fastify.decorate("queue", (fileId) => {
    queue.push(fileId);
  });
});
