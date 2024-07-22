/**
 * The file processor plugin.
 * It creates a zip file on put.io and downloads it to the specified folder.
 * @module processorPlugin
 */

import path from 'path'
import fs from 'fs'
import fp from 'fastify-plugin'

import utils from '../utils/utils.js'

/**
 * This plugin is for processing put.io files.
 * @async
 * @param {FastifyInstance} fastify - The Fastify instance.
 * @param {Object} opts - The plugin options.
 * @param {string} opts.downloadDir - The directory where the downloaded files will be stored.
 * @param {string} opts.processingDir - The directory where the file will downloaded/processed.
 */
async function processorPlugin(fastify, opts) {
  const { downloadDir, processingDir } = opts

  /**
   * Process a file by creating a zip file, downloading it, and extracting its contents.
   * @async
   * @param {number} fileId - The ID of the file to process.
   * @returns {boolean} - Returns `true` if the file was processed successfully.
   */
  fastify.decorate('processor', async function processFile(fileId) {
    try {
      const { getFileInfo, createZip, getDownloadStream, deleteFile } =
        fastify.putio

      fastify.log.info({ fileId }, `checking file info [${fileId}]`)

      const {
        file: { name: fileName },
      } = await getFileInfo(fileId)

      fastify.log.info({ fileId }, `creating put.io zip file [${fileName}]`)

      const { zip_id: zipId } = await createZip(fileId)

      const url = await utils.waitForZip(zipId, fastify.putio.checkZipStatus)

      fastify.log.info({ fileId, zipId }, `starting download [${fileName}]`)

      const downloadStream = await getDownloadStream(url)

      const processedItems = await utils.downloadAndUnzip(
        downloadStream,
        processingDir
      )

      for (const item of processedItems) {
        fs.renameSync(
          path.join(processingDir, item),
          path.join(downloadDir, item)
        )
      }

      fastify.log.info({ fileId, zipId }, `finished download [${fileName}]`)

      fastify.log.info({ fileId }, `deleting file from put.io [${fileName}]`)

      await deleteFile(fileId)

      fastify.log.info(`finished processing [${fileName}]`)
    } catch (error) {
      if (error.isAxiosError) {
        fastify.log.error(error.toJSON())
      } else {
        fastify.log.error(error)
      }
    }

    return true
  })
}

export default fp(processorPlugin)
