module.exports = async function (fastify, opts) {
  fastify.post("/", async function (request, reply) {
    const { file_id: fileId } = request.body;

    request.log.info(`received request for file id: ${fileId}`);

    if (!fileId) {
      reply.statusCode = 400;
      return "No file ID in request";
    }

    fastify.queue(fileId);

    return { received: true };
  });
};
