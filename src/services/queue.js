const fp = require("fastify-plugin");
const fastq = require("fastq");

module.exports = fp(async (fastify, opts) => {
  const fileQueue = fastq.promise(fastify.processor, 1);
  fastify.decorate("queue", function queue(fileId) {
    fileQueue.push(fileId);
  });
});
