/**
 * Fastify plugin to handle file queueing.
 * @module queue
 */

const fp = require('fastify-plugin')
const fastq = require('fastq')

module.exports = fp(async (fastify) => {
  /**
   * Function to add a file to the queue.
   * @function queue
   * @param {string} fileId - The ID of the file to be added to the queue.
   */
  const fileQueue = fastq.promise(fastify.processor, 1)
  fastify.decorate('queue', function queue(fileId) {
    fileQueue.push(fileId)
  })
})
