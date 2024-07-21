/**
 * Fastify plugin to handle file queueing.
 * @module queue
 */

import fp from 'fastify-plugin'
import fastq from 'fastq'

export default fp(async (fastify) => {
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
