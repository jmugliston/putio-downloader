/**
 * Defines the root route of the Put.io downloader API.
 *
 * @param {import('fastify').FastifyInstance} fastify - The Fastify instance.
 * @param {object} opts - The options object.
 */
module.exports = async function (fastify, opts) {
  /**
   * Handles GET requests to the root route.
   *
   * @param {import('fastify').FastifyRequest} request - The request object.
   * @param {import('fastify').FastifyReply} reply - The reply object.
   * @returns {string} The response message.
   */
  fastify.get('/', async function (request, reply) {
    return 'Put.io downloader API'
  })
}
