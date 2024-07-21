/**
 * Handles the POST request for file operations.
 *
 * @param {object} fastify - The Fastify instance.
 * @param {object} opts - The options object.
 * @returns {Promise<object>} - The response object.
 */
module.exports = async function (fastify, opts) {
  fastify.post('/', async function (request, reply) {
    if (!request?.body?.file_id) {
      return reply.badRequest('No file id in request')
    }

    const { file_id: fileId } = request.body

    request.log.info(`received request for file id: ${fileId}`)

    fastify.queue(fileId)

    return { received: true }
  })
}
