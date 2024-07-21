/**
 * Handles the healthcheck route.
 *
 * @param {import('fastify').FastifyInstance} fastify - The Fastify instance.
 * @param {object} opts - The options object.
 */
module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    return { ok: true }
  })
}
